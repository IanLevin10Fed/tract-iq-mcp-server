import { chromium } from 'playwright';

const APP_URL = 'https://app.tractiq.com';
const LOGIN_URL = 'https://app.tractiq.com/selfstorage/login';
const DASHBOARD_URL = 'https://dashboard.tractiq.com';
const INSIGHTS_URL = 'https://insights.tractiq.com';

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
  await page.click('input[type="submit"], input#login-form-submit, input[value="Login"]');
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  console.log('Login successful');
  isLoggedIn = true;
}

async function getInsightsParams(page, address) {
  console.log(`Searching for address: ${address}`);
  await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click search bar and type address
  await page.click('input[placeholder*="address" i], input[placeholder*="search" i], input[placeholder*="Enter address" i]');
  await page.waitForTimeout(500);
  await page.keyboard.type(address, { delay: 50 });
  await page.waitForTimeout(2000);

  // Click first suggestion
  const suggestion = await page.waitForSelector(
    '[role="option"]:first-child, [role="listbox"] li:first-child, .suggestion:first-child, [class*="autocomplete"] li:first-child',
    { timeout: 10000 }
  );
  await suggestion.click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click "Analyze deal" button
  console.log('Clicking Analyze deal...');
  await page.click('a:has-text("Analyze deal"), button:has-text("Analyze deal"), [href*="insights"]', { timeout: 15000 });

  // Wait for insights.tractiq.com to load
  await page.waitForURL((url) => url.toString().includes('insights.tractiq.com'), { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Extract params from URL
  const url = page.url();
  console.log('Insights URL:', url);

  const poisMatch = url.match(/pois=([^&]+)/);
  const facilityIdMatch = url.match(/facility-id=([^&]+)/);
  const titleMatch = url.match(/title=([^&]+)/);

  if (!poisMatch || !facilityIdMatch) {
    throw new Error(`Could not extract params from insights URL: ${url}`);
  }

  return {
    pois: poisMatch[1],
    facilityId: facilityIdMatch[1],
    title: titleMatch ? decodeURIComponent(titleMatch[1]) : address,
  };
}

function buildInsightsUrl(tab, params) {
  const { pois, facilityId, title } = params;
  const encodedTitle = encodeURIComponent(title);
  return `${INSIGHTS_URL}/#/selfstorage/${tab}?pois=${pois}&profile=radius&selection=3,5&title=${encodedTitle}&facility-id=${facilityId}&point-type=houseNumber`;
}

async function scrapeTab(page, url, tabName) {
  console.log(`Scraping ${tabName}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000); // Wait for charts/data to render

  return await page.evaluate((tab) => {
    const text = document.body.innerText;

    // Extract all label-value pairs from the data rows
    const rows = [];
    document.querySelectorAll('[class*="row"], [class*="metric"], [class*="stat"], tr, [class*="data-row"]').forEach(el => {
      const cells = Array.from(el.querySelectorAll('td, [class*="label"], [class*="value"], [class*="cell"]'));
      if (cells.length >= 2) {
        const label = cells[0].innerText.trim();
        const value = cells[cells.length - 1].innerText.trim();
        if (label && value && label !== value) rows.push({ label, value });
      }
    });

    // Extract tables
    const tables = [];
    document.querySelectorAll('table').forEach(table => {
      const tableRows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
        if (cells.some(c => c)) tableRows.push(cells);
      });
      if (tableRows.length > 1) tables.push(tableRows);
    });

    return { tab, rows, tables, rawText: text.substring(0, 10000) };
  }, tabName);
}

export async function searchProperty(address) {
  const page = await getPage();
  try {
    await login(page);
    const params = await getInsightsParams(page, address);
    console.log('Got insights params:', params);

    // Scrape all 5 tabs
    const tabs = [
      { name: 'executive_summary', path: 'market-profile' },
      { name: 'demography', path: 'demography' },
      { name: 'opportunity', path: 'selfstorage-opportunity' },
      { name: 'rate_trends', path: 'selfstorage-price' },
      { name: 'rental_comps', path: 'selfstorage-comps' },
    ];

    const results = {};
    for (const tab of tabs) {
      const url = buildInsightsUrl(tab.path, params);
      try {
        results[tab.name] = await scrapeTab(page, url, tab.name);
      } catch (err) {
        console.error(`Error scraping ${tab.name}:`, err.message);
        results[tab.name] = { error: err.message };
      }
    }

    return {
      address,
      params,
      timestamp: new Date().toISOString(),
      tabs: results,
    };
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

