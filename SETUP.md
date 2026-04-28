
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

## Backend / Database

This project uses a preconfigured Supabase backend.

- No setup is required for database or storage

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
