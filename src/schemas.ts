import { z } from 'zod';

export const SearchPropertyInputSchema = z.object({
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters')
    .describe('Full property address (street, city, state, zip)'),
  includeMapLayers: z.boolean()
    .default(true)
    .describe('Whether to include interactive map layer data'),
  radiusPreference: z.enum(['3-mile', '5-mile', '10-mile', 'all'])
    .default('all')
    .describe('Which radius analysis to return (default: all available)')
}).strict();

export type SearchPropertyInput = z.infer<typeof SearchPropertyInputSchema>;

export const GetExecutiveSummaryInputSchema = z.object({
  address: z.string()
    .describe('Property address to analyze'),
  radius: z.enum(['3-mile', '5-mile', '10-mile', 'all'])
    .default('all')
    .describe('Which radius(es) to return'),
  format: z.enum(['json', 'markdown'])
    .default('json')
    .describe('Output format')
}).strict();

export type GetExecutiveSummaryInput = z.infer<typeof GetExecutiveSummaryInputSchema>;

export const GetDemographicsInputSchema = z.object({
  address: z.string()
    .describe('Property address'),
  radius: z.enum(['3-mile', '5-mile', '10-mile', 'all'])
    .default('all')
    .describe('Which radius(es) to return'),
  includeGrowthData: z.boolean()
    .default(true)
    .describe('Include population/income/job growth trends')
}).strict();

export type GetDemographicsInput = z.infer<typeof GetDemographicsInputSchema>;

export const GetMarketAnalysisInputSchema = z.object({
  address: z.string()
    .describe('Property address'),
  includeRateTrends: z.boolean()
    .default(true)
    .describe('Include historical rate trends'),
  includeRentalComps: z.boolean()
    .default(true)
    .describe('Include nearby rental comparables'),
  includeOperatingMetrics: z.boolean()
    .default(true)
    .describe('Include operating performance data'),
  radius: z.enum(['3-mile', '5-mile', '10-mile', 'all'])
    .default('5-mile')
    .describe('Radius for market analysis')
}).strict();

export type GetMarketAnalysisInput = z.infer<typeof GetMarketAnalysisInputSchema>;

export const GetMapDataInputSchema = z.object({
  address: z.string()
    .describe('Property address'),
  layers: z.array(z.enum([
    'flood_zone',
    'crime_index',
    'income_growth',
    'job_growth',
    'population_growth',
    'education',
    'all'
  ]))
    .default(['all'])
    .describe('Which map layers to retrieve'),
  format: z.enum(['json', 'markdown'])
    .default('json')
    .describe('Output format')
}).strict();

export type GetMapDataInput = z.infer<typeof GetMapDataInputSchema>;

export const GenerateReportInputSchema = z.object({
  address: z.string()
    .describe('Property address'),
  reportType: z.enum(['executive_summary', 'full_market_analysis', 'competitive_analysis', 'demographic_focus'])
    .default('executive_summary')
    .describe('Type of report to generate'),
  radius: z.enum(['3-mile', '5-mile', '10-mile'])
    .default('5-mile')
    .describe('Radius for analysis'),
  format: z.enum(['markdown', 'json'])
    .default('markdown')
    .describe('Output format')
}).strict();

export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
