import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { loadStructures, loadTags } from '../GeneralFunctions';

const rateLimitMessage =
	'Capacities is receiving too many requests from this API token. Please wait a moment and try loading the options again.';

const createContext = (response: Record<string, unknown>) => {
	const requestMock = jest.fn().mockResolvedValue(response);
	const context = {
		helpers: {
			requestWithAuthentication: requestMock,
		},
	} as unknown as ILoadOptionsFunctions;

	return { context, requestMock };
};

const createRejectingContext = (error: unknown) => {
	const requestMock = jest.fn().mockRejectedValue(error);
	const context = {
		helpers: {
			requestWithAuthentication: requestMock,
		},
	} as unknown as ILoadOptionsFunctions;

	return { context, requestMock };
};

describe('loadStructures helper (v1)', () => {
	it('requests GET /space/structures with no spaceId and maps id/title pairs', async () => {
		const { context, requestMock } = createContext({
			structures: [
				{ id: 'structure-b', title: 'Beta' },
				{ id: 'structure-a', title: 'Alpha' },
			],
		});

		const result = await loadStructures.call(context);

		expect(requestMock).toHaveBeenCalledTimes(1);
		expect(requestMock).toHaveBeenCalledWith(
			'capacitiesApi',
			expect.objectContaining({
				url: '/space/structures',
				method: 'GET',
			}),
		);
		expect(requestMock.mock.calls[0][1]).not.toHaveProperty('qs');
		expect(result).toEqual([
			{ name: 'Alpha', value: 'structure-a' },
			{ name: 'Beta', value: 'structure-b' },
		]);
	});

	it('shows a human-readable rate-limit error', async () => {
		const { context } = createRejectingContext({
			response: { statusCode: 429 },
			message: 'The service is receiving too many requests from you',
		});

		await expect(loadStructures.call(context)).rejects.toThrow(rateLimitMessage);
	});
});

describe('loadTags helper (v2)', () => {
	it('loads tag options from valid RootTag searches and deduplicates results', async () => {
		const { context, requestMock } = createContext({
			results: [
				{ id: 'tag-b', title: 'Beta' },
				{ id: 'tag-a', title: 'Alpha' },
				{ id: 'tag-a', title: 'Alpha' },
			],
		});

		const result = await loadTags.call(context);

		expect(requestMock).toHaveBeenCalledTimes(26);
		expect(requestMock).toHaveBeenCalledWith(
			'capacitiesApi',
			expect.objectContaining({
				url: '/objects/search',
				method: 'POST',
				body: {
					query: 'a',
					structureIds: ['RootTag'],
					limit: 50,
				},
			}),
		);
		expect(result).toEqual([
			{ name: 'Alpha', value: 'tag-a' },
			{ name: 'Beta', value: 'tag-b' },
		]);
	});

	it('shows a human-readable rate-limit error', async () => {
		const { context } = createRejectingContext(
			new Error('NodeApiError The service is receiving too many requests from you'),
		);

		await expect(loadTags.call(context)).rejects.toThrow(rateLimitMessage);
	});
});
