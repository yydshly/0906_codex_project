const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[];
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const url=(process.env.SITE_URL||'http://127.0.0.1:8768/')+'demos/004-multica/';
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('#sim-status').waitFor();
  for(const key of ['system','execution','control','capability','guide']) {
    await page.locator(`[data-atlas="${key}"]`).click();
    await page.waitForFunction(()=>{const im=document.getElementById('atlas-image');return im.complete&&im.naturalWidth>0;});
    assert.equal(await page.locator(`[data-atlas="${key}"]`).getAttribute('aria-pressed'),'true');
  }
  for(let i=0;i<35 && !(await page.locator('#approve').isVisible());i++)await page.locator('#advance').click();
  assert.ok(await page.locator('#approve').isVisible(),'Human review must become available');
  assert.match(await page.locator('#sim-status').innerText(),/待人工审阅/);
  await page.locator('#approve').click();
  assert.match(await page.locator('#sim-status').innerText(),/已完成/);
  await page.locator('#directory-mode').selectOption('direct');
  await page.locator('#advance').click();await page.locator('#advance').click();
  assert.equal(await page.locator('.mc-job.running').count(),1);
  await page.locator('#directory-mode').selectOption('worktree');
  await page.locator('#reset').click();
  for(const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:1000});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert.equal(overflow,false,`No horizontal overflow at ${width}`);
    await page.locator('[data-atlas="control"]').click();
    await page.locator('[data-atlas="guide"]').click();
  }
  if(process.env.SCREENSHOT_DIR) {
    await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'web-desktop.png')});
    await page.setViewportSize({width:390,height:1000});await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'web-mobile.png')});
  }
  assert.deepEqual(errors,[],'Browser must not report missing resources or script errors');
  await browser.close();
  console.log('PASS: all atlas views; complete simulation; manual review; Direct serialization; 1440/768/390/320 layouts; no page or resource errors.');
})().catch(e=>{console.error(e);process.exit(1);});
