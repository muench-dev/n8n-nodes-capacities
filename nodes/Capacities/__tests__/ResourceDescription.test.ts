import { resources } from '../ResourceDescription';
import { getOptions, getProperty } from './testUtils';

describe('Resource description', () => {
	it('presents supported resources with dailyNote default', () => {
		const resourceProperty = getProperty(resources, 'resource');
		expect(resourceProperty).toBeDefined();
		expect(resourceProperty?.default).toBe('dailyNote');
		expect(getOptions(resourceProperty).map((option) => option.value).sort()).toEqual([
			'dailyNote',
			'search',
			'space',
			'weblink',
		]);
	});
});
