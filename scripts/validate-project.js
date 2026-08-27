#!/usr/bin/env node
/**
 * Validate that the current directory is a valid Next.js project
 * suitable for agent-afk SDK integration.
 */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const checks = [];
let hasError = false;

// Check 1: package.json with Next.js
const pkgPath = path.join(cwd, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps['next']) {
    checks.push({ name: 'package.json with Next.js', status: 'pass', detail: `next@${deps['next']}` });
  } else {
    checks.push({ name: 'package.json with Next.js', status: 'fail', detail: 'Next.js not found in dependencies' });
    hasError = true;
  }
} else {
  checks.push({ name: 'package.json', status: 'fail', detail: 'package.json not found' });
  hasError = true;
}

// Check 2: App Router directory
const srcApp = path.join(cwd, 'src', 'app');
const rootApp = path.join(cwd, 'app');
let appDir = null;
if (fs.existsSync(srcApp)) {
  appDir = 'src/app';
  checks.push({ name: 'App Router directory', status: 'pass', detail: 'src/app' });
} else if (fs.existsSync(rootApp)) {
  appDir = 'app';
  checks.push({ name: 'App Router directory', status: 'pass', detail: 'app' });
} else {
  checks.push({ name: 'App Router directory', status: 'fail', detail: 'Neither src/app nor app directory found' });
  hasError = true;
}

// Check 3: node_modules
if (fs.existsSync(path.join(cwd, 'node_modules'))) {
  checks.push({ name: 'Dependencies installed', status: 'pass', detail: 'node_modules exists' });
} else {
  checks.push({ name: 'Dependencies installed', status: 'fail', detail: 'Run pnpm install first' });
  hasError = true;
}

// Check 4: Already has agent-afk?
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps['agent-afk']) {
    checks.push({ name: 'agent-afk', status: 'info', detail: `Already installed: ${deps['agent-afk']}` });
  }
}

// Output
console.log('\n=== Next.js Project Validation ===\n');
for (const c of checks) {
  const icon = c.status === 'pass' ? '\u2705' : c.status === 'fail' ? '\u274C' : '\u2139\uFE0F';
  console.log(`${icon} ${c.name}: ${c.detail}`);
}
if (appDir) console.log(`\nApp directory: ${appDir}`);
console.log(`\nResult: ${hasError ? 'FAILED - fix issues above' : 'READY for agent-afk integration'}`);
process.exit(hasError ? 1 : 0);
