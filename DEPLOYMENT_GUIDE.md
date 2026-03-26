# Deployment Guide - Tract IQ MCP Server

## Overview

This guide walks you through deploying the Tract IQ MCP Server to Netlify in 5 minutes.

## Prerequisites

- GitHub account
- Netlify account (free tier works)
- Node.js 18+ (for local testing)

## Step-by-Step Deployment

### 1. Create GitHub Repository

#### Option A: Use GitHub Web UI
1. Go to [github.com/new](https://github.com/new)
2. Name: `tract-iq-mcp-server`
3. Description: "MCP server for Tract IQ self-storage market analysis"
4. Make it **Private** (recommended)
5. Click "Create repository"

#### Option B: Use Git CLI
```bash
# Create local repo
git init tract-iq-mcp-server
cd tract-iq-mcp-server

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Tract IQ MCP Server"

# Create repo on GitHub and push
git remote add origin https://github.com/yourusername/tract-iq-mcp-server.git
git branch -M main
git push -u origin main
```

### 2. Push Code to GitHub

Ensure all files are in your local directory:
```
tract-iq-mcp-server/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── schemas.ts
│   ├── formatter.ts
│   └── services/
│       └── tractIqService.ts
├── package.json
├── tsconfig.json
├── netlify.toml
├── .env.example
├── .gitignore
└── README.md
```

Push to GitHub:
```bash
git add .
git commit -m "Add all source files"
git push origin main
```

### 3. Connect to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up" or "Log in"
3. Click "New site from Git"
4. Select GitHub (or your preferred provider)
5. Authorize Netlify to access your repositories
6. Select `tract-iq-mcp-server` repository
7. Click "Deploy site"

Netlify will auto-detect:
- Build command: `npm run build`
- Publish directory: `dist`

### 4. Add Environment Variables

**In Netlify Dashboard:**

1. Go to your site
2. Click "Site settings"
3. Click "Build & Deploy" in left sidebar
4. Click "Environment"
5. Click "Edit variables"
6. Add these variables:

| Key | Value |
|-----|-------|
| `TRACT_IQ_EMAIL` | `ilevin@10federal.com` |
| `TRACT_IQ_PASSWORD` | `10Federal2025!` |
| `TRANSPORT` | `http` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

7. Click "Save"

### 5. Trigger Deploy

Your site will automatically deploy:
1. Go to "Deploys" tab
2. You should see a deployment in progress
3. Wait for build to complete (usually 2-3 minutes)
4. Check for "Published" status

**Your MCP server URL:** `https://your-site-name.netlify.app/mcp`

### 6. Test the Deployment

#### Test Health Endpoint
```bash
curl https://your-site-name.netlify.app/health
```

Expected response:
```json
{"status":"ok","message":"Tract IQ MCP Server is running"}
```

#### Test MCP Endpoint
```bash
curl -X POST https://your-site-name.netlify.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Troubleshooting Deployment

### Build Failed

**Check Netlify logs:**
1. Go to Deploys tab
2. Click on failed deploy
3. Click "Deploy log"
4. Look for error messages

**Common issues:**
- Missing environment variables
- Node version too old (need 18+)
- Missing dependencies

**Solution:**
```bash
# Test locally
npm install
npm run build

# Push fixes to GitHub
git add .
git commit -m "Fix build issues"
git push origin main

# Netlify will auto-redeploy
```

### Environment Variables Not Set

1. Verify in Netlify: Site Settings → Build & Deploy → Environment
2. Make sure all variables are there
3. Trigger rebuild: Deploys → Trigger Deploy

### MCP Endpoint Returns 404

1. Check health endpoint works: `/health`
2. Verify `netlify.toml` is in repo
3. Check build output includes `dist/` folder

## Connecting to Claude

Once deployed, add to Claude.ai or Claude Desktop:

### Claude Desktop Config

Edit `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tract-iq": {
      "command": "curl",
      "args": ["-X", "POST", "https://your-site-name.netlify.app/mcp"],
      "env": {
        "TRACT_IQ_EMAIL": "ilevin@10federal.com",
        "TRACT_IQ_PASSWORD": "10Federal2025!"
      }
    }
  }
}
```

### Test Connection

In Claude:
> "Search for 10915 Nacogdoches Rd, San Antonio, TX"

Claude should use the MCP server and return market data!

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify connected to repository
- [ ] Environment variables added to Netlify
- [ ] Build completes successfully
- [ ] Health endpoint responds
- [ ] MCP endpoint responds to requests
- [ ] Can call tools from Claude
- [ ] Credentials are secure (not in code)

## Maintenance

### Updating Code

```bash
# Make changes locally
vim src/index.ts

# Test
npm run build

# Push to GitHub
git add .
git commit -m "Update: description of changes"
git push origin main

# Netlify auto-deploys!
```

### Viewing Logs

1. Netlify Dashboard → your site
2. Click "Logs" (top right)
3. Select log type: Build logs, Function logs, etc.

### Monitoring

- **Build time:** Check Deploys tab
- **Function performance:** Netlify Analytics
- **Errors:** Check Function Logs

## Cost

- **Netlify:** Free tier (builds, hosting, functions)
- **Bandwidth:** First 100GB/month free
- **Build minutes:** 300 minutes/month free

## Support

If you encounter issues:

1. Check Netlify logs
2. Verify environment variables
3. Test build locally: `npm run build`
4. Review this deployment guide
5. Contact support: ilevin@10federal.com

---

**Deployed Successfully! 🎉**

Your Tract IQ MCP Server is now live and ready to use with Claude.
