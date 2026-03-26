import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import type { LocationProfile, ExecutiveSummaryMetrics } from './types.js';
import { DataFormatter } from './formatter.js';
import {
  SearchPropertyInputSchema,
  GetExecutiveSummaryInputSchema,
  GetDemographicsInputSchema,
  GetMarketAnalysisInputSchema,
  GetMapDataInputSchema,
  GenerateReportInputSchema,
  type SearchPropertyInput,
  type GetExecutiveSummaryInput,
  type GetDemographicsInput,
  type GetMarketAnalysisInput,
  type GetMapDataInput,
  type GenerateReportInput
} from "./schemas.js";

const server = new McpServer({
  name: "tract-iq-mcp-server",
  version: "1.0.0"
});

// Mock data generator for demonstration
function generateMockLocationProfile(address: string): LocationProfile {
  const mockProfile: LocationProfile = {
    address,
    latitude: 0,
    longitude: 0,
    status: 'active',
    executiveSummary: {
      threeMile: {
        radius: '3 Miles',
        metrics: {
          squareFootagePerCapita: 16.10,
          reitSquareFootagePerCapita: 7.72,
          nonReitSquareFootagePerCapita: 8.38,
          numberOfCurrentFacilities: 24,
          totalGrossSquareFootage: 1571386,
          totalNetRentableSquareFootage: 1435831,
          percentSqFtDriveUp: 69.61,
          percentCurrentFacilitiesOfferingClimateControl: 79.17,
          population: 89173,
          populationDensity: 3086.0,
          medianHouseholdIncome: 564284,
          averageHouseholdIncome: 79658.80,
          numberOfHouseholds: 37487,
          percentRenters: 43.8,
          percentHomeowners: 56.2
        }
      },
      fiveMile: {
        radius: '5 Miles',
        metrics: {
          squareFootagePerCapita: 13.51,
          reitSquareFootagePerCapita: 7.48,
          nonReitSquareFootagePerCapita: 6.03,
          numberOfCurrentFacilities: 63,
          totalGrossSquareFootage: 4252660,
          totalNetRentableSquareFootage: 3800702,
          percentSqFtDriveUp: 62.17,
          percentCurrentFacilitiesOfferingClimateControl: 80.95,
          population: 281406,
          populationDensity: 3762.3,
          medianHouseholdIncome: 573387,
          averageHouseholdIncome: 93578.91,
          numberOfHouseholds: 114166,
          percentRenters: 41.3,
          percentHomeowners: 58.7
        }
      }
    },
    demographics: {
      threeMile: {
        population: 89173,
        populationDensity: 3086.0,
        medianHouseholdIncome: 564284,
        averageHouseholdIncome: 79658.80,
        numberOfHouseholds: 37487,
        percentRenters: 43.8,
        percentHomeowners: 56.2,
        incomeGrowth: 2.3,
        jobGrowth: 1.8,
        populationGrowth: 1.5,
        educationAttainment: 'College: 28%, Some College: 22%'
      },
      fiveMile: {
        population: 281406,
        populationDensity: 3762.3,
        medianHouseholdIncome: 573387,
        averageHouseholdIncome: 93578.91,
        numberOfHouseholds: 114166,
        percentRenters: 41.3,
        percentHomeowners: 58.7,
        incomeGrowth: 2.1,
        jobGrowth: 1.9,
        populationGrowth: 1.6,
        educationAttainment: 'College: 32%, Some College: 24%'
      }
    },
    opportunity: {
      threeMile: { score: 78, rating: 'High' },
      fiveMile: { score: 82, rating: 'High' }
    },
    rateTrends: [
      { month: 'Jan 2024', averageRate: 1.15, trend: 'up', percentChange: 2.1 },
      { month: 'Feb 2024', averageRate: 1.18, trend: 'up', percentChange: 2.6 },
      { month: 'Mar 2024', averageRate: 1.16, trend: 'down', percentChange: -1.7 },
      { month: 'Apr 2024', averageRate: 1.19, trend: 'up', percentChange: 2.6 },
      { month: 'May 2024', averageRate: 1.21, trend: 'up', percentChange: 1.7 },
      { month: 'Jun 2024', averageRate: 1.23, trend: 'up', percentChange: 1.7 }
    ],
    rentalComps: [
      { facilityName: 'StorageMax Downtown', address: '123 Main St, San Antonio, TX', rate: 1.25, unitSize: '10x10', occupancy: 0.92, distance: 0.3 },
      { facilityName: 'SecureSpace', address: '456 Oak Ave, San Antonio, TX', rate: 1.18, unitSize: '10x10', occupancy: 0.88, distance: 0.5 },
      { facilityName: 'CityStorage Plus', address: '789 Elm Street, San Antonio, TX', rate: 1.22, unitSize: '10x10', occupancy: 0.85, distance: 0.7 }
    ],
    operatingPerformance: {
      threeMile: {
        occupancyRate: 0.87,
        rentCollectionRate: 0.96,
        averageUnitRent: 125,
        monthlyRevenue: 185000,
        operatingExpenses: 45000,
        netOperatingIncome: 140000
      },
      fiveMile: {
        occupancyRate: 0.85,
        rentCollectionRate: 0.97,
        averageUnitRent: 118,
        monthlyRevenue: 520000,
        operatingExpenses: 125000,
        netOperatingIncome: 395000
      }
    },
    mapLayers: [
      { layerName: 'Flood Zone Map', layerType: 'flood_zone', data: { status: 'available' }, note: 'Interactive map layer - hover to view detailed flood zones' },
      { layerName: 'Crime Index by Zip Code', layerType: 'crime_index', data: { status: 'available' }, note: 'EAIS crime index data - hover to view by area' },
      { layerName: 'Income Growth', layerType: 'income_growth', data: { status: 'available' }, note: 'Historical income growth trends - hover to view' },
      { layerName: 'Job Growth', layerType: 'job_growth', data: { status: 'available' }, note: 'Employment growth by sector - hover to view' },
      { layerName: 'Population Growth', layerType: 'population_growth', data: { status: 'available' }, note: 'Population density and growth rates - hover to view' },
      { layerName: 'Education', layerType: 'education', data: { status: 'available' }, note: 'Educational attainment levels - hover to view' }
    ]
  };
  return mockProfile;
}

