import { chromium } from 'playwright';
import pdfParse from 'pdf-parse';

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
    await pageInstance.setViewportSize({ width: 1440, height: 900 });
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
  console.log(`Searching for: ${address}`);
  await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.click('input[placeholder*="address" i], input[placeholder*="search" i], input[placeholder*="Enter address" i]');
  await page.waitForTimeout(500);
  await page.keyboard.type(address, { delay: 50 });
  await page.waitForTimeout(2000);

  const suggestion = await page.waitForSelector(
    '[role="option"]:first-child, [role="listbox"] li:first-child, [class*="autocomplete"] li:first-child',
    { timeout: 10000 }
  );
  await suggestion.click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('Clicking Analyze deal...');
  await page.click('a:has-text("Analyze deal"), button:has-text("Analyze deal")', { timeout: 15000 });
  await page.waitForURL((url) => url.toString().includes('insights.tractiq.com'), { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('Insights URL:', url);
  const poisMatch = url.match(/pois=([^&]+)/);
  const facilityIdMatch = url.match(/facility-id=([^&]+)/);
  const titleMatch = url.match(/title=([^&]+)/);
  if (!poisMatch || !facilityIdMatch) throw new Error(`Could not extract params from: ${url}`);

  return {
    pois: poisMatch[1],
    facilityId: facilityIdMatch[1],
    title: titleMatch ? decodeURIComponent(titleMatch[1]) : address,
  };
}

function buildTabUrl(tabPath, params) {
  const encodedTitle = encodeURIComponent(params.title);
  return `${INSIGHTS_URL}/#/selfstorage/${tabPath}?pois=${params.pois}&profile=radius&selection=3,5&title=${encodedTitle}&facility-id=${params.facilityId}&point-type=houseNumber`;
}

async function downloadTabPdf(page, tabPath, tabName, params) {
  const url = buildTabUrl(tabPath, params);
  console.log(`Downloading PDF for ${tabName}...`);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.click('button:has-text("PDF"), a:has-text("PDF"), [aria-label*="PDF"], button[title*="PDF"]', { timeout: 10000 });
  const download = await downloadPromise;

  const buffer = await new Promise((resolve, reject) => {
    download.createReadStream().then(stream => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });

  console.log(`PDF downloaded for ${tabName}: ${buffer.length} bytes`);
  return buffer;
}

export async function searchProperty(address) {
  const page = await getPage();
  try {
    await login(page);
    const params = await getInsightsParams(page, address);
    console.log('Got params:', params);

    const tabs = [
      { name: 'executive_summary', path: 'market-profile' },
      { name: 'demography', path: 'demography' },
      { name: 'opportunity', path: 'selfstorage-opportunity' },
      { name: 'rate_trends', path: 'selfstorage-price' },
      { name: 'rental_comps', path: 'selfstorage-comps' },
    ];

    const pdfTexts = {};
    for (const tab of tabs) {
      try {
        const buffer = await downloadTabPdf(page, tab.path, tab.name, params);
        const parsed = await pdfParse(buffer);
        pdfTexts[tab.name] = parsed.text;
        console.log(`Parsed ${tab.name}: ${parsed.text.length} chars`);
      } catch (err) {
        console.error(`Failed ${tab.name}:`, err.message);
        pdfTexts[tab.name] = null;
      }
    }

    return { address, params, timestamp: new Date().toISOString(), pdfTexts };
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
