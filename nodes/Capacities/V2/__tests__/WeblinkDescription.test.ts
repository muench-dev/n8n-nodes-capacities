import { weblink } from '../WeblinkDescription';
import { getOptions, getProperty } from './testUtils';

describe('Weblink description (v1)', () => {
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

	it('exposes Markdown, Title Overwrite, and Description Overwrite, but no Tags', () => {
		const optionsProperty = getProperty(weblink, 'weblinkOptions', 'weblink');
		expect(optionsProperty?.type).toBe('collection');
		const names = (optionsProperty?.options ?? []).map(
			(option) => (option as { name: string }).name,
		);
		expect(names).toEqual(
			expect.arrayContaining(['markdown', 'titleOverwrite', 'descriptionOverwrite']),
		);
		expect(names).not.toContain('tags');
	});
});
