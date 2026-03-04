"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdf2img = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const genericFunctions_1 = require("./genericFunctions");
class pdf2img {
    constructor() {
        this.description = {
            displayName: 'PDF to Image',
            name: 'pdf2img',
            icon: { light: 'file:pdf2img.svg', dark: 'file:pdf2img.dark.svg' },
            group: ['input'],
            version: 1,
            description: 'Convert PDF to Image',
            defaults: {
                name: 'PDF to Image',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
    }
    async execute() {
        const items = this.getInputData();
        const returnItems = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, '');
                const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
                this.logger.info('Converting PDF to PNG...');
                const pages = await (0, genericFunctions_1.convertPdfToPng)(binaryDataBuffer);
                this.logger.info(`Successfully converted PDF to PNG. Processed ${pages.length} page(s).`);
                for (const page of pages) {
                    const newItem = {
                        json: {
                            pageNumber: page.pageNumber,
                            name: page.name,
                            width: page.width,
                            height: page.height,
                        },
                        binary: {
                            [`${binaryPropertyName}_page_${page.pageNumber}`]: {
                                data: page.content.toString('base64'),
                                mimeType: 'image/png',
                                fileName: `${page.name}.png`,
                            },
                        },
                    };
                    returnItems.push(newItem);
                }
                items[itemIndex].json[binaryPropertyName] = binaryPropertyName;
            }
            catch (error) {
                if (this.continueOnFail()) {
                    items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
                }
                else {
                    if (error.context) {
                        error.context.itemIndex = itemIndex;
                        throw error;
                    }
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                        itemIndex,
                    });
                }
            }
        }
        return [returnItems];
    }
}
exports.pdf2img = pdf2img;
//# sourceMappingURL=pdf2img.node.js.map