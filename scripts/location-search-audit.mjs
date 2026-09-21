import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ headless:true, args:process.env.UAT_PUBLIC_DNS_IP ? [`--host-resolver-rules=MAP app.newworldcargo.com ${process.env.UAT_PUBLIC_DNS_IP}`] : [] });
const base = process.env.UAT_BASE_URL || 'http://localhost:5193';
const offices = [
 {id:'1',name:'Dubai office',city:'Dubai',country:'United Arab Emirates',address:'Dubai, United Arab Emirates',latitude:25.2,longitude:55.27},
 {id:'2',name:'Lusaka office',city:'Lusaka',country:'Zambia',address:'Lusaka, Zambia',latitude:-15.38,longitude:28.32},
 {id:'3',name:'Kitwe office',city:'Kitwe',country:'Zambia',address:'Kitwe, Zambia',latitude:-12.8,longitude:28.2},
];
try {
 for (const width of [1440,390]) for (const service of ['import','intercity','local','custom']) {
  const page = await browser.newPage({viewport:{width,height:900}});
  await page.route('**/api/gateway/**', route => {
   const path = new URL(route.request().url()).pathname.split('/v1')[1];
   return route.fulfill({json:{data:path==='/session'?{id:'uat',firstName:'Test',lastName:'Customer',verified:true}:path==='/reference-data'?{offices,deliveryOptions:[],transportOptions:[]}:[]}});
  });
  await page.route('**/maps.googleapis.com/**', route=>route.abort());
  const searches=[];
  await page.route('**/places.googleapis.com/v1/places:autocomplete', route=>{
   const query=route.request().postDataJSON().input; searches.push(query);
   return route.fulfill({json:{suggestions:query==='Riverside'?[{placePrediction:{placeId:'river',structuredFormat:{mainText:{text:'Riverside'},secondaryText:{text:'Kitwe, Zambia'}}}}]:[]}});
  });
  await page.goto(`${base}/send/${service}/route`);
  const inputs=page.locator('input[role="combobox"]:visible');
  await expect(inputs).toHaveCount(2);
  await inputs.first().fill(service==='import'?'rueir dubai':'lusaka lklk');
  const expected=service==='import'?'Dubai office':'Lusaka office';
  await expect(page.getByRole('option').first()).toContainText(expected);
  await inputs.first().press('Enter');
  await expect(inputs.first()).toHaveValue(new RegExp(expected));
  await inputs.nth(1).fill('kitwwe xxzz');
  await expect(page.getByRole('option').first()).toContainText('Kitwe office');
  await inputs.nth(1).press('ArrowDown');
  await inputs.nth(1).press('ArrowUp');
  await inputs.nth(1).press('Enter');
  await expect(inputs.nth(1)).toHaveValue(/Kitwe office/);
  if(service!=='import') {
   await inputs.first().fill('Riverside qzxj');
   await expect(page.getByRole('option').filter({hasText:'Riverside'})).toBeVisible();
   expect(searches).toContain('Riverside qzxj'); expect(searches).toContain('Riverside');
  }
  await page.screenshot({path:`/tmp/nwc-location-search-${service}-${width}.png`,fullPage:true});
  console.log(`PASS ${service} ${width}: tolerant pickup/destination search, keyboard selection${service!=='import'?', live-search fallback':''}`);
  await page.close();
 }
} finally {await browser.close();}
