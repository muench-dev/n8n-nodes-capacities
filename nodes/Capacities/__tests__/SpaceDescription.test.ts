import { space } from '../SpaceDescription';
import { loadSpaces } from '../GeneralFunctions';
import { getOptions, getProperty } from './testUtils';

describe('Space description', () => {
	it('declares getList operation extracting spaces array', () => {
		const operationProperty = getProperty(space, 'operation', 'space');
		expect(operationProperty).toBeDefined();
		const getList = getOptions(operationProperty).find((option) => option.value === 'getList');
		expect(getList?.routing?.request).toMatchObject({ url: '/spaces', method: 'GET' });
		expect(getList?.routing?.output?.postReceive).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: 'rootProperty',
					properties: { property: 'spaces' },
				}),
			]),
		);
	});

	it('wires getInfo operation to GET /space-info with a dynamic spaceId', () => {
		const operationProperty = getProperty(space, 'operation', 'space');
		const getInfo = getOptions(operationProperty).find((option) => option.value === 'getInfo');
		expect(getInfo?.routing?.request).toMatchObject({ url: '/space-info', method: 'GET' });
		const spaceIdProperty = getProperty(space, 'spaceId', 'space');
		expect(spaceIdProperty?.typeOptions?.loadOptions).toBe(loadSpaces);
		expect(spaceIdProperty?.routing?.request?.qs).toMatchObject({ spaceid: '={{$value}}' });
	});
});
