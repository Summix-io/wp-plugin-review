---
description: Find and analyze WordPress plugin competitors based on category and functionality
argument-hint: <plugin-slug>
allowed-tools:
  - Bash
  - Read
---

You are conducting competitive research to identify WordPress plugin competitors based on similar functionality and category.

# Task Overview

Find and analyze competitors for the WordPress plugin: **$1**

## Analysis Parameters

- Plugin Slug: $1
- Maximum Competitors: 10 (configurable)
- Selection Criteria: Similar functionality/category
- Output Format: Single markdown file with competitor list

## Implementation

This project includes a custom JavaScript competitor finder that handles all the research automatically.

### Prerequisites

1. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

### Running the Competitor Finder

Execute the competitor finder script with:

```bash
node src/findCompetitors.js $1
```

**Optional parameters:**
- `--max=N` - Set maximum number of competitors (default: 10)

**Examples:**
```bash
node src/findCompetitors.js woocommerce
node src/findCompetitors.js contact-form-7 --max=5
```

### What the Script Does Automatically

The script will:

1. **Fetch target plugin information** from WordPress.org
   - Extract name, description, category, and tags
   - Get install count, rating, and other metrics
   - Identify key characteristics for comparison

2. **Search for competitors** using multiple strategies:
   - Search by plugin tags (up to 3 primary tags)
   - Search by plugin category
   - Filter results to find similar plugins

3. **Validate competitors** based on:
   - Tag overlap with target plugin
   - Category match
   - Minimum install count (100+)
   - Minimum rating (3.0+ stars)
   - Plugin is active and maintained

4. **Fetch detailed information** for each competitor:
   - Name, description, and URL
   - Active installations and rating
   - Last updated date
   - Tags and category
   - Common tags with target plugin

5. **Generate comprehensive report** including:
   - Target plugin overview
   - Detailed competitor profiles
   - Competitive landscape summary
   - Market position analysis
   - Key insights and trends

6. **Save report** to: `reports/{plugin-slug}/competitors.md`

### Script Output

The script creates a structured report with:

```markdown
# Competitors Analysis for {Plugin Name}

## Target Plugin Overview
- Category, tags, description
- Install count and ratings
- Key metrics

## Competitor Plugins
For each competitor (up to 10):
- Name, slug, and URL
- Metrics (installs, rating, last updated)
- Description and tags
- Common tags with target

## Competitive Landscape Summary
- Market position by install count
- Average competitor rating
- Most common tags across competitors
- Key insights about market maturity
```

### Report Location

After the script completes, you'll find:
- **Competitor report**: `reports/{plugin-slug}/competitors.md`

All files are organized in the plugin's dedicated report folder.

## Usage Notes

1. **Rate Limiting**: The script includes built-in delays (1-2 seconds) between requests to respect WordPress.org servers

2. **Competitor Quality**: The script automatically filters out:
   - Plugins with very low install counts (< 100)
   - Poorly rated plugins (< 3 stars)
   - Plugins with no tag/category overlap

3. **Sorting**: Competitors are sorted by active installation count (descending), showing the most popular first

4. **Maximum Results**: By default, finds up to 10 competitors. Adjust with `--max=N` if needed

## Edge Cases

**Plugin Not Found:**
- If the plugin slug is invalid or the page cannot be fetched, the script will show an error
- Verify the slug is correct on WordPress.org

**Limited Competitors:**
- If fewer than 5 competitors are found, the report will include all available
- The summary will note the limited competitive landscape

**Highly Competitive Market:**
- If many competitors exist, the script selects the top 10 by install count
- Additional competitors are available by increasing `--max` parameter

**No Competitors Found:**
- If no competitors meet the criteria, check if:
  - The plugin is in a very niche category
  - Tags are too specific or unusual
  - Consider manually researching adjacent categories

## Example Workflow

1. **Run the competitor finder**:
   ```bash
   node src/findCompetitors.js yoast-seo
   ```

2. **Wait for completion**: The script will fetch data, process competitors, and generate the report (typically 1-3 minutes depending on number of competitors)

3. **Review the report**: Open `reports/yoast-seo/competitors.md` to see the analysis

4. **Next steps**: Optionally run `/wp-plugin-research` on any competitors to get detailed review analysis

Begin the competitor research now by running the script with the provided plugin slug.
