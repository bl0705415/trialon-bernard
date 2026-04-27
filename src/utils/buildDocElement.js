
import { build } from "pdfjs-dist";
import {
    IRBApplicationPDF,
    ConsentFormPDF,
    ClinicalTrialAgreementPDF
} from "../pdfDoc";

export function buildDocElement(docId, extractedData, clauses) {
    switch (docId) {
        case "irb": return <IRBApplicationPDF data={extractedData} />;
        case "consent": return <ConsentFormPDF data={extractedData} />;
        case "cta": return <ClinicalTrialAgreementPDF data={extractedData} clauses={clauses} />;
        default: throw new Error(`Unknown docId: ${ docId }`);
    }
}

