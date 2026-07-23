import type { ILoadOptionsFunctions, INodeListSearchResult, INodePropertyOptions } from 'n8n-workflow';

export async function loadStructures(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = (await this.helpers.requestWithAuthentication.call(this, 'capacitiesApi', {
		method: 'GET',
		baseURL: 'https://api.capacities.io',
		url: '/space/structures',
		json: true,
	})) as {
		structures: Array<{ id: string; title: string }>;
	};

	return response.structures
		.map((structure) => ({ name: structure.title, value: structure.id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchTags(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const query = String(filter ?? '').trim();

	if (!query) {
		return { results: [] };
	}

	const response = (await this.helpers.requestWithAuthentication.call(this, 'capacitiesApi', {
		method: 'POST',
		baseURL: 'https://api.capacities.io',
		url: '/objects/search',
		json: true,
		body: {
			query,
			structureIds: ['RootTag'],
			limit: 50,
		},
	})) as {
		results: Array<{ id: string; title: string }>;
	};

	return {
		results: response.results
			.map((tag) => ({ name: tag.title, value: tag.id }))
			.sort((a, b) => a.name.localeCompare(b.name)),
	};
}
