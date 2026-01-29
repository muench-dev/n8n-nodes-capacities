import type { INodeProperties } from 'n8n-workflow';
import { loadSpaces } from './GeneralFunctions';

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
						url: '/lookup',
						method: 'POST',
						json: true,
						body: {
							searchTerm: '={{$parameter.searchTerm}}',
							spaceId: '={{$parameter.searchSpaceId}}',
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
					}
				},
				action: 'Search',
			},
		],
		displayOptions: {
			show: {
				resource: [
					'search',
				],
			},
		},
	},

	{
		displayName: "Search Term",
		name: "searchTerm",
		type: "string",
		required: true,
		default: "",
		description: 'The term to search for',
		displayOptions: {
			show: {
				resource: [
					'search',
				],
				operation: [
					'search',
				],
			},
		}
	},
	{
		displayName: "Space",
		name: "searchSpaceId",
		type: "options",
		typeOptions: {
			emptyValue: 'Please select a space',
			loadOptions: loadSpaces,
		},
		default: '',
		placeholder: "Select a Space",
		description: 'The ID of the space to search in. Leave empty to search all spaces.',
		displayOptions: {
			show: {
				resource: [
					'search',
				],
				operation: [
					'search',
				],
			},
		},
	},

];
