import type { LocationProfile, ExecutiveSummaryMetrics, DemographicData, RentalComp } from './types.js';

export class DataFormatter {
  static formatMetricsToMarkdown(metrics: ExecutiveSummaryMetrics | DemographicData, title = 'Market Metrics'): string {
    const lines: string[] = [
      `## ${title}`,
      ''
    ];

    const metricsObj = metrics as Record<string, unknown>;
    for (const [key, value] of Object.entries(metricsObj)) {
      if (value === undefined || value === null) continue;
      const formattedKey = this.formatKeyForDisplay(key);
      const formattedValue = this.formatValueForDisplay(key, value);
      lines.push(`- **${formattedKey}**: ${formattedValue}`);
    }

    return lines.join('\n');
  }

  static formatLocationProfileToMarkdown(profile: LocationProfile): string {
    const sections: string[] = [
      `# Market Analysis: ${profile.address}`,
      '',
      `**Status**: ${profile.status}`,
      ''
    ];

    if (profile.executiveSummary) {
      sections.push('## Executive Summary');
      sections.push('');
      
      if (profile.executiveSummary.threeMile) {
        sections.push('### 3-Mile Radius');
        sections.push(this.formatMetricsToMarkdown(profile.executiveSummary.threeMile.metrics));
        sections.push('');
      }

      if (profile.executiveSummary.fiveMile) {
        sections.push('### 5-Mile Radius');
        sections.push(this.formatMetricsToMarkdown(profile.executiveSummary.fiveMile.metrics));
        sections.push('');
      }

      if (profile.executiveSummary.tenMile) {
        sections.push('### 10-Mile Radius');
        sections.push(this.formatMetricsToMarkdown(profile.executiveSummary.tenMile.metrics));
        sections.push('');
      }
    }

    if (profile.demographics) {
      sections.push('## Demographics');
      sections.push('');
      
      if (profile.demographics.threeMile) {
        sections.push('### 3-Mile Demographic Profile');
        sections.push(this.formatMetricsToMarkdown(profile.demographics.threeMile));
        sections.push('');
      }

      if (profile.demographics.fiveMile) {
        sections.push('### 5-Mile Demographic Profile');
        sections.push(this.formatMetricsToMarkdown(profile.demographics.fiveMile));
        sections.push('');
      }
    }

    if (profile.opportunity) {
      sections.push('## Market Opportunity');
      sections.push('');
      
      if (profile.opportunity.threeMile) {
        sections.push(`- **3-Mile Opportunity Score**: ${profile.opportunity.threeMile.score || 'N/A'}`);
      }
      if (profile.opportunity.fiveMile) {
        sections.push(`- **5-Mile Opportunity Score**: ${profile.opportunity.fiveMile.score || 'N/A'}`);
      }
      sections.push('');
    }

    if (profile.rateTrends && profile.rateTrends.length > 0) {
      sections.push('## Rate Trends');
      sections.push('');
      sections.push('| Month | Average Rate | Trend | Change |');
      sections.push('|-------|--------------|-------|--------|');
      
      for (const trend of profile.rateTrends) {
        sections.push(`| ${trend.month} | $${trend.averageRate.toFixed(2)} | ${trend.trend} | ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}% |`);
      }
      sections.push('');
    }

    if (profile.rentalComps && profile.rentalComps.length > 0) {
      sections.push('## Comparable Properties');
      sections.push('');
      sections.push('| Facility | Address | Rate | Distance | Occupancy |');
      sections.push('|----------|---------|------|----------|-----------|');
      
      for (const comp of profile.rentalComps) {
        sections.push(`| ${comp.facilityName} | ${comp.address} | $${comp.rate.toFixed(2)} | ${comp.distance.toFixed(1)} mi | ${(comp.occupancy * 100).toFixed(0)}% |`);
      }
      sections.push('');
    }

    if (profile.operatingPerformance) {
      sections.push('## Operating Performance');
      sections.push('');
      
      if (profile.operatingPerformance.fiveMile) {
        const perf = profile.operatingPerformance.fiveMile;
        sections.push('### 5-Mile Operating Metrics');
        sections.push(`- **Occupancy Rate**: ${(perf.occupancyRate * 100).toFixed(1)}%`);
        sections.push(`- **Rent Collection Rate**: ${(perf.rentCollectionRate * 100).toFixed(1)}%`);
        sections.push(`- **Average Unit Rent**: $${perf.averageUnitRent.toLocaleString()}`);
        sections.push(`- **Monthly Revenue**: $${perf.monthlyRevenue.toLocaleString()}`);
        sections.push(`- **Net Operating Income**: $${perf.netOperatingIncome.toLocaleString()}`);
        sections.push('');
      }
    }

    if (profile.mapLayers && profile.mapLayers.length > 0) {
      sections.push('## Available Map Layers');
      sections.push('');
      
      for (const layer of profile.mapLayers) {
        sections.push(`- **${layer.layerName}** (${layer.layerType}): ${layer.note || 'Interactive map layer'}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  static formatComparisonToMarkdown(comparisons: Array<{ address: string; metrics: Record<string, unknown> }>): string {
    const sections: string[] = [
      '# Market Comparison Analysis',
      ''
    ];

    if (comparisons.length > 0) {
      const headers = ['Metric', ...comparisons.map(c => c.address)];
      sections.push('| ' + headers.join(' | ') + ' |');
      sections.push('|' + headers.map(() => '-------').join('|') + '|');

      const metricsToCompare = [
        'population',
        'populationDensity',
        'medianHouseholdIncome',
        'numberOfFacilities',
        'occupancyRate'
      ];

      for (const metric of metricsToCompare) {
        const row = [this.formatKeyForDisplay(metric)];
        
        for (const comparison of comparisons) {
          const metricsObj = comparison.metrics as Record<string, unknown>;
          const value = metricsObj[metric] ?? 'N/A';
          row.push(String(value));
        }

        sections.push('| ' + row.join(' | ') + ' |');
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  private static formatKeyForDisplay(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private static formatValueForDisplay(key: string, value: unknown): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value !== 'number') return String(value);

    if (key.includes('Income') || key.includes('Revenue') || key.includes('NOI') || key.includes('Rent')) {
      return `$${Number(value).toLocaleString()}`;
    }

    if (key.includes('Percent') || key.includes('Rate')) {
      return `${(Number(value) * 100).toFixed(1)}%`;
    }

    if (key.includes('Density') || key.includes('Households') || key.includes('Facilities')) {
      return Number(value).toLocaleString();
    }

    if (key.includes('SquareFootage') || key.includes('Footage')) {
      return `${Number(value).toLocaleString()} sq ft`;
    }

    return String(value);
  }

  static convertToJSON(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }

  static summarizeProfile(profile: LocationProfile): string {
    const parts: string[] = [];

    if (profile.executiveSummary?.fiveMile?.metrics) {
      const metrics = profile.executiveSummary.fiveMile.metrics;
      parts.push(`📍 **Location**: ${profile.address}`);
      parts.push(`👥 **5-Mile Population**: ${Number(metrics.population ?? 0).toLocaleString()}`);
      parts.push(`🏢 **Facilities**: ${metrics.numberOfCurrentFacilities ?? 'N/A'}`);
      parts.push(`💰 **Median Income**: $${Number(metrics.medianHouseholdIncome ?? 0).toLocaleString()}`);
    }

    if (profile.opportunity?.fiveMile) {
      parts.push(`🎯 **Opportunity Score**: ${profile.opportunity.fiveMile.score ?? 'N/A'}/100`);
    }

    if (profile.operatingPerformance?.fiveMile) {
      const perf = profile.operatingPerformance.fiveMile;
      parts.push(`📊 **Market Occupancy**: ${(perf.occupancyRate * 100).toFixed(1)}%`);
    }

    return parts.join('\n');
  }
}
