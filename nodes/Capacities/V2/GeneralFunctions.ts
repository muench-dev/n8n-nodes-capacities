import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

const CAPACITIES_RATE_LIMIT_MESSAGE =
	'Capacities is receiving too many requests from this API token. Please wait a moment and try loading the options again.';

function getErrorText(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	return '';
}

function getErrorStatusCode(error: unknown): number | undefined {
	if (!error || typeof error !== 'object') {
		return undefined;
	}

	const errorObject = error as {
		httpCode?: number;
		statusCode?: number;
		response?: { statusCode?: number; status?: number };
	};

	return (
		errorObject.httpCode ??
		errorObject.statusCode ??
		errorObject.response?.statusCode ??
		errorObject.response?.status
	);
}

function throwHumanReadableLoadOptionsError(error: unknown): never {
	const errorText = getErrorText(error);
	const isRateLimit =
		getErrorStatusCode(error) === 429 || errorText.toLowerCase().includes('too many requests');

	if (isRateLimit) {
		throw new Error(CAPACITIES_RATE_LIMIT_MESSAGE);
	}

	throw error;
}

export async function loadStructures(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	let response: { structures: Array<{ id: string; title: string }> };

	try {
		response = (await this.helpers.requestWithAuthentication.call(this, 'capacitiesApi', {
			method: 'GET',
			baseURL: 'https://api.capacities.io',
			url: '/space/structures',
			json: true,
		})) as { structures: Array<{ id: string; title: string }> };
	} catch (error) {
		throwHumanReadableLoadOptionsError(error);
	}

	return response.structures
		.map((structure) => ({ name: structure.title, value: structure.id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const tagById = new Map<string, string>();
	const queries = 'abcdefghijklmnopqrstuvwxyz'.split('');

	try {
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
	} catch (error) {
		throwHumanReadableLoadOptionsError(error);
	}

	return [...tagById.entries()]
		.map(([id, title]) => ({ name: title, value: id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}
