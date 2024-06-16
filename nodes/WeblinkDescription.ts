import { INodeProperties } from 'n8n-workflow';
import {loadSpaces} from "./GeneralFunctions";

export const weblink: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		required: true,
		default: 'save',
		description: 'The operation to perform.',
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
							titleOverwrite: '={{$parameter.weblinkOptions.titleOverwrite ? $parameter.weblinkOptions.titleOverwrite : ""}}',
							tags: '={{$parameter.weblinkOptions.tags ? $parameter.weblinkOptions.tags : ""}}',
							mdText: '={{$parameter.weblinkOptions.mdText ? $parameter.weblinkOptions.mdText : ""}}',
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
		name: 'url',
		displayName: 'URL',
		type: 'string',
		description: 'The URL of the weblink.',
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
		name: 'spaceId',
		displayName: 'Space ID',
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
		name: 'weblinkOptions',
		displayName: 'Weblink Options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'MD Text',
				name: 'mdText',
				type: 'string',
				default: '',
				description: 'The markdown text of the weblink.',
			},
			{
				name: 'titleOverwrite',
				displayName: 'Title Overwrite',
				type: 'string',
				description: 'The title of the weblink.',
				default: '',
			},
			{
				name: 'tags',
				displayName: 'Tags',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Tag',
				},
				default: '',
				description: 'The tags of the weblink. Commas separate multiple tags.',
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
