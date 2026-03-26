function extractValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function parseKeyValueLines(text) {
  const result = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i++) {
    const label = lines[i];
    const value = lines[i + 1];
    // Value looks like a number, percentage, or dollar amount
    if (/^[\$\d][\d,.\s%$NAna\/]*$/.test(value) && label.length > 2 && label.length < 60) {
      const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      result[key] = value;
      i++; // skip value line
    }
  }
  return result;
}

function parseExecutiveSummary(text) {
  if (!text) return null;
  const kv = parseKeyValueLines(text);

  // Also try direct regex extraction for key metrics
  const extract = (patterns) => extractValue(text, patterns);

  return {
    // Supply
    sfPerCapita: extract([/Square Footage per Capita[\s\n]+([\d.]+)/i]),
    reitSfPerCapita: extract([/REIT Square Footage per Capita[\s\n]+([\d.NAna]+)/i]),
    nonReitSfPerCapita: extract([/Non-REIT Square Footage per Capita[\s\n]+([\d.]+)/i]),
    facilities: extract([/Number of Current Facilities[\s\n]+(\d+)/i]),
    totalGrossSF: extract([/Total Gross Square Footage[\s\n]+([\d,]+)/i]),
    totalNetRentableSF: extract([/Total Net Rentable Square Footage[\s\n]+([\d,]+)/i]),
    pctDriveUp: extract([/% Sq Ft that is Drive Up[\s\n]+([\d.%]+)/i]),
    pctClimateControl: extract([/% Current Facilities Offering Climate Control[\s\n]+([\d.%]+)/i]),
    // Demographics
    population: extract([/Population[\s\n]+([\d,]+)/i]),
    populationDensity: extract([/Population Density[\s\n]+([\d,.]+)/i]),
    medianHouseholdIncome: extract([/Median Household Income[\s\n]+\$?([\d,]+)/i]),
    avgHouseholdIncome: extract([/Average Household Income[\s\n]+\$?([\d,.]+)/i]),
    households: extract([/Number of Households[\s\n]+([\d,]+)/i]),
    pctRenters: extract([/% Renters[\s\n]+([\d.%]+)/i]),
    pctHomeowners: extract([/% Homeowners[\s\n]+([\d.%]+)/i]),
    sfPerHousehold: extract([/Sq\. Ft\. per Household[\s\n]+([\d,]+)/i]),
    // Projections
    newFacilitiesInDevelopment: extract([/New Facilities in Development[\s\n]+(\d+)/i]),
    _raw: kv,
  };
}

function parseDemography(text) {
  if (!text) return null;
  const extract = (patterns) => extractValue(text, patterns);
  return {
    totalPopulation3mi: extract([/3 Miles?[\s\S]{0,200}?Total Population[\s\n]+([\d,]+)/i]),
    totalPopulation5mi: extract([/5 Miles?[\s\S]{0,200}?Total Population[\s\n]+([\d,]+)/i]),
    daytimePopulation3mi: extract([/3 Miles?[\s\S]{0,200}?Daytime Population[\s\n]+([\d,]+)/i]),
    daytimePopulation5mi: extract([/5 Miles?[\s\S]{0,200}?Daytime Population[\s\n]+([\d,]+)/i]),
    medianIncome3mi: extract([/3 Miles?[\s\S]{0,300}?Median Household Income[\s\n]+\$?([\d,]+)/i]),
    medianIncome5mi: extract([/5 Miles?[\s\S]{0,300}?Median Household Income[\s\n]+\$?([\d,]+)/i]),
    avgIncome3mi: extract([/3 Miles?[\s\S]{0,300}?Average Household Income[\s\n]+\$?([\d,.]+)/i]),
    avgIncome5mi: extract([/5 Miles?[\s\S]{0,300}?Average Household Income[\s\n]+\$?([\d,.]+)/i]),
    pctRenters3mi: extract([/3 Miles?[\s\S]{0,300}?% Renters[\s\n]+([\d.%]+)/i]),
    pctRenters5mi: extract([/5 Miles?[\s\S]{0,300}?% Renters[\s\n]+([\d.%]+)/i]),
    _rawKv: parseKeyValueLines(text),
  };
}

function parseOpportunity(text) {
  if (!text) return null;
  const extract = (patterns) => extractValue(text, patterns);
  return {
    sfPerCapitaCurrent3mi: extract([/3 Miles?[\s\S]{0,200}?Current[\s\n]+([\d.]+)/i]),
    sfPerCapitaCurrent5mi: extract([/5 Miles?[\s\S]{0,200}?Current[\s\n]+([\d.]+)/i]),
    sfPerCapitaCensusProjection3mi: extract([/3 Miles?[\s\S]{0,300}?Census Projection[\s\n]+([\d.]+)/i]),
    sfPerCapitaCensusProjection5mi: extract([/5 Miles?[\s\S]{0,300}?Census Projection[\s\n]+([\d.]+)/i]),
    _rawKv: parseKeyValueLines(text),
  };
}

