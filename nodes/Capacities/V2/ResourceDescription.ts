import type { INodeProperties } from 'n8n-workflow';

export const resources: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Daily Note',
				value: 'dailyNote',
			},
			{
				name: 'Search',
				value: 'search',
			},
			{
				name: 'Space',
				value: 'space',
			},
			{
				name: 'Tag',
				value: 'tag',
			},
			{
				name: 'Weblink',
				value: 'weblink',
			},
		],
		default: 'dailyNote',
	},
];
