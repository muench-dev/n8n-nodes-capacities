import { Capacities } from '../Capacities.node';
import { CapacitiesV1 } from '../V1/CapacitiesV1.node';
import { CapacitiesV2 } from '../V2/CapacitiesV2.node';

describe('Capacities node router', () => {
	it('defaults new nodes to the v1 API implementation', () => {
		const node = new Capacities();
		expect(node.currentVersion).toBe(2);
		expect(node.description.defaultVersion).toBe(2);
	});

	it('keeps the Beta implementation available for existing workflows', () => {
		const node = new Capacities();
		expect(node.getNodeType(1)).toBeInstanceOf(CapacitiesV1);
		expect(node.getNodeType(2)).toBeInstanceOf(CapacitiesV2);
	});

	it('resolves the default version when none is requested', () => {
		const node = new Capacities();
		expect(node.getNodeType()).toBeInstanceOf(CapacitiesV2);
	});

	it('requires capacitiesApi credentials on every version', () => {
		const node = new Capacities();
		for (const version of [1, 2]) {
			expect(node.getNodeType(version).description.credentials).toContainEqual({
				name: 'capacitiesApi',
				required: true,
			});
		}
	});
});
