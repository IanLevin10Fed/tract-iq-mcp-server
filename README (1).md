# Tract IQ MCP Server

A Model Context Protocol (MCP) server that enables Claude to access and analyze Tract IQ self-storage market data through automated browser automation.

## 🎯 Quick Overview

This MCP server provides Claude with 6 powerful tools to query Tract IQ data:

1. **Search Property** — Get complete market analysis for any address
2. **Executive Summary** — Supply/facility metrics for 3-5-10 mile radii
3. **Demographics** — Population, income, growth data
4. **Market Analysis** — Rate trends, rental comps, operating performance
5. **Map Layers** — Flood zones, crime indices, growth data
6. **Generate Report** — Formatted market analysis reports

## ✨ Features

### Data Extraction (Tier 1 - Core)
- ✅ Executive Summary (supply, facilities, occupancy, demographics)
- ✅ Demographics (population, income, households, renter/owner %)
- ✅ Opportunity metrics & ratings
- ✅ Rate Trends (historical pricing)
- ✅ Rental Comparables

### Advanced Features (Tier 2)
- ✅ Operating Performance (occupancy, rent collection, NOI)
- ✅ Interactive Map Layers:
  - Flood Zone Maps
  - EAIS Crime Index by Zip Code
  - Income Growth Trends
  - Job Growth by Sector
  - Population Growth & Density
  - Educational Attainment

## 🚀 Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/tract-iq-mcp-server
cd tract-iq-mcp-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
```bash
cp .env.example .env
# Edit .env and add your credentials
```

### 4. Build & Run Locally
```bash
npm run build
npm start
```

Server will run on `http://localhost:3000/mcp`

## 🌐 Deploy to Netlify (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select your GitHub repository
4. Netlify will auto-detect build settings

### Step 3: Add Environment Variables
In Netlify Dashboard:
1. Go to **Site Settings → Build & Deploy → Environment**
2. Add variables:
   - `TRACT_IQ_EMAIL`: `ilevin@10federal.com`
   - `TRACT_IQ_PASSWORD`: `10Federal2025!`
   - `TRANSPORT`: `http`

### Step 4: Deploy
- Netlify auto-deploys on push to main
- Your URL: `https://your-site-name.netlify.app/mcp`

## 🔗 Integrate with Claude

Once deployed, you can use the MCP server in multiple ways:

### Option A: Claude Desktop (Recommended)
1. Download [Claude Desktop](https://claude.ai/download)
2. Edit `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tract-iq": {
      "command": "curl",
      "args": ["-X", "POST", "https://your-site.netlify.app/mcp"],
      "env": {
        "TRACT_IQ_EMAIL": "ilevin@10federal.com",
        "TRACT_IQ_PASSWORD": "10Federal2025!"
      }
    }
  }
}
```

3. Restart Claude Desktop
4. Ask Claude questions about properties!

### Option B: API Calls (For Automation)
```bash
curl -X POST https://your-site.netlify.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "tract_iq_search_property",
      "arguments": {
        "address": "10915 Nacogdoches Rd, San Antonio, TX 78217-2852"
      }
    }
  }'
```

## 💡 Usage Examples

### Example 1: Quick Market Analysis
```
User: "Search 10915 Nacogdoches Rd, San Antonio, TX and summarize the 5-mile market"

Claude queries: tract_iq_search_property
Returns: Full market analysis with all metrics
```

### Example 2: Competitive Analysis
```
User: "What are the rental comps for 123 Main St, Raleigh, NC?"

Claude queries: tract_iq_get_market_analysis
Returns: Table of comparable properties with rates
```

### Example 3: Demographic Focus
```
User: "Pull population and income data for [address] - 3 and 5 mile"

Claude queries: tract_iq_get_demographics
Returns: Formatted demographic profile with growth trends
```

### Example 4: Generate Report
```
User: "Create a competitive analysis report for [address]"

Claude queries: tract_iq_generate_report
Returns: Formatted market analysis document
```

## 📋 Project Structure

```
tract-iq-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server & tools
│   ├── types.ts              # TypeScript interfaces
│   ├── schemas.ts            # Zod validation schemas
│   ├── formatter.ts          # Data formatting utilities
│   └── services/
│       └── tractIqService.ts # Playwright automation (future)
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
├── netlify.toml
├── .env.example
├── README.md
└── .gitignore
```

## 🛠️ Development

### Local Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## 🔒 Security

✅ **Implemented:**
- Environment variable storage (never in code)
- HTTPS-only in production
- No credential logging
- Input validation with Zod
- CORS headers configured

⚠️ **Important:**
- Never commit `.env` file
- Use `.env.example` as template
- Rotate credentials periodically
- Monitor Netlify logs for errors

## 📊 Tool Reference

### tract_iq_search_property
Search any address and get comprehensive market analysis.

**Parameters:**
- `address` (string, required): Property address
- `includeMapLayers` (boolean): Include map data (default: true)
- `radiusPreference` (string): Radius preference (default: all)

**Returns:** Complete LocationProfile with all data

---

### tract_iq_get_executive_summary
Get Executive Summary metrics for supply and facilities.

**Parameters:**
- `address` (string, required)
- `radius` (string): '3-mile', '5-mile', '10-mile', 'all'
- `format` (string): 'json' or 'markdown'

**Returns:** Executive Summary metrics

---

### tract_iq_get_demographics
Get detailed demographic information.

**Parameters:**
- `address` (string, required)
- `radius` (string): Analysis radius
- `includeGrowthData` (boolean): Include growth trends

**Returns:** Demographic data with growth metrics

---

### tract_iq_get_market_analysis
Get comprehensive market analysis including comps and trends.

**Parameters:**
- `address` (string, required)
- `includeRateTrends` (boolean): Include rate history
- `includeRentalComps` (boolean): Include comparables
- `includeOperatingMetrics` (boolean): Include performance
- `radius` (string): Analysis radius

**Returns:** Rate trends, comps, and operating data

---

### tract_iq_get_map_data
Access interactive map layers.

**Parameters:**
- `address` (string, required)
- `layers` (array): Which layers to retrieve
- `format` (string): 'json' or 'markdown'

**Available Layers:**
- flood_zone
- crime_index
- income_growth
- job_growth
- population_growth
- education
- all

**Returns:** Map layer data

---

### tract_iq_generate_report
Generate formatted market analysis reports.

**Parameters:**
- `address` (string, required)
- `reportType` (string): executive_summary, full_market_analysis, competitive_analysis, demographic_focus
- `radius` (string): Analysis radius
- `format` (string): 'markdown' or 'json'

**Returns:** Formatted report

## 🐛 Troubleshooting

### "Authentication Failed"
- Verify credentials in environment variables
- Ensure 2FA is disabled for API access
- Test login manually on Tract IQ website

### "Timeout Errors"
- Increase `PLAYWRIGHT_TIMEOUT` in environment
- Check internet connection
- Verify Tract IQ site is responding

### "No Data Returned"
- Check browser console for errors
- Verify HTML selectors match current UI
- May need to update selectors if Tract IQ UI changed

### "Server Not Responding"
- Check Netlify build logs
- Verify environment variables are set
- Test health endpoint: `https://your-site.netlify.app/health`

## 📝 Logging

Logs are available in:
- **Local:** Console output
- **Netlify:** Site Settings → Logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Proprietary - 10 Federal

## 📧 Support

For questions or issues:
- Email: ilevin@10federal.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/tract-iq-mcp-server/issues)

---

## 📦 Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Netlify
- [ ] `.env` file in `.gitignore` (don't commit credentials)
- [ ] Build completes successfully: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Health check endpoint works
- [ ] MCP endpoint responds to requests
- [ ] Claude can call the MCP server

---

**Last Updated:** March 26, 2026
**Version:** 1.0.0
