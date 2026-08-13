import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { loadStructures, loadTags } from '../GeneralFunctions';

const mockSpaceStructures = jest.fn();
const mockObjectsSearch = jest.fn();

jest.mock('@capacities/api', () => {
	return {
		CapacitiesClient: jest.fn().mockImplementation(() => {
			return {
				space: {
					structures: mockSpaceStructures,
				},
				objects: {
					search: mockObjectsSearch,
				},
			};
		}),
	};
});

const rateLimitMessage =
	'Capacities is receiving too many requests from this API token. Please wait a moment and try loading the options again.';

const createContext = () => {
	const context = {
		getCredentials: jest.fn().mockResolvedValue({ token: 'test-token' }),
	} as unknown as ILoadOptionsFunctions;

	return { context };
};

describe('loadStructures helper (v1)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('requests structures and maps id/title pairs', async () => {
		mockSpaceStructures.mockResolvedValue({
			structures: [
				{ id: 'structure-b', title: 'Beta' },
				{ id: 'structure-a', title: 'Alpha' },
			],
		});

		const { context } = createContext();
		const result = await loadStructures.call(context);

		expect(mockSpaceStructures).toHaveBeenCalledTimes(1);
		expect(context.getCredentials).toHaveBeenCalledWith('capacitiesApi');
		expect(result).toEqual([
			{ name: 'Alpha', value: 'structure-a' },
			{ name: 'Beta', value: 'structure-b' },
		]);
	});

	it('shows a human-readable rate-limit error', async () => {
		mockSpaceStructures.mockRejectedValue({
			status: 429,
			message: 'The service is receiving too many requests from you',
		});

		const { context } = createContext();

		await expect(loadStructures.call(context)).rejects.toThrow(rateLimitMessage);
	});
});

describe('loadTags helper (v2)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('loads tag options from valid RootTag searches and deduplicates results', async () => {
		mockObjectsSearch.mockResolvedValue({
			results: [
				{ id: 'tag-b', title: 'Beta' },
				{ id: 'tag-a', title: 'Alpha' },
				{ id: 'tag-a', title: 'Alpha' },
			],
		});

		const { context } = createContext();
		const result = await loadTags.call(context);

		expect(mockObjectsSearch).toHaveBeenCalledTimes(26);
		expect(mockObjectsSearch).toHaveBeenCalledWith(
			expect.objectContaining({
				query: 'a',
				structureIds: ['RootTag'],
				limit: 50,
			}),
		);
		expect(context.getCredentials).toHaveBeenCalledWith('capacitiesApi');
		expect(result).toEqual([
			{ name: 'Alpha', value: 'tag-a' },
			{ name: 'Beta', value: 'tag-b' },
		]);
	});

	it('shows a human-readable rate-limit error', async () => {
		mockObjectsSearch.mockRejectedValue({
			status: 429,
			message: 'The service is receiving too many requests from you',
		});

		const { context } = createContext();

		await expect(loadTags.call(context)).rejects.toThrow(rateLimitMessage);
	});
});
