# AI-Assisted Testing Report
## CS4218 — Virtual Vault E-Commerce Project

**Team:** cs4218-2520-team5
**Tool:** n8n (workflow automation) + OpenAI GPT-4o
**Workflow URL:** https://lynnette-o.app.n8n.cloud/workflow/ZyYvFPYweEXwDGGc
**Workflow file:** `ai-testing/workflows/person2-coverage-analysis.json`

---

## 1. Overview

The team adopted an AI-assisted testing workflow to automate the identification of coverage gaps and the generation of Jest integration tests for the Virtual Vault MERN stack application. Rather than relying on single-prompt AI usage, the team chose **n8n** — a visual workflow automation platform — to build a structured, multi-step pipeline that incorporates iterative AI decision-making, execution-feedback loops, and controlled automation boundaries.

The workflow is divided into three sequential responsibilities, each owned by one team member:

| Person | Role | Responsibility |
|--------|------|----------------|
| Person 1 | Trigger + GitHub + CI/CD | Detect when to run; dispatch CI; collect results |
| Person 2 (Alyssa) | Repo Loader + Coverage Analysis | Parse coverage report; identify files needing tests |
| Person 3 (Ivan) | AI Test Generation | Generate Jest tests via GPT-4o; format output |

---

## 2. Tool Selection: n8n

**n8n** was selected as the workflow automation platform for the following reasons:

- **Visual pipeline design** — the multi-step testing workflow can be built and debugged visually without writing orchestration code
- **Native integrations** — built-in nodes for GitHub, HTTP requests, file compression, and code execution eliminate boilerplate
- **Iterative AI decision-making** — unlike single-prompt usage, n8n allows each AI call to be conditioned on the output of the previous step (e.g. coverage data informs the prompt)
- **Execution-feedback loops** — CI results can be fed back into n8n via webhooks or API polling to trigger downstream analysis
- **Structured data validation** — Code Nodes validate and transform data between each step, preventing malformed inputs from reaching the AI
- **Controlled automation boundaries** — the workflow does not auto-merge or modify production code; all generated files require human review before merge

**Pricing:** USD 20/month cloud plan. Free trial ran from 22 Feb – 8 Mar; paid plan covers through approximately 8 Jun (~SGD 76 total).

---

## 3. Overall Architecture

The full pipeline follows a linear, event-driven design:

```
[Manual Trigger]
       │
       ▼
[Set Repository Config]          ← Person 1
       │
       ▼
[Get Repository (GitHub OAuth)]  ← Person 1
       │
       ▼
[Prepare Payload for CI Dispatch]  ← Person 1
       │
       ▼
[Trigger Coverage Workflow]      ← Person 1  (dispatches coverage.yml via GitHub Actions API)
       │
       ▼
[Wait 120 s]                     ← Person 1
       │
       ▼
[Get Workflow Runs]              ← Person 1
[Select Latest Run]              ← Person 1
[Get Artifacts]                  ← Person 1
[Extract Artifact URL]           ← Person 1
[Download Artifact (zip)]        ← Person 1
       │
       ▼
[Unzip Artifact]                 ← Person 2
[Read Coverage JSON]             ← Person 2
[Parse Coverage (Code Node)]     ← Person 2
[Rule-Based Filter (Code Node)]  ← Person 2
       │
       ▼
[Prepare Files (Code Node)]      ← Person 3 (MS1)
[Loop Through Files]             ← Person 3 (MS1)
[Fetch Source File (GitHub)]     ← Person 3 (MS1)
[Build Prompt (Code Node)]       ← Person 3 (MS1)
[Generate Unit Tests — GPT-4o]   ← Person 3 (MS1)  ← AI Node
[Format Test File (Code Node)]   ← Person 3 (MS1)  ← Code Node
```

The pipeline is currently triggered **manually** for development and demonstration. A scheduled (hourly) trigger path and a GitHub PR webhook path are planned for later phases.

---

## 4. Person 1 — Trigger + GitHub + CI/CD

**Responsibility:** Implement event-driven automation that starts the pipeline and collects CI coverage results.

### 4.1 Nodes Implemented

