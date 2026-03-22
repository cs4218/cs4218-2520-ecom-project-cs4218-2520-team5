# Unit Test Generation Prompt — MS1
<!-- Person 3 — Ang Yi Jie, Ivan, A0259256U -->

This prompt template is used by the **AI Generation Node** (`Generate Unit Tests (OpenAI)`)
in the n8n workflow (`test-generation.json`).

It is assembled in the **Build Prompt** Code Node. Placeholders map to:

| Placeholder | Source in n8n |
|---|---|
| `{{FILE_PATH}}` | `$('Loop Through Files').item.json.file` — from Person 2's output |
| `{{AVG_COVERAGE}}` | `$('Loop Through Files').item.json.avgCoverage` |
| `{{PRIORITY}}` | `missing` (0%) or `low_coverage` (>0% but <100%) |
| `{{SOURCE_CODE}}` | base64-decoded from GitHub Contents API |

**API:** Anthropic `claude-sonnet-4-6` via `POST https://api.anthropic.com/v1/messages`.
Credential: HTTP Header Auth, name=`x-api-key`, value=your Anthropic API key.
**Response path:** `content[0].text`

---

## Prompt Template (OpenAI Chat Format)

**System message:**
```
You are an expert software engineer writing Jest integration tests for a MERN stack
e-commerce application called Virtual Vault.

Project context:
- Backend: Node.js + Express + Mongoose (MongoDB)
- Test framework: Jest 29 with Babel (ESM via --experimental-vm-modules)
- Integration tests use: MongoMemoryServer, Supertest, real Express routes,
  real Mongoose models
- Do NOT mock the controller or model layer under test.
  Only replace true external dependencies:
    • MongoDB → MongoMemoryServer
    • Braintree gateway → jest.fn()
    • nodemailer → jest.fn()
- Author comment required at top of file: // Ang Yi Jie, Ivan, A0259256U
- Import style: ES module (import/export). No require().

File to test: {{FILE_PATH}}

SOURCE CODE:
```javascript
{{SOURCE_CODE}}
```

EXISTING TESTS (do NOT duplicate these):
```javascript
{{EXISTING_TESTS}}
```

COVERAGE ANALYSIS:
{{COVERAGE_SUMMARY}}

INSTRUCTIONS:
1. Write complete Jest tests covering every exported function/controller.
2. Use describe() blocks to group tests by function name.
3. Within each describe, write at minimum:
   - A "happy path" test (valid inputs, expected 200/success response)
   - A "missing field" test (omit a required field, expect 400/error)
   - A "not found" test where applicable (non-existent ID, expect 404)
4. Each test() / it() must have at least one expect() assertion.
5. For database-touching code use MongoMemoryServer:
   - beforeAll: start MongoMemoryServer, mongoose.connect(uri)
   - afterAll:  mongoose.disconnect(), mongoServer.stop()
   - afterEach: delete all documents from affected collections
6. Use Supertest to call routes:
   - import request from 'supertest'
   - const app = express(); app.use(express.json()); app.use('/api', routes);
   - const res = await request(app).post('/api/...').send({...})
7. JWT tokens for auth:
   - import jwt from 'jsonwebtoken'
   - process.env.JWT_SECRET = 'testsecret'  (set in beforeAll)
   - const token = jwt.sign({ _id: user._id, role: 1 }, process.env.JWT_SECRET)
8. Start the file with exactly: // Ang Yi Jie, Ivan, A0259256U — AI-generated (MS1)
9. Return ONLY the test file code in a single ```javascript ... ``` code block.

Generate complete, runnable Jest tests now:
```

---

## Design Notes (MS1)

### Why this prompt structure?

**Explicit project context** — The model is told the exact stack, test framework,
and import style. This avoids the model generating CommonJS (`require`) or
incorrect import paths.

**"Do NOT mock" constraint** — The integration requirement means the prompt must
explicitly forbid mocking of the layer under test. Without this, the model
defaults to full unit-test style with all layers mocked.

**Structured instruction list** — Numbered steps force the model to follow the
exact test pattern used in `categoryApiIntegration.test.js`. The model is less
likely to drift if steps are explicit.

**Coverage-aware** — By injecting the coverage gaps, the model prioritises
generating tests for uncovered lines rather than re-covering already-tested paths.

**Single code block output** — The instruction to return only a `javascript` code
block makes the Format Test File Code Node's extraction logic reliable
(`/```javascript\n([\s\S]*?)```/`).

### Expected output structure

```javascript
// Ang Yi Jie, Ivan, A0259256U — AI-generated (MS1)

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import someRoutes from '../../routes/someRoutes.js';
import someModel from '../../models/someModel.js';

let mongoServer;
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(express.json());
  app.use('/api/v1/...', someRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await someModel.deleteMany({});
});

describe('functionName', () => {
  it('should do X on valid input', async () => {
    const res = await request(app).post('/api/v1/...').send({ ... });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 400 when required field is missing', async () => {
    const res = await request(app).post('/api/v1/...').send({});
    expect(res.status).toBe(400);
  });
});
```
