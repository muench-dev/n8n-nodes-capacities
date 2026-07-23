import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

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

export async function loadTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const tagById = new Map<string, string>();
	const queries = 'abcdefghijklmnopqrstuvwxyz'.split('');

	await Promise.all(
		queries.map(async (query) => {
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

			for (const tag of response.results) {
				tagById.set(tag.id, tag.title);
			}
		}),
	);

	return [...tagById.entries()]
		.map(([id, title]) => ({ name: title, value: id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}
