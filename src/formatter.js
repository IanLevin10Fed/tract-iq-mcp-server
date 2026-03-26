/**
 * Tract IQ Scraper
 * Uses Playwright to log into Tract IQ and extract real market data.
 */

import { chromium } from 'playwright';

const TRACTIQ_URL = 'https://app.tractiq.com';
const LOGIN_URL = `${TRACTIQ_URL}/login`;

let browserInstance = null;
let pageInstance = null;
let isLoggedIn = false;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
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

  if (!email || !password) {
    throw new Error('TRACT_IQ_EMAIL and TRACT_IQ_PASSWORD environment variables are required');
  }

  console.log('Logging into Tract IQ...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Fill login form
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', email);
  await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', password);
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")');

  // Wait for redirect after login
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 });

  console.log('Login successful');
  isLoggedIn = true;
}

async function searchAddress(page, address) {
  console.log(`Searching for address: ${address}`);

  // Navigate to search or home
  await page.goto(TRACTIQ_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Find and use the search bar
  const searchSelectors = [
    'input[placeholder*="search" i]',
    'input[placeholder*="address" i]',
    'input[aria-label*="search" i]',
    'input[type="search"]',
    '[data-testid="search-input"]',
    '.search-input input',
    'input.search',
  ];

  let searchInput = null;
  for (const selector of searchSelectors) {
    try {
      searchInput = await page.waitForSelector(selector, { timeout: 3000 });
      if (searchInput) break;
    } catch {
      continue;
    }
  }

  if (!searchInput) {
    // Try clicking a search button/icon first
    const searchBtnSelectors = [
      'button[aria-label*="search" i]',
      '[data-testid="search-button"]',
      '.search-icon',
      'button.search',
    ];
    for (const sel of searchBtnSelectors) {
      try {
        await page.click(sel, { timeout: 2000 });
        break;
      } catch {
        continue;
      }
    }
    // Try again
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.waitForSelector(selector, { timeout: 3000 });
        if (searchInput) break;
      } catch {
        continue;
      }
    }
  }

  if (!searchInput) {
    throw new Error('Could not find search input on Tract IQ. The UI may have changed.');
  }

  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type(address, { delay: 50 });

  // Wait for autocomplete suggestions
  await page.waitForTimeout(1500);

  // Click first suggestion
  const suggestionSelectors = [
    '[data-testid="suggestion-item"]:first-child',
    '.autocomplete-item:first-child',
    '.suggestion:first-child',
    'li[role="option"]:first-child',
    '.dropdown-item:first-child',
    '[role="listbox"] [role="option"]:first-child',
  ];

  let clicked = false;
  for (const sel of suggestionSelectors) {
    try {
      await page.click(sel, { timeout: 3000 });
      clicked = true;
      break;
    } catch {
      continue;
    }
  }

  if (!clicked) {
    // Press Enter as fallback
    await searchInput.press('Enter');
  }

  // Wait for results page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function extractExecutiveSummary(page) {
  console.log('Extracting executive summary...');

  const data = await page.evaluate(() => {
    const result = {
      radii: {}
    };

    // Look for radius tabs (3-mile, 5-mile, 10-mile)
    const radiusLabels = ['3', '5', '10'];

    radiusLabels.forEach(r => {
      const radiusData = {};

      // Try to find data containers for each radius
      // Tract IQ typically shows supply, facilities, SF, occupancy per radius
      const allText = document.body.innerText;

      // Generic metric extraction - looks for labeled values
      const metrics = [
        { key: 'facilities', patterns: ['facilit', 'store', 'propert'] },
        { key: 'squareFootage', patterns: ['sq ft', 'square feet', 'sqft', 'rentable sf'] },
        { key: 'occupancyRate', patterns: ['occupancy', 'occupied'] },
        { key: 'population', patterns: ['population', 'residents'] },
        { key: 'medianIncome', patterns: ['median income', 'med income', 'household income'] },
        { key: 'sfPerCapita', patterns: ['sf per capita', 'sqft per capita', 'per capita'] },
      ];

      result.radii[`${r}-mile`] = radiusData;
    });

    // More targeted extraction: find all stat cards / metric blocks
    const statElements = document.querySelectorAll(
      '[class*="stat"], [class*="metric"], [class*="card"], [class*="summary"], [class*="kpi"], [class*="data-point"]'
    );

    const stats = [];
    statElements.forEach(el => {
      const label = el.querySelector('[class*="label"], [class*="title"], [class*="name"], h3, h4, p:first-child')?.innerText?.trim();
      const value = el.querySelector('[class*="value"], [class*="number"], [class*="amount"], strong, span:last-child')?.innerText?.trim();
      if (label && value) {
        stats.push({ label, value });
      }
    });

    result.stats = stats;

    // Also grab all visible text for fallback parsing
    result.rawText = document.body.innerText.substring(0, 5000);

    return result;
  });

  return data;
}

