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
			expect.arrayContaining([
				'descriptionOverwrite',
				'markdown',
				'tags',
				'titleOverwrite',
			]),
		);

		const tagOption = (optionsProperty?.options ?? []).find(
			(option) => (option as { name: string }).name === 'tags',
		) as { options?: Array<{ values?: unknown[] }>; type?: string; typeOptions?: unknown } | undefined;

		expect(tagOption).toMatchObject({
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
		});

		expect(tagOption?.options?.[0].values).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'tagId',
					type: 'resourceLocator',
				}),
			]),
		);
	});

	it('maps Tag IDs to the v1 entity property shape', () => {
		const operationProperty = getProperty(weblink, 'operation', 'weblink');
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');
		const body = saveOption?.routing?.request?.body as { properties?: string } | undefined;
		const propertiesExpression = body?.properties;

		expect(propertiesExpression).toContain('o.tags?.values');
		expect(propertiesExpression).toContain('tag.tagId.value');
		expect(propertiesExpression).toContain('p.tags = { type: "entity"');
		expect(propertiesExpression).toContain('entity: tagIds.map((id) => ({ id }))');
	});
});
