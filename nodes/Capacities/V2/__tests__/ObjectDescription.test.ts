import { object } from '../ObjectDescription';
import { getOptions, getProperty } from './testUtils';

describe('Object description (v2)', () => {
	it('creates objects with POST /object routing', () => {
		const operationProperty = getProperty(object, 'operation', 'object');
		expect(operationProperty).toBeDefined();
		const createOption = getOptions(operationProperty).find((option) => option.value === 'create');

		expect(createOption?.routing?.request).toMatchObject({
			url: '/object',
			method: 'POST',
			json: true,
			body: {
				structureId: '={{$parameter.structureId}}',
			},
		});
	});

	it('exposes a structure selector backed by loadStructures', () => {
		const structureProperty = getProperty(object, 'structureId', 'object');

		expect(structureProperty).toMatchObject({
			type: 'options',
			required: true,
			default: '',
			typeOptions: {
				loadOptionsMethod: 'loadStructures',
			},
		});
	});

	it('exposes a required title field', () => {
		const titleProperty = getProperty(object, 'title', 'object');

		expect(titleProperty).toMatchObject({
			type: 'string',
			required: true,
			default: '',
		});
	});

	it('exposes additional fields for properties, collections, and blocks', () => {
		const additionalFieldsProperty = getProperty(object, 'additionalFields', 'object');

		expect(additionalFieldsProperty).toMatchObject({
			type: 'collection',
			default: {},
		});
		expect(additionalFieldsProperty?.options?.map((option) => option.name).sort()).toEqual([
			'blocksJson',
			'collectionIds',
			'propertiesJson',
			'propertiesToSend',
		]);
	});

	it('exposes update fields for title, properties, collections, and blocks', () => {
		const updateFieldsProperty = getProperty(object, 'updateFields', 'object');

		expect(updateFieldsProperty).toMatchObject({
			type: 'collection',
			default: {},
		});
		expect(updateFieldsProperty?.options?.map((option) => option.name).sort()).toEqual([
			'blocksJson',
			'collectionIds',
			'propertiesJson',
			'propertiesToSend',
			'title',
		]);
	});

	it('defines get object operation', () => {
		const operationProperty = getProperty(object, 'operation', 'object');
		expect(operationProperty).toBeDefined();
		const getOption = getOptions(operationProperty).find((option) => option.value === 'get');
		expect(getOption).toMatchObject({
			name: 'Get',
			value: 'get',
			description: 'Get an object from your space',
			action: 'Get an object',
		});
	});

	it('exposes fields for get/update/delete object operations', () => {
		const idProperty = getProperty(object, 'id', 'object');
		expect(idProperty).toMatchObject({
			type: 'string',
			required: true,
			default: '',
			displayOptions: {
				show: {
					resource: ['object'],
					operation: ['get', 'update', 'delete'],
				},
			},
		});

		const hardDeleteProperty = getProperty(object, 'hardDelete', 'object');
		expect(hardDeleteProperty).toMatchObject({
			type: 'boolean',
			default: false,
		});
	});
});
