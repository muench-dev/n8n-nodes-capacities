import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';
import { CapacitiesBeta } from './beta/CapacitiesBeta.node';
import { CapacitiesV1 } from './v1/CapacitiesV1.node';

export class Capacities extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Capacities',
			name: 'capacities',
			icon: 'file:capacities.svg',
			group: ['transform'],
			description: 'Interact with Capacities API',
			defaultVersion: 2,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new CapacitiesBeta(),
			2: new CapacitiesV1(),
		};

		super(nodeVersions, baseDescription);
	}
}
