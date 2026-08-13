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

	it('defines createFromMarkdown object operation', () => {
		const operationProperty = getProperty(object, 'operation', 'object');
		expect(operationProperty).toBeDefined();
		const option = getOptions(operationProperty).find(
			(option) => option.value === 'createFromMarkdown',
		);
		expect(option).toMatchObject({
			name: 'Create From Markdown',
			value: 'createFromMarkdown',
			description: 'Create an object from Markdown content',
			action: 'Create an object from markdown',
		});
	});

	it('exposes a body-content markdown field for the createFromMarkdown and appendFromMarkdown operations', () => {
		const markdownProperties = object.filter((property) => property.name === 'markdown');
		const bodyMarkdownProperty = markdownProperties.find(
			(property) =>
				property.displayOptions?.show?.operation &&
				Array.isArray(property.displayOptions.show.operation) &&
				property.displayOptions.show.operation.includes('createFromMarkdown'),
		);

		expect(bodyMarkdownProperty).toMatchObject({
			type: 'string',
			required: true,
			default: '',
			displayOptions: {
				show: {
					resource: ['object'],
					operation: ['createFromMarkdown', 'appendFromMarkdown'],
				},
			},
		});
	});

	it('exposes a frontmatter markdown field for the updateFromMarkdownFrontmatter operation', () => {
		const markdownProperties = object.filter((property) => property.name === 'markdown');
		const frontmatterMarkdownProperty = markdownProperties.find(
			(property) =>
				property.displayOptions?.show?.operation &&
				Array.isArray(property.displayOptions.show.operation) &&
				property.displayOptions.show.operation.includes('updateFromMarkdownFrontmatter'),
		);

		expect(frontmatterMarkdownProperty).toMatchObject({
			displayName: 'Markdown Frontmatter',
			type: 'string',
			required: true,
			default: '',
			displayOptions: {
				show: {
					resource: ['object'],
					operation: ['updateFromMarkdownFrontmatter'],
				},
			},
		});
		expect(frontmatterMarkdownProperty?.description).toContain('YAML frontmatter');
	});

	it('defines appendFromMarkdown object operation', () => {
		const operationProperty = getProperty(object, 'operation', 'object');
		expect(operationProperty).toBeDefined();
		const option = getOptions(operationProperty).find(
			(option) => option.value === 'appendFromMarkdown',
		);
		expect(option).toMatchObject({
			name: 'Append From Markdown',
			value: 'appendFromMarkdown',
			description: "Append Markdown content to an existing object's body",
			action: 'Append markdown to an object',
		});
	});

	it('defines updateFromMarkdownFrontmatter object operation', () => {
		const operationProperty = getProperty(object, 'operation', 'object');
		expect(operationProperty).toBeDefined();
		const option = getOptions(operationProperty).find(
			(option) => option.value === 'updateFromMarkdownFrontmatter',
		);
		expect(option).toMatchObject({
			name: 'Update From Markdown Frontmatter',
			value: 'updateFromMarkdownFrontmatter',
			description:
				"Update object properties from a YAML frontmatter block in a Markdown string (the object's body content is not touched)",
			action: 'Update an object from markdown frontmatter',
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
					operation: [
					'get',
					'update',
					'delete',
					'updateFromMarkdownFrontmatter',
					'appendFromMarkdown',
				],
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
