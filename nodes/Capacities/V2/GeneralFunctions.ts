import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { CapacitiesClient } from '@capacities/api';

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
		status?: number;
		httpCode?: number;
		statusCode?: number;
		response?: { statusCode?: number; status?: number };
	};

	return (
		errorObject.status ??
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
	let response: any;

	try {
		const credentials = await this.getCredentials('capacitiesApi');
		const token = credentials.token as string;
		const client = new CapacitiesClient({ apiToken: token });
		response = await client.space.structures();
	} catch (error) {
		throwHumanReadableLoadOptionsError(error);
	}

	return (response.structures as Array<{ id: string; title: string }>)
		.map((structure) => ({ name: structure.title, value: structure.id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const tagById = new Map<string, string>();
	const queries = 'abcdefghijklmnopqrstuvwxyz'.split('');

	try {
		const credentials = await this.getCredentials('capacitiesApi');
		const token = credentials.token as string;
		const client = new CapacitiesClient({ apiToken: token });

		await Promise.all(
			queries.map(async (query) => {
				const response = await client.objects.search({
					query,
					structureIds: ['RootTag'],
					limit: 50,
				});

				for (const tag of response.results as any[]) {
					tagById.set(tag.id as string, tag.title as string);
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
