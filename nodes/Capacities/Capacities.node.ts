import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';
import { CapacitiesV1 } from './V1/CapacitiesV1.node';
import { CapacitiesV2 } from './V2/CapacitiesV2.node';

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
			1: new CapacitiesV1(),
			2: new CapacitiesV2(),
		};

		super(nodeVersions, baseDescription);
	}
}
