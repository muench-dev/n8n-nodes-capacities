import type { INodeProperties } from 'n8n-workflow';

export const tag: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'save',
		options: [
			{
				name: 'Save',
				value: 'save',
				description: 'Create a tag object',
				action: 'Save a tag',
				routing: {
					request: {
						url: '/object',
						method: 'POST',
						json: true,
						body: {
							structureId: 'RootTag',
							properties: {
								title: {
									type: 'title',
									title: {
										value: '={{$parameter.title}}',
									},
								},
							},
						},
					},
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['tag'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		description: 'The title of the tag to create',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['save'],
			},
		},
	},
];
