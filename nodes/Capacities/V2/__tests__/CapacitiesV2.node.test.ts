import { CapacitiesV2 } from '../CapacitiesV2.node';
import { getOptions, getProperty } from './testUtils';

describe('CapacitiesV2 node', () => {
	it('exposes Capacities API defaults', () => {
		const node = new CapacitiesV2();
		expect(node.description.version).toBe(2);
		expect(node.description.requestDefaults).toMatchObject({
			baseURL: 'https://api.capacities.io',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		});
	});

	it('includes resource selector across all supported resources', () => {
		const node = new CapacitiesV2();
		const resourceProperty = getProperty(node.description.properties, 'resource');
		expect(resourceProperty?.type).toBe('options');
		expect(getOptions(resourceProperty).map((option) => option.value).sort()).toEqual([
			'dailyNote',
			'search',
			'space',
			'tag',
			'weblink',
		]);
	});

	it('registers loadStructures helper for load options', () => {
		const node = new CapacitiesV2();
		expect(node.methods.loadOptions.loadStructures).toBeDefined();
	});
});
