# Person 2 Workflow — Bug Notes
<!-- Ang Yi Jie, Ivan, A0259256U -->

Alyssa's `AI Testing Project.json` has a bug in the **"Code in JavaScript"** node
that will crash the workflow at runtime. Notes for coordination.

---

## Bug: `result.all_files` is never initialised

**Node:** `Code in JavaScript` (position ~2832, 272)

**Current code (broken):**
```javascript
const result = {
  missing_tests: [],
  low_coverage: [],           // <-- all_files is NOT here
};

// ...

result.all_files.push({ file, avgCoverage: avg });  // 💥 TypeError: Cannot read properties of undefined (reading 'push')
```

**Fix — add `all_files: []` to the initial result object:**
```javascript
const result = {
  missing_tests: [],
  low_coverage: [],
  all_files: [],              // ✅ add this line
};
```

---

## How this affects Person 3

Person 3's **Webhook** receives the output of Person 2's **"Rule based filter"** node.
That node reads `input.low_coverage` and `input.missing_tests` from the output of
**"Code in JavaScript"**. If "Code in JavaScript" crashes, Person 2's entire pipeline
stops and Person 3's webhook never gets called.

**After the fix**, Person 2's output flowing into Person 3 will be:
```json
{
  "valid_files": [
    { "file": "controllers/categoryController.js", "avgCoverage": 92.5 }
  ],
  "removed_low_coverage": [
    { "file": "controllers/authController.js", "avgCoverage": 60 }
  ],
  "rejected_missing_tests": [
    "controllers/productController.js"
  ],
  "summary": {
    "total_valid": 1,
    "total_removed_low_coverage": 1,
    "total_rejected_missing": 1
  }
}
```

Person 3's **Prioritise Files** Code Node handles both `rejected_missing_tests`
(0% coverage — highest priority) and `valid_files` (partial coverage).

---

## Additional notes on Person 2's workflow

| Observation | Detail |
|---|---|
| `coverage.yml` uploads only `coverage-summary.json` | Has percentages only — no specific line numbers. Person 3's prompts work with file-level gaps. |
| `COVERAGE_THRESHOLD = 85` in Rule based filter | Files 85–100% go to `valid_files`; files 0–85% go to `removed_low_coverage`. 0% files go to `rejected_missing_tests`. |
| Scheduled trigger path incomplete | `Set Repository Config 1` → `Prepare Handoff Payload 1` ends with no outgoing connection. Only the manual trigger path is functional. |
| Credential ID `TEnpyH2wW306jWY2` | Person 3 reuses the same `Bearer Auth account` credential ID for GitHub API calls for consistency. |
