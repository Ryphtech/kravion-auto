#!/usr/bin/env node

/**
 * Kravion Auto Standalone E2E Test Runner
 *
 * Usage:
 *   node tests/e2e/runner.mjs
 *   node tests/e2e/runner.mjs --tier=1
 *   node tests/e2e/runner.mjs --tier=2
 *   node tests/e2e/runner.mjs --filter=catalog
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
};

// Test Suite State Machine
class TestRunner {
  constructor() {
    this.currentSuite = null;
    this.suites = [];
    this.stats = {
      suitesTotal: 0,
      suitesPassed: 0,
      suitesFailed: 0,
      testsTotal: 0,
      testsPassed: 0,
      testsFailed: 0,
      durationMs: 0,
    };
  }

  describe(name, fn) {
    const parent = this.currentSuite;
    const suite = {
      name,
      parent,
      tests: [],
      beforeAllHooks: [],
      afterAllHooks: [],
      beforeEachHooks: [],
      afterEachHooks: [],
      childSuites: [],
    };

    if (parent) {
      parent.childSuites.push(suite);
    } else {
      this.suites.push(suite);
    }

    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = parent;
    }
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.describe('Root Suite', () => {
        this.currentSuite.tests.push({ name, fn });
      });
    } else {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAllHooks.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAllHooks.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEachHooks.push(fn);
  }

  getAllBeforeEach(suite) {
    const hooks = [];
    let cur = suite;
    while (cur) {
      hooks.unshift(...cur.beforeEachHooks);
      cur = cur.parent;
    }
    return hooks;
  }

  getAllAfterEach(suite) {
    const hooks = [];
    let cur = suite;
    while (cur) {
      hooks.push(...cur.afterEachHooks);
      cur = cur.parent;
    }
    return hooks;
  }

  async runSuite(suite, indent = '  ') {
    let suiteFailed = false;
    console.log(`${indent}${colors.cyan}${colors.bold}● ${suite.name}${colors.reset}`);

    for (const hook of suite.beforeAllHooks) {
      await hook();
    }

    const beforeEachList = this.getAllBeforeEach(suite);
    const afterEachList = this.getAllAfterEach(suite);

    for (const testCase of suite.tests) {
      this.stats.testsTotal++;
      const start = performance.now();
      let error = null;

      try {
        for (const hook of beforeEachList) {
          await hook();
        }
        await testCase.fn();
      } catch (err) {
        error = err;
        suiteFailed = true;
        this.stats.testsFailed++;
      } finally {
        for (const hook of afterEachList) {
          try {
            await hook();
          } catch (e) {
            if (!error) {
              error = e;
              suiteFailed = true;
              this.stats.testsFailed++;
            }
          }
        }
      }

      const elapsed = (performance.now() - start).toFixed(2);
      if (error) {
        console.log(`${indent}  ${colors.red}✗ FAIL:${colors.reset} ${testCase.name} ${colors.gray}(${elapsed}ms)${colors.reset}`);
        console.log(`${indent}    ${colors.red}${error.name}: ${error.message}${colors.reset}`);
        if (error.actual !== undefined && error.expected !== undefined) {
          console.log(`${indent}    ${colors.gray}Expected: ${JSON.stringify(error.expected)}${colors.reset}`);
          console.log(`${indent}    ${colors.gray}Actual:   ${JSON.stringify(error.actual)}${colors.reset}`);
        }
        if (error.stack) {
          const stackLines = error.stack
            .split('\n')
            .slice(1, 4)
            .map(line => `${indent}    ${colors.dim}${line.trim()}${colors.reset}`)
            .join('\n');
          console.log(stackLines);
        }
      } else {
        this.stats.testsPassed++;
        console.log(`${indent}  ${colors.green}✓ PASS:${colors.reset} ${testCase.name} ${colors.gray}(${elapsed}ms)${colors.reset}`);
      }
    }

    for (const child of suite.childSuites) {
      const childFailed = await this.runSuite(child, indent + '  ');
      if (childFailed) suiteFailed = true;
    }

    for (const hook of suite.afterAllHooks) {
      await hook();
    }

    return suiteFailed;
  }
}

// Global instance
const runnerInstance = new TestRunner();

export const describe = runnerInstance.describe.bind(runnerInstance);
export const test = runnerInstance.test.bind(runnerInstance);
export const it = test;
export const beforeAll = runnerInstance.beforeAll.bind(runnerInstance);
export const afterAll = runnerInstance.afterAll.bind(runnerInstance);
export const beforeEach = runnerInstance.beforeEach.bind(runnerInstance);
export const afterEach = runnerInstance.afterEach.bind(runnerInstance);

// Register on globalThis for zero-boilerplate test writing
globalThis.describe = describe;
globalThis.test = test;
globalThis.it = it;
globalThis.beforeAll = beforeAll;
globalThis.afterAll = afterAll;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;

/**
 * Scan directory recursively for test files
 */
