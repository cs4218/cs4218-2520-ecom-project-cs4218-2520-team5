// Ang Yi Jie, Ivan, A0259256U
// Person 3 — Validate Test Schema (MS2)
//
// This script is the standalone version of the n8n Code Node "Validate Test Schema".
// Paste the section between ===BEGIN=== and ===END=== into the n8n Code Node.
//
// MS2 Schema Rules:
//   Rule 1 — Jest test format required
//             File must have describe() + test()/it() + expect()
//   Rule 2 — No empty tests
//             Every test()/it() body must have at least one expect() or assert()
//   Rule 3 — Valid imports only
//             Imports must be relative paths, known npm packages, or node: built-ins
//             require() is forbidden (project uses ESM)

// ---------------------------------------------------------------------------
// Allowed npm packages (mirrors package.json dependencies + devDependencies)
// ---------------------------------------------------------------------------
const ALLOWED_PACKAGES = new Set([
  // Runtime deps
  'mongoose', 'express', 'jsonwebtoken', 'bcrypt', 'dotenv', 'slugify',
  'express-formidable', 'braintree', 'cors', 'morgan', 'colors', 'concurrently',
  'date-fns', 'react-icons',
  // Dev/test deps
  'supertest', 'mongodb-memory-server', 'jest', '@jest/globals',
  'babel-jest', '@babel/core', '@babel/preset-env', '@babel/preset-react',
  'identity-obj-proxy',
  // Node built-ins (node: prefix and bare)
  'path', 'fs', 'crypto', 'util', 'os', 'http', 'https', 'stream', 'events',
  'buffer', 'url', 'querystring', 'assert', 'child_process', 'net', 'tls',
]);

// ---------------------------------------------------------------------------
// Core validation function
// ---------------------------------------------------------------------------

/**
 * validateTestSchema
 *
 * @param {string} testCode - The full test file content
 * @returns {{ isValid: boolean, errors: string[], warnings: string[], testCount: number }}
 */
