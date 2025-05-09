import type { INodeProperties } from 'n8n-workflow';
import {loadSpaces} from "./GeneralFunctions";

export const space: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'getList',
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
				action: 'Returns the structures object types of a space',
				routing: {
					request: {
						url: '/space-info',
						method: 'GET',
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
		description: 'The ID of the space',
		routing: {
			request: {
				qs: {
					spaceid: '={{$value}}',
				},
			}
		},
		displayOptions: {
			show: {
				resource: ['space'],
				operation: ['getInfo'],
			},
		},
		default: '',
	},
];
