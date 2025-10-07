import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { loadSpaces, loadStructures } from '../GeneralFunctions';

type Selection = string | string[] | undefined;

const createLoadStructuresContext = (options: {
	currentSelection?: Selection;
	fallbackSelection?: Selection;
	responses?: Array<Record<string, unknown>>;
}) => {
	const requestMock = jest.fn();
	for (const response of options.responses ?? []) {
		requestMock.mockResolvedValueOnce(response);
	}
	const context = {
		helpers: {
			requestWithAuthentication: requestMock,
		},
		getCurrentNodeParameter: jest.fn((parameterName: string) => {
			if (parameterName === 'searchSpaceIds') {
				return options.currentSelection;
			}
			return undefined;
		}),
		getNodeParameter: jest.fn((parameterName: string, defaultValue: unknown) => {
			if (parameterName === 'searchSpaceIds') {
				return options.fallbackSelection ?? defaultValue;
			}
			return defaultValue;
		}),
	} as unknown as ILoadOptionsFunctions;

	return { context, requestMock };
};

describe('loadSpaces descriptor', () => {
	it('requests the spaces endpoint and sets post processing steps', () => {
		expect(loadSpaces.routing?.request).toMatchObject({ url: '/spaces', method: 'GET' });
		expect(loadSpaces.routing?.output?.postReceive).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: 'rootProperty',
					properties: { property: 'spaces' },
				}),
				expect.objectContaining({ type: 'setKeyValue' }),
				expect.objectContaining({ type: 'sort' }),
		]),
		);
	});
});

describe('loadStructures helper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns an empty list without hitting the API when no space is selected', async () => {
		const { context, requestMock } = createLoadStructuresContext({ currentSelection: undefined, fallbackSelection: [] });
		const result = await loadStructures.call(context);
		expect(result).toEqual([]);
		expect(requestMock).not.toHaveBeenCalled();
	});

	it('falls back to stored selection when current selection is undefined', async () => {
		const { context, requestMock } = createLoadStructuresContext({
			currentSelection: undefined,
			fallbackSelection: 'space-1',
			responses: [
				{
					spaceInfo: {
						structures: [
							{ id: 'solo-structure', name: 'Solo' },
						],
					},
				},
			],
		});
		const result = await loadStructures.call(context);
		expect(requestMock).toHaveBeenCalledTimes(1);
		expect(requestMock).toHaveBeenCalledWith(
			'capacitiesApi',
			expect.objectContaining({
				url: '/space-info',
				method: 'GET',
				qs: { spaceid: 'space-1' },
			}),
		);
		expect(result).toEqual([
			{
				name: 'Solo',
				value: 'solo-structure',
			},
		]);
	});

	it('aggregates, deduplicates, and sorts structures across multiple spaces', async () => {
		const { context, requestMock } = createLoadStructuresContext({
			currentSelection: ['space-alpha', 'space-beta'],
			responses: [
				{
					structures: [
						{ id: 'structure-a', title: 'Alpha' },
						{ structureId: 'structure-b', name: 'Beta' },
					],
				},
				{
					space: {
						structures: {
							gamma: { id: 'structure-c', name: 'Gamma' },
							duplicate: { id: 'structure-b', name: 'Beta override' },
						},
					},
					data: {
						structures: [
							{ id: 'structure-d', name: 'Delta' },
						],
					},
				},
			],
		});
		const result = await loadStructures.call(context);
		expect(requestMock).toHaveBeenCalledTimes(2);
		expect(requestMock).toHaveBeenNthCalledWith(
			1,
			'capacitiesApi',
			expect.objectContaining({ qs: { spaceid: 'space-alpha' } }),
		);
		expect(requestMock).toHaveBeenNthCalledWith(
			2,
			'capacitiesApi',
			expect.objectContaining({ qs: { spaceid: 'space-beta' } }),
		);
		expect(result).toEqual([
			{ name: 'Alpha (space-alpha)', value: 'structure-a' },
			{ name: 'Beta (space-alpha)', value: 'structure-b' },
			{ name: 'Delta (space-beta)', value: 'structure-d' },
			{ name: 'Gamma (space-beta)', value: 'structure-c' },
		]);
	});
});