export function validateTestSchema(testCode) {
  if (!testCode || typeof testCode !== 'string') {
    return {
      isValid: false,
      errors: ['Input is missing or not a string'],
      warnings: [],
      testCount: 0,
    };
  }

  const errors = [];
  const warnings = [];

  // -------------------------------------------------------------------------
  // Rule 1: Jest test format required
  // -------------------------------------------------------------------------

  // 1a. Must have at least one describe() block
  if (!/describe\s*\(/.test(testCode)) {
    errors.push('RULE1: No describe() block found — Jest test format required.');
  }

  // 1b. Must have at least one test() or it() block
  if (!/(?:^|\s)(?:test|it)\s*\(/.test(testCode)) {
    errors.push('RULE1: No test() or it() block found — Jest test format required.');
  }

  // 1c. Must have at least one expect() call
  if (!/expect\s*\(/.test(testCode)) {
    errors.push('RULE1: No expect() call found — tests must have assertions.');
  }

  // -------------------------------------------------------------------------
  // Rule 2: No empty tests
  // -------------------------------------------------------------------------
  // Strategy: Find all test()/it() blocks and check each body for expect/assert.
  // We use a line-based approach to avoid false positives from nested braces.

  const lines = testCode.split('\n');
  let testCount = 0;
  let emptyCount = 0;
  let inTestBody = false;
  let braceDepth = 0;
  let bodyLines = [];
  let testStartLine = 0;
  let testName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inTestBody) {
      // Look for test( or it( at the start of a block
      const testMatch = line.match(/^\s*(?:test|it)\s*\(\s*(['"`])(.*?)\1/);
      if (testMatch) {
        testCount++;
        inTestBody = true;
        braceDepth = 0;
        bodyLines = [];
        testStartLine = i + 1;
        testName = testMatch[2];
      }
    }

    if (inTestBody) {
      // Count braces to find the end of the test body
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') {
          braceDepth--;
          if (braceDepth < 0) braceDepth = 0;
        }
      }
      bodyLines.push(line);

      // End of test block when braces close back to 0 (and we've seen at least one open)
      const fullBody = bodyLines.join('\n');
      const hasOpen = /\{/.test(fullBody);
      if (hasOpen && braceDepth === 0) {
        // Check if body has any assertion
        const hasAssertion = /expect\s*\(|assert\s*\(|assert\.\w+\s*\(/.test(fullBody);
        if (!hasAssertion) {
          emptyCount++;
          warnings.push(
            `RULE2: Test "${testName}" at line ${testStartLine} appears to have no assertions.`
          );
        }
        inTestBody = false;
        bodyLines = [];
      }
    }
  }

  if (emptyCount > 0) {
    errors.push(
      `RULE2: ${emptyCount} test(s) have no assertions — no empty tests allowed.`
    );
  }

  // -------------------------------------------------------------------------
  // Rule 3: Valid imports only
  // -------------------------------------------------------------------------

  // 3a. No require() — project is ESM
  if (/\brequire\s*\(/.test(testCode)) {
    errors.push("RULE3: require() found — project uses ES modules (import/export only).");
  }

  // 3b. Check all import statements
  const importRegex = /^import\s+.*?from\s+['"]([^'"]+)['"]/gm;
  let importMatch;
  while ((importMatch = importRegex.exec(testCode)) !== null) {
    const pkg = importMatch[1];

    // Relative paths are always OK
    if (pkg.startsWith('.') || pkg.startsWith('/')) continue;

    // node: built-ins
    if (pkg.startsWith('node:')) continue;

    // Strip subpath for scoped and unscoped packages
    const rootPkg = pkg.startsWith('@')
      ? pkg.split('/').slice(0, 2).join('/')
      : pkg.split('/')[0];

    if (!ALLOWED_PACKAGES.has(rootPkg)) {
      warnings.push(
        `RULE3: Unknown import '${pkg}' — verify it exists in package.json.`
      );
    }
  }

  // -------------------------------------------------------------------------
  // Additional quality warnings (non-blocking)
  // -------------------------------------------------------------------------

  if (!testCode.includes('A0259256U')) {
    warnings.push('QUALITY: Author comment missing or incomplete (expected // Ang Yi Jie, Ivan, A0259256U).');
  }

  if (!testCode.includes('describe(')) {
    // Already caught by Rule 1, but add a quality note
  } else {
    const describeCount = (testCode.match(/describe\s*\(/g) || []).length;
    if (describeCount === 1) {
      warnings.push('QUALITY: Only one describe() block — consider grouping tests by function name.');
    }
  }

  if (testCount < 3) {
    warnings.push(`QUALITY: Only ${testCount} test(s) found — consider adding more coverage.`);
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    testCount,
  };
}

// ---------------------------------------------------------------------------
// n8n Code Node body — paste between ===BEGIN=== and ===END===
// ---------------------------------------------------------------------------

// ===BEGIN n8n Code Node===
/*
const ALLOWED_PACKAGES = new Set([
  'mongoose','express','jsonwebtoken','bcrypt','dotenv','slugify',
  'express-formidable','braintree','cors','morgan','colors','concurrently',
  'date-fns','react-icons','supertest','mongodb-memory-server','jest',
  '@jest/globals','babel-jest','@babel/core','@babel/preset-env',
  '@babel/preset-react','identity-obj-proxy',
  'path','fs','crypto','util','os','http','https','stream','events',
  'buffer','url','querystring','assert','child_process','net','tls',
]);

const item = $input.first().json;
const testCode = item.formattedTestFile;

if (!testCode || typeof testCode !== 'string') {
  return [{ json: { ...item, isValid: false, errors: ['formattedTestFile missing'], warnings: [], testCount: 0 } }];
}

const errors = [];
const warnings = [];

// Rule 1
if (!/describe\s*\(/.test(testCode))
  errors.push('RULE1: No describe() block found — Jest format required.');
if (!/(?:^|\s)(?:test|it)\s*\(/.test(testCode))
  errors.push('RULE1: No test() or it() block found — Jest format required.');
if (!/expect\s*\(/.test(testCode))
  errors.push('RULE1: No expect() call found — tests must have assertions.');

// Rule 2
const lines = testCode.split('\n');
let inTestBody = false, braceDepth = 0, bodyLines = [], testCount = 0, emptyCount = 0, testStartLine = 0, testName = '';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!inTestBody) {
    const m = line.match(/^\s*(?:test|it)\s*\(\s*(['"`])(.*?)\1/);
    if (m) { testCount++; inTestBody = true; braceDepth = 0; bodyLines = []; testStartLine = i + 1; testName = m[2]; }
  }
  if (inTestBody) {
    for (const ch of line) { if (ch==='{') braceDepth++; if (ch==='}') { braceDepth--; if(braceDepth<0)braceDepth=0; } }
    bodyLines.push(line);
    const full = bodyLines.join('\n');
    if (/\{/.test(full) && braceDepth === 0) {
      if (!/expect\s*\(|assert\s*\(/.test(full)) {
        emptyCount++;
        warnings.push(`RULE2: Test "${testName}" at line ${testStartLine} has no assertions.`);
      }
      inTestBody = false; bodyLines = [];
    }
  }
}
if (emptyCount > 0) errors.push(`RULE2: ${emptyCount} test(s) have no assertions.`);

// Rule 3
if (/\brequire\s*\(/.test(testCode))
  errors.push('RULE3: require() found — use import/export (ESM project).');
const importRe = /^import\s+.*?from\s+['"]([^'"]+)['"]/gm;
let m;
while ((m = importRe.exec(testCode)) !== null) {
  const pkg = m[1];
  if (pkg.startsWith('.') || pkg.startsWith('/') || pkg.startsWith('node:')) continue;
  const root = pkg.startsWith('@') ? pkg.split('/').slice(0,2).join('/') : pkg.split('/')[0];
  if (!ALLOWED_PACKAGES.has(root)) warnings.push(`RULE3: Unknown import '${pkg}'.`);
}

if (!testCode.includes('A0259256U'))
  warnings.push('QUALITY: Author comment missing or incomplete.');
if (testCount < 3)
  warnings.push(`QUALITY: Only ${testCount} test(s) — consider adding more.`);

return [{ json: { ...item, isValid: errors.length === 0, errors, warnings, testCount, schemaCheckedAt: new Date().toISOString() } }];
*/
// ===END n8n Code Node===

// ---------------------------------------------------------------------------
// Standalone CLI runner
// ---------------------------------------------------------------------------

if (process.argv[1] && process.argv[1].endsWith('validate-test-schema.js')) {
  import('fs').then(({ readFileSync }) => {
    const filePath = process.argv[2];
    if (!filePath) {
      console.error('Usage: node validate-test-schema.js <path-to-test-file.js>');
      process.exit(1);
    }
    const code = readFileSync(filePath, 'utf-8');
    const result = validateTestSchema(code);
    console.log(`isValid:    ${result.isValid}`);
    console.log(`testCount:  ${result.testCount}`);
    if (result.errors.length) {
      console.log('\nErrors:');
      result.errors.forEach((e) => console.log(`  ✗ ${e}`));
    }
    if (result.warnings.length) {
      console.log('\nWarnings:');
      result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    }
    process.exit(result.isValid ? 0 : 1);
  });
}
