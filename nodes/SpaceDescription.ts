import { INodeProperties } from 'n8n-workflow';
import {loadSpaces} from "./GeneralFunctions";

export const space: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		required: true,
		default: 'getList',
		description: 'The operation to perform.',
		options: [
			{
				name: 'Get List',
				value: 'getList',
				action: 'Get your spaces',
				routing: {
					request: {
						url: '/spaces',
						method: 'GET',

					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'spaces',
								},
							},
						],
					}
				},
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				action:
					'Returns the structures (object types) of a space.',
				routing: {
					request: {
						url: '/space-info',
						method: 'GET',
						qs: {
							spaceid: '={{$parameter["spaceId"]}}',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'structures',
								},
							},
						],
					}
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['space'],
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
		description: 'The ID of the space.',
		displayOptions: {
			show: {
				resource: ['space'],
				operation: ['getInfo'],
			},
		},
		default: '',
	},
];
