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
				operation: ['create'],
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
		displayName: 'Object ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the object to get, update, or delete',
		displayOptions: {
			show: {
				resource: ['object'],
				operation: ['get', 'update', 'delete'],
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
									'The value to set (use true/false for Boolean, numbers for Number, ISO strings, ranges like "2026-08-13 to 2026-08-15", or JSON/expressions for Date)',
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
									'The value to set (use true/false for Boolean, numbers for Number, ISO strings, ranges like "2026-08-13 to 2026-08-15", or JSON/expressions for Date)',
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
