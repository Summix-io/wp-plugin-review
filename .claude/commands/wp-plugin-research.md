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

Create a structured report with the following sections. **Be concise** - use bullet points, tables, and summaries instead of lengthy paragraphs.

### Executive Summary
One-page overview with:
- **Analysis Period**: Last N months (e.g., "Last 12 months: Oct 2024 - Oct 2025")
- Total reviews analyzed (number within time range)
- Rating distribution (table with star counts & percentages)
- Overall sentiment score (1-10)
- Top 3 strengths (one-line each)
- Top 3 critical weaknesses (one-line each)
- Top 3 most requested features (one-line each)
- **Key Insight**: One paragraph summarizing the competitive opportunity

### Rating Distribution Analysis
**Keep this brief** - use a table and 2-3 bullet points:
- Table: Rating | Count | % | Sentiment
- What drives 5-star reviews (2-3 bullets)
- What drives 1-star reviews (2-3 bullets)
- Note any temporal patterns (version-specific issues)

### What Users LOVE ❤️
**Limit to top 5 positive aspects**. For each:
- **Aspect**: One-line description
- **Frequency**: % of reviews mentioning
- **Quote**: One representative paraphrased quote
- **Impact**: One sentence

Format as compact list, not essay. Skip if genuinely nothing positive.

### What Users DISLIKE 👎
**Limit to top 7 critical issues**. For each:
- **Issue**: One-line description
- **Frequency**: % of reviews | Severity: Critical/High/Medium
- **Quote**: One representative paraphrased quote
- **Impact**: One sentence on business/user effect

Format as compact list. Focus on high-frequency and high-severity issues only.

### Feature Requests 🎯
**Organize into 3 tiers, limit to 10-12 total**:

**Tier 1: Critical Needs** (3-4 items)
- Feature | Frequency | One-line benefit

**Tier 2: Quick Wins** (3-4 items)
- Feature | Frequency | One-line benefit

**Tier 3: Strategic Opportunities** (3-4 items)
- Feature | Frequency | One-line benefit

Skip lengthy explanations. Use bullet points only.

### Market Opportunity Assessment 💡
**This is the money section - keep it actionable**:

**Market Gaps** (top 3-5 only):
- **Gap**: One-line description
- **Size**: Huge/Large/Medium | **Willingness to Pay**: High/Medium/Low
- **Opportunity**: One sentence

**Competitive Position**:
- Current plugin threat level: None/Low/Medium/High (one sentence why)
- Opportunity window: Wide Open/Open/Narrow/Closed (one sentence why)
- Market validation: One paragraph summarizing evidence

**Quick Recommendations**:
- Target audience: 2-3 primary segments (one-line each)
- Key differentiators: 3-4 bullet points
- Positioning statement: One sentence
- Marketing message: One powerful headline

### Sentiment Analysis (Brief)
**One-page summary**:
- Sentiment breakdown: Table (Positive/Mixed/Negative | % | Key themes)
- Emotional tone: 3-5 bullet points (anger, frustration, resignation, etc.)
- Community health score: X/10 with one-sentence assessment
- Review authenticity: One sentence confidence level

### Temporal Patterns (If Significant)
**Only include if there are version-specific crises or clear trends**:
- Crisis periods: Table (Date | Version | Issue | Impact)
- Trend direction: Getting better/worse/stable (one sentence)
- Recovery patterns: 2-3 bullets on common workarounds

### Data Appendix (Condensed)
**One page maximum**:
- **Sources**: Plugin slug, time period analyzed (last N months), actual date range (oldest to newest), total reviews
- **Top Keywords**: Two tables (Positive terms | Negative terms with frequencies)
- **Technical Errors**: If critical, include 1-2 key error messages
- **Confidence**: High/Medium/Low with one-sentence reasoning

---

## Report Writing Guidelines

**IMPORTANT - Keep It Concise:**
1. **Use tables** instead of paragraphs wherever possible
2. **Limit examples** to one quote per point (not 3-4)
3. **Cut redundancy** - don't repeat the same information in multiple sections
4. **Be selective** - top 5-7 items per category, not exhaustive lists
5. **One-line summaries** instead of multi-paragraph explanations
6. **Skip obvious details** - readers understand what "5-star review" means
7. **Focus on actionable insights** over descriptive analysis
8. **Target length**: 15-25 pages (not 50+ pages)

