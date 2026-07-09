import { weblink } from '../WeblinkDescription';
import { loadSpaces } from '../GeneralFunctions';
import { getCollectionOption, getOptions, getProperty } from './testUtils';

describe('Weblink description', () => {
	it('saves weblinks with POST /save-weblink routing', () => {
		const operationProperty = getProperty(weblink, 'operation', 'weblink');
		expect(operationProperty).toBeDefined();
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'save');
		expect(saveOption?.routing?.request).toMatchObject({
			url: '/save-weblink',
			method: 'POST',
			json: true,
		});
		expect(saveOption?.routing?.request?.body).toMatchObject({
			spaceId: '={{$parameter.spaceId}}',
			url: '={{$parameter.url}}',
		});
	});

	it('exposes required URL and space selectors with optional metadata', () => {
		const urlProperty = getProperty(weblink, 'url', 'weblink');
		expect(urlProperty?.required).toBe(true);
		const spaceIdProperty = getProperty(weblink, 'spaceId', 'weblink');
		expect(spaceIdProperty?.typeOptions?.loadOptions).toBe(loadSpaces);
		const optionsProperty = getProperty(weblink, 'weblinkOptions', 'weblink');
		expect(optionsProperty?.type).toBe('collection');
		const mdTextOption = getCollectionOption(optionsProperty, 'MD Text');
		expect(mdTextOption?.routing?.request?.body).toMatchObject({ mdText: '={{$value}}' });
		const tagsOption = getCollectionOption(optionsProperty, 'Tags');
		expect(tagsOption?.typeOptions?.multipleValues).toBe(true);
		expect(tagsOption?.routing?.request?.body).toMatchObject({ tags: '={{$value}}' });
	});
});
