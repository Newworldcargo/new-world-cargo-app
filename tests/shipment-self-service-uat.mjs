import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({args:['--no-sandbox']});
const base = process.env.UAT_BASE_URL || 'http://localhost:5195';
try { for (const width of [390,1440]) {
  const page = await browser.newPage({viewport:{width,height:950}});
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => console.error(error.message));
  let invoiceId = null, preparations = 0, collections = 0, failPreparation = true, intent = null;
  const money = {currency:'ZMW',amountMinor:3964};
  const summary = () => ({total:money,paid:{currency:'ZMW',amountMinor:0},remaining:money,status:'Unpaid',invoiceId,canPrepareCheckout:!invoiceId,checkoutMessage:null,receipts:[]});
  await page.route('**/api/gateway/**', async route => {
    const path = new URL(route.request().url()).pathname.split('/v1')[1];
    let data = [];
    if(path==='/session')data={id:'uat',firstName:'Test',lastName:'Customer',verified:true};
    if(path==='/shipments/38748')data={id:'38748',customerId:'uat',trackingNumber:'TEST38748',carrier:'New World Cargo',transportMode:'air',packageName:'Parcel',origin:'Lusaka',destination:'Kitwe',etaAt:null,etaLabel:'To be confirmed',status:'pending',statusLabel:'Approved',price:money,progress:0,events:[],allowedActions:[],revision:1};
    if(path==='/shipments/38748/delivery')data={revision:1};
    if(path==='/shipments/38748/payments')data=summary();
    if(path==='/shipments/38748/payments/checkout') {
      assert.equal(route.request().method(),'POST');preparations++;
      assert.deepEqual(route.request().postDataJSON(),{});
      if(failPreparation)return route.fulfill({status:503,json:{error:{code:'TEMPORARY',message:'Temporary failure'}}});
      invoiceId='123';data=summary();
    }
    if(path==='/payments/invoices/123/checkout')data={invoiceId,amount:money,methods:['mobile-money','card'],message:null};
    if(path==='/payments/invoices/123/intent')data=intent;
    if(path==='/payments/intents') {
      collections++;assert.equal(route.request().postDataJSON().invoiceId,'123');
      intent={id:'intent-123',status:'processing',method:'mobile-money',revision:1,amount:money};data=intent;
    }
    if(path==='/invoices')data=invoiceId?[{id:invoiceId,customerId:'uat',invoiceNumber:'REC-ONLINE',shipmentId:'38748',shipmentLabel:'TEST38748',route:'Lusaka to Kitwe',issuedAt:'2026-09-30T10:00:00Z',issuedAtLabel:'30 Sep 2026',dueAt:null,dueAtLabel:'Today',status:'unpaid',total:money,lineItems:[],paidAt:null,revision:1}]:[];
    return route.fulfill({json:{data}});
  });
  await page.goto(base+'/shipments/38748');
  const section=page.getByRole('region',{name:'Payments & receipts'});
  await section.getByRole('button',{name:'Pay now',exact:true}).click();
  await expect(section.getByRole('alert')).toContainText("We couldn't open checkout");
  assert.equal(collections,0);
  failPreparation=false;
  await section.getByRole('button',{name:'Pay now',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Make a payment',exact:true});
  await expect(dialog.getByLabel('Mobile money number')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Pay ZMW 39.64',exact:true})).toBeVisible();
  assert.equal(collections,0);assert.equal(preparations,2);
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await section.getByRole('button',{name:'Pay now',exact:true}).click();
  await expect(dialog.getByLabel('Mobile money number')).toBeVisible();
  assert.equal(preparations,2);
  await dialog.getByLabel('Mobile money number').fill('0972827372');
  await page.screenshot({path:`/tmp/nwc-self-service-${width}.png`,fullPage:true});
  await dialog.getByRole('button',{name:'Pay ZMW 39.64',exact:true}).click();
  await expect(dialog.getByText('Waiting for payment confirmation',{exact:true})).toBeVisible();
  assert.equal(collections,1);
  await page.goto(base+'/invoices');
  await page.getByRole('button').filter({hasText:'TEST38748'}).click();
  await page.getByRole('button',{name:'Pay invoice',exact:true}).click();
  await expect(dialog.getByText('Waiting for payment confirmation',{exact:true})).toBeVisible();
  assert.equal(collections,1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log(JSON.stringify({width,prepareRetry:true,reusesInvoice:true,shipmentAndInvoiceResume:true,collections}));
  await page.close();
}} finally {await browser.close();}