**Essential vs. Optional:**
- ✓ **Essential**: Executive summary, rating distribution, top issues, feature requests, market opportunity
- ✓ **Essential**: Clear evidence and data to back up claims
- ⚠️ **Conditional**: Temporal patterns (only if significant version issues)
- ⚠️ **Conditional**: Detailed technical errors (only if critical/common)
- ✗ **Skip**: Lengthy use case analysis per user type unless dramatically different
- ✗ **Skip**: Exhaustive keyword lists - keep top 10-15 only
- ✗ **Skip**: Review-by-review walkthroughs
- ✗ **Skip**: Repetitive sentiment descriptions across sections

**Tone:**
- Direct and actionable
- Data-driven but concise
- Business-focused (this is competitive intelligence, not academic research)
- Use strong statements backed by numbers

## Output Format

Generate the report as a well-structured, **scannable** Markdown document:
- Clear hierarchical headings (##, ###)
- Emoji indicators for major sections (❤️ 👎 🎯 💡)
- **Heavy use of tables** for data presentation
- **Bullet points** (not paragraphs) for lists
- **One quote per point maximum** using > blockquote format
- **Bold** for emphasis on key insights and numbers
- Star ratings: Use simple format (5★, 1★)

**Formatting Examples:**

✓ Good (concise):
> "Site crashed after update, lost business hours during peak season" - June 2025 reviewer

✗ Bad (verbose):
> One user stated in their review that they experienced significant technical difficulties when they updated the plugin, which resulted in their website becoming completely inaccessible. This occurred during what they described as a particularly important time for their business operations...

**Table Format Example:**
| Issue | Freq | Severity | Impact |
|-------|------|----------|--------|
| Site crashes | 58% | Critical | Revenue loss |

## Quality Checks

Before finalizing, verify:
- ✓ Rating distribution adds up to ~100%
- ✓ Top insights backed by frequency data (% or count)
- ✓ No redundant information across sections
- ✓ Report length: 15-25 pages (not 50+)
- ✓ Each section has clear, scannable structure
- ✓ Tables used for all comparative/statistical data
- ✓ Actionable recommendations included
- ✓ Focus on competitive intelligence value

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
- **Review data**: Saved to `data/{plugin-slug}-reviews-{date}.json`
- **Final report**: Save to current directory as `{plugin-slug}-competitive-analysis.md`

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

## Special Cases & Edge Cases

### Misclassified Reviews
**Watch for:** 5-star reviews that contain negative content
- Some users accidentally select wrong star rating
- Some users give 5 stars sarcastically with negative title
- **Action:** Manually verify 5-star reviews; note discrepancies in report
- Example: "They don't care or maintain this plugin" with 5 stars

### Empty Review Content
**Watch for:** Reviews with titles but no content text
- Older reviews may have minimal content
- Some users leave only star rating + title
- **Action:** Still valuable for sentiment analysis from title and rating

### Non-English Reviews
**Watch for:** Reviews in Spanish, Portuguese, Italian, German, etc.
- WordPress.org is global; plugins get international reviews
- **Action:** Include in analysis; sentiment often clear from context
- Note language distribution in report appendix

### Version-Specific Crises
**Watch for:** Clusters of 1-star reviews on same dates mentioning specific versions
- Indicates catastrophic update failure
- **Action:** Highlight as critical issue in report with timeline
- Example: "Version 3.5.0 - site crash" pattern in June 2025

### Spam/Invalid Reviews
**Watch for:** Generic single-word reviews, repetitive patterns
- Usually minimal on WordPress.org due to moderation
- **Action:** Filter out obvious spam; note in data quality section

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

**Output Location:** Save the final markdown report to the current working directory with filename: `{plugin-slug}-competitive-analysis.md`

Begin the analysis now and provide comprehensive competitive intelligence that highlights competitor strengths, weaknesses, and unmet market needs.