function findTestFiles(dir, filter = null, tier = null) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Filter by tier folder if specified
      if (tier) {
        const tierName = `tier${tier}`;
        if (entry.name.startsWith('tier') && !entry.name.startsWith(tierName)) {
          continue;
        }
      }
      results.push(...findTestFiles(fullPath, filter, tier));
    } else if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      if (filter && !entry.name.toLowerCase().includes(filter.toLowerCase())) {
        continue;
      }
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Main Runner CLI execution
 */
async function main() {
  const args = process.argv.slice(2);
  let tierArg = null;
  let filterArg = null;

  for (const arg of args) {
    if (arg.startsWith('--tier=')) {
      tierArg = arg.split('=')[1];
    } else if (arg.startsWith('--filter=')) {
      filterArg = arg.split('=')[1];
    }
  }

  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   KRAVION AUTO — E2E TEST SUITE RUNNER            ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  if (tierArg) console.log(`${colors.gray}Target Tier:${colors.reset} Tier ${tierArg}`);
  if (filterArg) console.log(`${colors.gray}Filter:${colors.reset} "${filterArg}"`);

  const testsDir = path.resolve(__dirname);
  const testFiles = findTestFiles(testsDir, filterArg, tierArg);

  if (testFiles.length === 0) {
    console.log(`\n${colors.yellow}No test files found matching criteria.${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${colors.bold}Discovered ${testFiles.length} test file(s):${colors.reset}`);
  testFiles.forEach(f => console.log(`  - ${colors.gray}${path.relative(process.cwd(), f)}${colors.reset}`));
  console.log(`\n${colors.dim}Executing tests...${colors.reset}\n`);

  const totalStart = performance.now();

  for (const file of testFiles) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`\n${colors.bold}File: ${relPath}${colors.reset}`);

    // Clear suites for each test file to keep suites isolated
    runnerInstance.suites = [];

    try {
      const fileUrl = pathToFileURL(file).href;
      // Append cache buster to support multiple runs if needed
      await import(`${fileUrl}?t=${Date.now()}`);

      runnerInstance.stats.suitesTotal += runnerInstance.suites.length;

      let fileHasFailures = false;
      for (const suite of runnerInstance.suites) {
        const failed = await runnerInstance.runSuite(suite);
        if (failed) fileHasFailures = true;
      }

      if (fileHasFailures) {
        runnerInstance.stats.suitesFailed++;
      } else {
        runnerInstance.stats.suitesPassed++;
      }
    } catch (importErr) {
      runnerInstance.stats.suitesFailed++;
      console.log(`  ${colors.red}Failed to load or execute test file:${colors.reset} ${importErr.message}`);
      if (importErr.stack) console.log(importErr.stack);
    }
  }

  runnerInstance.stats.durationMs = performance.now() - totalStart;

  // Final Summary Output
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}   TEST SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`  Suites:   ${runnerInstance.stats.suitesPassed} passed, ${runnerInstance.stats.suitesFailed} failed, ${runnerInstance.stats.suitesTotal} total`);
  console.log(`  Tests:    ${runnerInstance.stats.testsPassed} passed, ${runnerInstance.stats.testsFailed} failed, ${runnerInstance.stats.testsTotal} total`);
  console.log(`  Duration: ${(runnerInstance.stats.durationMs / 1000).toFixed(2)}s`);

  if (runnerInstance.stats.testsFailed > 0 || runnerInstance.stats.suitesFailed > 0) {
    console.log(`\n${colors.bgRed} RESULT: FAIL ${colors.reset} — Some tests failed.\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.bgGreen} RESULT: PASS ${colors.reset} — All tests passed cleanly.\n`);
    process.exit(0);
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((err) => {
    console.error(`\nUnhandled error in test runner: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });
}
