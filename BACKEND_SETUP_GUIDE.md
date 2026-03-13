# CheckMyRep Backend Setup Guide

Step-by-step beginner instructions for getting all API keys, setting up the server, and wiring real data into CheckMyRep.

---

## Table of Contents

1. [Overview — What We're Setting Up](#1-overview)
2. [Congress.gov API (Member Data + Bills)](#2-congressgov-api)
3. [Google Civic Information API (Address Lookup)](#3-google-civic-information-api)
4. [OpenSecrets API (Campaign Finance / Donor Data)](#4-opensecrets-api)
5. [OpenStates API (State Legislators)](#5-openstates-api)
6. [ProPublica Congress API (Voting Records + Statements)](#6-propublica-congress-api)
7. [Setting Up Environment Variables](#7-setting-up-environment-variables)
8. [Creating Next.js API Routes (Backend)](#8-creating-nextjs-api-routes)
9. [Deploying to Vercel](#9-deploying-to-vercel)
10. [Connecting Your Domain (civic.thefoiaforge.org)](#10-connecting-your-domain)

---

## 1. Overview

Right now CheckMyRep runs entirely in the browser with mock data. To get real data, we need:

| Data Source | What It Provides | Cost |
|---|---|---|
| Congress.gov API | Member bios, bills, votes, committees | Free |
| Google Civic Info API | "Enter ZIP" -> find your reps | Free (2,500 req/day) |
| OpenSecrets API | Campaign donations, top donors, industries | Free (non-commercial) |
| OpenStates API | State legislators (not federal) | Free |
| ProPublica Congress API | Voting records, bill details, statements | Free |

**How it will work:**
- API keys are stored on the SERVER (never exposed to the browser)
- Next.js "API routes" act as a middleman: browser -> your server -> external API -> back to browser
- The Anthropic key for AI drafting stays client-side (BYOK — user brings their own)

**What you need before starting:**
- A computer with Node.js installed (you already have this)
- An email address for signups
- A Google account (for Google Cloud)
- About 30-60 minutes

---

## 2. Congress.gov API

This is your primary source for member data, bill text, committee info, and vote records.

### Step 1: Go to the signup page

Open your browser and go to:
```
https://api.congress.gov/sign-up/
```

### Step 2: Fill out the form

- **First Name**: Your first name
- **Last Name**: Your last name
- **Email**: Your email address
- **Purpose**: Select "Personal/Research" or similar

Click **Sign Up**.

### Step 3: Check your email

You'll receive an email with your API key. It looks something like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Save this key somewhere safe** (a password manager, a secure note, etc).

### Step 4: Test it works

Open your terminal and run:
```bash
curl "https://api.congress.gov/v3/member?api_key=YOUR_KEY_HERE&limit=1"
```

Replace `YOUR_KEY_HERE` with your actual key. You should see JSON data about a member of Congress.

### What this API gives us:
- `/v3/member` — List all current and past members
- `/v3/member/{bioguideId}` — Detailed info on one member
- `/v3/bill` — Current bills
- `/v3/bill/{congress}/{type}/{number}` — Bill details
- `/v3/committee` — Committee listings
- `/v3/nomination` — Presidential nominations

### Rate limits:
- 5,000 requests per hour (very generous)

### Documentation:
```
https://api.congress.gov/
```

---

## 3. Google Civic Information API

This powers the "Enter your address/ZIP code" -> "Here are your representatives" feature. This is the most important API for the core user experience.

### Step 1: Go to Google Cloud Console

Open your browser and go to:
```
https://console.cloud.google.com/
```

Sign in with your Google account. If you've never used Google Cloud before, you may need to agree to terms of service.

### Step 2: Create a new project

1. Click the project dropdown at the top of the page (it might say "Select a project" or show an existing project name)
2. Click **New Project** in the popup
3. Enter these details:
   - **Project name**: `checkmyrep` (or whatever you want)
   - **Organization**: Leave as default
4. Click **Create**
5. Wait a few seconds, then make sure the new project is selected in the dropdown

### Step 3: Enable the Civic Information API

1. In the left sidebar, click **APIs & Services** > **Library**
   - Or go directly to: `https://console.cloud.google.com/apis/library`
2. In the search box, type: `Google Civic Information API`
3. Click on **Google Civic Information API** in the results
4. Click the blue **Enable** button
5. Wait for it to enable (a few seconds)

### Step 4: Create an API key

1. In the left sidebar, click **APIs & Services** > **Credentials**
   - Or go to: `https://console.cloud.google.com/apis/credentials`
2. Click **+ Create Credentials** at the top
3. Select **API key**
4. A popup will show your new API key. It looks like:
   ```
   AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
   ```
5. Click **Copy** to copy it
6. **Save this key somewhere safe**

### Step 5: Restrict your API key (recommended)

This prevents someone from stealing your key and racking up charges:

1. In the Credentials page, click on the API key you just created
2. Under **API restrictions**, select **Restrict key**
3. In the dropdown, select **Google Civic Information API**
4. Click **Save**

### Step 6: Test it works

In your terminal:
```bash
curl "https://www.googleapis.com/civicinfo/v2/representatives?address=10001&key=YOUR_KEY_HERE"
```

Replace `YOUR_KEY_HERE` with your key. You should see JSON with representatives for ZIP code 10001 (Manhattan, NY).

### What this API gives us:
- `/representatives` — Federal, state, and local officials by address
- `/elections` — Upcoming elections
- `/voterinfo` — Polling places, ballot info

### Rate limits:
- 2,500 requests per day (free tier)
- If you need more, you can enable billing (but 2,500/day is plenty for a small app)

### Documentation:
```
https://developers.google.com/civic-information
```

---

## 4. OpenSecrets API

This provides campaign finance data — who donates to each member, top industries, total fundraising, etc. This powers the "Follow the Money" section on rep profiles.

### Step 1: Create an account

Go to:
```
https://www.opensecrets.org/api/admin/index.php?function=signup
```

Fill out:
- **Name**: Your name
- **Email**: Your email
- **Organization**: `CheckMyRep` (or personal)
- **Intended use**: Something like "Civic engagement app showing campaign finance data to citizens"

### Step 2: Get your API key

After signing up, you'll receive an email with your API key, OR you can find it at:
```
https://www.opensecrets.org/api/admin/index.php?function=account
```

The key looks like a long alphanumeric string.

### Step 3: Test it works

```bash
curl "https://www.opensecrets.org/api/?method=candSummary&cid=N00007360&cycle=2024&apikey=YOUR_KEY_HERE&output=json"
```

This fetches summary data for Nancy Pelosi (CID: N00007360). You should see JSON with total receipts, expenditures, etc.

### What this API gives us:
- `candSummary` — Total raised, spent, cash on hand
- `candContrib` — Top individual contributors
- `candIndustry` — Top contributing industries
- `candSector` — Contributions by business sector
- `getLegislators` — Legislators by state (with CRP IDs for cross-referencing)

### Important: CRP IDs
OpenSecrets uses its own ID system (CRP IDs like `N00007360`). You'll need to map these to Congress.gov's bioguide IDs. OpenSecrets provides a bulk data download with this mapping.

### Rate limits:
- 200 requests per day (this is low — we'll need to cache aggressively)

### Bulk data (alternative for heavy use):
OpenSecrets offers bulk CSV downloads for non-commercial use:
```
https://www.opensecrets.org/open-data/bulk-data
```
This is better for our use case since we can download all the data once and store it.

### Documentation:
```
https://www.opensecrets.org/api/?output=doc
```

---

## 5. OpenStates API

This provides state-level legislator data (state senators, state representatives). Federal data comes from Congress.gov; this fills in the state level.

### Step 1: Create an account

Go to:
```
https://openstates.org/accounts/signup/
```

Create an account with your email.

### Step 2: Get your API key

After signing up, go to:
```
https://openstates.org/accounts/profile/
```

Your API key will be displayed on your profile page.

### Step 3: Test it works

```bash
curl -H "X-API-KEY: YOUR_KEY_HERE" "https://v3.openstates.org/people?jurisdiction=California&org_classification=legislature&page=1&per_page=5"
```

You should see JSON with California state legislators.

### What this API gives us:
- `/people` — State legislators by state
- `/bills` — State-level bills
- `/jurisdictions` — Available states/territories

### Rate limits:
- Varies by plan; free tier is generous for moderate use

### Documentation:
```
https://docs.openstates.org/
```

---

## 6. ProPublica Congress API

This supplements Congress.gov with cleaner voting record data, floor actions, and member statements. The data is well-structured and easy to work with.

### Step 1: Request an API key

Go to:
```
https://www.propublica.org/datastore/api/propublica-congress-api
```

Click the link to request access. Fill in:
- **Name**: Your name
- **Email**: Your email
- **Usage description**: "Building a civic engagement platform to help citizens contact their representatives"

### Step 2: Check your email

ProPublica will email you an API key. This may take a few minutes to a few hours (it's usually fast).

The key looks like a long alphanumeric string.

### Step 3: Test it works

```bash
curl -H "X-API-Key: YOUR_KEY_HERE" "https://api.propublica.org/congress/v1/members/S000033.json"
```

This fetches data for Bernie Sanders (bioguide ID: S000033). You should see detailed JSON.

### What this API gives us:
- `/members/{id}` — Detailed member profile
- `/members/{id}/votes` — Full voting history
- `/{congress}/bills/{bill-id}` — Bill details
- `/members/{id}/statements` — Press statements
- `/members/{id}/bills/{type}` — Bills sponsored/cosponsored

### Rate limits:
- 5,000 requests per day

### Documentation:
```
https://projects.propublica.org/api-docs/congress-api/
```

---

## 7. Setting Up Environment Variables

Now that you have all your API keys, let's store them securely in your project.

### Step 1: Create the environment file

In your terminal:
```bash
cd /Users/macbook/Desktop/checkmyrep
```

Create a file called `.env.local`:
```bash
touch .env.local
```

### Step 2: Add your keys

Open `.env.local` in any text editor and add:

```env
# Congress.gov API
CONGRESS_GOV_API_KEY=your_congress_gov_key_here

# Google Civic Information API
GOOGLE_CIVIC_API_KEY=your_google_key_here

# OpenSecrets API
OPENSECRETS_API_KEY=your_opensecrets_key_here

# OpenStates API
OPENSTATES_API_KEY=your_openstates_key_here

# ProPublica Congress API
PROPUBLICA_API_KEY=your_propublica_key_here
```

Replace each `your_..._key_here` with your actual API key.

### Step 3: Make sure .env.local is in .gitignore

This is CRITICAL — you never want API keys in your git repo. Check that `.gitignore` includes it:

```bash
cat .gitignore | grep env
```

You should see `.env.local` or `*.local` in the output. If not, add it:
```bash
echo ".env.local" >> .gitignore
```

### How environment variables work in Next.js:

- Variables in `.env.local` are available on the SERVER only (API routes, server components)
- They are accessed via `process.env.CONGRESS_GOV_API_KEY`
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser (DON'T do this with API keys)
- `.env.local` is automatically loaded by Next.js — no extra setup needed

---

## 8. Creating Next.js API Routes

API routes are server-side endpoints that run on YOUR server. The browser calls your API route, your API route calls the external API with the secret key, and sends the result back.

```
Browser  -->  /api/reps?zip=10001  -->  Google Civic API  -->  back to browser
                (your server)            (with your key)
```

### Step 1: Create the API directory

```bash
mkdir -p /Users/macbook/Desktop/checkmyrep/src/app/api
```

### Step 2: What routes we'll need

Here's the plan for API routes we'll build:

```
src/app/api/
  representatives/
    route.ts          # GET /api/representatives?address=... (Google Civic)
  members/
    route.ts          # GET /api/members (Congress.gov — list all)
    [id]/
      route.ts        # GET /api/members/S000033 (single member detail)
      votes/
        route.ts      # GET /api/members/S000033/votes (voting record)
  bills/
    route.ts          # GET /api/bills?congress=118 (bill listing)
    [id]/
      route.ts        # GET /api/bills/hr-1234 (single bill)
  finance/
    [id]/
      route.ts        # GET /api/finance/N00007360 (OpenSecrets data)
  state/
    [state]/
      route.ts        # GET /api/state/california (state legislators)
```

### Step 3: Example — Address Lookup Route

This is the most important one. Here's what the code looks like (I'll build all of these for you when you're ready):

```typescript
// src/app/api/representatives/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;

  const response = await fetch(
    `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${apiKey}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch representatives" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
```

Then the browser calls YOUR server:
```javascript
// In your React component
const res = await fetch(`/api/representatives?address=${zip}`);
const data = await res.json();
```

The API key never touches the browser.

### Step 4: I'll build these for you

Once you have all your API keys set up in `.env.local`, let me know and I'll create all the API routes, data transformation layers, and update the frontend to use real data instead of mock data.

---

## 9. Deploying to Vercel

Vercel is the company that makes Next.js, so deployment is seamless.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Push your code to GitHub

If you haven't already:

```bash
cd /Users/macbook/Desktop/checkmyrep
git init
git add -A
git commit -m "Initial CheckMyRep build"
```

Then create a repo on GitHub:
1. Go to https://github.com/new
2. Name it `checkmyrep`
3. Leave it public or private (your choice)
4. DON'T initialize with README (you already have code)
5. Click **Create repository**

GitHub will show you commands. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/checkmyrep.git
git branch -M main
git push -u origin main
```

### Step 3: Connect to Vercel

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New** > **Project**
3. Find and select your `checkmyrep` repository
4. Vercel will auto-detect it's a Next.js project
5. Before clicking Deploy, expand **Environment Variables**
6. Add each of your API keys:
   - `CONGRESS_GOV_API_KEY` = your key
   - `GOOGLE_CIVIC_API_KEY` = your key
   - `OPENSECRETS_API_KEY` = your key
   - `OPENSTATES_API_KEY` = your key
   - `PROPUBLICA_API_KEY` = your key
7. Click **Deploy**

Vercel will build and deploy your app. You'll get a URL like `checkmyrep.vercel.app`.

### Step 4: Set up automatic deploys

This happens automatically. Every time you push to `main` on GitHub, Vercel rebuilds and deploys.

---

## 10. Connecting Your Domain

To make CheckMyRep available at `civic.thefoiaforge.org`:

### Step 1: Add the domain in Vercel

1. Go to your project in the Vercel dashboard
2. Click **Settings** > **Domains**
3. Enter: `civic.thefoiaforge.org`
4. Click **Add**

### Step 2: Add a CNAME record

Vercel will tell you to add a CNAME record. Go to wherever you manage DNS for `thefoiaforge.org` (probably your domain registrar or Cloudflare):

1. Add a new DNS record:
   - **Type**: CNAME
   - **Name**: `civic`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Auto (or 300)

### Step 3: Wait for propagation

DNS changes can take 1-60 minutes. Vercel will automatically detect the CNAME and issue an SSL certificate.

### Step 4: Verify

Once DNS propagates, visit `https://civic.thefoiaforge.org` — you should see CheckMyRep.

---

## Quick Reference: All Your API Keys

After setup, you should have these 5 keys stored in `.env.local`:

| Variable | Source | Signup URL |
|---|---|---|
| `CONGRESS_GOV_API_KEY` | Congress.gov | https://api.congress.gov/sign-up/ |
| `GOOGLE_CIVIC_API_KEY` | Google Cloud | https://console.cloud.google.com/ |
| `OPENSECRETS_API_KEY` | OpenSecrets | https://www.opensecrets.org/api/admin/index.php?function=signup |
| `OPENSTATES_API_KEY` | OpenStates | https://openstates.org/accounts/signup/ |
| `PROPUBLICA_API_KEY` | ProPublica | https://www.propublica.org/datastore/api/propublica-congress-api |

---

## What Happens Next

Once you have your keys set up, come back and tell me. I'll then:

1. Build all the API routes (server-side endpoints)
2. Create data transformation layers (normalize different API formats into our types)
3. Add caching (so we don't hit rate limits)
4. Update the frontend to fetch real data instead of mock data
5. Keep the mock data as fallback for when APIs are down

The frontend you already have won't change much — we're just swapping where the data comes from.
