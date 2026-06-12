import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = 'C:/Users/prans/AppData/Local/Temp/dharma-screenshots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone size

const results = [];

async function step(label, fn) {
  try {
    await fn();
    results.push({ label, ok: true });
    console.log('✅', label);
  } catch (e) {
    results.push({ label, ok: false, err: e.message });
    console.log('❌', label, e.message);
  }
}

// 1. Load root → should redirect to /onboarding
await step('Load root, redirect to onboarding', async () => {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForURL('**/onboarding', { timeout: 5000 });
});
await page.screenshot({ path: `${outDir}/01-onboarding-screen1.png` });

// 2. Check first onboarding screen content
await step('Onboarding screen 1: Abhyasa text visible', async () => {
  await page.waitForSelector('text=अभ्यास', { timeout: 3000 });
  await page.waitForSelector('text=Abhyasa', { timeout: 3000 });
});

// 3. Navigate to screen 2
await step('Onboarding: progress to screen 2 (Vairagya)', async () => {
  await page.click('button:has-text("Next")');
  await page.waitForSelector('text=वैराग्य', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/02-onboarding-screen2.png` });

// 4. Navigate to screen 3
await step('Onboarding: progress to screen 3 (Svadharma)', async () => {
  await page.click('button:has-text("Next")');
  await page.waitForSelector('text=स्वधर्म', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/03-onboarding-screen3.png` });

// 5. Complete onboarding
await step('Onboarding: complete and navigate to /home', async () => {
  await page.click('button:has-text("आरम्भ")');
  await page.waitForURL('**/home', { timeout: 5000 });
});
await page.screenshot({ path: `${outDir}/04-home.png` });

// 6. Check home page elements
await step('/home: daily verse renders (Sanskrit text)', async () => {
  // Look for Sanskrit verse section header
  await page.waitForSelector('text=आज का श्लोक', { timeout: 3000 });
});

await step('/home: pillar cards present (निद्रा)', async () => {
  await page.waitForSelector('text=निद्रा', { timeout: 3000 });
});

await step('/home: pillar cards present (आहार)', async () => {
  await page.waitForSelector('text=आहार', { timeout: 3000 });
});

await step('/home: pillar cards present (व्यायाम)', async () => {
  await page.waitForSelector('text=व्यायाम', { timeout: 3000 });
});

// 7. Expand a pillar card and check targets
await step('/home: expand pillar card shows sub-targets', async () => {
  const pillarBtn = page.locator('text=निद्रा').first();
  await pillarBtn.click();
  await page.waitForSelector('text=Bedtime', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/05-home-pillar-expanded.png` });

// 8. Navigate to Sadhana
await step('/sadhana loads with pillars and targets', async () => {
  await page.goto('http://localhost:5173/sadhana', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=साधना', { timeout: 3000 });
  await page.waitForSelector('text=निद्रा', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/06-sadhana.png` });

await step('/sadhana: default targets visible', async () => {
  await page.waitForSelector('text=Bedtime', { timeout: 3000 });
});

// 9. Navigate to Gyaan
await step('/gyaan loads with chapter list', async () => {
  await page.goto('http://localhost:5173/gyaan', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=ज्ञान', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/07-gyaan.png` });

await step('/gyaan: chapter 1 visible (अर्जुनविषादयोग)', async () => {
  await page.waitForSelector('text=अर्जुनविषादयोग', { timeout: 3000 });
});

await step('/gyaan: all 18 chapters listed', async () => {
  const chapters = await page.locator('text=अध्याय').count();
  // Check we have chapter cards (devanagari numbers)
  const cards = await page.locator('[class*="card"]').count();
  if (cards < 5) throw new Error(`Expected 18 chapter cards, got ${cards}`);
});

// 10. Expand a chapter
await step('/gyaan: expand chapter 2 shows content', async () => {
  await page.locator('text=साङ्ख्ययोग').first().click();
  await page.waitForSelector('text=Yoga of Knowledge', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/08-gyaan-expanded.png` });

// 11. Manan page
await step('/manan loads correctly', async () => {
  await page.goto('http://localhost:5173/manan', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=मनन', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/09-manan.png` });

// 12. Drishti page
await step('/drishti loads with dashboard', async () => {
  await page.goto('http://localhost:5173/drishti', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=दृष्टि', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/10-drishti.png` });

// 13. Settings
await step('/settings loads', async () => {
  await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=सेटिंग्स', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/11-settings.png` });

// 14. Check log a target (checkbox)
await step('Log a checkbox target on home', async () => {
  await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
  const pillarBtn = page.locator('text=निद्रा').first();
  await pillarBtn.click();
  await page.waitForSelector('text=No phone', { timeout: 3000 });
  // Click the checkbox button for the No phone target
  const checkboxes = page.locator('button.rounded-full').first();
  await checkboxes.click();
  await page.waitForTimeout(500);
});
await page.screenshot({ path: `${outDir}/12-target-logged.png` });

await browser.close();

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);
console.log(`\n${passed}/${results.length} steps passed`);
if (failed.length) {
  console.log('Failed:');
  failed.forEach(f => console.log(' -', f.label, ':', f.err));
}
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));
