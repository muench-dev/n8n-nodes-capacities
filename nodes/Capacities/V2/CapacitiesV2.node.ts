import type {
	IDataObject,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { CapacitiesClient } from '@capacities/api';
import { resources } from './ResourceDescription';
import { general } from './GeneralDescription';
import { space } from './SpaceDescription';
import { search } from './SearchDescription';
import { weblink } from './WeblinkDescription';
import { dailyNote } from './DailyNoteDescription';
import { tag } from './TagDescription';
import { object } from './ObjectDescription';
import { loadStructures, loadTags } from './GeneralFunctions';

type WeblinkOptions = {
	markdown?: string;
	titleOverwrite?: string;
	descriptionOverwrite?: string;
	tagIds?: string | string[];
};

type ObjectAdditionalFields = {
	propertiesJson?: string;
	collectionIds?: string;
	blocksJson?: string;
	propertiesToSend?: {
		property?: Array<{
			id: string;
			type: string;
			value: unknown;
		}>;
	};
};

const WEBLINK_TAGS_UNSUPPORTED_MESSAGE =
	'Capacities API does not currently support assigning tags to weblinks. The /object/url endpoint only accepts title and description, and MediaWebResource objects cannot be updated via PATCH /object.';

function toJsonItems(response: unknown, rootProperty?: string): INodeExecutionData[] {
	const data = rootProperty
		? (response as Record<string, unknown> | undefined)?.[rootProperty]
		: response;
	const items = Array.isArray(data) ? data : [data ?? {}];

	return items.map((item) => ({ json: item as IDataObject }));
}

function getSelectedIds(value: string | string[] | undefined): string[] {
	if (Array.isArray(value)) {
		return value.filter(Boolean);
	}

	return value ? [value] : [];
}

function getWeblinkBody(url: string, options: WeblinkOptions): IDataObject {
	const body: IDataObject = { url };
	const properties: IDataObject = {};

	if (options.markdown) {
		body.markdown = options.markdown;
	}

	if (options.titleOverwrite) {
		properties.title = {
			type: 'title',
			title: { value: options.titleOverwrite },
		};
	}

	if (options.descriptionOverwrite) {
		properties.description = {
			type: 'text',
			text: { value: options.descriptionOverwrite },
		};
	}

	if (Object.keys(properties).length) {
		body.properties = properties;
	}

	return body;
}

function parseJsonField(
	value: string | undefined,
	fieldLabel: string,
	node: INode,
	itemIndex: number,
): IDataObject | undefined {
	if (!value || !value.trim() || value.trim() === '{}') {
		return undefined;
	}

	try {
		return JSON.parse(value) as IDataObject;
	} catch (error) {
		throw new NodeOperationError(
			node,
			`Invalid JSON in ${fieldLabel}: ${(error as Error).message}`,
			{
				itemIndex,
			},
		);
	}
}

function tryParseJsonOrJs(str: string): any {
	const trimmed = str.trim();
	try {
		return JSON.parse(trimmed);
	} catch (_) {}

	try {
		// Repair single quotes and unquoted keys (e.g., [{ id: 'medium' }] -> [{"id": "medium"}])
		const repaired = trimmed.replace(/'/g, '"').replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
		return JSON.parse(repaired);
	} catch (_) {}

	return null;
}

function parseEntityArray(val: unknown): Array<{ id: string; name?: string; color?: string }> {
	if (!val) {
		return [];
	}

	if (Array.isArray(val)) {
		return val
			.map((item) => {
				if (typeof item === 'string') {
					return { id: item.trim() };
				}
				if (item && typeof item === 'object') {
					const obj = item as Record<string, unknown>;
					const id = obj.id;
					if (typeof id === 'string' || typeof id === 'number') {
						const name = typeof obj.name === 'string' ? obj.name : undefined;
						const color = typeof obj.color === 'string' ? obj.color : undefined;
						return {
							id: String(id).trim(),
							...(name ? { name } : {}),
							...(color ? { color } : {}),
						};
					}
				}
				return null;
			})
			.filter((x): x is { id: string; name?: string; color?: string } => x !== null && !!x.id);
	}

	if (typeof val === 'string') {
		const trimmed = val.trim();
		if (
			(trimmed.startsWith('[') && trimmed.endsWith(']')) ||
			(trimmed.startsWith('{') && trimmed.endsWith('}'))
		) {
			const parsed = tryParseJsonOrJs(trimmed);
			if (parsed) {
				return parseEntityArray(parsed);
			}
		}

		return trimmed
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean)
			.map((id) => ({ id }));
	}

	if (typeof val === 'object') {
		const obj = val as Record<string, unknown>;
		if (obj.label !== undefined) {
			return parseEntityArray(obj.label);
		}
		if (obj.entity !== undefined) {
			return parseEntityArray(obj.entity);
		}
		if (obj.id !== undefined && (typeof obj.id === 'string' || typeof obj.id === 'number')) {
			const name = typeof obj.name === 'string' ? obj.name : undefined;
			const color = typeof obj.color === 'string' ? obj.color : undefined;
			return [
				{ id: String(obj.id).trim(), ...(name ? { name } : {}), ...(color ? { color } : {}) },
			];
		}
	}

	return [];
}

function parseDateString(str: string): { value: string | null; hasTime: boolean } {
	const trimmed = str.trim();
	if (!trimmed || trimmed.toLowerCase() === 'null') {
		return { value: null, hasTime: false };
	}

	// Check if it's already a full ISO string (midnight UTC)
	const midnightRegex = /^(\d{4}-\d{2}-\d{2})T00:00:00(\.000)?(Z|[+-]00:00)?$/i;
	const midnightMatch = trimmed.match(midnightRegex);
	if (midnightMatch) {
		return { value: `${midnightMatch[1]}T00:00:00.000Z`, hasTime: false };
	}

	// Check if it's a simple YYYY-MM-DD
	const simpleDateRegex = /^(\d{4})[-/](\d{2})[-/](\d{2})$/;
	const simpleMatch = trimmed.match(simpleDateRegex);
	if (simpleMatch) {
		return {
			value: `${simpleMatch[1]}-${simpleMatch[2]}-${simpleMatch[3]}T00:00:00.000Z`,
			hasTime: false,
		};
	}

	// Otherwise, let's try parsing it with Date
	const timestamp = Date.parse(trimmed);
	if (isNaN(timestamp)) {
		return { value: trimmed, hasTime: false };
	}

	const d = new Date(timestamp);
	const hasColon = trimmed.includes(':');

	if (hasColon) {
		return { value: d.toISOString(), hasTime: true };
	} else {
		const isIsoFormat = trimmed.includes('-');
		const year = isIsoFormat ? d.getUTCFullYear() : d.getFullYear();
		const month = String((isIsoFormat ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
		const date = String(isIsoFormat ? d.getUTCDate() : d.getDate()).padStart(2, '0');
		return { value: `${year}-${month}-${date}T00:00:00.000Z`, hasTime: false };
	}
}

function parseDateProperty(val: unknown): IDataObject {
	let startStr: unknown = null;
	let endStr: unknown = null;
	let resolution: string | undefined = undefined;

	let parsedJson: any = null;
	if (typeof val === 'string') {
		const trimmed = val.trim();
		if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
			try {
				parsedJson = JSON.parse(trimmed);
			} catch (e) {
				// Ignore JSON parse error, treat as raw string
			}
		}
	}

	if (parsedJson) {
		const dateObj =
			parsedJson.date && typeof parsedJson.date === 'object' ? parsedJson.date : parsedJson;
		startStr = dateObj.start !== undefined ? dateObj.start : null;
		endStr = dateObj.end !== undefined ? dateObj.end : null;
		resolution = typeof dateObj.dateResolution === 'string' ? dateObj.dateResolution : undefined;
	} else if (typeof val === 'object' && val !== null) {
		const dateObj =
			(val as any).date && typeof (val as any).date === 'object' ? (val as any).date : val;
		startStr = dateObj.start !== undefined ? dateObj.start : null;
		endStr = dateObj.end !== undefined ? dateObj.end : null;
		resolution = typeof dateObj.dateResolution === 'string' ? dateObj.dateResolution : undefined;
	} else if (typeof val === 'string') {
		const trimmed = val.trim();
		if (!trimmed || trimmed.toLowerCase() === 'null') {
			return {
				type: 'date',
				date: {
					dateResolution: 'day',
					start: null,
					end: null,
				},
			};
		}

		// Split range by " to ", " - ", "/", or ","
		const parts = trimmed.split(/\s+to\s+|\s+-\s+|\/|,/i);
		if (parts.length >= 2) {
			startStr = parts[0];
			endStr = parts[1];
		} else {
			startStr = trimmed;
			endStr = null;
		}
	} else if (val === null || val === undefined) {
		return {
			type: 'date',
			date: {
				dateResolution: 'day',
				start: null,
				end: null,
			},
		};
	} else {
		// Fallback for numbers, etc.
		startStr = String(val);
	}

	// Parse start and end strings
	const parsedStart =
		startStr !== null ? parseDateString(String(startStr)) : { value: null, hasTime: false };
	const parsedEnd =
		endStr !== null ? parseDateString(String(endStr)) : { value: null, hasTime: false };

	// Determine resolution if not explicitly set
	if (!resolution) {
		if (parsedStart.hasTime || parsedEnd.hasTime) {
			resolution = 'time';
		} else {
			resolution = 'day';
		}
	}

	return {
		type: 'date',
		date: {
			dateResolution: resolution,
			start: parsedStart.value,
			end: parsedEnd.value,
		},
	};
}

function mapUiPropertyToApi(prop: { id: string; type: string; value: unknown }): IDataObject {
	const type = prop.type;
	const val = prop.value;

	if (type === 'text') {
		return { type: 'text', text: { value: String(val ?? '') } };
	} else if (type === 'title') {
		return { type: 'title', title: { value: String(val ?? '') } };
	} else if (type === 'number') {
		const num = Number(val);
		return { type: 'number', number: { value: isNaN(num) ? null : num } };
	} else if (type === 'boolean') {
		if (typeof val === 'boolean') {
			return { type: 'boolean', boolean: { value: val } };
		}
		return { type: 'boolean', boolean: { value: String(val).toLowerCase() === 'true' } };
	} else if (type === 'url') {
		return { type: 'url', url: { value: String(val ?? '') } };
	} else if (type === 'date') {
		return parseDateProperty(val);
	} else if (type === 'label') {
		const parsed = parseEntityArray(val);
		return {
			type: 'label',
			label: parsed.map((item) => ({
				id: item.id,
				name: item.name ?? item.id,
				...(item.color ? { color: item.color } : {}),
			})),
		};
	} else if (type === 'entity') {
		return {
			type: 'entity',
			entity: parseEntityArray(val),
		};
	}
	return {};
}

function getCreateObjectBody(
	structureId: string,
	title: string,
	additionalFields: ObjectAdditionalFields,
	node: INode,
	itemIndex: number,
): IDataObject {
	const properties: IDataObject = {
		title: { type: 'title', title: { value: title } },
	};

	if (additionalFields.propertiesToSend?.property) {
		for (const prop of additionalFields.propertiesToSend.property) {
			if (prop.id) {
				properties[prop.id] = mapUiPropertyToApi(prop);
			}
		}
	}

	const extraProperties = parseJsonField(
		additionalFields.propertiesJson,
		'Properties',
		node,
		itemIndex,
	);
	if (extraProperties) {
		Object.assign(properties, extraProperties);
	}

	const body: IDataObject = { structureId, properties };

	const collectionIds = (additionalFields.collectionIds ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
	if (collectionIds.length) {
		body.collections = collectionIds;
	}

	const blocks = parseJsonField(additionalFields.blocksJson, 'Blocks', node, itemIndex);
	if (blocks) {
		body.blocks = blocks;
	}

	return body;
}

export class CapacitiesV2 implements INodeType {
	methods = {
		loadOptions: {
			loadStructures,
			loadTags,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Capacities',
		name: 'capacities',
		icon: 'file:capacities.svg',
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Capacities API',
		defaults: {
			name: 'Capacities',
		},
		// @ts-ignore
		inputs: ['main'],
		// @ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'capacitiesApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.capacities.io',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			...resources,
			...space,
			...search,
			...weblink,
			...dailyNote,
			...tag,
			...object,
			...general,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('capacitiesApi');
		const token = credentials.token as string;
		const client = new CapacitiesClient({ apiToken: token });

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;
			let response: any;
			let rootProperty: string | undefined;

			try {
				if (resource === 'space' && operation === 'get') {
					response = await client.space.get();
				} else if (resource === 'space' && operation === 'getInfo') {
					response = await client.space.structures();
					rootProperty = 'structures';
				} else if (resource === 'search' && operation === 'search') {
					const structureIds = this.getNodeParameter('structureIds', itemIndex, []) as string[];
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					const body: any = {
						query: this.getNodeParameter('searchTerm', itemIndex) as string,
						limit,
					};

					if (structureIds.length) {
						body.structureIds = structureIds;
					}

					response = await client.objects.search(body);
					rootProperty = 'results';
				} else if (resource === 'weblink' && operation === 'save') {
					const weblinkOptions = this.getNodeParameter(
						'weblinkOptions',
						itemIndex,
						{},
					) as WeblinkOptions;
					if (getSelectedIds(weblinkOptions.tagIds).length) {
						throw new NodeOperationError(this.getNode(), WEBLINK_TAGS_UNSUPPORTED_MESSAGE, {
							itemIndex,
						});
					}

					response = await client.object.createFromUrl(
						getWeblinkBody(
							this.getNodeParameter('url', itemIndex) as string,
							weblinkOptions,
						) as any,
					);
				} else if (resource === 'dailyNote' && operation === 'saveToDailyNote') {
					const body: any = {
						markdown: this.getNodeParameter('mdText', itemIndex) as string,
						noTimeStamp: !(this.getNodeParameter('timestamp', itemIndex, true) as boolean),
					};

					const date = this.getNodeParameter('date', itemIndex, '') as string;
					if (date) {
						body.date = date;
					}

					response = await client.blocks.dailyNote.append(body);
				} else if (resource === 'tag' && operation === 'save') {
					response = await client.object.create({
						structureId: 'RootTag',
						properties: {
							title: {
								type: 'title',
								title: {
									value: this.getNodeParameter('title', itemIndex) as string,
								},
							},
						},
					});
				} else if (resource === 'object' && operation === 'create') {
					const structureId = this.getNodeParameter('structureId', itemIndex) as string;
					const title = this.getNodeParameter('title', itemIndex) as string;
					const additionalFields = this.getNodeParameter(
						'additionalFields',
						itemIndex,
						{},
					) as ObjectAdditionalFields;

					response = await client.object.create(
						getCreateObjectBody(
							structureId,
							title,
							additionalFields,
							this.getNode(),
							itemIndex,
						) as any,
					);
				} else if (resource === 'object' && operation === 'createFromMarkdown') {
					const structureId = this.getNodeParameter('structureId', itemIndex) as string;
					const markdown = this.getNodeParameter('markdown', itemIndex) as string;

					response = await client.object.markdown.create({ structureId, markdown });
				} else if (resource === 'object' && operation === 'update') {
					const id = this.getNodeParameter('id', itemIndex) as string;
					const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as {
						title?: string;
						propertiesJson?: string;
						collectionIds?: string;
						blocksJson?: string;
						propertiesToSend?: {
							property?: Array<{
								id: string;
								type: string;
								value: string;
							}>;
						};
					};

					const properties: IDataObject = {};
					if (updateFields.title) {
						properties.title = {
							type: 'title',
							title: { value: updateFields.title },
						};
					}

					if (updateFields.propertiesToSend?.property) {
						for (const prop of updateFields.propertiesToSend.property) {
							if (prop.id) {
								properties[prop.id] = mapUiPropertyToApi(prop);
							}
						}
					}

					const extraProperties = parseJsonField(
						updateFields.propertiesJson,
						'Properties',
						this.getNode(),
						itemIndex,
					);
					if (extraProperties) {
						Object.assign(properties, extraProperties);
					}

					const body: any = { id };
					if (Object.keys(properties).length) {
						body.properties = properties;
					}

					const collectionIds = (updateFields.collectionIds ?? '')
						.split(',')
						.map((cid) => cid.trim())
						.filter(Boolean);
					if (collectionIds.length) {
						body.collections = collectionIds;
					}

					const blocks = parseJsonField(
						updateFields.blocksJson,
						'Blocks',
						this.getNode(),
						itemIndex,
					);
					if (blocks) {
						body.blocks = blocks;
					}

					response = await client.object.update(body);
				} else if (resource === 'object' && operation === 'updateFromMarkdownFrontmatter') {
					const id = this.getNodeParameter('id', itemIndex) as string;
					const markdown = this.getNodeParameter('markdown', itemIndex) as string;

					response = await client.object.markdown.update({ id, markdown });
				} else if (resource === 'object' && operation === 'appendFromMarkdown') {
					const id = this.getNodeParameter('id', itemIndex) as string;
					const markdown = this.getNodeParameter('markdown', itemIndex) as string;

					response = await client.blocks.append({ id, markdown });
				} else if (resource === 'object' && operation === 'delete') {
					const id = this.getNodeParameter('id', itemIndex) as string;
					const hardDelete = this.getNodeParameter('hardDelete', itemIndex, false) as boolean;

					await client.object.delete({ id, hardDelete });
					response = { success: true };
				} else if (resource === 'object' && operation === 'get') {
					const id = this.getNodeParameter('id', itemIndex) as string;

					response = await client.object.get({ id });
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported Capacities operation: ${resource}.${operation}`,
					);
				}

				returnData.push(...toJsonItems(response, rootProperty));
			} catch (error) {
				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
