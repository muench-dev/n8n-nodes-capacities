import { Capacities } from '../Capacities.node';
import { getOptions, getProperty } from './testUtils';

describe('Capacities node', () => {
	it('exposes Capacities API defaults', () => {
		const node = new Capacities();
		expect(node.description.requestDefaults).toMatchObject({
			baseURL: 'https://api.capacities.io',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		});
	});

	it('includes resource selector across all supported resources', () => {
		const node = new Capacities();
		const resourceProperty = getProperty(node.description.properties, 'resource');
		expect(resourceProperty?.type).toBe('options');
		expect(getOptions(resourceProperty).map((option) => option.value).sort()).toEqual([
			'dailyNote',
			'search',
			'space',
			'weblink',
		]);
	});

	it('registers loadStructures helper for load options', () => {
		const node = new Capacities();
		expect(node.methods.loadOptions.loadStructures).toBeDefined();
	});
});
