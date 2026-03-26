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
      { facilityNa
