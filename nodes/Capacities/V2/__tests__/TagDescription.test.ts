import { tag } from '../TagDescription';
import { getOptions, getProperty } from './testUtils';

describe('Tag description (v2)', () => {
	it('creates tags with POST /object routing', () => {
		const operationProperty = getProperty(tag, 'operation', 'tag');
		expect(operationProperty).toBeDefined();
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');

		expect(saveOption?.routing?.request).toMatchObject({
			url: '/object',
			method: 'POST',
			json: true,
			body: {
				structureId: 'RootTag',
				properties: {
					title: {
						type: 'title',
						title: {
							value: '={{$parameter.title}}',
						},
					},
				},
			},
		});
	});

	it('exposes a required title field', () => {
		const titleProperty = getProperty(tag, 'title', 'tag');

		expect(titleProperty).toMatchObject({
			type: 'string',
			required: true,
			default: '',
		});
	});
});
