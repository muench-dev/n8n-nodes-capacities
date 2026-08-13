import type { IExecuteFunctions } from 'n8n-workflow';

import { CapacitiesV2 } from '../CapacitiesV2.node';
import { getOptions, getProperty } from './testUtils';

const mockSpaceGet = jest.fn();
const mockSpaceStructures = jest.fn();
const mockObjectsSearch = jest.fn();
const mockObjectCreate = jest.fn();
const mockObjectUpdate = jest.fn();
const mockObjectDelete = jest.fn();
const mockObjectCreateFromUrl = jest.fn();
const mockBlocksDailyNoteAppend = jest.fn();

jest.mock('@capacities/api', () => {
	return {
		CapacitiesClient: jest.fn().mockImplementation(() => {
			return {
				space: {
					get: mockSpaceGet,
					structures: mockSpaceStructures,
				},
				objects: {
					search: mockObjectsSearch,
				},
				object: {
					create: mockObjectCreate,
					update: mockObjectUpdate,
					delete: mockObjectDelete,
					createFromUrl: mockObjectCreateFromUrl,
				},
				blocks: {
					dailyNote: {
						append: mockBlocksDailyNoteAppend,
					},
				},
			};
		}),
	};
});

describe('CapacitiesV2 node', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

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
		).toEqual(['dailyNote', 'object', 'search', 'space', 'tag', 'weblink']);
	});

	it('registers load option helpers', () => {
		const node = new CapacitiesV2();
		expect(node.methods.loadOptions.loadStructures).toBeDefined();
		expect(node.methods.loadOptions.loadTags).toBeDefined();
	});

	it('saves weblinks with supported properties', async () => {
		const node = new CapacitiesV2();
		mockObjectCreateFromUrl.mockResolvedValue({ id: 'created-weblink' });
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
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectCreateFromUrl).toHaveBeenCalledTimes(1);
		expect(mockObjectCreateFromUrl).toHaveBeenCalledWith({
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
		});
		expect(result).toEqual([[{ json: { id: 'created-weblink' } }]]);
	});

	it('creates objects with just a title', async () => {
		const node = new CapacitiesV2();
		mockObjectCreate.mockResolvedValue({ id: 'created-object' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'create',
					structureId: 'structure-1',
					title: 'My Object',
					additionalFields: {},
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectCreate).toHaveBeenCalledWith({
			structureId: 'structure-1',
			properties: {
				title: { type: 'title', title: { value: 'My Object' } },
			},
		});
		expect(result).toEqual([[{ json: { id: 'created-object' } }]]);
	});

	it('creates objects with additional properties, collections, and blocks', async () => {
		const node = new CapacitiesV2();
		mockObjectCreate.mockResolvedValue({ id: 'created-object' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'create',
					structureId: 'structure-1',
					title: 'My Object',
					additionalFields: {
						propertiesJson: '{"score":{"type":"number","number":{"value":42}}}',
						collectionIds: ' collection-1 , collection-2 ,,',
						blocksJson:
							'{"notes":[{"type":"TextBlock","tokens":[{"type":"TextToken","text":"Hi","style":{}}]}]}',
					},
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		await node.execute.call(context);

		expect(mockObjectCreate).toHaveBeenCalledWith({
			structureId: 'structure-1',
			properties: {
				title: { type: 'title', title: { value: 'My Object' } },
				score: { type: 'number', number: { value: 42 } },
			},
			collections: ['collection-1', 'collection-2'],
			blocks: {
				notes: [
					{
						type: 'TextBlock',
						tokens: [{ type: 'TextToken', text: 'Hi', style: {} }],
					},
				],
			},
		});
	});

	it('fails clearly with invalid JSON in the object properties field', async () => {
		const node = new CapacitiesV2();
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'create',
					structureId: 'structure-1',
					title: 'My Object',
					additionalFields: {
						propertiesJson: '{bad',
					},
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		await expect(node.execute.call(context)).rejects.toThrow('Invalid JSON in Properties');
		expect(mockObjectCreate).not.toHaveBeenCalled();
	});

	it('fails clearly when stale workflows still contain selected weblink tags', async () => {
		const node = new CapacitiesV2();
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
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		await expect(node.execute.call(context)).rejects.toThrow(
			'Capacities API does not currently support assigning tags to weblinks',
		);
		expect(mockObjectCreateFromUrl).not.toHaveBeenCalled();
	});

	it('updates objects with optional properties, collections, and blocks', async () => {
		const node = new CapacitiesV2();
		mockObjectUpdate.mockResolvedValue({ id: 'updated-object' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'update',
					id: 'object-id-123',
					updateFields: {
						title: 'New Title',
						propertiesJson: '{"score":{"type":"number","number":{"value":43}}}',
						collectionIds: ' collection-1 , collection-3 ',
						blocksJson:
							'{"notes":[{"type":"TextBlock","tokens":[{"type":"TextToken","text":"Updated","style":{}}]}]}',
					},
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectUpdate).toHaveBeenCalledWith({
			id: 'object-id-123',
			properties: {
				title: { type: 'title', title: { value: 'New Title' } },
				score: { type: 'number', number: { value: 43 } },
			},
			collections: ['collection-1', 'collection-3'],
			blocks: {
				notes: [
					{
						type: 'TextBlock',
						tokens: [{ type: 'TextToken', text: 'Updated', style: {} }],
					},
				],
			},
		});
		expect(result).toEqual([[{ json: { id: 'updated-object' } }]]);
	});

	it('deletes objects', async () => {
		const node = new CapacitiesV2();
		mockObjectDelete.mockResolvedValue(undefined);
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'delete',
					id: 'object-id-123',
					hardDelete: true,
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectDelete).toHaveBeenCalledWith({
			id: 'object-id-123',
			hardDelete: true,
		});
		expect(result).toEqual([[{ json: { success: true } }]]);
	});

	it('creates and updates objects with mapped propertiesToSend', async () => {
		const node = new CapacitiesV2();
		mockObjectCreate.mockResolvedValue({ id: 'created-object' });

		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'create',
					structureId: 'structure-1',
					title: 'My Object',
					additionalFields: {
						propertiesToSend: {
							property: [
								{ id: 'author', type: 'text', value: 'Christian Münch' },
								{ id: 'age', type: 'number', value: '42' },
								{ id: 'is_active', type: 'boolean', value: 'true' },
								{ id: 'website', type: 'url', value: 'https://example.com' },
								{ id: 'birthday', type: 'date', value: '2026-08-13' },
								{ id: 'tags', type: 'label', value: 'tag-1, tag-2' },
								{ id: 'links', type: 'entity', value: 'ent-1, ent-2' },
							],
						},
					},
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		await node.execute.call(context);

		expect(mockObjectCreate).toHaveBeenCalledWith({
			structureId: 'structure-1',
			properties: {
				title: { type: 'title', title: { value: 'My Object' } },
				author: { type: 'text', text: { value: 'Christian Münch' } },
				age: { type: 'number', number: { value: 42 } },
				is_active: { type: 'boolean', boolean: { value: true } },
				website: { type: 'url', url: { value: 'https://example.com' } },
				birthday: { type: 'date', date: { start: '2026-08-13' } },
				tags: { type: 'label', label: [{ id: 'tag-1' }, { id: 'tag-2' }] },
				links: { type: 'entity', entity: [{ id: 'ent-1' }, { id: 'ent-2' }] },
			},
		});
	});

	it('handles native arrays, JSON arrays, and array of objects for entity/label properties', async () => {
		const node = new CapacitiesV2();
		mockObjectCreate.mockResolvedValue({ id: 'created-object' });

		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'create',
					structureId: 'structure-1',
					title: 'My Object',
					additionalFields: {
						propertiesToSend: {
							property: [
								{ id: 'tags1', type: 'label', value: ['tag-1', 'tag-2'] },
								{ id: 'tags2', type: 'label', value: '["tag-3", "tag-4"]' },
								{ id: 'tags3', type: 'label', value: [{ id: 'tag-5' }, { id: 'tag-6' }] },
							],
						},
					},
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		await node.execute.call(context);

		expect(mockObjectCreate).toHaveBeenCalledWith({
			structureId: 'structure-1',
			properties: {
				title: { type: 'title', title: { value: 'My Object' } },
				tags1: { type: 'label', label: [{ id: 'tag-1' }, { id: 'tag-2' }] },
				tags2: { type: 'label', label: [{ id: 'tag-3' }, { id: 'tag-4' }] },
				tags3: { type: 'label', label: [{ id: 'tag-5' }, { id: 'tag-6' }] },
			},
		});
	});
});
