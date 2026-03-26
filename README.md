# Tract IQ MCP Server v2.0 — Live Scraper

Real-time Tract IQ market data via Playwright browser automation.
Returns live supply, demographics, and rental comp data for any address.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status check |
| POST | `/search` | Full market data (all metrics) |
| POST | `/summary` | Supply & occupancy only |
| POST | `/demographics` | Demographics & income only |
| POST | `/comps` | Rental comparables only |

### Request Body

```json
{
  "address": "1650 S Meadows Dr, Granbury, TX 76048",
  "format": "json",
  "reportType": "full"
}
```

- `format`: `"json"` (default) or `"markdown"` 
- `reportType`: `"full"`, `"supply_only"`, `"demographics_only"`, `"comps_only"`

### Example Call

```bash
curl -X POST https://your-server.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{"address": "1650 S Meadows Dr, Granbury, TX 76048", "format": "markdown"}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TRACT_IQ_EMAIL` | ✅ | Your Tract IQ login email |
| `TRACT_IQ_PASSWORD` | ✅ | Your Tract IQ password |
| `PORT` | No | Server port (default: 8080) |

## Deploy to Railway (Recommended)

Railway supports Playwright natively via Nixpacks.

1. Push this repo to GitHub (private)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables:
   - `TRACT_IQ_EMAIL`
   - `TRACT_IQ_PASSWORD`
5. Deploy — Railway uses `nixpacks.toml` automatically

Your server URL will be: `https://your-project.up.railway.app`

## Deploy with Docker

```bash
docker build -t tract-iq-server .
docker run -p 8080:8080 \
  -e TRACT_IQ_EMAIL=your@email.com \
  -e TRACT_IQ_PASSWORD=yourpassword \
  tract-iq-server
```

## Local Development

```bash
# 1. Install deps
npm install
npx playwright install chromium

# 2. Create .env from template
cp .env.example .env
# Edit .env — add your real password

# 3. Start server
npm start

# 4. Test
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"address": "1650 S Meadows Dr, Granbury, TX 76048"}'
```

## How It Works

1. On first request, Playwright launches a headless Chromium browser
2. Logs into Tract IQ with your credentials (browser session is reused)
3. Searches the address via Tract IQ's search bar
4. Extracts supply metrics, demographics, and rental comps from the results page
5. Returns structured JSON (or markdown) via the REST API

The browser stays alive between requests for speed — login only happens once per server session.

## Selector Maintenance

Tract IQ occasionally updates their UI. If data extraction breaks, the selectors to update are in:

- `src/tractiq.js` — `searchSelectors`, `suggestionSelectors`, `extractExecutiveSummary()`, `extractDemographics()`, `extractRentalComps()`

Screenshots are saved to `/tmp/tractiq-*.png` on each request to help debug UI changes.

## Data Returned

```json
{
  "address": "...",
  "url": "https://app.tractiq.com/...",
  "timestamp": "2026-03-26T...",
  "supply": {
    "byRadius": {
      "3-mile": { "facilities": 12, "squareFootage": "800000", "occupancyRate": "87%", "sfPerCapita": "6.2" },
      "5-mile": { ... },
      "10-mile": { ... }
    },
    "rawStats": [...]
  },
  "demographics": {
    "population": { "3-mile": "45000", "5-mile": "120000", "10-mile": "280000" },
    "medianIncome": "72000",
    "renterPct": "38",
    "populationGrowth": "2.1"
  },
  "rentalComps": [
    { "name": "CubeSmart Self Storage", "distance": "1.2 mi", "rate": "$129", "size": "10x10" }
  ],
  "rateTrends": [...]
}
```

## Proprietary — 10 Federal Capital
