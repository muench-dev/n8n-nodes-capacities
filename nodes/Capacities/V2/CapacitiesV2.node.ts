import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { resources } from './ResourceDescription';
import { general } from './GeneralDescription';
import { space } from './SpaceDescription';
import { search } from './SearchDescription';
import { weblink } from './WeblinkDescription';
import { dailyNote } from './DailyNoteDescription';
import { tag } from './TagDescription';
import { loadStructures, loadTags } from './GeneralFunctions';

type WeblinkOptions = {
	markdown?: string;
	titleOverwrite?: string;
	descriptionOverwrite?: string;
	tagIds?: string | string[];
};

type RequestOptions = {
	method: 'GET' | 'POST';
	baseURL: string;
	url: string;
	json: true;
	body?: IDataObject;
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
		properties: [...resources, ...space, ...search, ...weblink, ...dailyNote, ...tag, ...general],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;
			let requestOptions: RequestOptions;
			let rootProperty: string | undefined;

			if (resource === 'space' && operation === 'get') {
				requestOptions = {
					method: 'GET',
					baseURL: 'https://api.capacities.io',
					url: '/space',
					json: true,
				};
			} else if (resource === 'space' && operation === 'getInfo') {
				requestOptions = {
					method: 'GET',
					baseURL: 'https://api.capacities.io',
					url: '/space/structures',
					json: true,
				};
				rootProperty = 'structures';
			} else if (resource === 'search' && operation === 'search') {
				const structureIds = this.getNodeParameter('structureIds', itemIndex, []) as string[];
				const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
				const body: IDataObject = {
					query: this.getNodeParameter('searchTerm', itemIndex) as string,
					limit,
				};

				if (structureIds.length) {
					body.structureIds = structureIds;
				}

				requestOptions = {
					method: 'POST',
					baseURL: 'https://api.capacities.io',
					url: '/objects/search',
					json: true,
					body,
				};
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

				requestOptions = {
					method: 'POST',
					baseURL: 'https://api.capacities.io',
					url: '/object/url',
					json: true,
					body: getWeblinkBody(this.getNodeParameter('url', itemIndex) as string, weblinkOptions),
				};
			} else if (resource === 'dailyNote' && operation === 'saveToDailyNote') {
				const body: IDataObject = {
					markdown: this.getNodeParameter('mdText', itemIndex) as string,
					noTimeStamp: !(this.getNodeParameter('timestamp', itemIndex, true) as boolean),
				};

				const date = this.getNodeParameter('date', itemIndex, '') as string;
				if (date) {
					body.date = date;
				}

				requestOptions = {
					method: 'POST',
					baseURL: 'https://api.capacities.io',
					url: '/blocks/daily-note/append',
					json: true,
					body,
				};
			} else if (resource === 'tag' && operation === 'save') {
				requestOptions = {
					method: 'POST',
					baseURL: 'https://api.capacities.io',
					url: '/object',
					json: true,
					body: {
						structureId: 'RootTag',
						properties: {
							title: {
								type: 'title',
								title: {
									value: this.getNodeParameter('title', itemIndex) as string,
								},
							},
						},
					},
				};
			} else {
				throw new NodeOperationError(
					this.getNode(),
					`Unsupported Capacities operation: ${resource}.${operation}`,
				);
			}

			const response = await this.helpers.requestWithAuthentication.call(
				this,
				'capacitiesApi',
				requestOptions,
				undefined,
				itemIndex,
			);

			returnData.push(...toJsonItems(response, rootProperty));
		}

		return [returnData];
	}
}
