import { chromium } from 'playwright';

const TRACTIQ_URL = 'https://app.tractiq.com';
const LOGIN_URL = 'https://app.tractiq.com/selfstorage/login';

let browserInstance = null;
let pageInstance = null;
let isLoggedIn = false;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    isLoggedIn = false;
  }
  return browserInstance;
}

async function getPage() {
  const browser = await getBrowser();
  if (!pageInstance || pageInstance.isClosed()) {
    pageInstance = await browser.newPage();
    await pageInstance.setViewportSize({ width: 1400, height: 900 });
    isLoggedIn = false;
  }
  return pageInstance;
}

async function login(page) {
  if (isLoggedIn) return;
  const email = process.env.TRACT_IQ_EMAIL;
  const password = process.env.TRACT_IQ_PASSWORD;
  if (!email || !password) throw new Error('TRACT_IQ_EMAIL and TRACT_IQ_PASSWORD env vars are required');
  console.log('Logging into Tract IQ...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', email);
  await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', password);
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")');
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  console.log('Login successful');
  isLoggedIn = true;
}

async function searchAddress(page, address) {
  console.log(`Searching for: ${address}`);
  await page.goto(TRACTIQ_URL, { waitUntil: 'networkidle', timeout: 30000 });
  const searchSelectors = [
    'input[placeholder*="search" i]',
    'input[placeholder*="address" i]',
    'input[aria-label*="search" i]',
    'input[type="search"]',
    '[data-testid="search-input"]',
    '.search-input input',
  ];
  let searchInput = null;
  for (const selector of searchSelectors) {
    try {
      searchInput = await page.waitForSelector(selector, { timeout: 3000 });
      if (searchInput) break;
    } catch { continue; }
  }
  if (!searchInput) throw new Error('Could not find search input on Tract IQ');
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type(address, { delay: 50 });
  await page.waitForTimeout(1500);
  const suggestionSelectors = [
    '[data-testid="suggestion-item"]:first-child',
    '.autocomplete-item:first-child',
    'li[role="option"]:first-child',
    '[role="listbox"] [role="option"]:first-child',
    '.dropdown-item:first-child',
  ];
  let clicked = false;
  for (const sel of suggestionSelectors) {
    try {
      await page.click(sel, { timeout: 3000 });
      clicked = true;
      break;
    } catch { continue; }
  }
  if (!clicked) await searchInput.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function extractData(page) {
  return await page.evaluate(() => {
    const text = document.body.innerText;
    const stats = [];
    document.querySelectorAll('[class*="stat"], [class*="metric"], [class*="card"], [class*="kpi"]').forEach(el => {
      const label = el.querySelector('[class*="label"], [class*="title"], h3, h4, p')?.innerText?.trim();
      const value = el.querySelector('[class*="value"], [class*="number"], strong, span')?.innerText?.trim();
      if (label && value) stats.push({ label, value });
    });
    const tables = [];
    document.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
        if (cells.length > 0) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });
    return { stats, tables, rawText: text.substring(0, 8000) };
  });
}

export async function searchProperty(address) {
  const page = await getPage();
  try {
    await login(page);
    await searchAddress(page, address);
    const data = await extractData(page);
    return { address, url: page.url(), timestamp: new Date().toISOString(), data };
  } catch (error) {
    console.error('searchProperty error:', error.message);
    isLoggedIn = false;
    throw error;
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    pageInstance = null;
    isLoggedIn = false;
  }
}

