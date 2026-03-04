import { PDFiumLibrary } from '@hyzyla/pdfium';
import sharp from 'sharp';

interface ConvertedPage {
  pageNumber: number;
  name: string;
  width: number;
  height: number;
  content: Buffer;
}


export async function convertPdfToPng(pdfBuffer: Buffer ): Promise<ConvertedPage[]> {
  // Initialize the PDFium library and load the PDF document
  const library = await PDFiumLibrary.init();
  const document = await library.loadDocument(pdfBuffer);

  // Iterate through each page of the PDF, render it to a PNG image, and store the results in an array
  const pages: ConvertedPage[] = [];

  try {
    for (const page of document.pages()) {

      // Render the page to a PNG image using Sharp for processing
      const image = await page.render({
        scale: 3,
        render: async (options) => {
          return await sharp(options.data, {
            // PDFium returns raw RGBA pixel data, so we need to specify the dimensions and channels for Sharp to process it correctly
            raw: {
              width: options.width,
              height: options.height,
              channels: 4,
            },
          })
          // Convert the raw pixel data to PNG format and return it as a buffer
            .png()
            .toBuffer();
        },
      });

      // Store the page number, name, dimensions, and PNG content in the pages array
      pages.push({
        pageNumber: page.number,
        name: `page_${page.number}`,
        width: image.width,
        height: image.height,
        content: Buffer.from(image.data),
      });
    }
  } finally {
    // Clean up resources by destroying the PDF document and library instances to free memory
    document.destroy();
    library.destroy();
  }

  return pages;
}
