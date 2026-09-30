import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--no-sandbox']});
try {
 for (const width of [390,1440]) for(const scenario of ['mobile','card','usd','unavailable','timeout','resume','failure','review']) {
  const page=await browser.newPage({viewport:{width,height:950}});
  let intent=scenario==='resume'?{id:'p1',status:'processing',method:'mobile-money',revision:1}:scenario==='review'?{id:'p1',status:'review',revision:1}:null;
  let posts=0;
  await page.route('**/api/gateway/**', async route=>{
   const url=route.request().url();
   if(url.endsWith('/session')) return route.fulfill({json:{data:{id:'uat',firstName:'Test',lastName:'Customer',email:'test@example.com',provider:'password',verified:true}}});
   if(url.endsWith('/checkout')) return route.fulfill({json:{data:{invoiceId:'1',amount:{currency:scenario==='usd'?'USD':'ZMW',amountMinor:12500},methods:scenario==='unavailable'?[]:scenario==='usd'?['card']:['mobile-money','card'],message:scenario==='unavailable'?'Please contact your branch to confirm the remaining bill.':null}}});
   if(url.includes('/payments/invoices/')) return route.fulfill({json:{data:intent}});
   if(url.endsWith('/payments/intents')) {
    posts++; const body=route.request().postDataJSON(); assert.equal(body.phone,'0972827372');
    assert.equal(body.amount,undefined);assert.equal(body.currency,undefined);assert.equal(body.amountMinor,undefined);
    if(scenario==='timeout')return route.fulfill({status:504,json:{error:{code:'TIMEOUT',message:'Request timeout'}}});
    intent={id:'p1',status:['card','usd'].includes(scenario)?'requires_action':scenario==='failure'?'failed':'processing',method:body.method,revision:1,checkoutUrl:['card','usd'].includes(scenario)?'https://checkout.primenetpay.com/payment-checkout/test':null};
    return route.fulfill({status:201,json:{data:intent}});
   }
   if(url.includes('/invoices'))return route.fulfill({json:{data:[{id:'1',customerId:'uat',invoiceNumber:'INV-UAT',shipmentId:'1',shipmentLabel:'LIP-UAT',route:'Lusaka to Kitwe',issuedAt:'2026-09-30T10:00:00Z',issuedAtLabel:'30 Sep 2026',dueAt:null,dueAtLabel:'Today',status:intent?.status==='succeeded'?'paid':'unpaid',total:{currency:'ZMW',amountMinor:10000},lineItems:[],paidAt:null,revision:1}]}});
   return route.fulfill({json:{data:[]}});
  });
  await page.goto((process.env.UAT_BASE_URL || 'http://localhost:5194') + '/invoices');
  await page.getByRole('button').filter({hasText:'LIP-UAT'}).click();
  await page.getByRole('button',{name:'Pay invoice',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Make a payment',exact:true});
  await expect(dialog).toBeVisible();
  if(scenario==='unavailable') {
   await expect(dialog.getByText('Please contact your branch to confirm the remaining bill.')).toBeVisible();
   assert.equal(await dialog.getByRole('button',{name:/^Pay /}).count(),0);
   await page.close();continue;
  }
  if(scenario==='resume'||scenario==='review') {
   await expect(dialog.getByRole('heading',{name:scenario==='review'?'Payment needs review':'Waiting for payment confirmation'})).toBeVisible();
   assert.equal(posts,0);
  } else {
   if(scenario!=='usd') {
    await expect(dialog.getByLabel('Mobile money number')).toBeVisible();
    assert.equal(await dialog.getByLabel('Mobile money number').inputValue(),'');
   }
   if(['card','usd'].includes(scenario)) {
    if(scenario==='usd')assert.equal(await dialog.getByRole('radio',{name:'Mobile money',exact:true}).count(),0);
    await dialog.getByRole('radio',{name:'Card',exact:true}).check();
    await dialog.getByLabel('Contact number').fill('0972827372');
    for(const [label,value] of Object.entries({'First name':'Test','Last name':'Customer','Email':'test@example.com','Billing address':'1 Main Road','City':'Lusaka','Postal code':'10101'})) await dialog.getByLabel(label,{exact:true}).fill(value);
    assert.equal(await dialog.locator('input[autocomplete="cc-number"], input[autocomplete="cc-csc"]').count(),0);
    await dialog.getByRole('button',{name:'Continue to card payment'}).click();
    await expect(dialog.getByRole('link',{name:'Continue to secure checkout'})).toHaveAttribute('href','https://checkout.primenetpay.com/payment-checkout/test');
   } else {
    await dialog.getByLabel('Mobile money number').fill('0972827372');
    await dialog.getByRole('button',{name:/^Pay /}).click();
    await expect(dialog.getByText(scenario==='timeout'?'We are checking whether your payment started. Do not pay again yet.':scenario==='failure'?'Payment was not completed. Check your details before trying again.':'Waiting for payment confirmation',{exact:true})).toBeVisible();
   }
   assert.equal(posts,1);
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`/tmp/lipila-${scenario}-${width}.png`,fullPage:true});
  if(scenario==='mobile') {
   intent={...intent,status:'succeeded',revision:2};
   await dialog.getByRole('button',{name:'Check payment status'}).click();
   await expect(dialog).toBeHidden();
  }
  console.log(JSON.stringify({width,scenario,passed:true,collectionRequests:posts}));
  await page.close();
 }
} finally {await browser.close();}
