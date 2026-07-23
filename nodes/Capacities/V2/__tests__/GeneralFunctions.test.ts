import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { loadStructures, loadTags } from '../GeneralFunctions';

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

describe('loadTags helper (v2)', () => {
	it('requests RootTag search results and maps id/title pairs', async () => {
		const { context, requestMock } = createContext({
			results: [
				{ id: 'tag-b', title: 'Beta' },
				{ id: 'tag-a', title: 'Alpha' },
			],
		});

		const result = await loadTags.call(context);

		expect(requestMock).toHaveBeenCalledTimes(1);
		expect(requestMock).toHaveBeenCalledWith(
			'capacitiesApi',
			expect.objectContaining({
				url: '/objects/search',
				method: 'POST',
				body: {
					query: '',
					structureIds: ['RootTag'],
					limit: 100,
				},
			}),
		);
		expect(result).toEqual([
			{ name: 'Alpha', value: 'tag-a' },
			{ name: 'Beta', value: 'tag-b' },
		]);
	});
});
