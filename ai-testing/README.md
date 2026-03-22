# AI Test Generation — Person 3
<!-- Ang Yi Jie, Ivan, A0259256U -->

Automated Jest test generation using an n8n workflow and Claude (Anthropic API).

## What this does

The n8n workflow in `workflows/test-generation.json` automates the full test
generation cycle:

```
Manual Trigger
  → Set Parameters (repo, file path, branch)
  → Fetch Source File (GitHub API)
  → Parse Coverage (identify uncovered lines)
  → Fetch Existing Tests (avoid duplication)
  → Build Prompt + Generate Unit Tests (Claude — MS1)  ← Person 3: AI Node
  → Format Test File (Code Node — MS1)                 ← Person 3: Code Node
  → Build Edge Case Prompt + Generate Edge Cases (Claude — MS2)
  → Merge Tests
  → Validate Schema (Code Node — MS2)                  ← Person 3: Code Node
  → Is Schema Valid?
      ✓ → Push Test File to GitHub → Trigger CI → Done
      ✗ → Error Output (errors + raw code for manual review)
```

## Directory layout

```
ai-testing/
├── workflows/
│   └── test-generation.json      # n8n workflow — import via n8n UI
├── prompts/
│   ├── unit-test-generation.md   # MS1: unit test prompt design + template
│   └── edge-case-generation.md   # MS2: edge case prompt + schema rule docs
├── scripts/
│   ├── format-test-file.js       # MS1 Code Node (also runnable standalone)
│   ├── validate-test-schema.js   # MS2 Code Node (also runnable standalone)
│   └── coverage-parser.js        # Parse jest --coverage JSON (CLI + n8n)
└── README.md
```

## Setup

### 1. n8n instance

Use the CS4218 team's shared n8n instance (cloud or self-hosted).
Monthly plan: ~20 USD/month (free trial available).

### 2. Import the workflow

1. Open n8n → **Workflows** → **Import from file**
2. Select `ai-testing/workflows/test-generation.json`
3. The workflow will appear as **"AI Jest Test Generator"**

### 3. Configure credentials

Two credential sets are required (add via n8n **Settings → Credentials**):

| Credential name    | n8n Type           | Header name   | Value |
|--------------------|--------------------|---------------|-------|
| `Bearer Auth account` | HTTP Bearer Auth | `Authorization` | `ghp_YOUR_TOKEN` (GitHub PAT with `repo` + `workflow` scopes) |
| `Anthropic API Key`   | HTTP Header Auth | `x-api-key`   | `sk-ant-YOUR_KEY` |

The GitHub token needs `repo` and `workflow` scopes.

### 4. Configure the workflow parameters

Open the **Set Parameters** node and update:

| Parameter | Default | Description |
|---|---|---|
| `owner` | `cs4218` | GitHub org/user |
| `repo` | `cs4218-2520-ecom-project-cs4218-2520-team5` | Repository name |
| `branch` | `ivan1/ai-testing` | Branch to read from and push to |
| `file_path` | `controllers/categoryController.js` | Source file to generate tests for |
| `test_output_path` | *(auto-derived)* | Override output path |
| `model` | `claude-sonnet-4-6` | Claude model ID |
| `author_comment` | `// Ang Yi Jie, Ivan, A0259256U` | Author header for generated files |

### 5. Run

Click **Execute Workflow** (or set up a Cron/GitHub webhook trigger).

The workflow will:
1. Fetch the source file from GitHub
2. Generate Jest tests via Claude
3. Format and validate the output
4. Push a new test file to `ivan1/ai-testing` branch
5. Trigger the GitHub Actions CI to run the tests

---

## Person 3 deliverables

### MS1 — AI generation node + Code Node (format test file)

**Nodes owned:**
- `Generate Unit Tests (Claude)` — HTTP Request node calling Anthropic API
- `Format Test File` — Code Node: extracts `javascript` code block from Claude
  response, enforces author comment, normalises line endings, derives filename

