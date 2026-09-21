import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({headless:true, args:process.env.UAT_PUBLIC_DNS_IP ? [`--host-resolver-rules=MAP app.newworldcargo.com ${process.env.UAT_PUBLIC_DNS_IP}`] : []});
const base = process.env.UAT_BASE_URL || 'http://localhost:5193';
const shipment = {id:'38748', customerId:'uat', trackingNumber:'TEST38748', carrier:'New World Cargo', transportMode:'air', packageName:'Parcel', origin:'Lusaka', destination:'Kitwe', etaAt:null, etaLabel:'To be confirmed', status:'pending', statusLabel:'Approved', price:{currency:'USD',amountMinor:10000}, progress:0, events:[], allowedActions:[], revision:1};
const unavailable = 'Online payments are currently unavailable. Please contact your branch to arrange payment.';
try {
 for (const width of [1440,390]) {
  const page = await browser.newPage({viewport:{width,height:1000},acceptDownloads:true});
  let paid = 3000, failedDownload = false, checkoutMessage = unavailable;
  await page.route('**/api/gateway/**', async route => {
   const path = new URL(route.request().url()).pathname.split('/v1')[1];
   let data = [];
   if (path === '/session') data={id:'uat',firstName:'Test',lastName:'Customer',verified:true};
   if (path === '/shipments/38748') data=shipment;
   if (path === '/shipments/38748/delivery') data={revision:1};
   if (path === '/shipments/38748/payments') data={total:shipment.price,paid:{currency:'USD',amountMinor:paid},remaining:{currency:'USD',amountMinor:10000-paid},status:paid===10000?'Paid':paid?'Partially paid':'Unpaid',invoiceId:'123',checkoutMessage,receipts:paid?[{id:'payment-1',number:'R-TEST',amount:{currency:'USD',amountMinor:paid},dateLabel:'21 Sep 2026, 08:00',method:'Cash',refunded:false}]:[]};
   if (path === '/shipments/38748/receipts/payment-1') {
    if(failedDownload) return route.fulfill({status:503,json:{error:{code:'UNAVAILABLE',message:'Unavailable'}}});
    data={filename:'receipt-test.html',mimeType:'text/html',content:'<h1>Payment receipt</h1><p>USD 30.00</p>'};
   }
   await route.fulfill({json:{data}});
  });
  await page.goto(`${base}/shipments/38748`);
  const section = page.getByRole('region',{name:'Payments & receipts'});
  await expect(section.getByText('Partially paid',{exact:true})).toBeVisible();
  await expect(section.getByText('USD 70.00',{exact:true})).toBeVisible();
  await section.getByRole('button',{name:'Pay now',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText(unavailable);
  await page.getByRole('button',{name:'Close payment',exact:true}).click();
  failedDownload=true;
  await section.getByRole('button',{name:'Download receipt R-TEST'}).click();
  await expect(section.getByRole('alert')).toContainText("couldn't download");
  failedDownload=false;
  const downloadEvent=page.waitForEvent('download');
  await section.getByRole('button',{name:'Download receipt R-TEST'}).click();
  const downloaded=await downloadEvent;
  expect(downloaded.suggestedFilename()).toBe('receipt-test.html');
  expect(await readFile(await downloaded.path(),'utf8')).toContain('USD 30.00');
  paid=10000; await page.reload();
  await expect(section.getByText('Paid',{exact:true})).toBeVisible();
  await expect(section.getByRole('button',{name:'Pay now',exact:true})).toHaveCount(0);
  paid=0; checkoutMessage=null; await page.reload();
  await expect(section.getByText('No payment receipts yet.')).toBeVisible();
  await section.getByRole('button',{name:'Pay now',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Choose payment method');
  await page.screenshot({path:`/tmp/nwc-shipment-checkout-${width}.png`,fullPage:true});
  console.log(`PASS ${width}: partial/full/unpaid states, receipt download/retry, existing checkout and provider-unavailable state`);
  await page.close();
 }
} finally { await browser.close(); }
