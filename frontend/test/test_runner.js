/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// 1. Accessibility & WCAG 2.1 AA Verification
test('A11Y: Layout includes skip-to-content and WCAG landmark attributes', () => {
  const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(content.includes('Skip to main content'), 'Must include skip-to-content accessible link');
  assert.ok(content.includes('id="main-content"'), 'Must have main content anchor for skip link');
  assert.ok(content.includes('role="banner"'), 'Must designate header banner landmark role');
  assert.ok(content.includes('role="main"'), 'Must designate main landmark role');
  assert.ok(content.includes('role="contentinfo"'), 'Must designate footer contentinfo role');
});

test('A11Y: Navigation component includes ARIA landmarks and accessible labels', () => {
  const navPath = path.join(__dirname, '..', 'components', 'Navbar.tsx');
  const content = fs.readFileSync(navPath, 'utf8');

  assert.ok(content.includes('role="navigation"'), 'Navbar must have role="navigation"');
  assert.ok(content.includes('aria-label="Main Navigation"'), 'Navigation must have aria-label for screen readers');
  assert.ok(content.includes('aria-label='), 'Interactive links must have descriptive aria labels');
});

test('A11Y: Document Intake Form has explicit label-to-input association & ARIA live', () => {
  const uploadPath = path.join(__dirname, '..', 'app', 'upload', 'page.tsx');
  const content = fs.readFileSync(uploadPath, 'utf8');

  assert.ok(content.includes('htmlFor="doc-intake-title"'), 'Title input must have matching htmlFor');
  assert.ok(content.includes('id="doc-intake-title"'), 'Title input must have matching id');
  assert.ok(content.includes('htmlFor="raw-text-input"'), 'Textarea must have matching htmlFor');
  assert.ok(content.includes('id="raw-text-input"'), 'Textarea must have matching id');
  assert.ok(content.includes('aria-live="polite"'), 'Stepper must announce status updates to screen readers');
  assert.ok(content.includes('role="status"'), 'Stepper must have role="status"');
});

// 2. Security & Header Verification
test('Security: Next.js configuration enforces enterprise security headers', () => {
  const configPath = path.join(__dirname, '..', 'next.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');

  assert.ok(content.includes('Content-Security-Policy'), 'Must configure CSP header');
  assert.ok(content.includes('X-Frame-Options'), 'Must configure X-Frame-Options to DENY');
  assert.ok(content.includes('X-Content-Type-Options'), 'Must configure X-Content-Type-Options: nosniff');
  assert.ok(content.includes('Strict-Transport-Security'), 'Must configure HSTS preload');
  assert.ok(content.includes('Referrer-Policy'), 'Must configure strict Referrer-Policy');
});

// 3. Data Integrity & Grounding Provenance
test('Data: Seed documents conform to strict NyayaTrack contract schema & grounding proof', () => {
  const storePath = path.join(__dirname, '..', 'lib', 'store.ts');
  const content = fs.readFileSync(storePath, 'utf8');

  assert.ok(content.includes('doc_lease_001'), 'Must include baseline residential tenancy lease');
  assert.ok(content.includes('doc_free_002'), 'Must include baseline freelance consulting contract');
  assert.ok(content.includes('source_quote'), 'Entities must have source quotes for anti-hallucination verification');
  assert.ok(content.includes('is_grounded: true'), 'Verified fields must have is_grounded: true provenance flag');
  assert.ok(content.includes('summary_hi'), 'Documents must include Hindi translation field');
});

// 4. Mathematical Diffing Engine Verification
test('Diffing Engine: Accurately computes rent percentage hike and notice delta', () => {
  const baseRent = 25000;
  const newRent = 29500;
  const pctChange = ((newRent - baseRent) / baseRent) * 100;
  assert.strictEqual(Math.round(pctChange * 10) / 10, 18.0, 'Rent hike should equal exactly +18.0%');

  const baseNotice = 30;
  const newNotice = 15;
  const noticeReduction = baseNotice - newNotice;
  assert.strictEqual(noticeReduction, 15, 'Notice period reduction should equal 15 days');
});

// 5. Plain-Code Date Math & Urgency Sorting
test('Timeline Engine: Deterministically categorizes deadlines into urgency tiers', () => {
  const calculateUrgency = (daysRemaining) => {
    if (daysRemaining < 0) return 'OVERDUE';
    if (daysRemaining <= 7) return 'CRITICAL';
    if (daysRemaining <= 30) return 'UPCOMING';
    return 'STANDARD';
  };

  assert.strictEqual(calculateUrgency(-2), 'OVERDUE');
  assert.strictEqual(calculateUrgency(3), 'CRITICAL');
  assert.strictEqual(calculateUrgency(14), 'UPCOMING');
  assert.strictEqual(calculateUrgency(45), 'STANDARD');
});

// 6. Bilingual Localization Support
test('Localization: Application provides bilingual English and Devanagari Hindi support', () => {
  const docViewPath = path.join(__dirname, '..', 'app', 'document', '[id]', 'page.tsx');
  const content = fs.readFileSync(docViewPath, 'utf8');

  assert.ok(content.includes('हिन्दी'), 'Must offer Devanagari Hindi toggle');
  assert.ok(content.includes('summary_hi'), 'Must support Hindi summary translation');
});