// Tools
server.registerTool("tract_iq_search_property", {
  title: "Search Property in Tract IQ",
  description: "Search for a property and retrieve comprehensive market analysis data for 3-mile, 5-mile, and 10-mile radii.",
  inputSchema: SearchPropertyInputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
}, async (params: SearchPropertyInput) => {
  try {
    const profile = generateMockLocationProfile(params.address);
    const textContent = DataFormatter.formatLocationProfileToMarkdown(profile);
    return { content: [{ type: "text", text: textContent }], structuredContent: JSON.parse(DataFormatter.convertToJSON(profile)) };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

server.registerTool("tract_iq_get_executive_summary", {
  title: "Get Executive Summary Data",
  description: "Retrieve Executive Summary metrics including supply, facilities, occupancy, and demographic data.",
  inputSchema: GetExecutiveSummaryInputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
}, async (params: GetExecutiveSummaryInput) => {
  try {
    const profile = generateMockLocationProfile(params.address);
    if (!profile.executiveSummary) return { content: [{ type: "text", text: "No data" }] };
    
    let content = "";
    if (params.radius === "all" || params.radius === "3-mile") {
      if (profile.executiveSummary.threeMile) {
        content += DataFormatter.formatMetricsToMarkdown(profile.executiveSummary.threeMile.metrics, "3-Mile Executive Summary") + "\n\n";
      }
    }
    if (params.radius === "all" || params.radius === "5-mile") {
      if (profile.executiveSummary.fiveMile) {
        content += DataFormatter.formatMetricsToMarkdown(profile.executiveSummary.fiveMile.metrics, "5-Mile Executive Summary") + "\n\n";
      }
    }
    
    if (params.format === "markdown") {
      return { content: [{ type: "text", text: content }] };
    } else {
      return { content: [{ type: "text", text: DataFormatter.convertToJSON(profile.executiveSummary) }], structuredContent: JSON.parse(DataFormatter.convertToJSON(profile.executiveSummary)) };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

server.registerTool("tract_iq_get_demographics", {
  title: "Get Demographic Data",
  description: "Retrieve detailed demographic information including population, income, and growth trends.",
  inputSchema: GetDemographicsInputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
}, async (params: GetDemographicsInput) => {
  try {
    const profile = generateMockLocationProfile(params.address);
    if (!profile.demographics) return { content: [{ type: "text", text: "No data" }] };
    
    let content = "# Demographic Analysis\n\n";
    if (params.radius === "all" || params.radius === "3-mile") {
      if (profile.demographics.threeMile) {
        content += DataFormatter.formatMetricsToMarkdown(profile.demographics.threeMile, "3-Mile Demographics") + "\n\n";
      }
    }
    if (params.radius === "all" || params.radius === "5-mile") {
      if (profile.demographics.fiveMile) {
        content += DataFormatter.formatMetricsToMarkdown(profile.demographics.fiveMile, "5-Mile Demographics") + "\n\n";
      }
    }
    
    return { content: [{ type: "text", text: content }], structuredContent: JSON.parse(DataFormatter.convertToJSON(profile.demographics)) };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

server.registerTool("tract_iq_get_market_analysis", {
  title: "Get Comprehensive Market Analysis",
  description: "Retrieve market analysis including opportunity metrics, rate trends, rental comparables, and operating performance.",
  inputSchema: GetMarketAnalysisInputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
}, async (params: GetMarketAnalysisInput) => {
  try {
    const profile = generateMockLocationProfile(params.address);
    let content = `# Market Analysis: ${params.address}\n\n`;
    
    if (params.includeRateTrends && profile.rateTrends) {
      content += "## Rate Trends\n\n| Month | Rate | Trend | Change |\n|-------|------|-------|--------|\n";
      for (const trend of profile.rateTrends) {
        content += `| ${trend.month} | $${trend.averageRate.toFixed(2)} | ${trend.trend} | ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}% |\n`;
      }
      content += "\n";
    }
    
    if (params.includeRentalComps && profile.rentalComps) {
      content += "## Comparable Properties\n\n| Facility | Address | Rate | Distance | Occupancy |\n|----------|---------|------|----------|----------|\n";
      for (const comp of profile.rentalComps) {
        content += `| ${comp.facilityName} | ${comp.address} | $${comp.rate.toFixed(2)} | ${comp.distance.toFixed(1)} mi | ${(comp.occupancy * 100).toFixed(0)}% |\n`;
      }
      content += "\n";
    }
    
    if (params.includeOperatingMetrics && profile.operatingPerformance?.fiveMile) {
      const perf = profile.operatingPerformance.fiveMile;
      content += `## Operating Performance\n\n- **Occupancy**: ${(perf.occupancyRate * 100).toFixed(1)}%\n- **Collection Rate**: ${(perf.rentCollectionRate * 100).toFixed(1)}%\n- **Avg Rent**: $${perf.averageUnitRent}\n- **Monthly Revenue**: $${perf.monthlyRevenue.toLocaleString()}\n- **NOI**: $${perf.netOperatingIncome.toLocaleString()}\n\n`;
    }
    
    return { content: [{ type: "text", text: content }], structuredContent: JSON.parse(DataFormatter.convertToJSON({ address: params.address, rateTrends: profile.rateTrends, rentalComps: profile.rentalComps, operatingPerformance: profile.operatingPerformance })) };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

server.registerTool("tract_iq_get_map_data", {
  title: "Get Interactive Map Layer Data",
  description: "Retrieve interactive map layer data including flood zones, crime indices, and growth data.",
  inputSchema: GetMapDataInputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
}, async (params: GetMapDataInput) => {
  try {
    const profile = generateMockLocationProfile(params.address);
    if (!profile.mapLayers) return { content: [{ type: "text", text: "No map data" }] };
    
    const requestedLayers = params.layers.includes('all') ? profile.mapLayers : profile.mapLayers.filter(layer => (params.layers as string[]).includes(layer.layerType));
    
    if (params.format === "markdown") {
      let content = `# Map Layers: ${params.address}\n\n`;
      for (const layer of requestedLayers) {
        content += `## ${layer.layerName}\n**Type**: ${layer.layerType}\n**Status**: available\n**Note**: ${layer.note || 'Interactive map layer'}\n\n`;
      }
      return { content: [{ type: "text", text: content }] };
    } else {
      return { content: [{ type: "text", text: DataFormatter.convertToJSON(requestedLayers) }], structuredContent: JSON.parse(DataFormatter.convertToJSON({ mapLayers: requestedLayers })) };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

server.registerTool("tract_iq_generate_report", {
  title: "Generate Market Analysis Report",
  description: "Generate a comprehensive market analysis report in various formats.",
  inputSchema: GenerateReportInputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
}, async (params: GenerateReportInput) => {
  try {
    const profile = generateMockLocationProfile(params.address);
    let reportContent = "";
    
    switch (params.reportType) {
      case "executive_summary":
        reportContent = `# Executive Summary: ${params.address}\n\n${DataFormatter.summarizeProfile(profile)}\n\n${DataFormatter.formatLocationProfileToMarkdown(profile)}`;
        break;
      case "full_market_analysis":
        reportContent = DataFormatter.formatLocationProfileToMarkdown(profile);
        break;
      case "competitive_analysis":
        reportContent = `# Competitive Analysis: ${params.address}\n\n`;
        if (profile.rentalComps) {
          reportContent += "## Comparable Properties\n\n| Facility | Address | Rate | Distance |\n|----------|---------|------|----------|\n";
          for (const comp of profile.rentalComps) {
            reportContent += `| ${comp.facilityName} | ${comp.address} | $${comp.rate.toFixed(2)} | ${comp.distance.toFixed(1)} mi |\n`;
          }
        }
        reportContent += `\n## Opportunity\n- **3-Mile Score**: ${profile.opportunity?.threeMile?.score || 'N/A'}\n- **5-Mile Score**: ${profile.opportunity?.fiveMile?.score || 'N/A'}\n`;
        break;
      case "demographic_focus":
        reportContent = `# Demographic Analysis: ${params.address}\n\n${profile.demographics?.fiveMile ? DataFormatter.formatMetricsToMarkdown(profile.demographics.fiveMile, "5-Mile Demographics") : "No data"}`;
        break;
    }
    
    return { content: [{ type: "text", text: reportContent }], structuredContent: JSON.parse(DataFormatter.convertToJSON({ reportType: params.reportType, profile })) };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

// HTTP Server
async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on('close', () => {
      transport.close().catch((err) => {
        console.error("Transport close error:", err);
      });
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
  });

  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, () => {
    console.error(`MCP server running on http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
}

runHTTP().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
