import { Capacities } from '../Capacities.node';
import { CapacitiesBeta } from '../beta/CapacitiesBeta.node';
import { CapacitiesV1 } from '../v1/CapacitiesV1.node';

describe('Capacities node router', () => {
	it('defaults new nodes to the v1 API implementation', () => {
		const node = new Capacities();
		expect(node.currentVersion).toBe(2);
		expect(node.description.defaultVersion).toBe(2);
	});

	it('keeps the Beta implementation available for existing workflows', () => {
		const node = new Capacities();
		expect(node.getNodeType(1)).toBeInstanceOf(CapacitiesBeta);
		expect(node.getNodeType(2)).toBeInstanceOf(CapacitiesV1);
	});

	it('resolves the default version when none is requested', () => {
		const node = new Capacities();
		expect(node.getNodeType()).toBeInstanceOf(CapacitiesV1);
	});
});
