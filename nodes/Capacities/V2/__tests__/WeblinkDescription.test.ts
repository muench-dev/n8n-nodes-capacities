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
		expect(saveOption?.routing?.request?.body).toHaveProperty('properties');
	});

	it('does not expose a Space ID selector (token is space-scoped)', () => {
		expect(getProperty(weblink, 'spaceId', 'weblink')).toBeUndefined();
	});

	it('exposes Markdown, Title Overwrite, and Description Overwrite', () => {
		const optionsProperty = getProperty(weblink, 'weblinkOptions', 'weblink');
		expect(optionsProperty?.type).toBe('collection');
		const names = (optionsProperty?.options ?? []).map(
			(option) => (option as { name: string }).name,
		);
		expect(names).toEqual(
			expect.arrayContaining(['descriptionOverwrite', 'markdown', 'titleOverwrite']),
		);
		expect(names).not.toContain('tagIds');
	});

	it('uses direct option parameter paths so n8n resolves expressions before sending them', () => {
		const operationProperty = getProperty(weblink, 'operation', 'weblink');
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');
		const body = saveOption?.routing?.request?.body as
			| { markdown?: string; properties?: Record<string, string> }
			| undefined;

		expect(body?.markdown).toContain('$parameter["weblinkOptions"]["markdown"]');
		expect(body?.properties?.title).toContain('$parameter["weblinkOptions"]["titleOverwrite"]');
		expect(body?.properties?.description).toContain(
			'$parameter["weblinkOptions"]["descriptionOverwrite"]',
		);
	});

	it('does not include unsupported tags in the weblink create payload', () => {
		const operationProperty = getProperty(weblink, 'operation', 'weblink');
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');
		const body = saveOption?.routing?.request?.body as
			| { properties?: { tags?: string } }
			| undefined;

		expect(body?.properties?.tags).toBeUndefined();
	});
});
