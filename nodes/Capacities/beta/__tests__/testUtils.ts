import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const getProperty = (
	collection: INodeProperties[],
	name: string,
	resource?: string,
): INodeProperties | undefined =>
	collection.find((property) => {
		if (property.name !== name) {
			return false;
		}
		if (!resource) {
			return true;
		}
		const shownResources = property.displayOptions?.show?.resource;
		return Array.isArray(shownResources) && shownResources.includes(resource);
	});

export const getOptions = (property?: INodeProperties): INodePropertyOptions[] =>
	(property?.options ?? []).filter((option): option is INodePropertyOptions =>
		typeof (option as INodePropertyOptions).value === 'string',
	);

export const getCollectionOption = (
	collectionProperty: INodeProperties | undefined,
	displayName: string,
): INodeProperties | undefined =>
	((collectionProperty?.options ?? []) as INodeProperties[]).find(
		(option) => option.displayName === displayName,
	);
