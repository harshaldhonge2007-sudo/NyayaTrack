const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

test('Backend Health Endpoint: Returns 200 and healthy status', async () => {
  const data = await new Promise((resolve, reject) => {
    http.get('http://localhost:8000/api/health', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
    }).on('error', reject);
  });

  assert.strictEqual(data.statusCode, 200);
  assert.strictEqual(data.body.status, 'healthy');
  assert.strictEqual(data.body.service, 'NyayaTrack Backend API');
});

test('Backend Documents Endpoint: Returns pre-seeded documents', async () => {
  const data = await new Promise((resolve, reject) => {
    http.get('http://localhost:8000/api/documents', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });

  assert.ok(Array.isArray(data), 'Should return an array of documents');
  assert.ok(data.length >= 2, 'Should have at least 2 seeded documents');
  const lease = data.find(d => d.id === 'doc_lease_001');
  assert.ok(lease, 'Should include original residential tenancy lease');
});

test('Frontend Production Server: Serves 200 on port 3000', async () => {
  const statusCode = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode);
    }).on('error', reject);
  });

  assert.strictEqual(statusCode, 200, 'Frontend should be serving HTTP 200');
});

test('Accessibility Verification: Layout includes skip-to-content landmark', async () => {
  const html = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });

  assert.ok(html.includes('Skip to main content'), 'Should have skip to content link');
  assert.ok(html.includes('role="banner"'), 'Should have banner landmark');
  assert.ok(html.includes('role="main"'), 'Should have main landmark');
  assert.ok(html.includes('role="navigation"'), 'Should have navigation landmark');
});