**Prompt design** (`prompts/unit-test-generation.md`):
- Instructs Claude to use MongoMemoryServer, Supertest, real routes/models
- Explicit "do NOT mock the layer under test" constraint
- Forces ES module syntax
- Requires author comment `// Ang Yi Jie, Ivan, A0259256U — AI-generated (MS1)`
- Requests output as a single fenced `javascript` code block (reliable extraction)

### MS2 — Edge cases + schema validation

**Nodes owned:**
- `Generate Edge Cases (Claude)` — second AI call targeting boundaries/invalid inputs
- `Validate Test Schema` — Code Node enforcing three schema rules

**Schema rules** (`scripts/validate-test-schema.js`):

| Rule | Check | Enforcement |
|---|---|---|
| 1 — Jest format required | `describe()` + `test()/it()` + `expect()` present | Hard error → pipeline stops |
| 2 — No empty tests | Every `test()/it()` body has ≥1 `expect()` | Hard error → pipeline stops |
| 3 — Valid imports only | `import` only from known packages or relative paths; no `require()` | Hard error + per-import warnings |

If schema validation fails, the workflow branches to **Error Output** instead of
pushing to GitHub, preventing broken test files from reaching the repo.

---

## Local usage (scripts without n8n)

### Run coverage parser

```bash
# Generate coverage first
npm run test:backend -- --coverage --coverageReporters=json-summary

# Parse results
node ai-testing/scripts/coverage-parser.js coverage/coverage-summary.json --threshold=80
```

### Validate an existing test file

```bash
node ai-testing/scripts/validate-test-schema.js tests/integration/categoryApiIntegration.test.js
```

Exit code `0` = valid, `1` = schema errors found.

### Format a Claude response

```bash
# Pipe Claude's raw output into the formatter
echo '```javascript
// Ang Yi Jie, Ivan, A0259256U
test("x", () => { expect(1).toBe(1); });
```' | node ai-testing/scripts/format-test-file.js controllers/categoryController.js
```

---

## Evaluation metrics

| Metric | How measured |
|---|---|
| Code coverage improvement | Compare coverage report before/after running generated tests |
| Test pass rate | `npm run test:integration` exit code + Jest summary |
| Schema compliance | `validate-test-schema.js` exit code (0 = all rules pass) |
| Redundancy | Count duplicate `describe`/`it` names across generated and existing tests |

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    n8n Workflow                              │
│                                                             │
│  [Trigger] → [Set Params] → [Fetch Source] → [Parse Cov]   │
│                                    ↓               ↓        │
│                          [Fetch Existing Tests]             │
│                                    ↓                        │
│                          [Build Prompt]                      │
│                                    ↓                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Person 3 — AI Generation Node (MS1)                │    │
│  │  POST https://api.anthropic.com/v1/messages         │    │
│  │  model: claude-sonnet-4-6                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                    ↓                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Person 3 — Code Node: Format Test File (MS1)       │    │
│  │  • Extract ```javascript block                      │    │
│  │  • Enforce author comment                           │    │
│  │  • Normalise line endings                           │    │
│  │  • Derive output filename                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                    ↓                        │
│              [Build Edge Prompt] → [Generate Edge Cases]    │
│                                    ↓                        │
│                             [Merge Tests]                   │
│                                    ↓                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Person 3 — Code Node: Validate Schema (MS2)        │    │
│  │  Rule 1: Jest format (describe/test/expect)         │    │
│  │  Rule 2: No empty tests                             │    │
│  │  Rule 3: Valid imports only, no require()           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                    ↓                        │
│                          [If Schema Valid?]                  │
│                           ↙           ↘                     │
│              [Push to GitHub]    [Error Output]             │
│                    ↓                                        │
│              [Trigger CI]                                   │
│                    ↓                                        │
│              [Success Output]                               │
└─────────────────────────────────────────────────────────────┘
```
