"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertPdfToPng = convertPdfToPng;
const pdfium_1 = require("@hyzyla/pdfium");
const sharp_1 = __importDefault(require("sharp"));
async function convertPdfToPng(pdfBuffer) {
    const library = await pdfium_1.PDFiumLibrary.init();
    const document = await library.loadDocument(pdfBuffer);
    const pages = [];
    try {
        for (const page of document.pages()) {
            const image = await page.render({
                scale: 3,
                render: async (options) => {
                    return await (0, sharp_1.default)(options.data, {
                        raw: {
                            width: options.width,
                            height: options.height,
                            channels: 4,
                        },
                    })
                        .png()
                        .toBuffer();
                },
            });
            pages.push({
                pageNumber: page.number,
                name: `page_${page.number}`,
                width: image.width,
                height: image.height,
                content: Buffer.from(image.data),
            });
        }
    }
    finally {
        document.destroy();
        library.destroy();
    }
    return pages;
}
//# sourceMappingURL=genericFunctions.js.map