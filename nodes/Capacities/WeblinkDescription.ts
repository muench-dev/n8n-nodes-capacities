import { INodeProperties } from 'n8n-workflow';
import {loadSpaces} from "./GeneralFunctions";

export const weblink: INodeProperties[] = [
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
				action: 'Save weblink to a space',
				routing: {
					request: {
						url: '/save-weblink',
						method: 'POST',
						json: true,
						body: {
							spaceId: '={{$parameter.spaceId}}',
							url: '={{$parameter.url}}',
						},
					},
				}
			},
		],
		displayOptions: {
			show: {
				resource: [
					'weblink',
				],
			},
		},
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		description: 'The URL of the weblink',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'weblink',
				],
				operation: [
					'save',
				],
			},
		},
	},
	{
		displayName: 'Space ID',
		name: 'spaceId',
		type: 'options',
		typeOptions: {
			loadOptions: loadSpaces,
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: [
					'weblink',
				],
				operation: [
					'save',
				],
			},
		},
	},
	{
		displayName: 'Weblink Options',
		name: 'weblinkOptions',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		noDataExpression: false,
		options: [
			{
				displayName: 'MD Text',
				name: 'mdText',
				type: 'string',
				default: '',
				description: 'The markdown text of the weblink',
				routing: {
					request: {
						body: {
							mdText: '={{$value}}',
						}
					}
				}
			},
			{
				displayName: 'Title Overwrite',
				name: 'titleOverwrite',
				type: 'string',
				description: 'The title of the weblink',
				default: '',
				routing: {
					request: {
						body: {
							titleOverwrite: '={{$value}}',
						}
					}
				}
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Tag',
				},
				default: '',
				description: 'The tags of the weblink. Commas separate multiple tags.',
				routing: {
					request: {
						body: {
							tags: '={{$value}}',
						}
					}
				}
			},
		],
		displayOptions: {
			show: {
				resource: [
					'weblink',
				],
				operation: [
					'save',
				],
			},
		},
	},
];
