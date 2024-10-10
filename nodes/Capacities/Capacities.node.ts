import {INodeType, INodeTypeDescription, NodeConnectionType} from 'n8n-workflow';
import { resources } from './ResourceDescription';
import { general } from "./GeneralDescription";
import { space } from './SpaceDescription';
import { search } from './SearchDescription';
import { weblink } from './WeblinkDescription';
import { dailyNote } from './DailyNoteDescription';

export class Capacities implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Capacities',
		name: 'capacities',
		icon: 'file:capacities.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Capacities API',
		defaults: {
			name: 'Capacities',
		},
		// @ts-ignore
		inputs: ['main'],
		// @ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'capacitiesApi',
				required: false,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.capacities.io',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			...resources,
			...space,
			...search,
			...weblink,
			...dailyNote,
			...general,
		],
	};
}
