# AI Attribution

This document describes how AI development tools were used in the implementation of this project, including what code was generated, what was modified, and what required significant debugging or redesign.

---

## Overview

AI tools (primarily ChatGPT) were used as a development assistant throughout this project. Their role was to accelerate implementation, suggest code patterns, and help debug issues. However, all major system design decisions, architecture, and final integrations were determined, modified, and validated manually.

---

## Where AI Was Used

### 1. Initial Code Generation

AI tools were used to generate:
- Early versions of React components (e.g., upload UI, document viewers)
- Boilerplate code for Supabase integration
- Helper functions for PDF parsing (`pdfjs-dist`)
- Initial implementations of API calls to the LiteLLM endpoint

These outputs were used as starting points and were subsequently modified.

---

### 2. Prompt Engineering and LLM Integration

AI assistance was used to:
- Enforce consistent JSON output formatting

Prompts that I designed were iteratively refined and manually adjusted to ensure:
- Correct schema alignment (50 fields)
- Reliable parsing of outputs

---

### 3. UI and Component Structure

AI was used to suggest:
- Component layouts (e.g., `LegalDocumentsTab`, `DocumentsTab`)
- Styling patterns
- Basic state management patterns

All components were significantly modified to:
- Fit the application’s workflow
- Integrate with Supabase storage
- Support multiple user personas (RC, Legal, CRO)

---

## Substantial Modifications and Debugging

Many parts of the project required significant manual intervention beyond AI-generated suggestions.

### 1. Multi-Stage Pipeline Design

The final system uses a **two-stage LLM pipeline**:
1. Model 1: Extract structured protocol fields  
2. Model 2: Generate document content from structured fields  

This architecture was designed manually to ensure:
- separation of concerns
- consistent data flow
- better reliability than a single end-to-end generation step

---

### 2. Dynamic File Path Synchronization

A major challenge was synchronizing dynamically generated PDF file paths across:
- frontend components
- backend storage (Supabase)
- database records

AI initially suggested fixed file paths, which caused mismatches when filenames became dynamic (timestamped).

This was redesigned to:
- generate file paths at creation time
- store them in the database (`documents` field)
- retrieve them directly in the frontend instead of reconstructing them

This required substantial debugging and restructuring of both frontend and backend logic.

---

### 3. State Consistency and Data Flow

AI-generated patterns did not account for:
- stale React state
- mismatched identifiers
- inconsistent object shapes across components

These issues caused bugs such as:
- PDFs not loading
- incorrect study selection
- broken navigation flows

These were manually fixed by:
- enforcing a single source of truth (`studies` state)
- normalizing identifiers
- ensuring correct object propagation between components

---

### 4. PDF Rendering Integration

AI-assisted code for `@react-pdf/renderer` required adjustments to:
- correctly inject generated content
- avoid rendering invalid objects
- ensure only valid components were returned

Incorrect patterns initially caused:
- raw JSON rendering in PDFs
- rendering errors

These were fixed through manual debugging and restructuring.

---

## Design Decisions and Tradeoffs, See Self Assessment Template, Category 1, Item 13

### API-Based LLM vs Custom Model Training

A key design decision was to use a **pretrained API-based language model (GPT via LiteLLM)** rather than training a custom model.

#### Tradeoffs:

| Option | Pros | Cons |
|------|------|------|
API-based LLM | High accuracy, no training data needed, fast to implement | External dependency, latency |
Custom model | Full control, no API dependency | Requires labeled dataset, significant training effort |

#### Decision:

I chose an API-based LLM pipeline because:
- No labeled dataset was available for training
- Protocol formats are far from standardized
- Generalization across document types was critical
- Labeling thousands of pages’ worth of data in the span of a single semester was unrealistic

This decision is reflected in:
- `aiService.js` (model calls)
- prompt-based schema enforcement
- Multi-stage pipeline design

---

## Summary

AI tools were used as a productivity aid for:
- generating initial code scaffolding
- suggesting implementations
- assisting with debugging

However, the final system required:
- substantial modification of generated code
- manual debugging of complex integration issues
- independent design decisions around architecture and ML usage

The most significant contributions of this project, particularly the multi-stage ML pipeline and dynamic document generation system, were the result of iterative development and manual refinement beyond AI-generated suggestions.
