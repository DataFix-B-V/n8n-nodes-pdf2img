import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { convertPdfToPng } from './genericFunctions';

export class pdf2img implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF to Image',
		name: 'pdf2img',
		icon: { light: 'file:pdf2img.svg', dark: 'file:pdf2img.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'Convert PDF to Image',
		defaults: {
			name: 'PDF to Image',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				hint: 'The name of the input binary field containing the file to be written',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, '') as string;
				const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

				this.logger.info('Converting PDF to PNG...');
				const pages = await convertPdfToPng(binaryDataBuffer);
				this.logger.info(`Successfully converted PDF to PNG. Processed ${pages.length} page(s).`);

				for (const page of pages) {
					const newItem: INodeExecutionData = {
						json: {
							pageNumber: page.pageNumber,
							name: page.name,
							width: page.width,
							height: page.height,
						},
						binary: {
							[`${binaryPropertyName}_page_${page.pageNumber}`]: {
								data: page.content!.toString('base64'),
								mimeType: 'image/png',
								fileName: `${page.name}.png`,
							},
						},
					};
					returnItems.push(newItem);
				}

				items[itemIndex].json[binaryPropertyName] = binaryPropertyName;
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnItems];
	}
}
