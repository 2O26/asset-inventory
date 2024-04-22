import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { GetIPranges, GetState } from "../../Services/ApiService";
import { useQuery, useMutation } from "@tanstack/react-query"
import { useState } from "react";
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import '../NetworkScan/NetworkScan.css'

// Set the fonts to use
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Generates and downloads a PDF document from JSON data.
 * @param {Object} jsonData - The JSON data to convert into a PDF document.
 */
function generatePdfFromJson(jsonData) {

    if (!jsonData) {
        console.error('No data provided to generate PDF');
        return;
    }

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

export default function PDFDownload() {
    const [IPRanges, setIPRanges] = useState([]);

    const { data, isLoading } = useQuery({
        queryKey: ['IPranges'],
        queryFn: GetIPranges,
        enabled: true
    });

    const { mutate, isPending, isError, error } = useMutation({
        mutationFn: GetState,
        onSuccess: (jsonData) => {
            generatePdfFromJson(jsonData.state);
        },
        onError: (err) => {
            console.error(err)
        }
    });

    const changeScanRange = (event) => {
        const { value, checked } = event.target;

        setIPRanges(prev => {
            if (value === "all") {
                // Toggle "All" independently
                return [];
            } else {
                if (checked) {
                    // Add the value if it's not already included and remove "all" if it's there
                    return prev.includes("all") ? [value] : [...prev, value];
                } else {
                    // Remove the value and keep "all" out if it's currently included
                    return prev.filter(range => range !== value);
                }
            }
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Ranges:", IPRanges)
        mutate(IPRanges)
    }

    return (
        <div className="page-container">
            <div className="scan-form-container">
                <form onSubmit={handleSubmit}>
                    <div className='IPField'>
                        <p className='text-desc'>Please select an IP range or subnet:</p>
                        {isError && <div className='errorMessage'>{error.message}</div>}
                        {isLoading && <LoadingSpinner />}
                        <label className='range-checkbox-label'>
                            <p className='text-desc'>All</p>
                            <input
                                type="checkbox"
                                value="all"
                                checked={IPRanges.length === 0}
                                onChange={changeScanRange}
                            />
                        </label>
                        {data?.ipranges?.map((iprange, index) => (
                            <label className='range-checkbox-label' key={index}>
                                <p className='text-desc'>{iprange}</p>
                                <input
                                    type="checkbox"
                                    value={iprange}
                                    checked={IPRanges.includes(iprange) && !IPRanges.includes("all")}
                                    onChange={changeScanRange}
                                />
                            </label>
                        ))}
                    </div>
                    <button className='standard-button' type="submit">
                        Generate PDF
                    </button>
                    {isPending && <LoadingSpinner />}
                </form>
            </div>
        </div>
    );
}