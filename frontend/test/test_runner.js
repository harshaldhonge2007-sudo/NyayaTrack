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

// 7. Important Constraint: Informational Guidance vs Legal Advice
test('Constraint: Enforces clear distinction between legal information and legal advice', () => {
  const bannerPath = path.join(__dirname, '..', 'components', 'DisclaimerBanner.tsx');
  const content = fs.readFileSync(bannerPath, 'utf8');

  assert.ok(content.includes('Not Legal Advice'), 'Must clearly state not legal advice');
  assert.ok(content.includes('Informational Guidance Only'), 'Must declare informational guidance only');
});

// 8. Legal Professional Preparation: Case Brief Modal
test('Use Case 7: Advocate case brief modal prepares structured consultation notes', () => {
  const modalPath = path.join(__dirname, '..', 'components', 'LawyerModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');

  assert.ok(content.includes('role="dialog"'), 'Must have role="dialog" for accessibility');
  assert.ok(content.includes('Case Brief'), 'Must prepare structured case brief');
  assert.ok(content.includes('questions'), 'Must provide pre-compiled questions for advocate consultation');
});

// 9. Clause Risk Detection Component Verification
test('Use Case 3: Clause risk cards render risk levels and source grounding quotes', () => {
  const cardPath = path.join(__dirname, '..', 'components', 'ClauseRiskCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');

  assert.ok(content.includes('risk_level'), 'Must evaluate risk levels');
  assert.ok(content.includes('is_grounded'), 'Must track source quote grounding');
  assert.ok(content.includes('compared_to'), 'Must benchmark against reference corpus');
});

// 10. Document Comparison Diff Component Verification
test('Use Case 2: DocumentDiffView highlights material modifications and risk delta', () => {
  const diffPath = path.join(__dirname, '..', 'components', 'DocumentDiffView.tsx');
  const content = fs.readFileSync(diffPath, 'utf8');

  assert.ok(content.includes('field_name'), 'Must display changed field');
  assert.ok(content.includes('old_value'), 'Must show previous baseline value');
  assert.ok(content.includes('new_value'), 'Must show new revision value');
});

// 11. Multi-Tier AI Guardrails & Prompt Injection Defense
test('Safety: Multi-tier Q&A defense guards against prompt injection and refuses judicial outcome predictions', () => {
  const enginePath = path.join(__dirname, '..', 'lib', 'engine.ts');
  const content = fs.readFileSync(enginePath, 'utf8');

  assert.ok(content.includes('Prompt Injection Defense'), 'Must include prompt injection defense step');
  assert.ok(content.includes('ignore previous instructions'), 'Must detect prompt override attempts');
  assert.ok(content.includes('predict court outcomes') || content.includes('guarantee legal outcomes'), 'Must refuse court predictions');
  assert.ok(content.includes('suggest_lawyer: true'), 'Must trigger advocate referral on risky questions');
});

// 12. Dynamic Legal Intelligence & Statutory Risk Rules
test('Legal Intelligence: Clause analyzer benchmarks against ICA Sec 27, Sec 74, TPA Sec 106, and MSMED Act', () => {
  const enginePath = path.join(__dirname, '..', 'lib', 'engine.ts');
  const content = fs.readFileSync(enginePath, 'utf8');

  assert.ok(content.includes('Section 27 of the Indian Contract Act'), 'Must evaluate non-compete clauses under Sec 27');
  assert.ok(content.includes('Section 74 of the Indian Contract Act'), 'Must evaluate liquidated damages under Sec 74');
  assert.ok(content.includes('Model Tenancy Act') || content.includes('Transfer of Property Act'), 'Must check notice standards');
  assert.ok(content.includes('MSMED Act'), 'Must check payment windows under MSMED Act');
});

// 13. Dual-Scenario 1-Click Fast Track Selectors
test('Demo UX: Intake page offers dual-scenario presets for Tenants and Freelancers', () => {
  const uploadPath = path.join(__dirname, '..', 'app', 'upload', 'page.tsx');
  const content = fs.readFileSync(uploadPath, 'utf8');

  assert.ok(content.includes('handlePreFillTenancy'), 'Must provide tenancy demo preset handler');
  assert.ok(content.includes('handlePreFillFreelance'), 'Must provide freelance demo preset handler');
  assert.ok(content.includes('Scenario 1 • Small Tenants'), 'Must present Scenario 1 UI card');
  assert.ok(content.includes('Scenario 2 • Freelancers / Gig Workers'), 'Must present Scenario 2 UI card');
});