| n8n Node | Type | Purpose |
|----------|------|---------|
| Manual Test Trigger | Manual Trigger | Start the workflow on demand for testing |
| Scheduled Trigger | Schedule Trigger | Hourly automated run (prepared; not yet active) |
| Set Repository Config | Set | Hardcodes owner, repo, branch, workflow filename |
| Get a repository | GitHub (OAuth2) | Fetches repo metadata to confirm connectivity |
| Prepare Payload for File Fetch | Set | Extracts and normalises fields (owner, name, branch) for downstream nodes |
| Trigger Coverage Workflow | HTTP Request | `POST /repos/{owner}/{repo}/actions/workflows/coverage.yml/dispatches` — triggers the Jest coverage CI run |
| Wait | Wait | Pauses 120 seconds for the CI run to complete |
| Get Workflow Runs | HTTP Request | `GET /repos/{owner}/{repo}/actions/runs` — lists all workflow runs |
| Select Latest Run | Code Node | Filters to completed runs; selects the most recent by `created_at` |
| Get Artifacts | HTTP Request | `GET /repos/.../runs/{run_id}/artifacts` — lists artifacts from the latest run |
| Extract Artifact | Code Node | Finds the `coverage-summary` artifact and extracts its download URL |
| Download Artifact | HTTP Request | Downloads the artifact zip file (binary response) |

### 4.2 Design Decisions

**Manual trigger for current phase:** Because the full pipeline (CI dispatch → wait → collect) takes approximately 3–5 minutes, a manual trigger is used during development so the team can test individual nodes in isolation. The Scheduled Trigger node is connected and configured but not yet activated.

**GitHub OAuth2 authentication:** The GitHub node uses OAuth2 (not a PAT) so that the workflow inherits the correct scopes for dispatching Actions workflows and reading artifacts.

**120-second wait:** The `coverage.yml` CI job runs both frontend and backend Jest suites. 120 seconds was chosen as a conservative estimate; if the run is still in progress after the wait, `Select Latest Run` will retry once the run reaches `completed` status.

### 4.3 Milestone 1 Deliverables

- Manual trigger node and Cron trigger node configured
- GitHub Node connected to the team repository (`cs4218-2520-ecom-project-cs4218-2520-team5`)
- Repository metadata (name, owner, default branch, last push timestamp) loaded and passed downstream

### 4.4 Milestone 2 Deliverables

- GitHub Actions workflow dispatch (`Trigger Coverage Workflow` node)
- Artifact polling pipeline: Get Runs → Select Latest → Get Artifacts → Extract → Download
- Branch rules enforced via `Set Repository Config` (only targets the `main` branch)

---

## 5. Person 2 (Alyssa) — Repo Loader + Coverage Analysis

**Responsibility:** Unpack the CI coverage artifact and identify which files have missing or insufficient test coverage.

### 5.1 Nodes Implemented

| n8n Node | Type | Purpose |
|----------|------|---------|
| Unzip Artifact | Compression | Decompresses the downloaded artifact zip |
| Read Coverage JSON | Extract From File | Parses `file_0` (coverage-summary.json) from binary to JSON |
| Code in JavaScript | Code Node | Iterates every file in the coverage report; classifies into `missing_tests` (0% avg) and `low_coverage` (>0% but <100%) |
| Rule based filter | Code Node | Applies 85% threshold; outputs `valid_files`, `removed_low_coverage`, and `rejected_missing_tests` |

### 5.2 Coverage Parsing Logic

The **Code in JavaScript** node reads Jest's `coverage-summary.json` format. For each file it computes a composite average:

```
avgCoverage = (lines% + functions% + statements% + branches%) / 4
```

Files are then classified:
- `avgCoverage === 0` → `missing_tests` (no tests exist at all)
- `0 < avgCoverage < 100` → `low_coverage`
- `avgCoverage === 100` → excluded (fully covered)

The **Rule based filter** node applies a threshold of **85%**:
- Files with `avgCoverage ≥ 85%` → `valid_files` (already passing; de-duplicated)
- Files with `avgCoverage < 85%` → `removed_low_coverage` (need more tests)
- Files with `avgCoverage = 0%` → `rejected_missing_tests` (need tests from scratch)

### 5.3 Output Format

The Rule based filter node produces a single JSON item:

