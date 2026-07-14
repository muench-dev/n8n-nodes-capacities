import type { INodeProperties } from 'n8n-workflow';

export const dailyNote: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'saveToDailyNote',
		options: [
			{
				name: 'Save',
				value: 'saveToDailyNote',
				description: "Append markdown to a daily note",
				routing: {
					request: {
						url: '/blocks/daily-note/append',
						method: 'POST',
						json: true,
						body: {
							markdown: '={{$parameter.mdText}}',
							noTimeStamp: '={{$parameter.timestamp ? false : true}}',
							date: '={{$parameter.date || undefined}}',
						},
					},
				},
				action: 'Save a daily note',
			},
		],
		displayOptions: {
			show: {
				resource: ['dailyNote'],
			},
		},
	},
	{
		displayName: 'MD Text',
		name: 'mdText',
		type: 'string',
		default: '',
		description: 'The markdown text to append to the daily note',
		required: true,
		displayOptions: {
			show: {
				resource: ['dailyNote'],
				operation: ['saveToDailyNote'],
			},
		},
	},
	{
		displayName: 'Timestamp',
		name: 'timestamp',
		type: 'boolean',
		default: true,
		description: 'Whether to add a timestamp to the note',
		displayOptions: {
			show: {
				resource: ['dailyNote'],
				operation: ['saveToDailyNote'],
			},
		},
	},
	{
		displayName: 'Date',
		name: 'date',
		type: 'dateTime',
		default: '',
		description: 'The day to append to, at UTC midnight. Leave empty to use today (UTC).',
		displayOptions: {
			show: {
				resource: ['dailyNote'],
				operation: ['saveToDailyNote'],
			},
		},
	},
];
