# WordPress Plugin Review Fetcher & Analyzer

A comprehensive JavaScript tool to fetch, analyze, and generate competitive intelligence from WordPress plugin reviews on WordPress.org.

## Features

- ✅ **Smart Review Fetching** - Fetch reviews from WordPress.org with intelligent pagination
- ✅ **Date Range Filtering** - Filter reviews by time period (e.g., last 12 months)
- ✅ **Automatic Deduplication** - Removes duplicate reviews automatically
- ✅ **Competitive Intelligence Analysis** - Built-in analyzer identifies pain points and opportunities
- ✅ **Export Options** - Save data to JSON and CSV formats
- ✅ **Rating Statistics** - Detailed rating distribution and sentiment analysis
- ✅ **Keyword Extraction** - Identifies common themes and complaints
- ✅ **Rate-Limited** - Respectful to WordPress.org servers (1s delay between requests)

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```bash
node src/index.js <plugin-slug>
```

### With Options

```bash
# Fetch reviews from last 6 months
node src/index.js woocommerce --months=6

# Also export as CSV
node src/index.js elementor --csv

# Custom time range with CSV export
node src/index.js contact-form-7 --months=24 --csv

# Adjust delay between requests (in milliseconds)
node src/index.js my-plugin --delay=2000
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--months=N` | Number of months to look back | 12 |
| `--max-pages=N` | Maximum pages to fetch | 10 |
| `--csv` | Also export data as CSV | false |
| `--delay=N` | Delay between requests in ms | 1000 |

## What You Get

### 1. Review Data Collection

The tool will:
1. Fetch reviews page by page from WordPress.org
2. Parse rating, title, author, date, content, and topic URL
3. Stop automatically when reaching reviews older than cutoff date
4. Deduplicate reviews (removes duplicates by topic URL)
5. Filter to only include reviews within the specified time range

### 2. Competitive Intelligence Analysis

Automatically analyzes and reports:
- **Rating Distribution** - Breakdown of 1-5 star reviews
- **Sentiment Analysis** - Overall positive/negative/mixed percentages
- **Negative Theme Extraction** - Identifies common complaints and issues
- **Pain Point Identification** - Lists critical problems (crashes, bugs, etc.)
- **Sample Reviews** - Shows representative reviews for each rating
- **Opportunity Assessment** - Evaluates competitive opportunities

### 3. Data Export & Reports

All results are organized in a structured folder system:

**Folder Structure:** `reports/{plugin-slug}/{date}/`

Each analysis generates:
- `reviews.json` - Full structured review data
- `report.md` - Comprehensive markdown analysis report
- `reviews.csv` - CSV export (if --csv flag used)

**Example:**
```
reports/
└── facebook-for-woocommerce/
    └── 2025-10-13/
        ├── reviews.json
        ├── report.md
        └── reviews.csv
```

## Output Format

### JSON Structure

```json
{
  "pluginSlug": "facebook-for-woocommerce",
  "fetchDate": "2025-10-13T10:30:00.000Z",
  "monthsBack": 12,
  "cutoffDate": "2024-10-13T10:30:00.000Z",
  "totalReviewsFetched": 6,
  "reviewsInRange": 6,
  "pagesFetched": 10,
  "reviews": [
    {
      "rating": 1,
      "title": "Plugin broke my site",
      "author": "username",
      "date": "October 12, 2025",
      "content": "Full review text...",
      "topicUrl": "https://wordpress.org/support/topic/...",
      "dateObject": "2025-10-12T00:00:00.000Z"
    }
  ]
}
```

### Console Analysis Output

