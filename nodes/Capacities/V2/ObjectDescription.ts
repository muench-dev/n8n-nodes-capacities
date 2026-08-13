import type { INodeProperties } from 'n8n-workflow';

export const object: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'create',
		options: [
			{
				name: 'Append From Markdown',
				value: 'appendFromMarkdown',
				description: "Append Markdown content to an existing object's body",
				action: 'Append markdown to an object',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create an object of any structure/type',
				action: 'Create an object',
				routing: {
					request: {
						url: '/object',
						method: 'POST',
						json: true,
						body: {
							structureId: '={{$parameter.structureId}}',
							properties:
								'={{Object.assign({ title: { type: "title", title: { value: $parameter.title } } }, $parameter["additionalFields"]["propertiesJson"] ? JSON.parse($parameter["additionalFields"]["propertiesJson"]) : {})}}',
							collections:
								'={{$parameter["additionalFields"]["collectionIds"] ? $parameter["additionalFields"]["collectionIds"].split(",").map((id) => id.trim()).filter((id) => id) : undefined}}',
							blocks:
								'={{$parameter["additionalFields"]["blocksJson"] ? JSON.parse($parameter["additionalFields"]["blocksJson"]) : undefined}}',
						},
					},
				},
			},
			{
				name: 'Create From Markdown',
				value: 'createFromMarkdown',
				description: 'Create an object from Markdown content',
				action: 'Create an object from markdown',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an object from your space',
				action: 'Delete an object',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an object from your space',
				action: 'Get an object',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update properties, collections, or blocks of an object',
				action: 'Update an object',
			},
			{
				name: 'Update From Markdown Frontmatter',
				value: 'updateFromMarkdownFrontmatter',
				description:
					"Update object properties from a YAML frontmatter block in a Markdown string (the object's body content is not touched)",
				action: 'Update an object from markdown frontmatter',
			},
		],
		displayOptions: {
			show: {
				resource: ['object'],
			},
		},
	},
	{
		displayName: 'Structure Name or ID',
		name: 'structureId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'loadStructures',
		},
		default: '',
		required: true,
		description:
			'The structure (object type) to create the object as. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['create', 'createFromMarkdown'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		description: 'The title of the object to create',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Markdown',
		name: 'markdown',
		type: 'string',
		default: '',
		required: true,
		description:
			'The Markdown body content to set (Create) or append (Append). See the <a href="https://developers.capacities.io/api/concepts/markdown">Capacities markdown docs</a> for supported syntax.',
		hint: 'Plain Markdown, e.g. "## Heading\\n\\nSome body text."',
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['createFromMarkdown', 'appendFromMarkdown'],
			},
		},
	},
	{
		displayName: 'Markdown Frontmatter',
		name: 'markdown',
		type: 'string',
		default: '',
		required: true,
		description:
			'Only the YAML frontmatter block is processed - keys are property IDs (e.g. "title", or a UUID for custom properties) and values are the new plain values to set. Everything after the closing "---" is ignored, so this cannot be used to change the object body - use the Create From Markdown or Append From Markdown operations for that.',
		hint: 'Example: "---\\ntitle: New Title\\ndescription: Updated description\\n---"',
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['updateFromMarkdownFrontmatter'],
			},
		},
	},
	{
		displayName: 'Object ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the object to get, update, or delete',
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
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		placeholder: 'Add Field',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Blocks (JSON)',
				name: 'blocksJson',
				type: 'json',
				default: '{}',
				description:
					'Initial block content, keyed by property definition ID. See the <a href="https://developers.capacities.io/api/concepts/objects">Capacities API docs</a> for the block model.',
			},
			{
				displayName: 'Collection IDs',
				name: 'collectionIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of collection IDs to place the object into',
			},
			{
				displayName: 'Properties (JSON)',
				name: 'propertiesJson',
				type: 'json',
				default: '{}',
				description:
					'Additional typed properties to set, keyed by property definition ID. Merged with the title property. See the <a href="https://developers.capacities.io/api/concepts/properties">Capacities API docs</a> for the typed value shapes.',
			},
			{
				displayName: 'Properties to Send',
				name: 'propertiesToSend',
				placeholder: 'Add Property',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Custom properties to set without writing raw JSON',
				options: [
					{
						name: 'property',
						displayName: 'Property',
						values: [
							{
								displayName: 'Property ID',
								name: 'id',
								type: 'string',
								required: true,
								default: '',
								description:
									'Stable key used in object properties maps (e.g. title, or a UUID for custom fields)',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'Boolean', value: 'boolean' },
									{ name: 'Date', value: 'date' },
									{ name: 'Label / Select (Comma-Separated IDs)', value: 'label' },
									{ name: 'Number', value: 'number' },
									{ name: 'Reference / Link to Object (Comma-Separated IDs)', value: 'entity' },
									{ name: 'Text / String', value: 'text' },
									{ name: 'Title', value: 'title' },
									{ name: 'URL', value: 'url' },
								],
								default: 'text',
								description: 'The type of the property value',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description:
									'The value to set (use true/false for Boolean, numbers for Number, ISO strings/ranges for Date, or comma-separated IDs / JSON objects/arrays for Label and Reference properties)',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		placeholder: 'Add Field',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Blocks (JSON)',
				name: 'blocksJson',
				type: 'json',
				default: '{}',
				description:
					'Updated block content, keyed by property definition ID. See the <a href="https://developers.capacities.io/api/concepts/objects">Capacities API docs</a> for the block model.',
			},
			{
				displayName: 'Collection IDs',
				name: 'collectionIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of collection IDs to place the object into',
			},
			{
				displayName: 'Properties (JSON)',
				name: 'propertiesJson',
				type: 'json',
				default: '{}',
				description:
					'Additional typed properties to set, keyed by property definition ID. Merged with the title property. See the <a href="https://developers.capacities.io/api/concepts/properties">Capacities API docs</a> for the typed value shapes.',
			},
			{
				displayName: 'Properties to Send',
				name: 'propertiesToSend',
				placeholder: 'Add Property',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Custom properties to update without writing raw JSON',
				options: [
					{
						name: 'property',
						displayName: 'Property',
						values: [
							{
								displayName: 'Property ID',
								name: 'id',
								type: 'string',
								required: true,
								default: '',
								description:
									'Stable key used in object properties maps (e.g. title, or a UUID for custom fields)',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'Boolean', value: 'boolean' },
									{ name: 'Date', value: 'date' },
									{ name: 'Label / Select (Comma-Separated IDs)', value: 'label' },
									{ name: 'Number', value: 'number' },
									{ name: 'Reference / Link to Object (Comma-Separated IDs)', value: 'entity' },
									{ name: 'Text / String', value: 'text' },
									{ name: 'Title', value: 'title' },
									{ name: 'URL', value: 'url' },
								],
								default: 'text',
								description: 'The type of the property value',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description:
									'The value to set (use true/false for Boolean, numbers for Number, ISO strings/ranges for Date, or comma-separated IDs / JSON objects/arrays for Label and Reference properties)',
							},
						],
					},
				],
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The new title of the object',
			},
		],
	},
	{
		displayName: 'Hard Delete',
		name: 'hardDelete',
		type: 'boolean',
		default: false,
		description: 'Whether to permanently delete the object, bypassing the trash',
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['delete'],
			},
		},
	},
];
