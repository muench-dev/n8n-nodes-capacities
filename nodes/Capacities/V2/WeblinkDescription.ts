import type { INodeProperties } from 'n8n-workflow';

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
				action: 'Save weblink to your space',
				routing: {
					request: {
						url: '/object/url',
						method: 'POST',
						json: true,
						body: {
							url: '={{$parameter.url}}',
							markdown: '={{$parameter.weblinkOptions.markdown || undefined}}',
							properties:
								'={{(() => { const o = $parameter.weblinkOptions; const p = {}; if (o.titleOverwrite) { p.title = { type: "title", title: { value: o.titleOverwrite } }; } if (o.descriptionOverwrite) { p.description = { type: "text", text: { value: o.descriptionOverwrite } }; } return Object.keys(p).length ? p : undefined; })()}}',
						},
					},
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['weblink'],
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
				resource: ['weblink'],
				operation: ['save'],
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
				displayName: 'Markdown',
				name: 'markdown',
				type: 'string',
				default: '',
				description: 'The markdown text of the weblink',
				hint: 'Text formatted as markdown that will be added to the notes section',
			},
			{
				displayName: 'Title Overwrite',
				name: 'titleOverwrite',
				type: 'string',
				description: 'The title of the weblink',
				hint: 'If empty, the title will be fetched from the URL',
				default: '',
			},
			{
				displayName: 'Description Overwrite',
				name: 'descriptionOverwrite',
				type: 'string',
				description: 'The description of the weblink',
				hint: 'If empty, the description will be fetched from the URL',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['weblink'],
				operation: ['save'],
			},
		},
	},
];
