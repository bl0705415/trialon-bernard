
# TrialOn - AI-Powered Clinical Trial Protocol Extraction and IRB Document Generation

**AI-Assisted IRB Preparation & Study Startup Acceleration**

##Description

This project is a web application that uses large language models to extract structured data from clinical trial protocol PDFs and automatically generate regulatory documents. It implements a multi-stage ML pipeline combining information extraction and controlled text generation.

---

## What It Does

Upload a clinical trial protocol PDF and TrialON uses GPT-4.1 (via Duke's LiteLLM API) to automatically extract **50 protocol fields** and generate drafts for **5 regulatory documents**:

| Template | Description |
|----------|-------------|
| 📋 **IRB Application** | 50 fields across sections A.1–B.7 (contact info, summary checklist, common questions, consent process, direct interaction) |
| 📝 **Informed Consent Form** | Long-form adult consent based on Duke template (key summary, purpose, risks, HIPAA, injuries, withdrawal) |
| 🤝 **IRB Reliance Agreement** | HRP-235 WCG IRB reliance agreement (organization info, protocol details, PI) |
| 🔒 **Personal Data Disclosure** | Compensation & tax reporting form for research participants |
| ✅ **Study Planning Checklist** | Clinical study planning checklist (study ID, type, phase, enrollment, locations) |

Each field is tagged as:
- 🟢 **Auto-filled** — extracted directly from the protocol PDF
- 🔴 **Missing** — not found in protocol, prompted to RC one at a time via wizard

---

## Three Persona Views

TrialON supports three distinct user roles with hardcoded test accounts (no real auth):

| Email | Password | Role |
|-------|----------|------|
| rc@test.com | test345 | Research Coordinator |
| legal@test.com | test234 | Legal Reviewer |
| cro@test.com | test123 | Sponsor / CRO |

### 1. Research Coordinator (RC)
- Upload a protocol PDF → GPT extracts 50 fields → missing fields prompted one at a time
- Review all extracted fields, then navigate to Documents
- **Send to Legal** and **Send to CRO** buttons push the study to the respective reviewer
- Click **View** on any document PDF to generate it (uses `@react-pdf/renderer`) and upload to Supabase Storage — **PDFs are only generated when the RC clicks View for the first time**
- Archive studies (soft delete — hidden from UI but kept in Supabase)

### 2. Legal Reviewer
- Only sees studies where RC has clicked "Send to Legal"
- Sees **Contract Sections (CTA) only** — can approve or flag each section
- Can view/download generated PDFs via "View PDFs →" button (only available after RC has clicked View)
- Status updates (approved/flagged) are saved back to Supabase in real time

### 3. Sponsor / CRO
- Only sees studies where RC has clicked "Send to CRO"
- Sees **Consent Form sections (ICF) only** — can accept or counter-propose each section
- Can view/download generated PDFs via "View PDFs →" button
- Status updates saved to Supabase in real time

---

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Setup

```bash
# Clone the repo
git clone git@github.com:amd226/trial-on.git
cd trial-on

# Install dependencies
npm install

# Copy the PDF.js worker file (required for PDF parsing)
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js

# Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

> ⚠️ **The `pdf.worker.min.js` copy step is required every time you do a fresh `npm install`.** Without it, PDF uploads will fail with a worker version mismatch error.

---

## Key Dependencies

Install these if they are missing:

```bash
npm install @supabase/supabase-js pdfjs-dist lucide-react @react-pdf/renderer
```

| Package | Purpose |
|---------|---------|
| `pdfjs-dist` | Extract text from uploaded protocol PDFs |
| `@supabase/supabase-js` | Database (studies table) and file storage (PDF bucket) |
| `lucide-react` | Sidebar icons |
| `@react-pdf/renderer` | Generate IRB, Consent, and CTA PDFs client-side |

---

## How Parsing Works

1. The RC uploads a `.pdf` protocol file
2. `pdfjs-dist` extracts raw text from every page client-side in the browser
3. The raw text (up to 14,000 characters) is sent to **Duke's LiteLLM API** (GPT 4.1) with a structured prompt asking it to return exactly 50 fields as a JSON object
4. Any fields GPT couldn't find are prompted to the RC one at a time through the **Missing Fields Wizard**
5. The completed 50-field object is saved to Supabase along with auto-generated contract and consent sections

### LiteLLM Configuration
```
Base URL: https://litellm-01.oit.duke.edu
Model:    GPT 4.1
Key:      sk-nC6KVrXD65MVLvso4sXsKA  (team key — do not use gpt-4o, it is not allowed)
```

### 50 Extracted Fields
Fields span 13 categories: Study Identification, Regulatory, Study Design, Study Population, Study Product, Procedures, Risk/Safety, Consent, Recruitment, Payments to Subjects, Data/Privacy, Specimens, and Specimens/Genetics.

---

## Supabase Setup

**Project URL:** `https://rxepavvxustsikfsilpc.supabase.co`

### Database Tables

#### `studies` table
```sql
create table studies (
  id text primary key,
  title text,
  sponsor text,
  phases text,
  pi text,
  contract_sections jsonb,
  consent_sections jsonb,
  extracted_fields jsonb,
  uploaded_at bigint,
  archived boolean default false,
  pushed_to_legal boolean default false,
  pushed_to_cro boolean default false,
  created_at timestamp default now()
);
```

RLS policies: public select, insert, and update all enabled.

### Storage

**Bucket:** `study-pdfs` (public)

PDFs are stored at path: `{studyId}/{docId}.pdf` where `docId` is one of `irb`, `consent`, or `cta`.

Required storage policies on `study-pdfs`:
- **Allow public uploads** — INSERT, policy definition: `true`
- **Allow public reads** — SELECT, policy definition: `true`

> ⚠️ PDFs are only generated and uploaded when the RC clicks **View** on a document for the first time. Until then, Legal/CRO will see "Object not found" if they try to view the PDF directly.

---

## Project Structure

```
src/
├── App.js          # Main single-file React app (all components and logic)
├── pdfDoc.jsx      # PDF document components using @react-pdf/renderer
│                   #   - IRBApplicationPDF
│                   #   - ConsentFormPDF
│                   #   - ClinicalTrialAgreementPDF
└── pdfUtils.js     # PDF generation and Supabase Storage utilities
                    #   - getPdfUrl()      — generate + upload + cache PDF
                    #   - downloadPdf()    — trigger browser download
                    #   - invalidateStudyCache() — clear cached PDFs

public/
└── pdf.worker.min.js   # Required pdfjs worker (copy from node_modules — see setup)
```

---

## Data Flow

```
RC uploads PDF
    → pdfjs extracts text
    → LiteLLM/GPT-4.1 extracts 50 fields
    → Missing fields wizard fills gaps
    → Study saved to Supabase (studies table)
    → RC clicks "Send to Legal" → pushed_to_legal = true in Supabase
    → RC clicks "Send to CRO"  → pushed_to_cro = true in Supabase
    → RC clicks "View" PDF     → @react-pdf/renderer generates PDF
                               → uploaded to Supabase Storage study-pdfs bucket

Legal logs in
    → Fetches studies where pushed_to_legal = true
    → Sees Contract Sections (CTA) only
    → Can approve/flag sections (saved to Supabase)
    → Can view/download PDFs from Supabase Storage

CRO logs in
    → Fetches studies where pushed_to_cro = true
    → Sees Consent Form sections (ICF) only
    → Can accept/counter-propose sections (saved to Supabase)
    → Can view/download PDFs from Supabase Storage
```

---

## Git Workflow (Multiple Contributors)

Always pull before pushing to avoid conflicts:

```bash
git stash && git pull origin main --rebase && git stash pop && git push origin main
```

If there are merge conflicts on `package.json` or `package-lock.json`:

```bash
git checkout --theirs package.json package-lock.json
git add package.json package-lock.json
git commit -m "merge: accept partner package changes"
npm install
```

---

## Known Limitations

- **No real authentication** — roles are hardcoded with test accounts
- **No email notifications** — document pushes are flag-based only; reviewers need to manually refresh
- **PDFs only generate on RC View click** — Legal/CRO cannot view PDFs until RC has opened them at least once
- **Vercel deployment is not currently active** — run locally with `npm start`
- **LiteLLM key is a shared team key** — do not use `gpt-4o` model, only `GPT 4.1` is permitted

---

## Important Disclaimers

> ⚠️ **This is a demo/MVP — not a production system.**
>
> - All generated content is marked as DRAFT and requires human review
> - This tool does not guarantee IRB approval or regulatory compliance
> - Responsibility for accuracy remains with the research team
> - No real IRB system integrations are implemented
> - Do not use generated documents for actual regulatory submissions without thorough review

---

## Tech Stack

- **React** (Create React App)
- **Supabase** (PostgreSQL database + file storage)
- **Duke LiteLLM API** (GPT 4.1 for field extraction)
- **pdfjs-dist** (client-side PDF text extraction)
- **@react-pdf/renderer** (client-side PDF generation)
- **lucide-react** (icons)

---

=======
# trialon-bernard
Personal IRB Application Project
