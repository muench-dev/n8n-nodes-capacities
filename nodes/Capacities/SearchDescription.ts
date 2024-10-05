import { INodeProperties } from 'n8n-workflow';
import { loadSpaces} from "./GeneralFunctions";

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
				description: 'Returns content based on a search term in a set of spaces',
				routing: {
					request: {
						url: '/search',
						method: 'POST',
						json: true,
						body: {
							mode: '={{$parameter.searchMode}}',
							searchTerm: '={{$parameter.searchTerm}}',
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
		displayName: 'Search Mode',
		name: 'searchMode',
		type: 'options',
		required: true,
		default: 'title',
		description: 'The mode to search for content',
		options: [
			{
				name: 'Title',
				value: 'title',
			},
			{
				name: 'Full Text',
				value: 'fullText',
			},
		],
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
		displayName: "Space IDs",
		name: "searchSpaceIds",
		type: "options",
		typeOptions: {
			multipleValues: true,
			emptyValue: 'Please select a space',
			loadOptions: loadSpaces,
		},
		required: true,
		default: '',
		placeholder: "Add Space ID",
		description: 'The IDs of the spaces to search in',
		routing: {
			request: {
				body: {
					spaceIds: '={{$value}}',
				}
			}
		},
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
	}
];
