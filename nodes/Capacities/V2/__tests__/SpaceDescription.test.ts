import { space } from '../SpaceDescription';
import { getOptions, getProperty } from './testUtils';

describe('Space description (v1)', () => {
	it('declares get operation wired to GET /space', () => {
		const operationProperty = getProperty(space, 'operation', 'space');
		expect(operationProperty).toBeDefined();
		const get = getOptions(operationProperty).find((option) => option.value === 'get');
		expect(get?.routing?.request).toMatchObject({ url: '/space', method: 'GET' });
	});

	it('wires getInfo operation to GET /space/structures extracting structures array', () => {
		const operationProperty = getProperty(space, 'operation', 'space');
		const getInfo = getOptions(operationProperty).find((option) => option.value === 'getInfo');
		expect(getInfo?.routing?.request).toMatchObject({ url: '/space/structures', method: 'GET' });
		expect(getInfo?.routing?.output?.postReceive).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: 'rootProperty',
					properties: { property: 'structures' },
				}),
			]),
		);
	});

	it('does not expose a Space ID selector (token is space-scoped)', () => {
		expect(getProperty(space, 'spaceId', 'space')).toBeUndefined();
	});
});
