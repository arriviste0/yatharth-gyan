import { chromium } from 'playwright';
import fs from 'fs';

const outDir = 'C:/Users/prans/AppData/Local/Temp/dharma-screenshots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

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

// 2. Check first onboarding screen content (Sanskrit accent + English word both present)
await step('Onboarding screen 1: Abhyasa visible', async () => {
  await page.waitForSelector('text=अभ्यास', { timeout: 3000 });
  await page.waitForSelector('text=Abhyāsa', { timeout: 3000 });
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

// 5. Complete onboarding — button now says "Begin practice"
await step('Onboarding: complete and navigate to /home', async () => {
  await page.click('button:has-text("Begin practice")');
  await page.waitForURL('**/home', { timeout: 5000 });
});
await page.screenshot({ path: `${outDir}/04-home.png` });

// 6. Check home page elements (English UI)
await step('/home: greeting visible', async () => {
  // Matches "Good morning", "Good afternoon", "Good evening", "Evening", "Still up?"
  await page.waitForSelector('h1', { timeout: 3000 });
});

await step('/home: "Verse of the day" section header visible', async () => {
  await page.waitForSelector('text=Verse of the day', { timeout: 3000 });
});

await step("/home: Today's practice section visible", async () => {
  await page.waitForSelector("text=Today's practice", { timeout: 3000 });
});

// Pillars still show Sanskrit accent — PillarCard renders pillar.english (Sleep/Food/Gym)
await step('/home: pillar card Sleep present', async () => {
  await page.waitForSelector('text=Sleep', { timeout: 3000 });
});

await step('/home: pillar card Food present', async () => {
  await page.waitForSelector('text=Food', { timeout: 3000 });
});

await step('/home: pillar card Gym present', async () => {
  await page.waitForSelector('text=Gym', { timeout: 3000 });
});

// 7. Pillars start expanded (≤3 pillars → defaultExpanded=true)
await step('/home: Sleep sub-targets visible by default', async () => {
  await page.waitForSelector('text=Bedtime', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/05-home-pillar-expanded.png` });

// 8. Navigate to Sadhana (now titled "Pillars")
await step('/sadhana loads with English heading', async () => {
  await page.goto('http://localhost:5173/sadhana', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1:has-text("Pillars")', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/06-sadhana.png` });

await step('/sadhana: Sleep pillar card visible', async () => {
  await page.waitForSelector('text=Sleep', { timeout: 3000 });
});

await step('/sadhana: default targets visible', async () => {
  await page.waitForSelector('text=Bedtime', { timeout: 3000 });
});

// 9. Navigate to Gyaan (now titled "Wisdom")
await step('/gyaan loads with English heading', async () => {
  await page.goto('http://localhost:5173/gyaan', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1:has-text("Wisdom")', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/07-gyaan.png` });

await step('/gyaan: chapter 1 Sanskrit name visible', async () => {
  await page.waitForSelector('text=अर्जुनविषादयोग', { timeout: 3000 });
});

// 10. Expand a chapter
await step('/gyaan: expand chapter 2 shows essence text', async () => {
  await page.locator('text=साङ्ख्ययोग').first().click();
  await page.waitForSelector('text=Key Shlokas', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/08-gyaan-expanded.png` });

// 11. Manan / Journal page
await step('/manan loads with English heading', async () => {
  await page.goto('http://localhost:5173/manan', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1:has-text("Journal")', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/09-manan.png` });

await step('/manan: this week section visible', async () => {
  await page.waitForSelector('text=This Week', { timeout: 3000 });
});

// 12. Drishti / Dashboard page
await step('/drishti loads with English heading', async () => {
  await page.goto('http://localhost:5173/drishti', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/10-drishti.png` });

await step('/drishti: 90 Days heatmap section visible', async () => {
  await page.waitForSelector('text=90 Days', { timeout: 3000 });
});

// 13. Settings
await step('/settings loads with English heading', async () => {
  await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1:has-text("Settings")', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/11-settings.png` });

await step('/settings: Export Data button visible', async () => {
  await page.waitForSelector('text=Export Data', { timeout: 3000 });
});

await step('/settings: Import Data button visible', async () => {
  await page.waitForSelector('text=Import Data', { timeout: 3000 });
});

// 14. Focus timer on home
await step('/home: Focus Timer button opens modal', async () => {
  await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle' });
  await page.click('[title="Focus Timer"]');
  await page.waitForSelector('text=Focus Timer', { timeout: 3000 });
});
await page.screenshot({ path: `${outDir}/12-focus-timer.png` });

await browser.close();

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);
console.log(`\n${passed}/${results.length} steps passed`);
if (failed.length) {
  console.log('Failed:');
  failed.forEach(f => console.log(' -', f.label, ':', f.err));
}
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));
console.log(`\nScreenshots saved to: ${outDir}`);