```json
{
  "valid_files": [
    { "file": "controllers/categoryController.js", "avgCoverage": 92.5 }
  ],
  "removed_low_coverage": [
    { "file": "controllers/authController.js", "avgCoverage": 60.0 }
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

This structured output is consumed directly by Person 3's pipeline.

### 5.4 Milestone 1 Deliverables

- Pull repo files using GitHub node (artifact download pipeline from Person 1)
- Run Jest coverage via CI dispatch; parse `coverage-summary.json`
- Generate structured coverage gap output: `missing_tests` and `low_coverage` arrays

### 5.5 Milestone 2 Deliverables

- Rank files by coverage gap severity (worst first within each category)
- Apply 85% threshold rule to separate actionable files from already-passing files
- Produce structured input ready for the AI generator (Person 3)

### 5.6 Bug Identified and Fixed

During development, the **Code in JavaScript** node contained a reference to `result.all_files.push(...)` before `all_files` was initialised in the result object. This caused a `TypeError` at runtime and would have prevented any downstream nodes from executing. The fix — adding `all_files: []` to the initial `result` object — was applied and documented in `ai-testing/person2-bug-notes.md`.

---

## 6. Person 3 (Ivan) — AI Test Generation (MS1)

**Responsibility:** For each file identified by Person 2 as needing tests, fetch its source code, generate Jest integration tests using GPT-4o, and format the output into a valid test file.

### 6.1 Nodes Implemented

| n8n Node | Type | MS | Purpose |
|----------|------|----|---------|
| Prepare Files (P3) | Code Node | MS1 | Merge Person 2's output into a prioritised, capped list of files |
| Loop Through Files (P3) | SplitInBatches | MS1 | Iterate one file at a time to avoid token budget overruns |
| Fetch Source File (P3) | HTTP Request | MS1 | `GET /repos/{owner}/{repo}/contents/{file}` — fetches the base64-encoded source |
| Build Prompt (P3) | Code Node | MS1 | Decodes source; assembles system + user prompt for GPT-4o |
| Generate Unit Tests — GPT-4o | HTTP Request | MS1 | **AI Node** — `POST https://api.openai.com/v1/chat/completions` with `gpt-4o` |
| Format Test File (P3) | Code Node | MS1 | **Code Node** — extracts code block, enforces author comment, normalises output |

### 6.2 Prepare Files Logic

The **Prepare Files (P3)** Code Node merges the two actionable outputs from Person 2:

1. `rejected_missing_tests` (0% coverage) — assigned priority `'missing'`; processed first as they represent the highest coverage gain
2. `removed_low_coverage` (below 85%) — assigned priority `'low_coverage'`; sorted ascending by `avgCoverage` so the worst files are addressed first

A cap of **3 files per run** (`MAX_FILES = 3`) is applied to control OpenAI API cost per execution. Each item in the output includes `owner`, `repo`, `branch`, and a derived `testOutputPath` so that all metadata required for GitHub operations is self-contained.

### 6.3 Loop and Fetch

The **Loop Through Files (P3)** node (SplitInBatches, batch size 1) processes one file per iteration. After the last file is processed, the loop's "done" output terminates the run.

**Fetch Source File (P3)** calls the GitHub Contents API:
```
GET https://api.github.com/repos/{owner}/{repo}/contents/{file}?ref={branch}
```
The response contains the file content as a base64-encoded string, which is decoded in the next node.

### 6.4 Prompt Design

The **Build Prompt (P3)** Code Node constructs a two-part prompt:

**System message** establishes the engineering context:
- Project: Virtual Vault (MERN stack)
- Test framework: Jest 29 with Babel (ESM, `--experimental-vm-modules`)
- Integration test stack: MongoMemoryServer, Supertest, real routes and models
- Critical constraint: **do not mock the controller or model layer under test** — only external dependencies (MongoDB → MongoMemoryServer, Braintree → `jest.fn()`) are replaced
- Import style: ES modules (`import/export`) only, no `require()`
- Author comment requirement: `// Ang Yi Jie, Ivan, A0259256U -- AI-generated (MS1)`
- Output format: single fenced `javascript` code block

**User message** provides file-specific context:
- File path and current coverage percentage
- Full source code (decoded from GitHub API)
- Minimum test requirements per controller function: happy path (200/success), missing required field (400), not-found case (404)
- Boilerplate setup pattern (MongoMemoryServer + Supertest) to guide the model

By separating system and user messages, the model is given project-wide rules once (system) and file-specific content per iteration (user), which keeps token usage predictable across files.

### 6.5 AI Node: Generate Unit Tests — GPT-4o

**Node type:** HTTP Request
**Endpoint:** `POST https://api.openai.com/v1/chat/completions`
**Model:** `gpt-4o`
**Parameters:** `max_tokens: 4096`, `temperature: 0.2`

Temperature 0.2 was chosen to produce deterministic, consistent test code rather than creative variation. The response is parsed from `choices[0].message.content`.

### 6.6 Format Test File Logic

The **Format Test File (P3)** Code Node performs four operations on the raw GPT-4o response:

1. **Extract code block** — regex ```` /```(?:javascript|js)?\n([\s\S]*?)```/ ```` extracts the fenced code block. If GPT-4o returns raw code without fences, the full text is used as a fallback.

2. **Enforce author comment** — the first line is inspected:
   - If the student ID `A0259256U` is absent, the author line is prepended
   - If the ID is present but the generation marker `-- AI-generated (MS1)` is missing, it is appended to the first line
   - This ensures authorship is always traceable regardless of what GPT-4o generates

3. **Normalise whitespace** — CRLF is converted to LF; trailing whitespace is stripped from every line; the file ends with exactly one newline

