
# Setup Guide

This guide explains how to run the project locally.

---

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- Internet connection (required for API-based model inference)

---

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo>
```

2. Install dependencies:

```bash
npm install
```

---

## Run the Application

```bash
npm start
```

Then open:

http://localhost:3000

---

## External Services

This project uses the following external services:
1. Supabase for database and file storage
2. Duke LiteLLM API (GPT-4.1) for text extraction and document generation
These services are preconfigured in the code, so no additional setup is required.
---

## Notes

- Generated PDFs are stored in Supabase storage
- File paths are dynamically generated and stored in the database
- The system requires an internet connection to call the LLM API

---

## Troubleshooting

If PDF parsing fails, ensure dependencies were installed correctly:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Summary

```bash
npm install
npm start
```
