import type { INodeProperties } from 'n8n-workflow';

export const search: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'search',
		options: [
			{
				name: 'Search',
				value: 'search',
				description: 'Returns content based on a search term',
				routing: {
					request: {
						url: '/objects/search',
						method: 'POST',
						json: true,
						body: {
							query: '={{$parameter.searchTerm}}',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'results',
								},
							},
						],
					},
				},
				action: 'Search',
			},
		],
		displayOptions: {
			show: {
				resource: ['search'],
			},
		},
	},
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		required: true,
		default: '',
		description: 'The term to search for',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Structure Names or IDs',
		name: 'structureIds',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'loadStructures',
		},
		default: [],
		description:
			'Limit the search to these structures (object types). Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: {
			send: {
				type: 'body',
				property: 'structureIds',
				value: '={{$value.length ? $value : undefined}}',
			},
		},
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
		routing: {
			send: {
				type: 'body',
				property: 'limit',
				value: '={{$value}}',
			},
		},
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['search'],
			},
		},
	},
];
