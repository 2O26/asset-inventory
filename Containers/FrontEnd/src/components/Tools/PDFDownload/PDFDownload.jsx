import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Set the fonts to use
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Generates and downloads a PDF document from JSON data.
 * @param {Object} jsonData - The JSON data to convert into a PDF document.
 */
function generatePdfFromJson(jsonData) {

    const tocItems = [];

    let assetCount = 0;
    tocItems.push({ text: "Assets", style: 'header', tocItem: true, pageBreak: 'before' })

    // Generate sections for each asset
    Object.entries(jsonData.assets).forEach(([id, asset], index) => {
        const properties = asset.properties;
        assetCount = index + 1;
        // Adding each asset to the TOC
        tocItems.push({ text: `${properties["Name"]}`, style: 'tocItem', tocItem: true }, { text: 'Standard Info: ', style: 'subHeader' }, {
            ul: [
                `ID: ${id}`,
                `Name: ${properties["Name"]}`,
                `Owner: ${properties["Owner"]}`,
                `Type: ${properties["Type"].join(", ")}`,
                `Criticality: ${properties["Criticality"]}`,
                `Created at: ${properties["Created at"]}`,
                `Updated at: ${properties["Updated at"]}`,
                `Hostname: ${properties["Hostname"]}`,
            ]
        },
            // { text: 'Plugin Info: ', style: 'subHeader' }
        );
    });

    // Generate sections for each relation
    let relationCount = 0;
    tocItems.push({ text: 'Relations', style: 'tocItem', tocItem: true, pageBreak: 'before' })
    Object.entries(jsonData.relations).forEach(([id, relation], index) => {
        // Adding each relation to the TOC
        relationCount = index + 1;
        tocItems.push({ text: `${id}`, style: 'tocItem', tocItem: true }, {
            ul: [
                `From: ${relation.from}`,
                `To: ${relation.to}`,
                `Owner: ${relation.owner}`,
                `Created at: ${relation.dateCreated}`,
            ]
        });
    });

    const infoText = [{ text: "Information", style: 'info' }, {
        ul: [
            `Date Updated: ${jsonData["mostRecentUpdate"]}`,
            `Number of Assets: ${assetCount}`,
            `Number of Relations: ${relationCount}`
        ]
    }]


    const docDefinition = {
        content: [
            { text: 'Asset Inventory | Knowit', style: 'header', },
            ...infoText,
            { toc: { title: { text: 'Table of Contents', style: 'header' } }, pageBreak: 'before' },
            ...tocItems,
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10],
            },
            tocItem: {
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 5],
            },
            info: {
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 5],
            },
            subHeader: {
                fontSize: 14,
                bold: true
            }
            // Define more styles as needed
        }
    };

    // Generate the PDF
    pdfMake.createPdf(docDefinition).download('pdf_from_json.pdf');
}

export default async function PDFDownload(jsonData) {
    // const queryClient = new QueryClient({})

    // try {
    //     const data = await queryClient.fetchQuery({
    //         queryKey: ['getState'],
    //         queryFn: async () => GetState
    //     });
    //     console.log(data)
    // } catch (error) {
    //     console.log(error)
    // }
    console.log(jsonData)
    generatePdfFromJson(jsonData);
}