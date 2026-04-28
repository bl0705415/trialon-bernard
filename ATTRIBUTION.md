# AI Attribution

This document describes how AI development tools were used in the implementation of this project, including what code was generated, what was modified, and what required significant debugging or redesign.

---

## Overview

AI tools (primarily ChatGPT) were used as a development assistant throughout this project. Their role was to accelerate implementation, suggest code patterns, and help debug issues. However, all major system design decisions, architecture, and final integrations were determined, modified, and validated manually.

---

## Where AI Was Used

### 1. Initial Code Generation

AI tools were used to generate early versions of React components (e.g., upload UI, document viewers), helper functions for PDF parsing (`pdfjs-dist`), and initial implementations of API calls to the LiteLLM endpoint. These outputs were used as starting points and were subsequently modified.

---

### 2. Prompt Engineering and LLM Integration

AI assistance was used to enforce consistent JSON output formatting.

Prompts that I designed were iteratively refined and manually adjusted to ensure correct schema alignment (50 fields) and reliable parsing of outputs.

---

### 3. UI and Component Structure

AI was used to suggest component layouts (e.g., `LegalDocumentsTab`, `DocumentsTab`), styling patterns, and basic state management patterns.
All components were significantly modified to fit the application’s workflow and smoothly integrate with Supabase storage.

---

## Substantial Modifications and Debugging

Many parts of the project required significant manual intervention beyond AI-generated suggestions.

### 1. Multi-Stage Pipeline Design

The final system uses a two-stage LLM pipeline.
1. Model 1: Extract structured protocol fields  
2. Model 2: Generate document content from structured fields  

This architecture was designed manually to ensure separation of concerns and better reliability than a single end-to-end generation step by strictly relying on extracted data rather than possibly extraneous protocol text.

---

### 2. Dynamic File Path Synchronization

A major challenge was synchronizing dynamically generated PDF file paths across frontend components and backend storage (Supabase).
AI initially suggested fixed file paths, which caused mismatches when filenames became dynamic (timestamped).

I scrapped that idea, and it was redesigned to generate file paths at creation time, store them in the database (`documents` field), and retrieve them directly in the frontend instead of reconstructing them.

This required substantial debugging and restructuring of both frontend and backend logic.

---

### 3. State Consistency and Data Flow

AI-generated patterns did not account for stale React states or mismatched studyID identifiers (in past iterations). These issues caused bugs such as PDFs not loading, incorrect study selection, and broken navigation flows. These were manually fixed by enforcing a single source of truth via the "studies" state, normalizing all identifiers, and ensuring correct object propagation between components.

---

### 4. PDF Rendering Integration

AI-assisted code for `@react-pdf/renderer` required adjustments to correctly inject generated content, avoid rendering invalid objects, and to ensure only valid components were returned. This is because the incorrect ai-assited patterns initially caused raw JSON rendering in PDFs and other rendering errors, which were fixed through manual debugging and restructuring of code.

---

## Design Decisions and Tradeoffs, See Self Assessment Template, Category 1, Item 13

### API-Based LLM vs Custom Model Training

A key design decision was to use a pretrained API-based language model (GPT via LiteLLM) rather than training a custom model. I had to evaluate between the following set of pros and cons: with an API based LLM, I would have relatively lower accuracy due to less training data would be much faster to implement. On the other hand, a custom model would give me much tighter control over its ability to discern the 50 features from a protocol. However, this would require a labeled dataset of thousands of protocols.

I ultimately decided to go with an API based LLM pipeline. This is because there was no labeled dataset available for training, protocol formats are extremely unstandardized in an environment where generalization across document types was necessary, and most importantly, labeling thousands of pages’ worth of data in the span of a single semester was extremely unrealistic.

This decision is reflected in aiService.js with the API calls as opposed to a custom model.

---

## External Libraries and Services

This project uses the following external libraries and services:

- **React** — frontend framework for building the user interface  
- **pdfjs-dist** — client-side PDF text extraction  
- **@react-pdf/renderer** — dynamic PDF generation  
- **Supabase** — database and file storage backend  
- **Duke LiteLLM API (GPT-4.1)** — language model used for structured extraction and document generation  

All libraries were used according to their official documentation.

---

## Summary

AI tools were used as a productivity aid for generating initial code scaffolding, suggesting implementations, and assisting with debugging.

Crucially, I had to personally decide the overall product architecture, and the final system required substantial modification of generated code, manual debugging of different integration issues, and independent design decisions around the pipeline itself and how ML was integrated..

The most significant contributions of this project, particularly the multi-stage ML pipeline and dynamic document generation system, were the result of iterative development and manual refinement beyond AI-generated suggestions.
