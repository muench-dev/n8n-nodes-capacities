import { search } from '../SearchDescription';
import { loadSpaces } from '../GeneralFunctions';
import { getOptions, getProperty } from './testUtils';

describe('Search description', () => {
	it('configures search operation payload and output mapping', () => {
		const operationProperty = getProperty(search, 'operation', 'search');
		expect(operationProperty).toBeDefined();
		const searchOption = getOptions(operationProperty).find((option) => option.value === 'search');
		expect(searchOption?.routing?.request).toMatchObject({
			url: '/lookup',
			method: 'POST',
			json: true,
		});
		expect(searchOption?.routing?.request?.body).toMatchObject({
			searchTerm: '={{$parameter.searchTerm}}',
			spaceId: '={{$parameter.searchSpaceId}}',
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

	it('ties load options to space input', () => {
		const spaceIdProperty = getProperty(search, 'searchSpaceId', 'search');
		expect(spaceIdProperty?.type).toBe('options');
		expect(spaceIdProperty?.typeOptions?.loadOptions).toBe(loadSpaces);
	});
});
