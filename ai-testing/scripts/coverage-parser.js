// Ang Yi Jie, Ivan, A0259256U
// Person 3 — Coverage Parser
//
// Parses Jest's --coverage JSON output (coverage-summary.json) to identify
// files with insufficient coverage. Used by the "Parse Coverage" Code Node
// in the n8n workflow to direct the AI towards the highest-value targets.
//
// Input formats supported:
//   1. Jest coverage-summary.json  (--coverageReporters=json-summary)
//   2. Jest coverage/coverage-summary.json (default Jest coverage directory)
//
// Usage (CLI):
//   npm run test:backend -- --coverage --coverageReporters=json-summary
//   node ai-testing/scripts/coverage-parser.js [coverage-summary.json] [--threshold=80]

import { readFileSync } from 'fs';
import { resolve, relative } from 'path';

// ---------------------------------------------------------------------------
// Core parser
// ---------------------------------------------------------------------------

/**
 * parseCoverageSummary
 *
 * @param {object} coverageJson - Parsed content of coverage-summary.json
 * @param {object} options
 * @param {number} options.threshold   - Min acceptable line coverage % (default 100)
 * @param {number} options.topN        - Return only the N worst files (default: all)
 * @param {string} options.rootDir     - Project root for relative path display
 * @returns {CoverageReport}
 */
export function parseCoverageSummary(coverageJson, options = {}) {
  const { threshold = 100, topN = Infinity, rootDir = process.cwd() } = options;

  if (!coverageJson || typeof coverageJson !== 'object') {
    throw new Error('parseCoverageSummary: coverageJson must be an object');
  }

  /** @type {CoverageGap[]} */
  const gaps = [];
  /** @type {CoverageFile[]} */
  const fullyTested = [];

  for (const [absPath, stats] of Object.entries(coverageJson)) {
    if (absPath === 'total') continue;
    if (!stats || !stats.lines) continue;

    const relPath = relative(rootDir, absPath);
    const linePct = stats.lines.pct ?? 0;
    const stmtPct = stats.statements?.pct ?? 0;
    const fnPct = stats.functions?.pct ?? 0;
    const branchPct = stats.branches?.pct ?? 0;

    const entry = {
      file: relPath,
      lines: { pct: linePct, covered: stats.lines.covered, total: stats.lines.total, skipped: stats.lines.skipped },
      statements: { pct: stmtPct, covered: stats.statements?.covered, total: stats.statements?.total },
      functions: { pct: fnPct, covered: stats.functions?.covered, total: stats.functions?.total },
      branches: { pct: branchPct, covered: stats.branches?.covered, total: stats.branches?.total },
      uncoveredLines: stats.lines.total - stats.lines.covered,
      priority: computePriority(linePct, fnPct, stats.lines.total),
    };

    if (linePct < threshold) {
      gaps.push(entry);
    } else {
      fullyTested.push(entry);
    }
  }

  // Sort by priority descending (most in need of testing first)
  gaps.sort((a, b) => b.priority - a.priority);

  const topGaps = Number.isFinite(topN) ? gaps.slice(0, topN) : gaps;

  const total = coverageJson.total;

  return {
    coverageAvailable: true,
    threshold,
    summary: {
      totalFiles: gaps.length + fullyTested.length,
      gapFiles: gaps.length,
      fullyTestedFiles: fullyTested.length,
      overallLines: total?.lines?.pct ?? null,
      overallStatements: total?.statements?.pct ?? null,
      overallFunctions: total?.functions?.pct ?? null,
      overallBranches: total?.branches?.pct ?? null,
    },
    gaps: topGaps,
    fullyTested,
    lowestCoverage: topGaps[0] ?? null,
    formattedForPrompt: formatForPrompt(topGaps, threshold),
  };
}

/**
 * Compute a priority score so the workflow targets the highest-value files.
 * Higher score = AI should generate tests for this file first.
 *
 * Score factors:
 *   - Many uncovered lines → high value
 *   - Low line % → high urgency
 *   - 0% function coverage → very high urgency (never run)
 *
 * @param {number} linePct
 * @param {number} fnPct
 * @param {number} totalLines
 * @returns {number}
 */
function computePriority(linePct, fnPct, totalLines) {
  const lineGap = 100 - linePct; // 0–100, higher = worse
  const fnGap = 100 - fnPct;
  const lineCount = Math.min(totalLines, 500); // cap at 500 to avoid bias toward huge files
  return lineGap * 0.5 + fnGap * 0.3 + lineCount * 0.2;
}

