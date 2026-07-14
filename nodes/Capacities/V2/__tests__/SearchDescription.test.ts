import { search } from '../SearchDescription';
import { getOptions, getProperty } from './testUtils';

describe('Search description (v1)', () => {
	it('configures search operation payload and output mapping', () => {
		const operationProperty = getProperty(search, 'operation', 'search');
		expect(operationProperty).toBeDefined();
		const searchOption = getOptions(operationProperty).find((option) => option.value === 'search');
		expect(searchOption?.routing?.request).toMatchObject({
			url: '/objects/search',
			method: 'POST',
			json: true,
		});
		expect(searchOption?.routing?.request?.body).toMatchObject({
			query: '={{$parameter.searchTerm}}',
		});
		expect(searchOption?.routing?.output?.postReceive).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: 'rootProperty',
					properties: { property: 'results' },
				}),
			]),
		);
	});

	it('does not expose a Space selector (token is space-scoped)', () => {
		expect(getProperty(search, 'searchSpaceId', 'search')).toBeUndefined();
	});

	it('exposes optional structureIds filter backed by loadStructures', () => {
		const structureIdsProperty = getProperty(search, 'structureIds', 'search');
		expect(structureIdsProperty?.type).toBe('multiOptions');
		expect(structureIdsProperty?.typeOptions?.loadOptionsMethod).toBe('loadStructures');
		expect(structureIdsProperty?.routing?.send).toMatchObject({
			type: 'body',
			property: 'structureIds',
		});
	});

	it('exposes optional limit field', () => {
		const limitProperty = getProperty(search, 'limit', 'search');
		expect(limitProperty?.type).toBe('number');
		expect(limitProperty?.routing?.send).toMatchObject({
			type: 'body',
			property: 'limit',
		});
	});
});
