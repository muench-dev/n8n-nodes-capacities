import type { IExecuteFunctions } from 'n8n-workflow';

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
		expect(
			getOptions(resourceProperty)
				.map((option) => option.value)
				.sort(),
		).toEqual(['dailyNote', 'search', 'space', 'tag', 'weblink']);
	});

	it('registers load option helpers', () => {
		const node = new CapacitiesV2();
		expect(node.methods.loadOptions.loadStructures).toBeDefined();
		expect(node.methods.loadOptions.loadTags).toBeDefined();
	});

	it('saves weblinks with supported properties', async () => {
		const node = new CapacitiesV2();
		const requestMock = jest.fn().mockResolvedValue({ id: 'created-weblink' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'weblink',
					operation: 'save',
					url: 'https://example.com',
					weblinkOptions: {
						markdown: 'Notes',
						titleOverwrite: 'Title',
						descriptionOverwrite: 'Description',
					},
				};

				return parameters[parameterName];
			}),
			helpers: {
				requestWithAuthentication: requestMock,
			},
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(requestMock).toHaveBeenCalledTimes(1);
		expect(requestMock).toHaveBeenCalledWith(
			'capacitiesApi',
			expect.objectContaining({
				url: '/object/url',
				method: 'POST',
				body: {
					url: 'https://example.com',
					markdown: 'Notes',
					properties: {
						title: {
							type: 'title',
							title: { value: 'Title' },
						},
						description: {
							type: 'text',
							text: { value: 'Description' },
						},
					},
				},
			}),
			undefined,
			0,
		);
		expect(result).toEqual([[{ json: { id: 'created-weblink' } }]]);
	});

	it('fails clearly when stale workflows still contain selected weblink tags', async () => {
		const node = new CapacitiesV2();
		const requestMock = jest.fn();
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'weblink',
					operation: 'save',
					url: 'https://example.com',
					weblinkOptions: {
						tagIds: ['tag-1'],
					},
				};

				return parameters[parameterName];
			}),
			helpers: {
				requestWithAuthentication: requestMock,
			},
		} as unknown as IExecuteFunctions;

		await expect(node.execute.call(context)).rejects.toThrow(
			'Capacities API does not currently support assigning tags to weblinks',
		);
		expect(requestMock).not.toHaveBeenCalled();
	});
});
