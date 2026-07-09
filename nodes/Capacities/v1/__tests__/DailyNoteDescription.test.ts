import { dailyNote } from '../DailyNoteDescription';
import { getOptions, getProperty } from './testUtils';

describe('DailyNote description (v1)', () => {
	it('provides save operation wired to POST /blocks/daily-note/append', () => {
		const operationProperty = getProperty(dailyNote, 'operation', 'dailyNote');
		expect(operationProperty).toBeDefined();
		const saveOption = getOptions(operationProperty).find(
			(option) => option.value === 'saveToDailyNote',
		);
		expect(saveOption?.routing?.request).toMatchObject({
			url: '/blocks/daily-note/append',
			method: 'POST',
			json: true,
		});
		expect(saveOption?.routing?.request?.body).toMatchObject({
			markdown: '={{$parameter.mdText}}',
			noTimeStamp: '={{$parameter.timestamp ? false : true}}',
		});
		expect(saveOption?.routing?.request?.body).not.toHaveProperty('spaceId');
		expect(saveOption?.routing?.request?.body).not.toHaveProperty('commandPalette');
	});

	it('does not expose a Space ID selector (token is space-scoped)', () => {
		expect(getProperty(dailyNote, 'spaceId', 'dailyNote')).toBeUndefined();
	});

	it('surfaces required markdown input, timestamp toggle, and optional date', () => {
		const mdTextProperty = getProperty(dailyNote, 'mdText', 'dailyNote');
		expect(mdTextProperty?.required).toBe(true);
		const timestampProperty = getProperty(dailyNote, 'timestamp', 'dailyNote');
		expect(timestampProperty?.type).toBe('boolean');
		expect(timestampProperty?.default).toBe(true);
		const dateProperty = getProperty(dailyNote, 'date', 'dailyNote');
		expect(dateProperty?.type).toBe('dateTime');
	});
});
