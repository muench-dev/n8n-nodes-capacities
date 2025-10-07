import type { ILoadOptions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

export const loadSpaces: ILoadOptions = {
	routing: {
		request: {
			url: '/spaces',
			method: 'GET',
		},
		output: {
			postReceive: [
				{
					type: 'rootProperty',
					properties: {
						property: 'spaces',
					},
				},
				{
					type: 'setKeyValue',
					properties: {
						name: '={{$responseItem.title}}',
						value: '={{$responseItem.id}}',
					},
				},
				{
					// If incoming data is an array of objects, sort alphabetically by key
					type: 'sort',
					properties: {
						key: 'name',
					},
				},
			],
		}
	}
};

export async function loadStructures(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const currentSelection = this.getCurrentNodeParameter('searchSpaceIds');
	const fallbackSelection = this.getNodeParameter('searchSpaceIds', []) as string[];
	const selectedSpaceIds = currentSelection ?? fallbackSelection;
	const spaceIds = Array.isArray(selectedSpaceIds)
		? (selectedSpaceIds as string[])
		: selectedSpaceIds
			? [selectedSpaceIds as string]
			: [];

	if (!spaceIds.length) {
		return [];
	}

	const structureLabelById = new Map<string, string>();
	const formatSpaceContext = (id: string) => id.replace(/\b\w/g, (char) => char.toUpperCase());

	for (const spaceId of spaceIds) {
		if (!spaceId) {
			continue;
		}

		const response = (await this.helpers.requestWithAuthentication.call(this, 'capacitiesApi', {
			method: 'GET',
			baseURL: 'https://api.capacities.io',
			url: '/space-info',
			qs: {
				spaceid: spaceId,
			},
			json: true,
		})) as {
			structures?: Array<Record<string, unknown>> | Record<string, Record<string, unknown>>;
			space?: {
				structures?: Array<Record<string, unknown>> | Record<string, Record<string, unknown>>;
			};
			data?: {
				structures?: Array<Record<string, unknown>> | Record<string, Record<string, unknown>>;
			};
			spaceInfo?: {
				structures?: Array<Record<string, unknown>> | Record<string, Record<string, unknown>>;
			};
		};

		const extractStructures = (structuresSource: unknown): Array<Record<string, unknown>> => {
			if (Array.isArray(structuresSource)) {
				return structuresSource as Array<Record<string, unknown>>;
			}
			if (structuresSource && typeof structuresSource === 'object') {
				return Object.values(structuresSource as Record<string, Record<string, unknown>>);
			}
			return [];
		};

		const structures = [
			...extractStructures(response?.structures),
			...extractStructures(response?.space?.structures),
			...extractStructures(response?.data?.structures),
			...extractStructures(response?.spaceInfo?.structures),
		];

		for (const structure of structures) {
			const idValue = structure?.id ?? structure?.structureId ?? structure?.slug ?? structure?.name;
			if (typeof idValue !== 'string' || idValue.trim() === '') {
				continue;
			}

			const displayNameSource =
				structure?.title ??
				structure?.name ??
				structure?.label ??
				structure?.displayName ??
				idValue;

			const structureName = typeof displayNameSource === 'string' ? displayNameSource : idValue;
			const spaceLabel = formatSpaceContext(spaceId);
			const nameWithContext = spaceIds.length > 1 ? `${structureName} (${spaceLabel})` : structureName;
			if (!structureLabelById.has(idValue)) {
				structureLabelById.set(idValue, nameWithContext);
			}
		}
	}

	return Array.from(structureLabelById.entries())
		.sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
		.map(([value, name]) => ({ name, value }));
}
