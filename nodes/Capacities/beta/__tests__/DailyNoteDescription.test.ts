import { dailyNote } from '../DailyNoteDescription';
import { loadSpaces } from '../GeneralFunctions';
import { getOptions, getProperty } from './testUtils';

describe('DailyNote description', () => {
	it('provides save operation wired to POST /save-to-daily-note', () => {
		const operationProperty = getProperty(dailyNote, 'operation', 'dailyNote');
		expect(operationProperty).toBeDefined();
		const saveOption = getOptions(operationProperty).find((option) => option.value === 'saveToDailyNote');
		expect(saveOption?.routing?.request).toMatchObject({
			url: '/save-to-daily-note',
			method: 'POST',
			json: true,
		});
		expect(saveOption?.routing?.request?.body).toMatchObject({
			spaceId: '={{$parameter.spaceId}}',
			mdText: '={{$parameter.mdText}}',
			commandPalette: '={{$parameter.commandPalette}}',
			noTimeStamp: '={{$parameter.timestamp ? false : true}}',
		});
	});

	it('surfaced inputs leverage dynamic spaces and timestamp toggle', () => {
		const spaceIdProperty = getProperty(dailyNote, 'spaceId', 'dailyNote');
		expect(spaceIdProperty?.typeOptions?.loadOptions).toBe(loadSpaces);
		const mdTextProperty = getProperty(dailyNote, 'mdText', 'dailyNote');
		expect(mdTextProperty?.required).toBe(true);
		const timestampProperty = getProperty(dailyNote, 'timestamp', 'dailyNote');
		expect(timestampProperty?.type).toBe('boolean');
		expect(timestampProperty?.default).toBe(true);
	});
});
