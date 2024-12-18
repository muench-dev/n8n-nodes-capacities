import type {ILoadOptions} from "n8n-workflow";

export const loadSpaces: ILoadOptions = {
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
				{
					type: 'setKeyValue',
					properties: {
						name: '={{$responseItem.title}}',
						value: '={{$responseItem.id}}',
					},
				},
				{
					// If incoming data is an array of objects, sort alphabetically by key
					type: 'sort',
					properties: {
						key: 'name',
					},
				},
			],
		}
	}
};
