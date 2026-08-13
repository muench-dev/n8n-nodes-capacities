import type { IExecuteFunctions } from 'n8n-workflow';

import { CapacitiesV2 } from '../CapacitiesV2.node';
import { getOptions, getProperty } from './testUtils';

const mockSpaceGet = jest.fn();
const mockSpaceStructures = jest.fn();
const mockObjectsSearch = jest.fn();
const mockObjectGet = jest.fn();
const mockObjectCreate = jest.fn();
const mockObjectUpdate = jest.fn();
const mockObjectDelete = jest.fn();
const mockObjectCreateFromUrl = jest.fn();
const mockObjectMarkdownCreate = jest.fn();
const mockObjectMarkdownUpdate = jest.fn();
const mockBlocksDailyNoteAppend = jest.fn();
const mockBlocksAppend = jest.fn();

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
					get: mockObjectGet,
					create: mockObjectCreate,
					update: mockObjectUpdate,
					delete: mockObjectDelete,
					createFromUrl: mockObjectCreateFromUrl,
					markdown: {
						create: mockObjectMarkdownCreate,
						update: mockObjectMarkdownUpdate,
					},
				},
				blocks: {
					dailyNote: {
						append: mockBlocksDailyNoteAppend,
					},
					append: mockBlocksAppend,
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

	it('creates objects from markdown', async () => {
		const node = new CapacitiesV2();
		mockObjectMarkdownCreate.mockResolvedValue({ id: 'created-object-md' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'createFromMarkdown',
					structureId: 'structure-1',
					markdown: '# My Object\n\nSome body text.',
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectMarkdownCreate).toHaveBeenCalledWith({
			structureId: 'structure-1',
			markdown: '# My Object\n\nSome body text.',
		});
		expect(result).toEqual([[{ json: { id: 'created-object-md' } }]]);
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

	it('updates objects from markdown', async () => {
		const node = new CapacitiesV2();
		mockObjectMarkdownUpdate.mockResolvedValue({ id: 'updated-object-md' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'updateFromMarkdownFrontmatter',
					id: 'object-id-123',
					markdown: '---\ntitle: Updated Title\n---\n',
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectMarkdownUpdate).toHaveBeenCalledWith({
			id: 'object-id-123',
			markdown: '---\ntitle: Updated Title\n---\n',
		});
		expect(result).toEqual([[{ json: { id: 'updated-object-md' } }]]);
	});

	it('appends markdown to objects', async () => {
		const node = new CapacitiesV2();
		mockBlocksAppend.mockResolvedValue({ id: 'appended-object-md' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'appendFromMarkdown',
					id: 'object-id-123',
					markdown: '## Appended\n\nMore body text.',
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockBlocksAppend).toHaveBeenCalledWith({
			id: 'object-id-123',
			markdown: '## Appended\n\nMore body text.',
		});
		expect(result).toEqual([[{ json: { id: 'appended-object-md' } }]]);
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
				birthday: {
					type: 'date',
					date: { dateResolution: 'day', start: '2026-08-13T00:00:00.000Z', end: null },
				},
				tags: {
					type: 'label',
					label: [
						{ id: 'tag-1', name: 'tag-1' },
						{ id: 'tag-2', name: 'tag-2' },
					],
				},
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
				tags1: {
					type: 'label',
					label: [
						{ id: 'tag-1', name: 'tag-1' },
						{ id: 'tag-2', name: 'tag-2' },
					],
				},
				tags2: {
					type: 'label',
					label: [
						{ id: 'tag-3', name: 'tag-3' },
						{ id: 'tag-4', name: 'tag-4' },
					],
				},
				tags3: {
					type: 'label',
					label: [
						{ id: 'tag-5', name: 'tag-5' },
						{ id: 'tag-6', name: 'tag-6' },
					],
				},
			},
		});
	});

	it('handles single objects, nested properties, and stringified JSON objects for label/entity properties', async () => {
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
								{ id: 'single_obj', type: 'label', value: { id: 'tag-1', name: 'Tag 1' } },
								{ id: 'single_obj_str', type: 'label', value: '{"id": "tag-2", "name": "Tag 2"}' },
								{
									id: 'nested_label_obj',
									type: 'label',
									value: { type: 'label', label: [{ id: 'tag-3' }] },
								},
								{
									id: 'nested_label_str',
									type: 'label',
									value: '{"type": "label", "label": [{"id": "tag-4"}]}',
								},
								{
									id: 'nested_entity_obj',
									type: 'entity',
									value: { type: 'entity', entity: [{ id: 'ent-1' }] },
								},
								{
									id: 'nested_entity_str',
									type: 'entity',
									value: '{"type": "entity", "entity": [{"id": "ent-2"}]}',
								},
								{ id: 'single_quoted_obj_arr', type: 'label', value: "[{ id: 'medium' }]" },
								{ id: 'single_quoted_str_arr', type: 'label', value: "['tag-1', 'tag-2']" },
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
				single_obj: { type: 'label', label: [{ id: 'tag-1', name: 'Tag 1' }] },
				single_obj_str: { type: 'label', label: [{ id: 'tag-2', name: 'Tag 2' }] },
				nested_label_obj: { type: 'label', label: [{ id: 'tag-3', name: 'tag-3' }] },
				nested_label_str: { type: 'label', label: [{ id: 'tag-4', name: 'tag-4' }] },
				nested_entity_obj: { type: 'entity', entity: [{ id: 'ent-1' }] },
				nested_entity_str: { type: 'entity', entity: [{ id: 'ent-2' }] },
				single_quoted_obj_arr: { type: 'label', label: [{ id: 'medium', name: 'medium' }] },
				single_quoted_str_arr: {
					type: 'label',
					label: [
						{ id: 'tag-1', name: 'tag-1' },
						{ id: 'tag-2', name: 'tag-2' },
					],
				},
			},
		});
	});

	it('handles diverse date property formats correctly', async () => {
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
								{ id: 'date1', type: 'date', value: '2026-08-13' },
								{ id: 'date2', type: 'date', value: '2026-08-13T12:00:00Z' },
								{ id: 'date3', type: 'date', value: '2026-08-13 to 2026-08-15' },
								{ id: 'date4', type: 'date', value: '2026-08-13T12:00:00Z - 2026-08-13T13:00:00Z' },
								{ id: 'date5', type: 'date', value: 'null' },
								{ id: 'date6', type: 'date', value: '' },
								{
									id: 'date7',
									type: 'date',
									value: {
										type: 'date',
										date: { dateResolution: 'day', start: '2026-08-13', end: null },
									},
								},
								{
									id: 'date8',
									type: 'date',
									value: '{"dateResolution":"time","start":"2026-08-13T12:00:00Z","end":null}',
								},
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
				date1: {
					type: 'date',
					date: { dateResolution: 'day', start: '2026-08-13T00:00:00.000Z', end: null },
				},
				date2: {
					type: 'date',
					date: { dateResolution: 'time', start: '2026-08-13T12:00:00.000Z', end: null },
				},
				date3: {
					type: 'date',
					date: {
						dateResolution: 'day',
						start: '2026-08-13T00:00:00.000Z',
						end: '2026-08-15T00:00:00.000Z',
					},
				},
				date4: {
					type: 'date',
					date: {
						dateResolution: 'time',
						start: '2026-08-13T12:00:00.000Z',
						end: '2026-08-13T13:00:00.000Z',
					},
				},
				date5: { type: 'date', date: { dateResolution: 'day', start: null, end: null } },
				date6: { type: 'date', date: { dateResolution: 'day', start: null, end: null } },
				date7: {
					type: 'date',
					date: { dateResolution: 'day', start: '2026-08-13T00:00:00.000Z', end: null },
				},
				date8: {
					type: 'date',
					date: { dateResolution: 'time', start: '2026-08-13T12:00:00.000Z', end: null },
				},
			},
		});
	});

	it('gets objects', async () => {
		const node = new CapacitiesV2();
		mockObjectGet.mockResolvedValue({ id: 'object-id-123', title: 'Test Object' });
		const context = {
			getInputData: jest.fn(() => [{ json: {} }]),
			getNode: jest.fn(() => ({ name: 'Capacities', type: 'capacities' })),
			getNodeParameter: jest.fn((parameterName: string) => {
				const parameters: Record<string, unknown> = {
					resource: 'object',
					operation: 'get',
					id: 'object-id-123',
				};

				return parameters[parameterName];
			}),
			getCredentials: jest.fn(() => Promise.resolve({ token: 'test-token' })),
		} as unknown as IExecuteFunctions;

		const result = await node.execute.call(context);

		expect(mockObjectGet).toHaveBeenCalledWith({
			id: 'object-id-123',
		});
		expect(result).toEqual([[{ json: { id: 'object-id-123', title: 'Test Object' } }]]);
	});
});
