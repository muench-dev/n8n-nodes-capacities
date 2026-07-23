import { weblink } from '../WeblinkDescription';
import { getOptions, getProperty } from './testUtils';

describe('Weblink description (v2)', () => {
	it('saves weblinks with POST /object/url routing', () => {
		const operationProperty = getProperty(weblink, 'operation', 'weblink');
		expect(operationProperty).toBeDefined();
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');
		expect(saveOption?.routing?.request).toMatchObject({
			url: '/object/url',
			method: 'POST',
			json: true,
		});
		expect(saveOption?.routing?.request?.body).toMatchObject({
			url: '={{$parameter.url}}',
		});
	});

	it('does not expose a Space ID selector (token is space-scoped)', () => {
		expect(getProperty(weblink, 'spaceId', 'weblink')).toBeUndefined();
	});

	it('exposes Markdown, Title Overwrite, Description Overwrite, and selectable Tags', () => {
		const optionsProperty = getProperty(weblink, 'weblinkOptions', 'weblink');
		expect(optionsProperty?.type).toBe('collection');
		const names = (optionsProperty?.options ?? []).map(
			(option) => (option as { name: string }).name,
		);
		expect(names).toEqual(
			expect.arrayContaining(['markdown', 'titleOverwrite', 'descriptionOverwrite', 'tagIds']),
		);

		const tagOption = (optionsProperty?.options ?? []).find(
			(option) => (option as { name: string }).name === 'tagIds',
		) as { type?: string; typeOptions?: { loadOptionsMethod?: string } } | undefined;

		expect(tagOption).toMatchObject({
			type: 'multiOptions',
			typeOptions: {
				loadOptionsMethod: 'loadTags',
			},
		});
	});

	it('maps Tag IDs to the v1 entity property shape', () => {
		const operationProperty = getProperty(weblink, 'operation', 'weblink');
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');
		const body = saveOption?.routing?.request?.body as { properties?: string } | undefined;
		const propertiesExpression = body?.properties;

		expect(propertiesExpression).toContain('o.tagIds');
		expect(propertiesExpression).toContain('p.tags = { type: "entity"');
		expect(propertiesExpression).toContain('entity: tagIds.map((id) => ({ id }))');
	});
});
