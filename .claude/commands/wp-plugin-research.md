---
description: Perform competitive analysis of WordPress plugin reviews to identify strengths, weaknesses, and market opportunities
argument-hint: <plugin-slug> [--months=N] [--output=report.md]
allowed-tools:
  - Bash
  - Read
  - Write
---

You are conducting a competitive intelligence analysis of WordPress plugin reviews to understand market positioning, user satisfaction, and opportunity gaps.

# Task Overview

Analyze plugin reviews from WordPress.org for the plugin: **$1**

## Analysis Parameters

- Plugin Slug: $1
- Time Range: Last 12 months (default, override with --months=N)
- Additional Arguments: $ARGUMENTS
- Analysis Depth: Comprehensive (sentiment, patterns, categorization)

## Step 1: Data Collection

Use the **JavaScript review fetcher script** to extract review data from WordPress.org plugin directory for the **last 12 months** (or custom period if --months=N specified).

**Prerequisites:**

1. Ensure dependencies are installed (run once at start):
```bash
npm install
```

**Running the Fetcher:**

Execute the review fetcher with the appropriate options:

```bash
node src/index.js $1 --months=12
```

**Parse --months from arguments:**
- Check if --months=N is present in $ARGUMENTS
- Extract the number N from --months=N
- Pass it to the script: `--months=N`
- Default to 12 if not specified

**The script will automatically:**
1. Calculate cutoff date: Today's date minus N months (default 12)
2. Fetch pages sequentially from WordPress.org
3. Parse all review data (rating, title, author, date, content, topic URL)
4. Check the oldest review date on each page
5. Stop pagination when reaching reviews older than cutoff date
6. Filter all collected reviews to only include those within time range
7. Save results to: `data/{plugin-slug}-reviews-{date}.json`
8. Display rating statistics in console

**Script Output:**

The script will create a JSON file with this structure:
```json
{
  "pluginSlug": "plugin-name",
  "fetchDate": "2025-10-13T10:30:00.000Z",
  "monthsBack": 12,
  "cutoffDate": "2024-10-13T10:30:00.000Z",
  "totalReviewsFetched": 150,
  "reviewsInRange": 120,
  "pagesFetched": 5,
  "reviews": [
    {
      "rating": 5,
      "title": "Great plugin!",
      "author": "username",
      "date": "October 12, 2025",
      "content": "Full review text...",
      "topicUrl": "https://wordpress.org/support/topic/...",
      "dateObject": "2025-10-12T00:00:00.000Z"
    }
  ]
}
```

## Step 2: Load and Organize Review Data

**Load the JSON file:**

The fetcher script has already collected and filtered the reviews. Now load the JSON data:

```bash
# Find the most recent JSON file for this plugin
ls -t data/${plugin-slug}-reviews-*.json | head -1
```

Use the **Read tool** to load the JSON file and parse the data.

**Review Data Structure:**

Each review in the JSON contains:
- `rating` - 1-5 stars
- `title` - Review headline
- `author` - Username
- `date` - Human-readable date string
- `dateObject` - ISO date for sorting
- `content` - Full review text
- `topicUrl` - Link to review thread

**Metadata Available:**

The JSON file includes metadata:
- `pluginSlug` - Plugin identifier
- `fetchDate` - When data was collected
- `monthsBack` - Time range requested
- `cutoffDate` - Date filter applied
- `totalReviewsFetched` - Raw count before filtering
- `reviewsInRange` - Filtered count within time range
- `pagesFetched` - Number of pages processed
- `reviews` - Array of review objects

**Data is Pre-Filtered:**

The script has already:
- Fetched all necessary pages
- Filtered reviews by date range
- Removed reviews outside the time window
- Organized data in structured format

You can now proceed directly to analysis.

## Step 3: Review Categorization

Analyze each review and categorize by:

### Rating Distribution
- 5-star reviews (Positive)
- 4-star reviews (Mostly Positive)
- 3-star reviews (Mixed)
- 2-star reviews (Mostly Negative)
- 1-star reviews (Negative)

### Content Analysis

For each review, identify and extract:

#### What Users LIKE (Positive Aspects)
- **Features praised**: Specific functionality users love
- **Ease of use**: Comments about intuitive interface/setup
- **Performance**: Speed, efficiency, reliability mentions
- **Support quality**: Positive support experiences
- **Value proposition**: Worth the cost/free nature
- **Integration**: Works well with other tools
- **Customization**: Flexibility and options
- **Documentation**: Helpful guides and resources

#### What Users DISLIKE (Negative Aspects)
- **Bugs and errors**: Technical issues encountered
- **Missing features**: Functionality users expected but is absent
- **Complexity**: Difficult to use or configure
- **Performance issues**: Slow, resource-heavy, conflicts
- **Poor support**: Unresponsive or unhelpful support
- **Pricing concerns**: Cost vs. value complaints
- **Compatibility**: Doesn't work with certain themes/plugins/versions
- **Updates**: Breaking changes or lack of updates

#### Feature Requests
- **Explicit requests**: "I wish it had..." or "Please add..."
- **Implicit needs**: Problems that suggest missing features
- **Workflow improvements**: Suggested enhancements
- **Integration requests**: Desire for third-party connections
- **UI/UX suggestions**: Interface improvement ideas

### Sentiment Indicators
- **Enthusiasm level**: Exclamation marks, superlatives
- **Frustration markers**: Negative language, complaints
- **Conditional positivity**: "Great but..." patterns
- **Loyalty signals**: "Been using for years", recommendations
- **Abandonment threats**: "Switching to...", "Looking for alternatives"

