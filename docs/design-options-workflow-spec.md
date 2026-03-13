# Design Options Workflow — Product Spec

**Status:** Approved  
**Last updated:** March 2025

This spec describes how designers create and send **4–5 design options** to customers for approval. The customer **only ever sees 4–5 options**; the designer uses 8–12 internal options to curate down to that set.

---

## 1. Overview

- **Designer** picks **4–5 templates** (e.g. filtered by “simple” when the customer wants simple).
- **App** applies the school/customer branding (logo, colors) and generates **2–3 variations per template** (e.g. color emphasis: blue-dominant, gold-dominant, balanced).
- **Designer** sees **8–12 options total** (for their eyes only), picks **one variation per template** that looks best.
- **Customer** receives **only 4–5 options** — one chosen design per template. No 8–12.

---

## 2. User flow

| Step | Actor   | Action |
|------|--------|--------|
| 1    | Designer | Filter templates (e.g. by attribute like “simple”) and select **4–5 templates**. |
| 2    | App      | For each selected template: apply branding and generate **2–3 variations** (same template, different color/layout emphasis). Total: **8–12 options**. |
| 3    | Designer | Review all 8–12 options and **select one variation per template** (the best of each set). Result: **4–5 selected options**. |
| 4    | Designer | **Send to customer** only those 4–5 selected options (e.g. one link or one PDF). |
| 5    | Customer | Sees and approves from **4–5 options only**. |

---

## 3. Requirements

### 3.1 Template selection

- Designer can **filter** templates (e.g. by attribute: **simple**, complex, sport, etc.).
- Designer can **multi-select 4–5 templates** from the filtered list (designer’s choice which ones).
- Templates are the existing .ai-based templates; optional SVG for preview/editing as today.

### 3.2 Variation generation

- For each of the 4–5 selected templates, the app generates **2–3 variations**.
- Variations = same template + same branding (logo, school colors), with different **color/layout emphasis** (e.g. primary-dominant, secondary-dominant, balanced).
- Total options shown to designer: **4 templates × 2–3 variations = 8–12** (or 5 × 2–3 if 5 templates).

### 3.3 Curation (designer only)

- All 8–12 options are displayed in a **curation view** (designer-only).
- Designer **selects exactly one variation per template** (e.g. checkboxes, “Pick for customer,” or “Add to send set”).
- Final “send set” = **4–5 options** (one per template).

### 3.4 Sending to customer

- Designer can **send to customer** only the 4–5 selected options (e.g. generate link or PDF).
- Customer **never** sees the full 8–12; only the 4–5 in the send set.

---

## 4. Out of scope for this spec

- **Approval workflow** (e.g. customer clicks “Approve” / “Request changes”) — to be specified separately.
- **3D Builder** integration (SVG export for 3D) — to be specified separately.
- **Production handoff** (e.g. “Send to production in China” after approval) — to be specified separately.

---

## 5. Summary

- **8–12 options** = internal set for the designer (4–5 templates × 2–3 variations).
- **Designer** picks 1 variation per template → **4–5 options**.
- **Customer** only receives and sees **4–5 options** for approval.
