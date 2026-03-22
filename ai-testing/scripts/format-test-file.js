// Ang Yi Jie, Ivan, A0259256U
// Person 3 — Format Test File (MS1)
//
// This script is the standalone version of the n8n Code Node "Format Test File".
// It can be run directly (node ai-testing/scripts/format-test-file.js) for
// local testing, or its core logic is pasted verbatim into the n8n Code Node.
//
// Responsibilities:
//   1. Extract the ```javascript ... ``` code block from Claude's raw response
//   2. Enforce the author comment header
//   3. Normalise line endings (CRLF → LF)
//   4. Derive the output filename from the source file path
//   5. Return a structured object: { formattedTestFile, filename, linesOfCode }

// ---------------------------------------------------------------------------
// Core formatting function (used in n8n Code Node AND standalone)
// ---------------------------------------------------------------------------

/**
 * formatTestFile
 *
 * @param {string|object} rawResponse - Raw text OR OpenAI API response object
 *   OpenAI format: { choices: [{ message: { content: string } }] }
 *   Plain string: the raw text directly
 * @param {object} params - Workflow parameters
 * @param {string} params.file_path        - Source file path (e.g. controllers/categoryController.js)
 * @param {string} params.test_output_path - Override output path (optional)
 * @param {string} params.author_comment   - Author comment string
 * @returns {{ formattedTestFile: string, filename: string, linesOfCode: number, generatedAt: string }}
 */
export function formatTestFile(rawResponse, params = {}) {
  // Support both plain string and OpenAI response object
  let rawClaudeResponse;
  if (rawResponse && typeof rawResponse === 'object' && rawResponse.choices) {
    rawClaudeResponse = rawResponse.choices[0]?.message?.content || '';
  } else {
    rawClaudeResponse = rawResponse;
  }
  const {
    file_path = 'unknown.js',
    test_output_path = null,
    author_comment = '// Ang Yi Jie, Ivan, A0259256U',
  } = params;

  if (!rawClaudeResponse || typeof rawClaudeResponse !== 'string') {
    throw new Error('formatTestFile: rawClaudeResponse must be a non-empty string');
  }

  // Step 1: Extract code block
  // Accepts ```javascript, ```js, or plain ``` blocks
  const codeBlockRegex = /```(?:javascript|js)?\n([\s\S]*?)```/;
  const match = rawClaudeResponse.match(codeBlockRegex);
  let testCode = match ? match[1].trim() : rawClaudeResponse.trim();

  if (!testCode) {
    throw new Error('formatTestFile: could not extract code from Claude response');
  }

  // Step 2: Enforce author comment at top
  const authorLine = author_comment.trim();
  const generatedMarker = '— AI-generated (MS1)';

  if (!testCode.startsWith('//')) {
    // No comment at all — prepend
    testCode = `${authorLine} ${generatedMarker}\n${testCode}`;
  } else {
    const firstLineEnd = testCode.indexOf('\n');
    const firstLine = firstLineEnd === -1 ? testCode : testCode.slice(0, firstLineEnd);

    if (!firstLine.includes('A0259256U')) {
      // Wrong author or no student ID — replace first line
      testCode =
        `${authorLine} ${generatedMarker}\n` +
        (firstLineEnd === -1 ? '' : testCode.slice(firstLineEnd + 1));
    } else if (!firstLine.includes('AI-generated') && !firstLine.includes('Assisted with AI')) {
      // Has student ID but missing generation marker — append marker
      testCode =
        `${firstLine} ${generatedMarker}\n` +
        (firstLineEnd === -1 ? '' : testCode.slice(firstLineEnd + 1));
    }
    // else: first line already correct — leave it
  }

  // Step 3: Normalise line endings
  testCode = testCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 4: Remove trailing whitespace on each line
  testCode = testCode
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Ensure file ends with a single newline
  testCode = testCode.replace(/\n+$/, '') + '\n';

  // Step 5: Derive output filename
  const baseName = file_path.split('/').pop().replace(/\.js$/, '');
  const filename =
    test_output_path || `tests/integration/${baseName}.ai-generated.test.js`;

  return {
    formattedTestFile: testCode,
    filename,
    sourceFile: file_path,
    linesOfCode: testCode.split('\n').length,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// n8n Code Node body (paste this verbatim into the n8n Code Node)
// ---------------------------------------------------------------------------
//
// ===BEGIN n8n Code Node===
/*
const response = $input.first().json;
const buildData = $('Build Prompt').item.json;

// Extract text from OpenAI response (choices[0].message.content)
let rawText = '';
if (response.choices && Array.isArray(response.choices)) {
  rawText = response.choices[0]?.message?.content || '';
} else if (typeof response === 'string') {
  rawText = response;
}
const params = { file_path: buildData.file, test_output_path: buildData.testOutputPath, author_comment: '// Ang Yi Jie, Ivan, A0259256U' };

if (!rawText) throw new Error('Claude returned empty content.');

// Extract code block
const codeBlockRegex = /```(?:javascript|js)?\n([\s\S]*?)```/;
const match = rawText.match(codeBlockRegex);
let testCode = match ? match[1].trim() : rawText.trim();

// Enforce author comment
const authorLine = (params.author_comment || '// Ang Yi Jie, Ivan, A0259256U').trim();
const generatedMarker = '— AI-generated (MS1)';

if (!testCode.startsWith('//')) {
  testCode = `${authorLine} ${generatedMarker}\n${testCode}`;
} else {
  const firstLineEnd = testCode.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? testCode : testCode.slice(0, firstLineEnd);
  if (!firstLine.includes('A0259256U')) {
    testCode = `${authorLine} ${generatedMarker}\n` +
      (firstLineEnd === -1 ? '' : testCode.slice(firstLineEnd + 1));
  } else if (!firstLine.includes('AI-generated') && !firstLine.includes('Assisted with AI')) {
    testCode = `${firstLine} ${generatedMarker}\n` +
      (firstLineEnd === -1 ? '' : testCode.slice(firstLineEnd + 1));
  }
}

// Normalise
testCode = testCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
testCode = testCode.split('\n').map(l => l.trimEnd()).join('\n');
testCode = testCode.replace(/\n+$/, '') + '\n';

// Derive filename
const baseName = (params.file_path || 'unknown.js').split('/').pop().replace(/\.js$/, '');
const filename = params.test_output_path || `tests/integration/${baseName}.ai-generated.test.js`;

return [{
  json: {
    formattedTestFile: testCode,
    filename,
    sourceFile: params.file_path,
    linesOfCode: testCode.split('\n').length,
    generatedAt: new Date().toISOString()
  }
}];
*/
// ===END n8n Code Node===

// ---------------------------------------------------------------------------
// Standalone CLI runner (for local testing)
// ---------------------------------------------------------------------------

// Run: echo "```javascript\ntest('x', () => { expect(1).toBe(1); });\n```" | node ai-testing/scripts/format-test-file.js

if (process.argv[1] && process.argv[1].endsWith('format-test-file.js')) {
  let input = '';
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const result = formatTestFile(input, {
        file_path: process.argv[2] || 'controllers/categoryController.js',
        author_comment: '// Ang Yi Jie, Ivan, A0259256U',
      });
      console.log('--- Formatted Output ---');
      console.log(result.formattedTestFile);
      console.log(`--- Metadata ---`);
      console.log(`File:         ${result.filename}`);
      console.log(`Lines:        ${result.linesOfCode}`);
      console.log(`Generated at: ${result.generatedAt}`);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });
}
