import { search } from '../SearchDescription';
import { loadSpaces } from '../GeneralFunctions';
import { getOptions, getProperty } from './testUtils';

describe('Search description', () => {
	it('configures search operation payload and output mapping', () => {
		const operationProperty = getProperty(search, 'operation', 'search');
		expect(operationProperty).toBeDefined();
		const searchOption = getOptions(operationProperty).find((option) => option.value === 'search');
		expect(searchOption?.routing?.request).toMatchObject({
			url: '/search',
			method: 'POST',
			json: true,
		});
		expect(searchOption?.routing?.request?.body).toMatchObject({
			mode: '={{$parameter.searchMode}}',
			searchTerm: '={{$parameter.searchTerm}}',
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

	it('ties load options to spaces and structures inputs', () => {
		const spaceIdsProperty = getProperty(search, 'searchSpaceIds', 'search');
		expect(spaceIdsProperty?.type).toBe('multiOptions');
		expect(spaceIdsProperty?.typeOptions?.loadOptions).toBe(loadSpaces);
		expect(spaceIdsProperty?.routing?.request?.body).toMatchObject({
			spaceIds: '={{Array.isArray($value) ? $value : []}}',
		});
		const structureProperty = getProperty(search, 'filterStructureIds', 'search');
		expect(structureProperty?.typeOptions?.loadOptionsMethod).toBe('loadStructures');
		expect(structureProperty?.typeOptions?.loadOptionsDependsOn).toEqual(['searchSpaceIds']);
		expect(structureProperty?.routing?.request?.body).toMatchObject({
			filterStructureIds: '={{Array.isArray($value) ? $value : []}}',
		});
	});
});
