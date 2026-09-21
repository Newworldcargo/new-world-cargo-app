import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ headless: true, args: process.env.UAT_PUBLIC_DNS_IP ? [`--host-resolver-rules=MAP app.newworldcargo.com ${process.env.UAT_PUBLIC_DNS_IP}`] : [] });
const base = process.env.UAT_BASE_URL || 'http://localhost:5193';
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  let linked = false, status = 'pending', service = 'local';
  const requests = [];
  await page.route('**/api/gateway/**', route => {
   const path = new URL(route.request().url()).pathname.split('/v1')[1]; requests.push(path);
   let data = [];
   if (path === '/session') data = { id: 'uat', firstName: 'Test', verified: true };
   if (path === '/bookings/5') data = { id:'booking-5', bookingId:'5', reference:'BOOKING-5', shipmentId:linked?'38748':null, service, transportMode:service==='import'?'sea':null, packageName:'Parcel', parcelOwner:'Recipient', origin:'Lusaka, Zambia', destination:'Longacres, Lusaka', status, statusLabel:status==='cancelled'?'Booking declined':'Awaiting review', price:{currency:'ZMW',amountMinor:5000}, events:[{id:'received',label:'Booking request received',detail:'Your request was received.',displayTime:'21 Sep 2026'}] };
   if (path === '/shipments/38748') data = { id:'38748',customerId:'uat',trackingNumber:'SHIP-38748',carrier:'New World Cargo',transportMode:'air',packageName:'Parcel',origin:'Lusaka',destination:'Kitwe',etaAt:null,etaLabel:'To be confirmed',status:'in_transit',statusLabel:'In transit',price:{currency:'ZMW',amountMinor:5000},progress:50,events:[],allowedActions:[],revision:1 };
   if (path === '/shipments/38748/delivery') data = { revision:1 };
   if (path === '/shipments/38748/payments') data = { total:{currency:'ZMW',amountMinor:5000},paid:{currency:'ZMW',amountMinor:2000},remaining:{currency:'ZMW',amountMinor:3000},status:'Partially paid',invoiceId:'1',checkoutMessage:'Please contact your branch to arrange payment.',receipts:[] };
   return route.fulfill({ json:{data} });
  });
  for (service of ['local','intercity','import','custom']) {
   await page.goto(`${base}/shipments/booking-5`);
   await expect(page.getByRole('heading',{name:'BOOKING-5',exact:true})).toBeVisible();
   await expect(page.getByText('Awaiting approval',{exact:true})).toBeVisible();
   await expect(page.getByText('Booking request received',{exact:true})).toBeVisible();
   await expect(page.getByRole('heading',{name:'Payments & receipts'})).toBeVisible();
   await expect(page.getByRole('button',{name:'Pay now',exact:true})).toHaveCount(0);
   await expect(page.getByRole('button',{name:'Manage delivery',exact:true})).toHaveCount(0);
   if(service!=='import') await expect(page.getByText('Air freight',{exact:true})).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  expect(requests.some(path=>path?.includes('/shipments/booking-'))).toBe(false);
  await page.screenshot({path:`/tmp/nwc-booking-detail-${width}.png`,fullPage:true});
  status='cancelled'; await page.reload();
  await expect(page.getByText('Booking closed',{exact:true})).toBeVisible();
  linked=true; status='booking_confirmed'; await page.reload();
  await expect(page.getByRole('heading',{name:'SHIP-38748',exact:true})).toBeVisible();
  await expect(page.getByText('In transit',{exact:true})).toBeVisible();
  await expect(page.getByText('Partially paid',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pay now',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  console.log(`PASS ${width}: all booking types, pending/declined/linked, shared tracking and payment checkout, no invalid booking shipment requests`);
  await page.close();
 }
} finally { await browser.close(); }
