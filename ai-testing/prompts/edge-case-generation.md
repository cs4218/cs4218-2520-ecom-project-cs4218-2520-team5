# Edge Case Generation Prompt — MS2
<!-- Person 3 — Ang Yi Jie, Ivan, A0259256U -->

This prompt template is used by the **Generate Edge Cases (Claude)** node in the
n8n workflow. It is assembled in the **Build Edge Case Prompt** Code Node and
runs after the MS1 unit tests have already been generated and formatted.

MS2 enhancements over MS1:
- Boundary value tests
- Invalid input / wrong type tests
- Missing required field tests (one field at a time)
- Auth edge cases (missing token, expired token, wrong role)
- Schema validation enforcement (see `validate-test-schema.js`)

---

## Prompt Template

```
You are an expert software engineer specialising in edge-case, boundary, and
negative-path testing for Node.js applications.

You will be given an existing Jest test file for a MERN stack e-commerce API.
Your task is to AUGMENT it with additional edge-case tests — do NOT rewrite or
duplicate the existing tests.

EXISTING TEST FILE:
```javascript
{{EXISTING_TEST_FILE}}
```

WHAT TO ADD:
Group all new tests inside a single describe block:

  describe('Edge Cases & Boundary Tests', () => { ... });

Within that block, add test cases targeting:

1. BOUNDARY VALUES
   - Empty string '' for name/title/slug fields → expect 400 or validation error
   - null / undefined for required fields → expect 400
   - Numeric 0 and -1 for quantity/price fields
   - String with only whitespace '   ' → should be rejected or trimmed
   - Very long strings (> 500 chars) for text fields

2. MISSING REQUIRED FIELDS (one at a time)
   - For each required field in the request body, send a request with that one
     field absent. Verify the API returns 4xx and does not create/update the record.

3. INVALID TYPES
   - Send a number where a string is expected (e.g. name: 123)
   - Send a string where a boolean is expected
   - Send an invalid ObjectId format for _id parameters

4. AUTH EDGE CASES
   - Request with no Authorization header → expect 401
   - Request with an expired JWT token → expect 401
   - Request with a valid user token on an admin-only route → expect 401 or 403
   - Request with a malformed token (not a valid JWT) → expect 401

5. IDEMPOTENCY / DUPLICATE HANDLING
   - If the unit tests already create a resource, try creating it again with the
     same unique field (slug, email, etc.) → expect 400/409 conflict error.

RULES:
- Each test() must have at least one expect() assertion. No empty tests.
- Do NOT repeat test cases already in the existing file.
- Use the same imports and helpers already present in the existing file
  (do not add new imports unless absolutely necessary).
- Author comment for new block:
    // Ang Yi Jie, Ivan, A0259256U — AI-generated edge cases (MS2)
- Return ONLY the new describe block inside a single ```javascript ... ``` code
  block. Do NOT return the entire file — only the addition.

Generate the edge-case describe block now:
```

---

## Schema Validation Rules (MS2)

After the edge-case block is merged, the **Validate Test Schema** Code Node
enforces three rules before the file is pushed to GitHub:

### Rule 1 — Jest test format required
The merged file must contain:
- At least one `describe()` block
- At least one `test()` or `it()` block
- At least one `expect()` call

*Rationale:* Prevents the AI from returning prose or markdown instead of code.

### Rule 2 — No empty tests
Every `test()` / `it()` body must contain at least one `expect()` or `assert()`.

*Rationale:* Empty tests (skeleton placeholders) inflate test count without
providing any coverage value. The schema validator scans each test body
with a regex and fails the pipeline if any are empty.

### Rule 3 — Valid imports only
All `import … from '…'` statements must resolve to either:
- A relative path (`./`, `../`) — assumed to exist in the project
- A known npm package (see allowed list in `validate-test-schema.js`)
- A Node.js built-in (`node:fs`, `node:path`, etc.)

`require()` is always rejected — the project is pure ESM.

*Rationale:* AI models sometimes hallucinate package names. This rule catches
imports like `import supertest from 'super-test'` (wrong) before the file
is committed and CI fails.

---

## Design Notes (MS2)

### Why a separate edge-case pass?

Asking the model to generate both unit tests and edge cases in one prompt
reliably produces lower quality output — the model tends to front-load happy
paths and write thin edge cases. Splitting into two passes:

1. **MS1 pass** → comprehensive happy-path + obvious error paths (full context)
2. **MS2 pass** → targeted edge cases (the model is given the existing tests and
   told explicitly *what is already covered* so it focuses on gaps)

### Why append rather than regenerate?

Appending the edge-case describe block preserves the MS1 tests exactly. This
is important for auditability (MS1 and MS2 deliverables stay distinct) and
avoids the risk of the model inadvertently altering already-validated test logic.

### Merge strategy

The **Merge Tests** Code Node:
1. Extracts the `describe('Edge Cases …')` block from the Claude response
2. Appends it after the existing test code with a separator comment
3. Passes the merged string to the schema validator

If the edge-case generation fails (network error, Claude refusal), the
Merge Tests node falls back to returning the MS1 file unchanged, so the
pipeline can still push a valid (if incomplete) file.
