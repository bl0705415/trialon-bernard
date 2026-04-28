
# TrialOn - AI-Powered Clinical Trial Protocol Extraction and IRB Document Generation



## Description

The period between the development of a clinical trial protocol and the initial enrollment of patients is known as clinical trial start-up. It involves transferring information from the protocol, which can often be hundreds of pages long, onto a series of documents to form an Institutional Review Board (IRB) application. Currently, the IRB Application is an inefficient, months-long process that requires tedious protocol analysis as well as dependencies between Regulatory Coordinators (RCs), Legal Coordinators, and Contract Research Organizations (CROs) or study sponsors. There exists no streamlined way to populate IRB Application documents and efficiently communicate across these personas. TrialOn aims to provide this missing functionality, using a multi-stage LLM pipeline to extract structured data and automatically generate several selected regulatory documents from an upload protocol PDF according to stored templates and creative text generation. 

---

## What It Does

This project allows users to upload clinical trial protocol PDFs and automatically processes them through a multi-stage machine learning pipeline. First, a pretrained language model extracts 50 structured fields from unstructured protocol text, converting it into a standardized representation. Next, a second model uses these structured features to generate human-readable sections such as lay summaries and risk descriptions. These outputs are then integrated into dynamically generated regulatory documents, including informed consent forms and clinical trial agreements, which are rendered as PDFs. The system provides an interactive web interface where users can review extracted data, complete missing fields, and generate finalized documents in real time.

---

## Quick Start:

### Prerequisites
- Node.js
- npm

### Setup

```bash
git clone <your-repo-url>
cd <your-repo>
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).
When prompted, upload Sample_protocol.pdf (attached sample protocol) and run the application.

---

## Video Links:

**Demo Video:**
https://drive.google.com/file/d/1nDyT9S1tQfmlOTDzIklR_h6pyrcele7i/view?usp=drive_link

**Technical Walkthrough:**
https://drive.google.com/file/d/1mPbBPB4OgY7N0At5eJ7RlYERIi9aR83r/view?usp=drive_link

---

## Evaluations:

**Missing Fields/Extraction Quality:**
The system tracks how many of the 50 protocol fields are automatically populated versus how many require manual completion in the review workflow. In typical use, the extraction stage populates the majority of fields, while missing or uncertain fields are surfaced to the user for correction through the Field Wizard. This provides a practical measure of extraction completeness and helps identify where the model is less reliable.

**Quality of Patient-Facing Generated Sections:**
I qualitatively evaluated the second-stage generation outputs, especially the lay summary and risk description used in the informed consent form. In testing, the multi-stage pipeline consistently produced readable, structured patient-facing sections that were aligned with the extracted protocol data and appropriate for inclusion in draft regulatory documents.

**System Performance:**
The application performs end-to-end inference at upload time, including PDF text extraction, structured field extraction, and second-stage document text generation. In practice, this completes within a few seconds per uploaded protocol and is fast enough to support interactive use in the web application.

---

## Individual Contributions:

This project was completed alone.


---

## Extra Information (Personal):


**Detailed Description:**

Upload a clinical trial protocol PDF, and TrialON will use GPT-4.1 (via Duke's LiteLLM API) to automatically extract 50 protocol fields and generate drafts for a general IRB application form, informed consent form, and a study contract form:

| Template | Description |
|----------|-------------|
| **IRB Application** | 50 fields across sections A.1–B.7 (contact info, summary checklist, common questions, consent process, direct interaction) |
| **Informed Consent Form** | Long-form adult consent based on Duke template (key summary, purpose, risks, HIPAA, injuries, withdrawal) |
| **IRB Reliance Agreement/Contract** | HRP-235 WCG IRB reliance agreement (organization info, protocol details, PI) |

Each field is tagged as:
- **Auto-filled** — extracted directly from the protocol PDF
- **Missing** — not found in protocol, prompted to RC one at a time via wizard


**How Parsing Works**

1. The user uploads a `.pdf` clinical trial protocol file  
2. `pdfjs-dist` extracts raw text from each page directly in the browser  
3. The extracted text (truncated to ~14,000 characters to fit model limits) is sent to Duke’s LiteLLM API (GPT-4.1)  
4. The model is prompted to return exactly 50 structured fields in JSON format, effectively converting unstructured text into a standardized schema  
5. Any missing or uncertain fields are presented to the user through a **Missing Fields Wizard** for manual completion  
6. The finalized structured data is stored in Supabase and used downstream to generate regulatory documents such as consent forms


**Three-Persona Guide:**

TrialON supports three distinct user roles with hardcoded test accounts (no real auth):

| Email | Password | Role |
|-------|----------|------|
| rc@test.com | test345 | Research Coordinator |
| legal@test.com | test234 | Legal Reviewer |
| cro@test.com | test123 | Sponsor / CRO |

1. Research Coordinator (RC)
- Upload a protocol PDF → GPT extracts 50 fields → missing fields prompted one at a time
- Review all extracted fields, then navigate to Documents
- **Send to Legal** and **Send to CRO** buttons push the study to the respective reviewer
- Click **View** on any document PDF to generate it (uses `@react-pdf/renderer`) and upload to Supabase Storage — **CRUCIAL: PDFs are only generated when the RC clicks View for the first time**
- Delete studies (soft delete — hidden from UI but kept in Supabase)

2. Legal Reviewer
- Only sees studies where RC has clicked "Send to Legal"
- Can view/download generated PDFs via "View PDFs →" button (only available after RC has clicked View)
- Status updates (approved/flagged) are saved back to Supabase in real time

3. Sponsor / CRO
- Only sees studies where RC has clicked "Send to CRO"
- Can view/download generated PDFs via "View PDFs →" button (only available after RC has clicked View)
- Status updates saved to Supabase in real time


