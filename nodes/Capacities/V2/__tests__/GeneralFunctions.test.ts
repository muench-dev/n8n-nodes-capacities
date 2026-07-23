import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { loadStructures, searchTags } from '../GeneralFunctions';

const createContext = (response: Record<string, unknown>) => {
	const requestMock = jest.fn().mockResolvedValue(response);
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
});

describe('searchTags helper (v2)', () => {
	it('returns no options without hitting the API when no filter is set', async () => {
		const { context, requestMock } = createContext({ results: [] });

		const result = await searchTags.call(context);

		expect(result).toEqual({ results: [] });
		expect(requestMock).not.toHaveBeenCalled();
	});

	it('requests RootTag search results and maps id/title pairs', async () => {
		const { context, requestMock } = createContext({
			results: [
				{ id: 'tag-b', title: 'Beta' },
				{ id: 'tag-a', title: 'Alpha' },
			],
		});

		const result = await searchTags.call(context, 'a');

		expect(requestMock).toHaveBeenCalledTimes(1);
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
		expect(result).toEqual({
			results: [
				{ name: 'Alpha', value: 'tag-a' },
				{ name: 'Beta', value: 'tag-b' },
			],
		});
	});
});
