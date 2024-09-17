import { INodeProperties } from 'n8n-workflow';
import {loadSpaces} from "./GeneralFunctions";

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
				description: 'Save text to today\'s daily note',
				routing: {
					request: {
						url: '/save-to-daily-note',
						method: 'POST',
						json: true,
						body: {
							spaceId: '={{$parameter.spaceId}}',
							mdText: '={{$parameter.mdText}}',
							commandPalette: '={{$parameter.commandPalette}}',
							noTimeStamp: '={{$parameter.timestamp ? false : true}}',
						},
					},
				},
				action: 'Save a daily note',
			}
		],
		displayOptions: {
			show: {
				resource: [
					'dailyNote',
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
		description: 'The ID of the space',
		displayOptions: {
			show: {
				resource: ['dailyNote'],
				operation: ['saveToDailyNote'],
			},
		},
		default: '',
	},
	{
		displayName: 'MD Text',
		name: 'mdText',
		type: 'string',
		default: '',
		description: 'The markdown text of the weblink',
		required: true,
		displayOptions: {
			show: {
				resource: [
					'dailyNote',
				],
				operation: [
					'saveToDailyNote',
				],
			},
		},
	},
	{
		displayName: "Timestamp",
		name: "timestamp",
		type: "boolean",
		default: true,
		description: "If true, a timestamp will not be added to the daily note",
		displayOptions: {
			show: {
				resource: [
					'dailyNote',
				],
				operation: [
					'saveToDailyNote',
				],
			},
		},
	}
];
