import { INodeProperties } from 'n8n-workflow';
import { loadSpaces} from "./GeneralFunctions";

export const search: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		required: true,
		default: 'search',
		description: 'Operation to perform.',
		options: [
			{
				name: 'Search',
				value: 'search',
				description: 'Returns content based on a search term in a set of spaces.',
				routing: {
					request: {
						url: '/search',
						method: 'POST',
						json: true,
						body: {
							mode: '={{$parameter.searchMode}}',
							searchTerm: '={{$parameter.searchTerm}}',
							spaceIds: '={{$parameter.spaceIds}}',
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
				}
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
		name: 'searchMode',
		displayName: 'Search Mode',
		type: 'options',
		required: true,
		default: 'title',
		description: 'The mode to search for content.',
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
		name: "searchTerm",
		displayName: "Search Term",
		type: "string",
		required: true,
		default: "",
		description: "The term to search for.",
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
		name: "spaceIds",
		displayName: "Space IDs",
		type: "options",
		typeOptions: {
			multipleValues: true,
			emptyValue: 'Please select a space',
			loadOptions: loadSpaces,
		},
		required: true,
		default: [],
		placeholder: "Add Space ID",
		description: "The IDs of the spaces to search in.",
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