```
============================================================
REVIEW ANALYSIS SUMMARY
============================================================

Plugin: facebook-for-woocommerce
Analysis Period: Sun Oct 13 2024 - Mon Oct 13 2025
Total Unique Reviews: 6

Rating Distribution:
  5★: 1 (16.7%)
  4★: 0 (0.0%)
  3★: 0 (0.0%)
  2★: 1 (16.7%)
  1★: 4 (66.7%)

Average Rating: 1.83 stars
Overall Sentiment: EXTREMELY NEGATIVE

============================================================
NEGATIVE THEMES ANALYSIS
============================================================

Top Negative Keywords:
  - 'crash': 1 mention
  - 'broke': 1 mention
  - 'error': 1 mention
  - 'connection': 1 mention
  - 'pixel': 1 mention

============================================================
COMPETITIVE OPPORTUNITY ASSESSMENT
============================================================

🚨 CRITICAL OPPORTUNITY - User satisfaction crisis detected
   83.3% negative reviews indicates major market gap

Key Pain Points:
   1. Site crashes and instability (CRITICAL)
   2. Connection failures and authentication problems
   3. Facebook Pixel tracking issues
```

## Example Use Cases

### 1. Competitive Analysis

Analyze competitor plugins to understand market opportunities:

```bash
node src/index.js facebook-for-woocommerce --months=12
```

**Use Case:** You're building a WooCommerce-Facebook integration plugin and want to understand what users hate about the current solution.

### 2. Market Research

Study multiple plugins in a category:

```bash
node src/index.js woocommerce --months=6
node src/index.js woocommerce-subscriptions --months=6
node src/index.js mailchimp-for-woocommerce --months=6
```

**Use Case:** Identify common pain points across e-commerce plugins to find underserved market needs.

### 3. Due Diligence

Research before acquiring or integrating with a plugin:

```bash
node src/index.js target-plugin --months=24 --csv
```

**Use Case:** Evaluate plugin quality and user satisfaction before making business decisions.

## Project Structure

```
├── src/
│   ├── index.js           # Main CLI entry point
│   ├── reviewFetcher.js   # Fetches reviews from WordPress.org
│   ├── reviewAnalyzer.js  # Analyzes reviews for competitive intelligence
│   └── dataStore.js       # Handles data persistence (JSON/CSV/MD)
├── reports/               # Generated reports (organized by plugin/date)
│   └── {plugin-slug}/
│       └── {date}/
│           ├── reviews.json
│           ├── report.md
│           └── reviews.csv
├── data/                  # Legacy data directory (deprecated)
├── examples/              # Example usage scripts
└── package.json
```

## How It Works

### 1. HTML Parsing

The tool uses `cheerio` to parse WordPress.org review pages:
- Extracts rating from `data-rating` attribute in `.wporg-ratings` element
- Parses review title, author, date from structured HTML
- Extracts full review content from `.review-content` div
- Captures topic URL for reference

### 2. Smart Pagination

- Fetches reviews page by page
- Checks the oldest review date on each page
- Stops pagination when oldest review < cutoff date
- Prevents unnecessary requests

### 3. Deduplication

- Uses topic URL as unique identifier
- Falls back to title+author+date if URL missing
- Ensures no duplicate reviews in dataset

### 4. Analysis

- Calculates rating statistics and percentages
- Groups reviews by rating (1-5 stars)
- Extracts keywords from negative reviews
- Identifies pain points (crashes, bugs, errors, etc.)
- Assesses competitive opportunity based on sentiment

## Rate Limiting & Respect

This tool respects WordPress.org servers by:
- ✅ Using 1-second delay between requests (configurable)
- ✅ Proper User-Agent headers
- ✅ Stopping early when date cutoff is reached
- ✅ No unnecessary or excessive requests

## Troubleshooting

### No reviews found

**Problem:** Script reports "No reviews found"

**Solutions:**
- Verify the plugin slug is correct (check WordPress.org URL)
- Try increasing `--max-pages` if plugin has many reviews
- Check if plugin actually has reviews on WordPress.org

### Duplicate reviews in output

**Problem:** Same review appears multiple times

**Solution:** This is fixed! The tool now automatically deduplicates reviews by topic URL.

### Rate limiting / timeout errors

**Problem:** Getting HTTP errors or timeouts

**Solution:** Increase delay between requests:
```bash
node src/index.js plugin-slug --delay=2000
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## License

MIT

## Credits

Built for competitive intelligence analysis of WordPress plugin ecosystems.
