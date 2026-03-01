# General Tab (Settings) — UI/UX Design Critique

**Context:** Business owner Settings → General tab: single long form for profile + address + PIS (Personal Information Sheet).

---

## What works

- **No card chrome:** Content isn’t buried in a heavy card; the two-panel layout matches the dashboard.
- **Filled inputs:** Filled variant keeps the form light and consistent with sign-up.
- **Vertical layout:** Labels above fields support scanning and work well on narrow viewports.
- **Single save:** One primary action (Save) with Discard when dirty reduces ambiguity.
- **Conditional spouse field:** Showing Spouse Name only when Marital status = Married avoids clutter.

---

## Issues (senior UI/UX perspective)

### 1. **Weak information hierarchy**

All fields sit in one continuous flow with no grouping. Users can’t quickly answer “where do I change my address?” or “where’s date of birth?”. It reads like one long list instead of clear sections.

**Recommendation:** Add section headings, e.g. **Basic information**, **Address**, **Personal information (PIS)** so the form has a clear outline.

### 2. **High cognitive load**

Everything is visible at once. For 15+ fields, that’s a lot to take in. There’s no progressive disclosure or sense of “steps,” so the form feels heavy even when the user only wants to change one thing.

**Recommendation:** Keep a single scroll for now, but use section headings and spacing so the form feels like 3–4 blocks, not one block. Later, consider collapsible sections (“Basic info” expanded by default, “Address” and “PIS” collapsible) for returning users.

### 3. **Missing context in the tab**

The right panel has a header (avatar, name, “General”), but the **content** of the General tab has no title or short description. Users land directly on fields.

**Recommendation:** Add a short, low-emphasis title/line at the top of the tab content, e.g. “Personal information and address,” so the tab has a clear purpose.

### 4. **Actions only at the bottom**

Save and Discard sit at the bottom. On a long form, users must scroll to save and may lose track of whether they’ve left changes.

**Recommendation:** Consider a sticky “Save / Discard” bar that appears when the form is dirty (or at least when the user has scrolled past the primary content), so the primary actions are always reachable.

### 5. **Inconsistent optional vs required**

Some labels say “(optional)”; `requiredMark` is toggled by layout. Required PIS fields (e.g. Marital status, Place of birth) don’t use the same pattern as “Middle name (optional),” so the mental model “what must I fill?” is unclear.

**Recommendation:** Use a consistent pattern: either show “(optional)” only for optional fields and rely on required asterisks for required ones, or use a single convention app-wide and document it.

### 6. **Address block doesn’t match the rest**

`PhilippineAddressFields` uses default Input/Select styling; the rest of the form uses filled variant. The address block feels like a different “form” visually.

**Recommendation:** If the design system supports it, pass a variant (or equivalent) into `PhilippineAddressFields` so address fields match the rest of the General tab.

### 7. **No landmark structure for accessibility**

The form is one large `<Form>` with no `<fieldset>`/`<section>` or `aria-labelledby`. Screen-reader users get a long list of controls with little structure.

**Recommendation:** Wrap each logical section in a `<fieldset>` with a `<legend>` (or a section with `aria-labelledby`), and ensure section headings are associated so assistive tech can jump by section.

---

## Quick wins (high impact, low effort)

1. **Add section headings**  
   “Basic information,” “Address,” “Personal information (PIS)” with consistent spacing above/below. Improves scanability and perceived complexity.

2. **Add a tab-level title**  
   One line of text at the top of the General content, e.g. “Update your personal details and address.”

3. **Sticky save bar when dirty**  
   When `isDirty`, show a slim bar (e.g. at bottom of viewport or below the panel header) with Save / Discard so users don’t have to scroll to submit.

4. **Tighten spacing between PIS rows**  
   The second PIS row already has `marginTop: 0`; ensure the gap between “Address” and “Marital status” is consistent with other section gaps so the Address + PIS block feels like one coherent section with a heading.

---

## Summary

The General tab is functional and consistent with the rest of the app in layout and inputs, but it underuses hierarchy and structure. As a senior UI/UX designer, I’d prioritize **section headings**, a **short tab-level title**, and **sticky save when dirty** so the form feels clearer, lighter, and easier to use without a full redesign.