async function extractDemographics(page) {
  console.log('Extracting demographics...');

  return await page.evaluate(() => {
    const demographics = {};

    // Look for demographic section
    const demoSection = document.querySelector(
      '[class*="demograph"], [data-section="demographics"], #demographics, [aria-label*="demograph" i]'
    );

    const container = demoSection || document.body;

    const text = container.innerText;

    // Extract key demographic values using regex patterns
    const patterns = {
      population3mi: /3[\s-]?mile[\s\S]{0,200}?population[\s\S]{0,50}?([\d,]+)/i,
      population5mi: /5[\s-]?mile[\s\S]{0,200}?population[\s\S]{0,50}?([\d,]+)/i,
      population10mi: /10[\s-]?mile[\s\S]{0,200}?population[\s\S]{0,50}?([\d,]+)/i,
      medianIncome: /median\s+(?:household\s+)?income[\s\S]{0,50}?\$?([\d,]+)/i,
      avgIncome: /average\s+(?:household\s+)?income[\s\S]{0,50}?\$?([\d,]+)/i,
      households: /households?[\s\S]{0,50}?([\d,]+)/i,
      renterPct: /renter[\s\S]{0,30}?([\d.]+)%/i,
      ownerPct: /owner[\s\S]{0,30}?([\d.]+)%/i,
      popGrowth: /population\s+growth[\s\S]{0,30}?([\d.]+)%/i,
      incomeGrowth: /income\s+growth[\s\S]{0,30}?([\d.]+)%/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) demographics[key] = match[1];
    }

    // Grab structured table data if present
    const tables = document.querySelectorAll('table');
    const tableData = [];
    tables.forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
        if (cells.length > 0) rows.push(cells);
      });
      if (rows.length > 0) tableData.push(rows);
    });

    demographics.tables = tableData;
    demographics.rawText = text.substring(0, 3000);

    return demographics;
  });
}

