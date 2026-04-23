import { CapacitiesApi } from '../CapacitiesApi.credentials';

describe('CapacitiesApi credentials', () => {
	it('should have the correct properties', () => {
		const credentials = new CapacitiesApi();
		expect(credentials.name).toBe('capacitiesApi');
		expect(credentials.displayName).toBe('Capactities API');
		expect(credentials.documentationUrl).toBe('https://docs.capacities.io/developer/api');
		expect(credentials.icon).toBe('node:@muench-dev/n8n-nodes-capacities.capacities');
	});

	it('should have the correct properties in the properties array', () => {
		const credentials = new CapacitiesApi();
		expect(credentials.properties).toHaveLength(1);
		const tokenProperty = credentials.properties[0];
		expect(tokenProperty.name).toBe('token');
		expect(tokenProperty.type).toBe('string');
		expect(tokenProperty.typeOptions).toMatchObject({ password: true });
		expect(tokenProperty.default).toBe('');
	});

	it('should have the correct authenticate configuration', () => {
		const credentials = new CapacitiesApi();
		expect(credentials.authenticate).toMatchObject({
			type: 'generic',
			properties: {
				headers: {
					Authorization: '={{"Bearer " + $credentials.token}}',
				},
			},
		});
	});

	it('should have the correct test request configuration', () => {
		const credentials = new CapacitiesApi();
		expect(credentials.test).toMatchObject({
			request: {
				baseURL: 'https://api.capacities.io',
				url: '/spaces',
			},
		});
	});
});
