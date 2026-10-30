#!/usr/bin/env node
// Structural governance guard only. Does not prove data security or compliance.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'docs/governance/OREMEA-DATA-SECURITY-POLICY.md',
  'docs/governance/PORTFOLIO-COVERAGE.md',
  'docs/governance/RELEASE-GATE.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
];
let failed = false;
const fail = (msg) => { failed = true; console.error('GOVERNANCE ERROR: ' + msg); };
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) fail('Missing policy file: ' + file);
}
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/governance/product-boundaries.json'),'utf8'));
} catch (e) {
  fail('Cannot parse product-boundaries.json: ' + e.message);
  process.exit(1);
}
if (manifest.approvalStatus !== 'PROPOSED_NOT_APPROVED' && manifest.approvalStatus !== 'APPROVED') {
  fail('Approval status must be explicit');
}
const ids = new Set();
const requiredProducts = new Set(['oremea','sustain','dawn','works','binflow','countress','the-raw-route','be-well-with-ang','party']);
for (const product of manifest.products ?? []) {
  if (ids.has(product.id)) fail('Duplicate product: ' + product.id);
  ids.add(product.id);
  if (typeof product.name !== 'string' || !product.name.trim() || typeof product.purpose !== 'string' || !product.purpose.trim()) fail('Product missing name/purpose: ' + product.id);
  for (const key of ['automaticCrossProductSharing','studyMarketingInProduct','feedbackRepurposedAsResearch']) {
    if (product[key] !== false) fail(product.id + ': ' + key + ' MUST be false');
  }
  if (product.privateByDefault !== true) fail(product.id + ': personal data must be private by default');
}
for (const id of requiredProducts) if (!ids.has(id)) fail('Missing product boundary: ' + id);
const allowed = new Set(['PASS','NEEDS_WORK','BLOCKED','NOT_TESTED']);
const controls = new Map();
for (const control of manifest.controls ?? []) {
  if (controls.has(control.id)) fail('Duplicate gate: ' + control.id);
  controls.set(control.id, control);
  if (!allowed.has(control.status)) fail('Unknown status for ' + control.id);
  if (!Array.isArray(control.evidence)) fail('Evidence must be an array: ' + control.id);
  if (control.status === 'PASS' && (!Array.isArray(control.evidence) || control.evidence.length === 0)) {
    fail('PASS without evidence: ' + control.id);
  }
}
for (let i=1;i<=9;i++) if (!controls.has('G'+i)) fail('Missing gate G'+i);
if (manifest.releaseGate === 'APPROVED' && [...controls.values()].some(c=>c.status!=='PASS')) {
  fail('Release cannot be APPROVED with non-PASS controls');
}
if (!['BLOCKED_PENDING_EVIDENCE','APPROVED'].includes(manifest.releaseGate)) fail('Invalid release gate value');
if (failed) process.exit(1);
console.log('Governance manifest and documentation structure validated.');
console.log('IMPORTANT: This check does not establish security, legal compliance or release approval.');