async function extractRentalComps(page) {
  console.log('Extracting rental comps...');

  // Try to click the "Market Analysis" or "Comps" tab if it exists
  const compTabSelectors = [
    'button:has-text("Comps")',
    'button:has-text("Comparables")',
    'button:has-text("Market Analysis")',
    'tab:has-text("Comps")',
    '[role="tab"]:has-text("Comps")',
    '[role="tab"]:has-text("Market")',
    'a:has-text("Comps")',
    'a:has-text("Rental Comps")',
  ];

  for (const sel of compTabSelectors) {
    try {
      await page.click(sel, { timeout: 2000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(1000);
      break;
    } catch {
      continue;
    }
  }

  return await page.evaluate(() => {
    const comps = [];

    // Look for comp rows / competitor listings
    const compSelectors = [
      '[class*="comp"]',
      '[class*="competitor"]',
      '[class*="comparable"]',
      '[class*="facility-row"]',
      '[class*="store-row"]',
      'table tbody tr',
    ];

    let compElements = [];
    for (const sel of compSelectors) {
      compElements = document.querySelectorAll(sel);
      if (compElements.length > 1) break;
    }

    compElements.forEach(el => {
      const text = el.innerText;
      if (!text || text.length < 10) return;

      const comp = { raw: text.trim() };

      // Try to extract structured fields
      const nameEl = el.querySelector('[class*="name"], [class*="title"], td:first-child');
      const distEl = el.querySelector('[class*="distance"], [class*="dist"]');
      const rateEl = el.querySelector('[class*="rate"], [class*="price"]');
      const sizeEl = el.querySelector('[class*="size"], [class*="sf"], [class*="sqft"]');

      if (nameEl) comp.name = nameEl.innerText.trim();
      if (distEl) comp.distance = distEl.innerText.trim();
      if (rateEl) comp.rate = rateEl.innerText.trim();
      if (sizeEl) comp.size = sizeEl.innerText.trim();

      comps.push(comp);
    });

    // Also look for rate trend data
    const rateTrends = [];
    const rateElements = document.querySelectorAll('[class*="rate-trend"], [class*="rate-history"], [class*="pricing-trend"]');
    rateElements.forEach(el => {
      rateTrends.push(el.innerText.trim());
    });

    return {
      comps: comps.slice(0, 20), // Cap at 20
      rateTrends,
      rawText: document.body.innerText.substring(0, 3000),
    };
  });
}

async function extractSupplyData(page) {
  console.log('Extracting supply data...');

  return await page.evaluate(() => {
    const text = document.body.innerText;

    const supply = {};

    // SF per capita patterns
    const sfPerCapita = text.match(/sf\s+per\s+capita[\s\S]{0,30}?([\d.]+)/i);
    if (sfPerCapita) supply.sfPerCapita = sfPerCapita[1];

    // Total facilities
    const facilities = text.match(/(?:total\s+)?facilit(?:ies|y)[\s\S]{0,30}?(\d+)/i);
    if (facilities) supply.facilities = facilities[1];

    // Total SF
    const totalSF = text.match(/(?:total\s+)?(?:rentable\s+)?(?:sq\s*ft|square\s+feet|sqft)[\s\S]{0,30}?([\d,]+)/i);
    if (totalSF) supply.totalSF = totalSF[1];

    // Occupancy
    const occupancy = text.match(/(?:avg|average|market)?\s*occupancy[\s\S]{0,30}?([\d.]+)%/i);
    if (occupancy) supply.occupancyRate = occupancy[1] + '%';

    // New supply / pipeline
    const pipeline = text.match(/(?:new\s+supply|pipeline|under\s+construction)[\s\S]{0,50}?([\d,]+\s*(?:sq\s*ft|sf|units)?)/i);
    if (pipeline) supply.pipeline = pipeline[1];

    // Demand score / opportunity score
    const demandScore = text.match(/(?:demand|opportunity)\s+score[\s\S]{0,30}?([\d.]+(?:\/\d+)?)/i);
    if (demandScore) supply.opportunityScore = demandScore[1];

    // Grab all stat blocks
    const statBlocks = [];
    document.querySelectorAll('[class*="stat"], [class*="metric"], [class*="kpi"]').forEach(el => {
      statBlocks.push(el.innerText.trim());
    });

    supply.statBlocks = statBlocks;

    return supply;
  });
}

async function takeScreenshot(page, label) {
  try {
    const path = `/tmp/tractiq-${label}-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log(`Screenshot saved: ${path}`);
    return path;
  } catch (e) {
    console.error('Screenshot failed:', e.message);
    return null;
  }
}

export async function searchProperty(address) {
  const page = await getPage();

  try {
    await login(page);
    await searchAddress(page, address);

    // Take screenshot for debugging
    await takeScreenshot(page, 'after-search');

    // Extract all data in parallel where possible
    const [executiveSummary, demographics, rentalComps, supplyData] = await Promise.allSettled([
      extractExecutiveSummary(page),
      extractDemographics(page),
      extractRentalComps(page),
      extractSupplyData(page),
    ]);

    const currentUrl = page.url();

    return {
      address,
      url: currentUrl,
      timestamp: new Date().toISOString(),
      executiveSummary: executiveSummary.status === 'fulfilled' ? executiveSummary.value : { error: executiveSummary.reason?.message },
      demographics: demographics.status === 'fulfilled' ? demographics.value : { error: demographics.reason?.message },
      rentalComps: rentalComps.status === 'fulfilled' ? rentalComps.value : { error: rentalComps.reason?.message },
      supplyData: supplyData.status === 'fulfilled' ? supplyData.value : { error: supplyData.reason?.message },
    };
  } catch (error) {
    console.error('searchProperty error:', error.message);
    // Reset login state on error so next call tries fresh
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