## Step 4: Pattern Recognition & Analysis

After loading the review data from JSON, **ANALYZE the collected data yourself** to identify patterns:

1. **Common Praise**: What features/aspects are consistently mentioned positively?
2. **Recurring Complaints**: What issues appear across multiple reviews?
3. **Rating Patterns**: What separates 5-star from 1-star reviews?
4. **Feature Gap Analysis**: What do users wish existed?
5. **Use Case Insights**: How are different users using the plugin?
6. **Competitive Mentions**: Are users comparing to other plugins?
7. **Version-Specific Issues**: Do certain versions have more complaints?
8. **User Profile Patterns**: Beginners vs. advanced users - different needs?

**Important:** Use your reasoning capabilities to understand nuances, context, and sentiment that automated analysis might miss. Pay attention to:
- Tone and enthusiasm in positive reviews
- Specific pain points in negative reviews
- Constructive feedback vs. venting
- Context around feature requests
- Business impact statements from users

## Step 5: Generate Concise Report

Follow the report template structure defined in [report-templates/competitive-analysis-template.md](report-templates/competitive-analysis-template.md).

The template provides comprehensive guidelines for:
- **Report structure**: All required sections (Executive Summary, Rating Distribution, What Users Love/Dislike, Feature Requests, Market Opportunity, etc.)
- **Content analysis guidelines**: What to look for in positive/negative aspects and feature requests
- **Pattern recognition focus**: Key insights to identify in the review data
- **Report writing guidelines**: Conciseness rules, essential vs. optional sections, tone
- **Output format**: Markdown formatting, tables, quotes, emojis
- **Quality checks**: Validation criteria before finalizing
- **Special cases**: How to handle misclassified reviews, empty content, non-English reviews, version-specific crises, spam

**Key Points:**
- Target length: 15-25 pages (not 50+)
- Use tables instead of paragraphs
- One quote per point maximum
- Focus on actionable competitive intelligence
- Be selective: top 5-7 items per category

## Implementation Best Practices

### Using the JavaScript Fetcher

**Tool Overview:**
The project includes a custom JavaScript review fetcher that handles all data collection automatically.

**Location:** `src/index.js`

**Workflow:**
1. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

2. **Run the fetcher** with Bash tool:
   ```bash
   node src/index.js {plugin-slug} --months={N}
   ```

3. **The script automatically:**
   - Fetches pages sequentially from WordPress.org
   - Parses HTML to extract review data
   - Filters by date range
   - Saves to JSON file in `data/` directory
   - Displays progress and statistics

4. **Load the data** with Read tool:
   - Find file: `ls -t data/{plugin-slug}-reviews-*.json | head -1`
   - Read file: Use Read tool on the JSON path
   - Parse JSON and analyze reviews

### Data Files
- **Review data**: Saved to `reports/{plugin-slug}/{YYYY-MM-DD}/reviews.json`
- **Final report**: Saved to `reports/{plugin-slug}/{YYYY-MM-DD}/competitive-analysis.md`
- **Directory structure**: All files for a plugin analysis are grouped by date

### Analysis Scope
- **Time-based**: Script fetches reviews from last N months (default 12)
- **Parse --months argument**: Extract from $ARGUMENTS and pass to script
- **Automatic filtering**: Script handles date filtering and pagination
- **Complete data**: All reviews within time range are included
- **Metadata included**: Review count, date range, pages fetched

### Script Features

**Smart Pagination:**
- Starts with page 1
- Checks oldest review date on each page
- Stops when reaching reviews older than cutoff
- Typical plugins: 2-5 pages cover 12 months
- High-volume plugins: May fetch 10+ pages

**Data Quality:**
- Extracts rating, title, author, date, content, topic URL
- Handles missing fields gracefully
- Filters out reviews outside time range
- Provides pre-filtered, clean data for analysis

**Rate Limiting:**
- 1 second delay between requests (default)
- Respectful to WordPress.org servers
- Configurable via `--delay` parameter

## Additional Instructions

**Time Range Handling:**
- Default: Last 12 months from today
- Custom: Parse --months=N from arguments (e.g., --months=6 for 6 months, --months=18 for 18 months)
- Calculate cutoff date: Today's date minus N months
- Document actual date range in report (oldest and newest review dates)

**Example Calculations:**
- Today: October 13, 2025
- Default (12 months): Include reviews from October 13, 2024 onward
- Custom --months=6: Include reviews from April 13, 2025 onward
- Custom --months=18: Include reviews from April 13, 2024 onward

**Edge Cases:**
- If plugin has fewer reviews than expected in time range, note this in report
- If all reviews are within 1-2 pages, that's fine - include them all
- If plugin is new (< 12 months old), analyze all available reviews and note actual time span
- If the script encounters errors, check the error message and retry or report the issue

**Plugin Validation:**
If the plugin slug is invalid or inaccessible, provide guidance on correct plugin identification. If reviews are minimal or non-existent, adjust the analysis scope accordingly and note limitations in the report.

**Output Location:**
The fetcher script automatically creates the directory structure and saves files to:
- `reports/{plugin-slug}/{YYYY-MM-DD}/reviews.json` - Raw review data
- `reports/{plugin-slug}/{YYYY-MM-DD}/report.md` - Initial analysis summary

**Your Task:**
After analyzing the reviews, save your comprehensive competitive intelligence report to:
- `reports/{plugin-slug}/{YYYY-MM-DD}/competitive-analysis.md`

This keeps all analysis files organized by plugin and date.

Begin the analysis now and provide comprehensive competitive intelligence that highlights competitor strengths, weaknesses, and unmet market needs.