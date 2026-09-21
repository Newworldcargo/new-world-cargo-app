import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: process.env.UAT_PUBLIC_DNS_IP ? [`--host-resolver-rules=MAP app.newworldcargo.com ${process.env.UAT_PUBLIC_DNS_IP}`] : [] });
const base = process.env.UAT_BASE_URL || 'http://localhost:5193';
const offices = [
  { id: '1', name: 'Lusaka', latitude: -15.3875, longitude: 28.3228 },
  { id: '2', name: 'Kitwe', latitude: -12.8024, longitude: 28.2132 },
  { id: '3', name: 'Harare', latitude: -17.8252, longitude: 31.0335 },
];
try {
  for (const width of [1440, 390]) for (const service of ['local', 'intercity']) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route('**/api/gateway/**', route => {
      const path = new URL(route.request().url()).pathname.split('/v1')[1];
      return route.fulfill({ json: { data: path === '/session' ? { id: 'uat', firstName: 'Test', verified: true } : path === '/reference-data' ? { offices, deliveryOptions: [], transportOptions: [] } : [] } });
    });
    await page.route('**/maps.googleapis.com/**', route => route.abort());
    await page.route('**/places.googleapis.com/v1/places:autocomplete', route => {
      const input = route.request().postDataJSON();
      expect(input.includedRegionCodes).toEqual(['zm']);
      if (service === 'local') expect(input.locationRestriction.rectangle.low.latitude).toBeLessThan(-15.38);
      return route.fulfill({ json: { suggestions: [{ placePrediction: { placeId: 'outside', structuredFormat: { mainText: { text: 'Outside location' }, secondaryText: { text: 'Outside delivery area' } } } }] } });
    });
    await page.route('**/places.googleapis.com/v1/places/outside*', route => route.fulfill({ json: { location: { latitude: -17.8252, longitude: 31.0335 } } }));
    await page.goto(`${base}/send/${service}/route`);
    const inputs = page.locator('input[role="combobox"]:visible');
    await inputs.first().fill('Lusaka');
    await page.getByRole('option').filter({ hasText: 'Lusaka' }).click();
    await inputs.nth(1).focus();
    await expect(page.getByRole('option').filter({ hasText: 'Harare' })).toHaveCount(0);
    if (service === 'local') await expect(page.getByRole('option').filter({ hasText: 'Kitwe' })).toHaveCount(0);
    else await expect(page.getByRole('option').filter({ hasText: 'Kitwe' })).toBeVisible();
    await inputs.nth(1).fill('Outside location');
    await page.getByRole('option').filter({ hasText: 'Outside location' }).click();
    await expect(page.getByText(service === 'local' ? /Choose both locations in Lusaka/ : /Choose both locations in Zambia/)).toBeVisible();
    await page.locator('button:visible').filter({ hasText: /^Continue to/ }).click();
    await expect(page).toHaveURL(/\/route$/);
    await expect(inputs.first()).toHaveValue(/Lusaka/);
    await page.screenshot({ path: `/tmp/nwc-zone-${service}-${width}.png`, fullPage: true });
    console.log(`PASS ${service} ${width}: search restriction, office filtering, outside selection blocked, valid pickup retained`);
    await page.close();
  }
} finally { await browser.close(); }
