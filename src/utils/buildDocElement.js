
/**
 * AI Attribution:
 * ChatGPT assisted in structuring the mapping between document types and PDF components.
 * The final implementation and integration with the document generation pipeline
 * were completed manually by the author.
 */


import { build } from "pdfjs-dist";
import {
    IRBApplicationPDF,
    ConsentFormPDF,
    ClinicalTrialAgreementPDF
} from "../pdfDoc";

export function buildDocElement(docId, extractedData, clauses) {

    switch (docId) {
        case "irb": return <IRBApplicationPDF data={extractedData} />;
        case "consent":
            return (
                <ConsentFormPDF
                    data={extractedData}
                    generated={extractedData.generatedContent || {}}
                />
            );
        case "cta":
            return (
                <ClinicalTrialAgreementPDF
                    data={extractedData}
                    clauses={clauses}
                />
            );

        default:
            throw new Error(`Unknown docId: ${ docId }`);
    }
}

