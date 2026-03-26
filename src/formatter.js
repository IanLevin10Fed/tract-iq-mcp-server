export function formatPropertyData(raw) {
  if (!raw) return { error: 'No data returned' };
  const { address, url, timestamp, data } = raw;
  const text = data?.rawText || '';

  const extract = (patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m[1];
    }
    return null;
  };

  return {
    address,
    url,
    timestamp,
    supply: {
      facilities: extract([/facilit(?:ies|y)[:\s]+(\d+)/i, /(\d+)\s+facilit/i]),
      totalSF: extract([/(?:rentable\s+)?(?:sq\s*ft|sqft)[:\s]+([\d,]+)/i]),
      occupancyRate: extract([/occupancy[:\s]+([\d.]+)%/i, /([\d.]+)%\s+occup/i]),
      sfPerCapita: extract([/sf\s+per\s+capita[:\s]+([\d.]+)/i]),
      opportunityScore: extract([/(?:demand|opportunity)\s+score[:\s]+([\d.]+)/i]),
    },
    demographics: {
      population3mi: extract([/3[\s-]?mile[\s\S]{0,300}?population[\s\S]{0,50}?([\d,]+)/i]),
      population5mi: extract([/5[\s-]?mile[\s\S]{0,300}?population[\s\S]{0,50}?([\d,]+)/i]),
      population10mi: extract([/10[\s-]?mile[\s\S]{0,300}?population[\s\S]{0,50}?([\d,]+)/i]),
      medianIncome: extract([/median\s+(?:household\s+)?income[\s\S]{0,50}?\$?([\d,]+)/i]),
      avgIncome: extract([/average\s+(?:household\s+)?income[\s\S]{0,50}?\$?([\d,]+)/i]),
      renterPct: extract([/renter[\s\S]{0,30}?([\d.]+)%/i]),
      ownerPct: extract([/owner[\s\S]{0,30}?([\d.]+)%/i]),
      popGrowth: extract([/population\s+growth[\s\S]{0,30}?([\d.]+)%/i]),
      incomeGrowth: extract([/income\s+growth[\s\S]{0,30}?([\d.]+)%/i]),
    },
    rawStats: data?.stats || [],
    tables: data?.tables || [],
    rawText: text.substring(0, 2000),
  };
}

export function formatMarkdownReport(data) {
  if (data.error) return `❌ Error: ${data.error}`;
  const lines = [];
  lines.push(`# Tract IQ Market Report`);
  lines.push(`**Address:** ${data.address}`);
  lines.push(`**Source:** ${data.url}`);
  lines.push(`**Generated:** ${new Date(data.timestamp).toLocaleString()}\n`);

  lines.push(`## Supply & Occupancy`);
  const s = data.supply;
  if (s.facilities) lines.push(`- **Facilities:** ${s.facilities}`);
  if (s.totalSF) lines.push(`- **Total SF:** ${s.totalSF}`);
  if (s.occupancyRate) lines.push(`- **Occupancy:** ${s.occupancyRate}`);
  if (s.sfPerCapita) lines.push(`- **SF Per Capita:** ${s.sfPerCapita}`);
  if (s.opportunityScore) lines.push(`- **Opportunity Score:** ${s.opportunityScore}`);

  lines.push(`\n## Demographics`);
  const d = data.demographics;
  if (d.population3mi) lines.push(`- **Population (3mi):** ${d.population3mi}`);
  if (d.population5mi) lines.push(`- **Population (5mi):** ${d.population5mi}`);
  if (d.population10mi) lines.push(`- **Population (10mi):** ${d.population10mi}`);
  if (d.medianIncome) lines.push(`- **Median Income:** $${d.medianIncome}`);
  if (d.avgIncome) lines.push(`- **Avg Income:** $${d.avgIncome}`);
  if (d.renterPct) lines.push(`- **Renter %:** ${d.renterPct}%`);
  if (d.popGrowth) lines.push(`- **Pop Growth:** ${d.popGrowth}%`);
  if (d.incomeGrowth) lines.push(`- **Income Growth:** ${d.incomeGrowth}%`);

  if (data.rawStats.length > 0) {
    lines.push(`\n## All Extracted Stats`);
    data.rawStats.forEach(s => lines.push(`- **${s.label}:** ${s.value}`));
  }

  if (data.tables.length > 0) {
    lines.push(`\n## Data Tables`);
    data.tables.slice(0, 3).forEach((table, i) => {
      lines.push(`\n_Table ${i + 1}:_`);
      table.forEach(row => lines.push(`| ${row.join(' | ')} |`));
    });
  }

  lines.push(`\n---\n_Live data from Tract IQ_`);
  return lines.join('\n');
}
