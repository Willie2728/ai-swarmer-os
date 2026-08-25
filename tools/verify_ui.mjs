import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/wilke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../artifacts/ui');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(out,'console-desktop.png'),fullPage:true});
  if(!await page.getByText('Security overview').isVisible())throw new Error('Defense console did not render.');
  await page.getByText('Investor intelligence room').click();
  await page.waitForURL('**/investor');
  await page.waitForLoadState('networkidle');
  if(!await page.getByText('Every AI agent needs a').isVisible())throw new Error('Investor room thesis did not render.');
  await page.screenshot({path:path.join(out,'investor-desktop.png'),fullPage:true});
  await page.locator('#guideInput').fill('How will you price the enterprise product?');
  await page.locator('#guideForm button').click();
  await page.waitForFunction(()=>document.querySelector('#conversation')?.textContent?.includes('STEWARD'));
  if(!(await page.locator('#conversation').textContent()).includes('planning hypotheses'))throw new Error('CFO diligence response did not render.');
  await page.screenshot({path:path.join(out,'investor-cfo-answer.png'),fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  if(overflow)throw new Error('Desktop investor room has horizontal overflow.');

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  mobile.on('pageerror',e=>errors.push(`mobile page: ${e.message}`));
  await mobile.goto('http://127.0.0.1:8080/investor',{waitUntil:'networkidle'});
  await mobile.locator('#openGuide').click();
  if(!await mobile.locator('#guideStudio').evaluate(el=>el.classList.contains('open')))throw new Error('Mobile guide studio did not open.');
  await mobile.screenshot({path:path.join(out,'investor-mobile.png'),fullPage:true});
  const mobileOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  if(mobileOverflow)throw new Error('Mobile investor room has horizontal overflow.');
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ok:true,screenshots:['console-desktop.png','investor-desktop.png','investor-cfo-answer.png','investor-mobile.png']}));
}finally{await browser.close()}