function parseRateTrends(text) {
  if (!text) return null;
  const extract = (patterns) => extractValue(text, patterns);
  return {
    facilities3mi: extract([/3 Mile radius[\s\S]{0,100}?(\d+)[\s\n]+\d+/i]),
    facilities5mi: extract([/5 Mile radius[\s\S]{0,100}?(\d+)[\s\n]+\d+/i]),
    facilitiesWithPricingData3mi: extract([/3 Mile radius[\s\S]{0,200}?(\d+)\s*$/im]),
    facilitiesWithPricingData5mi: extract([/5 Mile radius[\s\S]{0,200}?(\d+)\s*$/im]),
    _rawKv: parseKeyValueLines(text),
    _rawText: text.substring(0, 3000),
  };
}

function parseRentalComps(text) {
  if (!text) return null;

  // Parse the comps table - each facility has name, address, sq ft, distance, and rate columns
  const comps = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let currentComp = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect facility name lines (followed by address)
    if (line.match(/Storage|Self Storage|U-Haul|CubeSmart|Extra Space|Public Storage|Life Storage/i) &&
        !line.match(/^\$|^[\d.]+$|^N\/A$/)) {
      if (currentComp) comps.push(currentComp);
      currentComp = { name: line, rates: {} };
    }

    // Detect rate values
    if (currentComp && line.match(/^\$[\d.]+$/)) {
      // Assign to rate slots
      const rateKeys = ['cc_5x5', 'cc_5x10', 'cc_10x10', 'cc_10x15', 'cc_10x20', 'cc_10x30',
                        'ncc_5x5', 'ncc_5x10', 'ncc_10x10', 'ncc_10x15', 'ncc_10x20', 'ncc_10x30'];
      const filledCount = Object.keys(currentComp.rates).length;
      if (filledCount < rateKeys.length) {
        currentComp.rates[rateKeys[filledCount]] = line;
      }
    }

    // Distance
    if (currentComp && line.match(/^\d+\.?\d*\s*miles?$/i)) {
      currentComp.distance = line;
    }

    // Square footage
    if (currentComp && line.match(/^[\d,]+\s*sq\.\s*feet$/i)) {
      currentComp.sqFt = line;
    }
  }
  if (currentComp) comps.push(currentComp);

  return {
    comps: comps.slice(0, 30),
    _rawText: text.substring(0, 5000),
  };
}

export function formatPropertyData(raw) {
  if (!raw) return { error: 'No data returned' };
  const { address, params, timestamp, pdfTexts } = raw;

  return {
    address,
    timestamp,
    insightsUrl: params ? `https://insights.tractiq.com/#/selfstorage/market-profile?pois=${params.pois}&profile=radius&selection=3,5&facility-id=${params.facilityId}&point-type=houseNumber` : null,
    executiveSummary: parseExecutiveSummary(pdfTexts?.executive_summary),
    demography: parseDemography(pdfTexts?.demography),
    opportunity: parseOpportunity(pdfTexts?.opportunity),
    rateTrends: parseRateTrends(pdfTexts?.rate_trends),
    rentalComps: parseRentalComps(pdfTexts?.rental_comps),
  };
}

export function formatMarkdownReport(data) {
  if (data.error) return `Error: ${data.error}`;
  const lines = [];
  lines.push(`# Tract IQ Report: ${data.address}`);
  lines.push(`Generated: ${new Date(data.timestamp).toLocaleString()}\n`);

  const s = data.executiveSummary;
  if (s) {
    lines.push(`## Executive Summary`);
    if (s.sfPerCapita) lines.push(`- SF per Capita: ${s.sfPerCapita}`);
    if (s.facilities) lines.push(`- Facilities: ${s.facilities}`);
    if (s.totalNetRentableSF) lines.push(`- Net Rentable SF: ${s.totalNetRentableSF}`);
    if (s.pctClimateControl) lines.push(`- % Climate Control: ${s.pctClimateControl}`);
    if (s.pctDriveUp) lines.push(`- % Drive Up: ${s.pctDriveUp}`);
    if (s.population) lines.push(`- Population: ${s.population}`);
    if (s.medianHouseholdIncome) lines.push(`- Median HH Income: $${s.medianHouseholdIncome}`);
    if (s.pctRenters) lines.push(`- % Renters: ${s.pctRenters}`);
  }

  const c = data.rentalComps;
  if (c?.comps?.length > 0) {
    lines.push(`\n## Rental Comps (${c.comps.length} facilities)`);
    lines.push(`| Facility | Distance | 10x10 CC | 10x10 NCC |`);
    lines.push(`|----------|----------|----------|-----------|`);
    c.comps.forEach(comp => {
      lines.push(`| ${comp.name} | ${comp.distance || 'N/A'} | ${comp.rates?.cc_10x10 || 'N/A'} | ${comp.rates?.ncc_10x10 || 'N/A'} |`);
    });
  }

  return lines.join('\n');
}
