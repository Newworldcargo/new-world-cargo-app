import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Controlled API fixtures exercise the real UI without creating customer orders.
const output = process.env.UAT_PRODUCTION_HEADERS ? '/tmp/nwc-booking-production-policy-audit' : process.env.UAT_LIVE_MAP ? '/tmp/nwc-booking-live-map-audit' : '/tmp/nwc-booking-browser-audit';
const deployment = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const productionHeaders = Object.fromEntries(deployment.headers.find(item => item.source === '/(.*)').headers.map(item => [item.key.toLowerCase(), item.value]));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: process.env.UAT_PUBLIC_DNS_IP ? [`--host-resolver-rules=MAP app.newworldcargo.com ${process.env.UAT_PUBLIC_DNS_IP}`] : [] });
const results = [];
const offices = [
  { id: '1', name: 'Guangzhou', address: 'Guangzhou, China', country: 'China', latitude: 23.1291, longitude: 113.2644 },
  { id: '2', name: 'Lusaka', address: 'Lusaka, Zambia', country: 'Zambia', latitude: -15.3875, longitude: 28.3228 },
  { id: '3', name: 'Kitwe', address: 'Kitwe, Zambia', country: 'Zambia', latitude: -12.8024, longitude: 28.2132 },
  { id: '4', name: 'Longacres', address: 'Longacres, Zambia', country: 'Zambia', latitude: -15.405, longitude: 28.315 },
];
try {
  for (const width of process.env.UAT_ONE_FLOW ? [1440] : [1440, 390]) {
    for (const service of process.env.UAT_ONE_FLOW ? ['import'] : ['import', 'intercity', 'local', 'custom']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, ignoreHTTPSErrors: !process.env.UAT_PUBLIC_DNS_IP });
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      if (process.env.UAT_PRODUCTION_HEADERS) {
        await page.route('**/send/**', async route => {
          if (route.request().resourceType() !== 'document') return route.continue();
          const response = await route.fetch();
          const headers = { ...response.headers(), ...productionHeaders };
          if (process.env.UAT_OLD_CSP) headers['content-security-policy'] = headers['content-security-policy'].replace("script-src 'self' https://maps.googleapis.com https://maps.gstatic.com", "script-src 'self'");
          await route.fulfill({ response, headers });
        });
      }
      const errors = [];
      const mapErrors = [];
      const requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') mapErrors.push(message.text().replace(/AIza[\w-]+/g, '[redacted]'));
      });
      await page.route('**/api/gateway/**', async route => {
        const request = route.request();
        const path = new URL(request.url()).pathname.split('/v1')[1];
        requests.push({ path, method: request.method(), body: request.postData() });
        let data = [];
        if (path === '/session') data = { id: 'uat', firstName: 'Test', lastName: 'Customer', phone: '+260970000000', email: 'uat@example.test', verified: true };
        if (path === '/reference-data') data = { offices, deliveryOptions: [], transportOptions: [] };
        if (path === '/bookings/quote') data = { source: 'server', quotePayload: {}, quoteSignature: 'fixture', formattedTotal: 'K 120.00' };
        if (path === '/shipment-drafts' && request.method() === 'POST') data = { id: '42', revision: 1 };
        if (path?.endsWith('/submit')) data = { id: 'booking-42', trackingNumber: 'UAT-BOOKING-42' };
        await route.fulfill({ json: { data }, headers: { 'X-CSRF-Token': 'uat-csrf-token-123456' } });
      });
      // Failure mode is deliberate; live map tests must be recorded separately.
      if (!process.env.UAT_LIVE_MAP) {
        await page.route('**/maps.googleapis.com/**', route => route.abort());
        await page.route('**/places.googleapis.com/**', route => route.fulfill({ json: { suggestions: [] } }));
      }
      const visible = selector => page.locator(`${selector}:visible`);
      try {
        await page.goto(`${process.env.UAT_BASE_URL || 'http://localhost:5193'}/send/${service}/route`);
        const inputs = visible('input[role="combobox"]');
        await expect(inputs).toHaveCount(2);
        if (process.env.UAT_LIVE_MAP && service === 'local') {
          await inputs.first().fill('Levy Junction Lusaka');
          await expect(visible('[role="option"]').filter({ hasText: /Levy/i }).first()).toBeVisible({ timeout: 15000 });
          await visible('[role="option"]').filter({ hasText: /Levy/i }).first().click();
          await expect(inputs.first()).toHaveValue(/Levy/i);
          await visible('button').filter({ hasText: /^Clear$/ }).first().click();
        }
        await expect(page.locator('[aria-label="Booking route map"]')).toHaveCount(1);
        if (width < 1000) {
          await page.getByRole('button', { name: 'Collapse booking form' }).click();
          await expect(inputs.first()).not.toBeVisible();
          await page.getByRole('button', { name: 'Expand booking form' }).click();
          await expect(inputs.first()).toBeVisible();
        }
        await visible('button').filter({ hasText: /^Continue to/ }).click();
        await expect(page).toHaveURL(/\/route$/);
        for (let index = 0; index < 2; index++) {
          await inputs.nth(index).fill(index === 0 && service === 'import' ? 'Guang' : index === 0 ? 'Lus' : service === 'local' ? 'Longacres' : 'Kit');
          await expect(visible('[role="option"]').first()).toBeVisible();
          await expect(visible('[role="listbox"]')).toBeVisible();
          await inputs.nth(index).press('Enter');
          await expect(visible('[role="listbox"]')).toHaveCount(0);
        }
        await inputs.first().focus();
        await inputs.first().press('Escape');
        await expect(visible('[role="listbox"]')).toHaveCount(0);
        if (process.env.UAT_LIVE_MAP) {
          await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeEnabled();
          await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
          await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
          await page.waitForTimeout(5000);
          const tileImages = await page.locator('.gm-style img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth > 100).length);
          console.log(JSON.stringify({ service, tileImages, mapErrors }));
          expect(tileImages).toBeGreaterThan(0);
          expect(mapErrors.filter(message => /content security policy|Refused to|Google Maps JavaScript API error/i.test(message))).toEqual([]);
        }
        await page.screenshot({ path: `${output}/${service}-${width}-route.png`, fullPage: true });
        await visible('button').filter({ hasText: /^Continue to/ }).click();
        await expect(page).not.toHaveURL(/\/route$/);
        await visible('button[aria-label="Go back"]').click();
        await expect(inputs.nth(1)).toHaveValue(service === 'local' ? /Longacres/ : /Kitwe/);
        await visible('button').filter({ hasText: /^Continue to/ }).click();
        if (service === 'custom') await visible('button').filter({ hasText: 'Other request' }).click();
        await visible('input[aria-label="Cargo item 1"]').fill('UAT parcel');
        await visible('input[aria-label="Quantity for cargo item 1"]').fill('0');
        const cargoUrl = page.url();
        await visible('button').filter({ hasText: /^Continue to/ }).click();
        expect(page.url()).toBe(cargoUrl);
        await visible('input[aria-label="Quantity for cargo item 1"]').fill('1');
        await visible('button').filter({ hasText: 'Add another item' }).click();
        await visible('input[aria-label="Cargo item 2"]').fill('Second parcel');
        await visible('button[aria-label="Remove cargo item 2"]').click();
        await expect(visible('input[aria-label="Cargo item 2"]')).toHaveCount(0);
        await visible('button').filter({ hasText: /^Continue to/ }).click();
        if (service !== 'custom') {
          const names = page.getByLabel('Name', { exact: true }).filter({ visible: true });
          const phones = page.getByLabel('Phone', { exact: true }).filter({ visible: true });
          // Import includes optional supplier; fill all displayed contact fields.
          for (let i = 0; i < await names.count(); i++) await names.nth(i).fill('Test Recipient');
          for (let i = 0; i < await phones.count(); i++) await phones.nth(i).fill('+260971111111');
          await visible('button').filter({ hasText: /^Continue to/ }).click();
          if (service === 'intercity') await visible('button').filter({ hasText: /^Continue to/ }).click();
        }
        await expect(page).toHaveURL(/\/review$/);
        await page.screenshot({ path: `${output}/${service}-${width}-review.png`, fullPage: true });
        await visible('button').filter({ hasText: /^(Request a quote|Confirm delivery request|Submit booking request)$/ }).click();
        await expect(page.getByText(/Booking reference UAT-BOOKING-42/)).toBeVisible();
        expect(requests.filter(item => item.path?.endsWith('/submit'))).toHaveLength(1);
        expect(errors).toEqual([]);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        expect(overflow).toBe(false);
        results.push({ service, width, passed: true, liveMap: Boolean(process.env.UAT_LIVE_MAP), mapErrors });
      } catch (error) {
        await page.screenshot({ path: `${output}/${service}-${width}-failure.png`, fullPage: true });
        results.push({ service, width, passed: false, error: error.message, errors });
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
if (results.some(result => !result.passed)) process.exitCode = 1;
