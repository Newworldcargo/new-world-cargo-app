import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, args: process.env.UAT_PUBLIC_DNS_IP ? [`--host-resolver-rules=MAP app.newworldcargo.com ${process.env.UAT_PUBLIC_DNS_IP}`] : [] });
const base = process.env.UAT_BASE_URL || 'http://localhost:5193';
const booking = { id: 'booking-5', bookingId: '5', reference: 'OBR0000005', shipmentId: null, service: 'local', transportMode: null, packageName: 'Parcel', parcelOwner: 'Test Recipient', origin: 'Lusaka', destination: 'Longacres', status: 'pending', statusLabel: 'Awaiting review', price: { currency: 'ZMW', amountMinor: 12000 }, events: [{ id: 'received', label: 'Booking request received', detail: 'Your request is awaiting review.', displayTime: 'Sep 21, 2026' }] };
await mkdir('/tmp/nwc-booking-read-audit', { recursive: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const requests = [];
    let failBooking = false;
    let accepted = false;
    const confirmed = { ...booking, id: '99', customerId: 'uat', trackingNumber: 'NWC99', carrier: 'New World Cargo', transportMode: 'air', etaAt: null, etaLabel: 'To be confirmed', status: 'in_transit', statusLabel: 'In transit', progress: 30, events: [], allowedActions: [], revision: 1 };
    await page.route('**/api/gateway/**', async route => {
      const path = new URL(route.request().url()).pathname.split('/v1')[1];
      requests.push(path);
      if (path === '/bookings/5' && failBooking) return route.fulfill({ status: 503, json: { error: { code: 'UNAVAILABLE', message: 'Please try again.' } } });
      const data = path === '/session' ? { id: 'uat', firstName: 'Test', lastName: 'Customer', verified: true }
        : path === '/bookings' ? [{ ...booking, ...(accepted ? { shipmentId: '99', status: 'booking_confirmed' } : {}) }]
        : path === '/bookings/5' ? booking : path === '/shipments' ? (accepted ? [confirmed] : []) : [];
      await route.fulfill({ json: { data } });
    });
    await page.goto(`${base}/shipments`);
    await expect(page.getByText('Awaiting approval', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Booking requests', exact: true })).toHaveCount(0);
    await page.screenshot({ path: `/tmp/nwc-booking-read-audit/pipeline-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: /OBR0000005/ }).click();
    await expect(page).toHaveURL(/\/shipments\/booking-5$/);
    await expect(page.getByRole('heading', { name: 'OBR0000005' })).toBeVisible();
    await expect(page.getByText('Awaiting review', { exact: true })).toBeVisible();
    expect(requests.some(path => path?.startsWith('/shipments/booking-'))).toBe(false);
    await page.screenshot({ path: `/tmp/nwc-booking-read-audit/detail-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Back to shipments' }).click();
    await page.getByPlaceholder('Search by tracking number or destination').fill('OBR0000005');
    await expect(page.getByRole('button', { name: /OBR0000005/ })).toBeVisible();
    await page.getByPlaceholder('Search by tracking number or destination').fill('not-matching');
    await expect(page.getByText('No shipments match your filters')).toBeVisible();
    await page.getByPlaceholder('Search by tracking number or destination').fill('');
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await expect(page.getByRole('button', { name: /OBR0000005/ })).toBeVisible();
    await page.getByRole('button', { name: 'Delivered', exact: true }).click();
    await expect(page.getByRole('button', { name: /OBR0000005/ })).toHaveCount(0);
    await page.goto(`${base}/shipments/booking-5`);
    await expect(page.getByRole('heading', { name: 'OBR0000005' })).toBeVisible();
    failBooking = true;
    await page.reload();
    await expect(page.getByRole('heading', { name: "We couldn't load your booking" })).toBeVisible({ timeout: 15000 });
    failBooking = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'OBR0000005' })).toBeVisible();
    accepted = true;
    await page.goto(`${base}/shipments`);
    await expect(page.getByRole('button', { name: 'Open shipment NWC99', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open shipment/ })).toHaveCount(1);
    await expect(page.getByText('In transit', { exact: true })).toBeVisible();
    await expect(page.getByText('Local delivery', { exact: true })).toBeVisible();
    await expect(page.getByText('Air cargo', { exact: true })).toHaveCount(0);
    console.log(`PASS ${width}: unified cards, approval replacement without duplicates, details, search, filters and retry`);
    await page.close();
  }
} finally { await browser.close(); }