/**
 * Format coverage gaps as a human-readable string for injection into the AI prompt.
 *
 * @param {CoverageGap[]} gaps
 * @param {number} threshold
 * @returns {string}
 */
function formatForPrompt(gaps, threshold) {
  if (gaps.length === 0) {
    return `All files meet the ${threshold}% coverage threshold. Focus on edge cases.`;
  }

  const lines = [`Coverage gaps (files below ${threshold}% line coverage):\n`];
  for (const g of gaps.slice(0, 10)) {
    // Top 10 for prompt length
    lines.push(
      `  • ${g.file}: lines ${g.lines.pct}% (${g.uncoveredLines} uncovered), ` +
        `functions ${g.functions.pct}%, branches ${g.branches.pct}%`
    );
  }
  if (gaps.length > 10) {
    lines.push(`  … and ${gaps.length - 10} more files.`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// n8n Code Node body
// ===BEGIN n8n Code Node (Parse Coverage)===
/*
const item = $input.first().json;

// item.content is the base64-encoded file content from GitHub Contents API
let coverageJson;
try {
  const raw = Buffer.from(item.content, 'base64').toString('utf-8');
  coverageJson = JSON.parse(raw);
} catch (e) {
  return [{ json: { coverageAvailable: false, gaps: [], formattedForPrompt: 'No coverage data available — generate tests for all functions.' } }];
}

const gaps = [];
for (const [filePath, stats] of Object.entries(coverageJson)) {
  if (filePath === 'total' || !stats?.lines) continue;
  const linePct = stats.lines.pct ?? 0;
  if (linePct < 100) {
    gaps.push({
      file: filePath,
      lines: linePct,
      uncoveredLines: (stats.lines.total || 0) - (stats.lines.covered || 0),
      functions: stats.functions?.pct ?? 0,
      branches: stats.branches?.pct ?? 0,
    });
  }
}
gaps.sort((a, b) => a.lines - b.lines);

const formattedForPrompt = gaps.length === 0
  ? 'All files are at 100% line coverage. Focus on edge cases and boundary tests.'
  : 'Coverage gaps (files below 100%):\n' + gaps.slice(0, 10).map(g =>
      `  • ${g.file}: lines ${g.lines}% (${g.uncoveredLines} uncovered), functions ${g.functions}%`
    ).join('\n');

return [{ json: { coverageAvailable: true, totalGaps: gaps.length, gaps, lowestCoverage: gaps[0] || null, formattedForPrompt } }];
*/
// ===END n8n Code Node===

// ---------------------------------------------------------------------------
// CLI runner
// ---------------------------------------------------------------------------

if (process.argv[1] && process.argv[1].endsWith('coverage-parser.js')) {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith('--')) || 'coverage/coverage-summary.json';
  const thresholdArg = args.find((a) => a.startsWith('--threshold='));
  const threshold = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : 100;
  const topNArg = args.find((a) => a.startsWith('--top='));
  const topN = topNArg ? parseInt(topNArg.split('=')[1], 10) : Infinity;

  try {
    const raw = readFileSync(resolve(filePath), 'utf-8');
    const json = JSON.parse(raw);
    const report = parseCoverageSummary(json, { threshold, topN });

    console.log(`\nCoverage Report (threshold: ${threshold}%)`);
    console.log('='.repeat(60));
    console.log(`Total files:        ${report.summary.totalFiles}`);
    console.log(`Files below ${threshold}%:   ${report.summary.gapFiles}`);
    console.log(`Fully tested:       ${report.summary.fullyTestedFiles}`);
    console.log(`Overall lines:      ${report.summary.overallLines ?? 'n/a'}%`);
    console.log(`Overall functions:  ${report.summary.overallFunctions ?? 'n/a'}%`);
    console.log(`\nTop gaps (by priority):`);
    for (const g of report.gaps.slice(0, 10)) {
      console.log(
        `  [${String(g.lines.pct).padStart(5)}% lines] ${g.file}` +
          ` (${g.uncoveredLines} uncovered lines, ${g.functions.pct}% fn)`
      );
    }
    console.log(`\nPrompt injection snippet:\n${report.formattedForPrompt}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

/**
 * @typedef {{ file: string, lines: object, statements: object, functions: object, branches: object, uncoveredLines: number, priority: number }} CoverageGap
 * @typedef {{ file: string, lines: object }} CoverageFile
 * @typedef {{ coverageAvailable: boolean, threshold: number, summary: object, gaps: CoverageGap[], fullyTested: CoverageFile[], lowestCoverage: CoverageGap|null, formattedForPrompt: string }} CoverageReport
 */
