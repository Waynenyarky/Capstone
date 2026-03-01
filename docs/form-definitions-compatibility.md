# Form Definitions – Compatibility with Business Owner Flow

This document describes how the business-owner application form (Add Business / Edit Application) stays compatible when admins change form definitions via the **Form Definitions** feature (add/remove/reorder sections and items, change labels, keys, types, validation, etc.).

## What is definition-driven (safe to change)

- **Sections**: Order, count, `category`, `source`, `notes`, `showWhen` (conditional visibility). The UI renders sections from `definition.sections` in order and filters by `showWhen` using current form values.
- **Fields per section**: Order, count, and for each item: `label`, `key`, `type`, `required`, `placeholder`, `helpText`, `span`, `validation`, `dropdownOptions`, `groupFields` (for repeatable groups). The renderer iterates `section.items` and renders each field by `type`.
- **Date handling**: Which fields are dates (and which repeatable-group columns are dates) is derived from the definition when loading drafts (`formDataWithDayjs`) and when generating test data. Adding/removing date fields or changing keys is reflected automatically.
- **Validation**: Required checks and section completion use the current definition. Changing `required` or adding/removing fields is reflected without code changes.
- **Payload**: `formData` sent to the backend is the full set of form values (keyed by field `key` or `label`). The backend stores `formData` as-is and does not validate it against the form definition schema.

So **reordering sections/items, changing labels/placeholders/helpText, adding or removing standard fields (text, number, date, select, file, address, repeatable groups), and changing validation** are all compatible. The app loads the active definition by form type and renders whatever is in `sections`.

## What is fixed in code (caveats)

### 1. Line of Business (AI) section

- **Field type**: `ai_lob_recommendation` is a special widget. The form uses **fixed internal field names**: `businessDescriptionText`, `hasAnalyzedBusinessDescription`, `businessActivities`. These are not editable in the form definition.
- **Compatibility**: 
  - You can have **one** section that contains an item with `type: 'ai_lob_recommendation'`. That section will work as intended.
  - If you add **more than one** such section, they will all bind to the same form fields and show the same data (not separate LOB blocks). Prefer **one LOB section per form**.
  - If you remove the LOB section, existing drafts that already have `businessActivities` in `formData` will still save and load that data; there just won’t be a UI to edit it for that definition.

### 2. Extracted payload fields

The submit handler maps form values to a few top-level payload fields (e.g. `businessName`, `primaryLineOfBusiness`, `tinNumber`, `contactNumber`, `email`). It uses **fallback lists of possible keys** (e.g. `'Business Name' || 'businessName' || 'Trade Name'`). So:

- **Safe**: Changing only the **label** of a field (e.g. "Business Name" → "Registered Business Name") keeps the same `key`, so extraction still works.
- **Caveat**: If you change a field’s **key** to something not in the fallback list (e.g. from `businessName` to `registeredBusinessName`), that value will no longer be used for the extracted payload unless the code is updated to include the new key. **Either keep the same key when renaming, or add the new key to the extraction logic in `AddBusinessForm.jsx`.**

Current extraction keys (examples):

- **businessName**: `Business Name`, `businessName`, `Trade Name`, `tradeName`
- **primaryLineOfBusiness**: `Business Type`, `businessType`, `Line of Business`, `lineOfBusiness`, or first entry in `businessActivities[].lineOfBusiness`
- **tinNumber**: `TIN`, `tin`, `TIN Number`
- **contactNumber**: `Contact Number`, `contactNumber`, `Phone`, `phone`
- **email**: `Email`, `email`, `Business Email`
- **capitalInvestment**, **numberOfEmployees**: similar pattern (multiple possible keys)

### 3. Field types supported by the frontend

The renderer supports a fixed set of types: `text`, `textarea`, `number`, `date`, `select`, `multiselect`, `file`, `download`, `checkbox`, `address`, `address_alaminos`, `repeatable_group`, `ai_lob_recommendation`. If the definition contains an item with a **type not in this list** (e.g. a new type added in the backend before the frontend is updated), the field is rendered as a plain text input (default case). So the form does not break; the field may just be less appropriate (e.g. no date picker). Keeping backend and frontend field types in sync avoids this.

### 4. Loading drafts after definition changes

When a user opens an existing draft:

- Form values are set from `editingBusiness.formData`.
- Dates are normalized to dayjs using the **current** definition (so only fields that exist in the current definition and are of type `date` get converted).
- Extra keys in `formData` that no longer exist in the definition remain in form state but have no visible input; they are still submitted with the form.
- New fields in the definition that are not in the saved `formData` appear empty.

So drafts remain loadable and submittable even if the definition was edited (sections/items added/removed/renamed). No migration of old `formData` is required.

## Summary

- **Compatible**: Section/item order and count, labels, placeholders, helpText, validation, conditional sections, standard field types, date fields, repeatable groups, single LOB section. Changing these via the Form Definitions feature works with the current implementation.
- **Caveats**: (1) Use at most one LOB section per form. (2) When renaming fields that feed extracted payload (business name, TIN, primary LOB, etc.), keep the same key or update the extraction logic. (3) New field types need to be implemented in the frontend renderer to get the right UI.
