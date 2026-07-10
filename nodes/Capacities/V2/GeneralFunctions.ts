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
