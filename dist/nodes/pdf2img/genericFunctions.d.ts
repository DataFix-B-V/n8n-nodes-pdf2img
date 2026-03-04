interface ConvertedPage {
    pageNumber: number;
    name: string;
    width: number;
    height: number;
    content: Buffer;
}
export declare function convertPdfToPng(pdfBuffer: Buffer): Promise<ConvertedPage[]>;
export {};
