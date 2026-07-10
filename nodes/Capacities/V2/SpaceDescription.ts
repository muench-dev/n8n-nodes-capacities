import type { INodeProperties } from 'n8n-workflow';

export const space: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'get',
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get your space',
				description: 'Returns the space the API token is scoped to',
				routing: {
					request: {
						url: '/space',
						method: 'GET',
					},
				},
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				action: 'Get structures and collections of the space',
				description:
					'Returns object types, property definitions, and collections for the space',
				routing: {
					request: {
						url: '/space/structures',
						method: 'GET',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'structures',
								},
							},
						],
					},
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['space'],
			},
		},
	},
];