4. **Derive output path** — the filename is derived from the source file path: `controllers/categoryController.js` → `tests/integration/categoryController.ai-generated.test.js`

The node outputs a structured item:

```json
{
  "formattedTestFile": "// Ang Yi Jie, Ivan, A0259256U -- AI-generated (MS1)\n...",
  "filename": "tests/integration/categoryController.ai-generated.test.js",
  "sourceFile": "controllers/categoryController.js",
  "linesOfCode": 142,
  "generatedAt": "2026-03-22T10:00:00.000Z"
}
```

After formatting, execution returns to the loop node to process the next file.

### 6.7 Supporting Assets

| Asset | Location | Purpose |
|-------|----------|---------|
| Prompt template (unit tests) | `ai-testing/prompts/unit-test-generation.md` | Documents the full system + user prompt template and design rationale |
| Format Test File script | `ai-testing/scripts/format-test-file.js` | Standalone version of the Code Node; can be run locally via `node ai-testing/scripts/format-test-file.js` |
| Coverage parser script | `ai-testing/scripts/coverage-parser.js` | Parses `coverage-summary.json` locally; used for offline testing of Person 2's logic |
| Validate Test Schema script | `ai-testing/scripts/validate-test-schema.js` | Validates Jest test files against schema rules (prepared for MS2) |

### 6.8 Credentials Required

To run the Person 3 nodes, one additional n8n credential must be configured:

| Credential Name | n8n Type | Value |
|----------------|----------|-------|
| `OpenAI Bearer Token` | HTTP Bearer Auth | OpenAI API key (`sk-...`) |

The existing `Bearer Auth account` credential (used by Person 1 for GitHub API calls) is reused for the GitHub Contents API call in `Fetch Source File (P3)`.

---

## 7. Governance and Guardrails

The following constraints are enforced by the workflow design:

- **No auto-merge** — the workflow generates test files but does not push them to the repository or open pull requests automatically. Generated output is inspectable in the n8n execution log before any manual action is taken.
- **No production code modification** — the workflow only reads source files; it never writes to the repository.
- **Capped file count** — `MAX_FILES = 3` per run prevents runaway API spending.
- **Prompt output validation** — the Format Test File node validates that the AI response contains a parseable code block; if GPT-4o returns an empty response, the workflow throws a descriptive error rather than committing an empty file.
- **Author comment enforcement** — every generated file is guaranteed to carry `// Ang Yi Jie, Ivan, A0259256U -- AI-generated (MS1)` as the first line, ensuring authorship is traceable.

---

## 8. Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Person 1: Manual trigger | ✅ Complete | Triggers workflow on demand |
| Person 1: GitHub repo fetch | ✅ Complete | OAuth2, loads repo metadata |
| Person 1: CI dispatch + wait | ✅ Complete | Dispatches `coverage.yml`, waits 120 s |
| Person 1: Artifact collection | ✅ Complete | Gets runs → artifacts → download |
| Person 2: Artifact unpack | ✅ Complete | Unzip + JSON extraction |
| Person 2: Coverage parsing | ✅ Complete | Bug fixed (`all_files` init) |
| Person 2: Rule-based filter | ✅ Complete | 85% threshold applied |
| Person 3: Prepare Files | ✅ Complete | Prioritised, capped list |
| Person 3: Loop + Fetch Source | ✅ Complete | GitHub Contents API |
| Person 3: Build Prompt | ✅ Complete | System + user prompt assembled |
| Person 3: Generate (GPT-4o) | ✅ Complete | AI Node calling OpenAI |
| Person 3: Format Test File | ✅ Complete | Code Node, author enforcement |
| Scheduled trigger | 🔄 Prepared | Node present; not yet activated |
| GitHub PR webhook trigger | 📋 Planned | Phase 2 |
| Push generated tests to GitHub | 📋 Planned | Phase 2 |
| CI re-run on generated tests | 📋 Planned | Phase 2 |
| Edge case generation (MS2) | 📋 Planned | Person 3 MS2 |
| Schema validation (MS2) | 📋 Planned | Person 3 MS2 |

---

## 9. Expected Benefits

- **20–40% increase in meaningful test coverage** by systematically targeting the lowest-coverage files first
- **Reduced manual test-writing effort** — developers review and approve generated tests rather than writing from scratch
- **Faster root cause identification** — structured coverage data and AI-generated tests make gaps explicit
- **Structured AI reasoning traceability** — every generated file carries an author comment and `generatedAt` timestamp; all prompts and responses are logged in the n8n execution history
- **Improved regression detection** — generated integration tests use real routes, real models, and an in-memory MongoDB instance, catching regressions that unit tests with mocks would miss
