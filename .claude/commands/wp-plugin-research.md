---
description: Perform competitive analysis of WordPress plugin reviews to identify strengths, weaknesses, and market opportunities
argument-hint: <plugin-slug> [--pages=N] [--output=report.md]
allowed-tools:
  - Bash:
      allowed-commands:
        - curl
        - python3
        - /tmp/venv/bin/python3
        - /tmp/venv/bin/pip
        - pip
        - chmod
        - ls
        - sleep
---

You are conducting a competitive intelligence analysis of WordPress plugin reviews to understand market positioning, user satisfaction, and opportunity gaps.

# Task Overview

Analyze plugin reviews from WordPress.org for the plugin: **$1**

## Analysis Parameters

- Plugin Slug: $1
- Additional Arguments: $ARGUMENTS
- Analysis Depth: Comprehensive (sentiment, patterns, categorization)

## Step 1: Data Collection

First, fetch review data from the WordPress.org plugin directory.

**IMPORTANT:** Use curl with proper headers to avoid empty responses:

```bash
curl -L -A "Mozilla/5.0" "https://wordpress.org/plugins/$1/reviews/" -o /tmp/wp_reviews_page_1.html
```

Key curl flags:
- `-L`: Follow redirects
- `-A "Mozilla/5.0"`: Set user agent (required by WordPress.org)
- `-s`: Silent mode (optional, for cleaner output)

For analyzing just page 1 (typically 10-15 reviews), this is usually sufficient for initial analysis. Fetch additional pages if requested via `--pages=N` argument:

```bash
curl -L -A "Mozilla/5.0" "https://wordpress.org/plugins/$1/reviews/page/2/" -o /tmp/wp_reviews_page_2.html
```

**Parse review information using Python with BeautifulSoup:**

You MUST use Python for HTML parsing (not grep/sed/awk). Create a Python script that:
1. Reads the HTML file
2. Uses BeautifulSoup to parse structure
3. Extracts review data - **NOTE:** WordPress.org uses **bbPress forum structure**, not simple `<div class="review">` elements
4. Saves results to JSON for easy processing

**Required setup:**
```bash
python3 -m venv /tmp/venv
/tmp/venv/bin/pip install beautifulsoup4 lxml -q
```

Use `/tmp/venv/bin/python3` for all subsequent Python scripts.

**IMPORTANT:** WordPress.org plugin review pages use bbPress forum structure:
- Each review is in a `<ul id="bbp-topic-{id}">` element
- Title is in `<a class="bbp-topic-permalink">`
- Rating is in `<div class="wporg-ratings">` with filled/empty star spans
- Author is in `<span class="bbp-author-name">`
- Date is in `<li class="bbp-topic-freshness">`
- **Review content is NOT on the list page** - you need to fetch individual topic URLs to get full review text

## Step 2: Review Data Extraction

**Parse reviews using Python + BeautifulSoup:**

Extract from each review list page:
- **Rating**: Star rating (1-5 stars) - count `<span class="dashicons-star-filled">` elements inside `<div class="wporg-ratings">`
- **Review Title**: From `<a class="bbp-topic-permalink">` text (remove rating div text)
- **Topic URL**: From `href` attribute of `<a class="bbp-topic-permalink">` - needed to fetch full content
- **Reviewer Name**: From `<span class="bbp-author-name">`
- **Date**: From `<li class="bbp-topic-freshness">` link's title attribute or text
- **Reply Count**: From `<li class="bbp-topic-reply-count">` (engagement indicator)

**To get full review content:** Fetch individual topic URLs using curl with same headers, then parse:
- Look for `<div class="bbp-topic-content">` or `<div class="bbp-reply-content">`
- Use `.get_text(separator=' ', strip=True)` to extract clean text

**Structure for JSON output:**
```json
{
  "plugin": "plugin-slug",
  "total_reviews": 60,
  "extraction_date": "2025-10-12T17:39:19",
  "reviews": [
    {
      "rating": 5,
      "title": "Amazing plugin!",
      "content": "Full review text...",
      "author": "username",
      "date": "October 12, 2025 at 3:53 pm",
      "topic_url": "https://wordpress.org/support/topic/...",
      "reply_count": "2"
    }
  ]
}
```

Save to `/tmp/reviews_data.json` for analysis.

**Performance Tip:** For 60 reviews on 2 pages, fetch content for first 30-40 reviews (most recent) to balance depth vs. time. Use `time.sleep(1)` between fetches.

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

After extracting review data with BeautifulSoup and saving to JSON, **READ and ANALYZE the JSON data yourself** to identify patterns:

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

## Step 5: Generate Comprehensive Report

Create a structured report with the following sections:

### Executive Summary
- Total reviews analyzed
- Average rating and distribution
- Overall sentiment (Positive/Mixed/Negative)
- Top 3 strengths
- Top 3 weaknesses
- Most requested features

### Rating Distribution Analysis
- Breakdown by star rating (count and percentage)
- Trend analysis (if dates available)
- What drives 5-star vs. 1-star reviews

### What Users LOVE ❤️

For each major positive aspect:
- **Feature/Aspect**: What users appreciate
- **Frequency**: How often mentioned (% of positive reviews)
- **Impact**: Why this matters to users
- **Example Quotes**: Representative feedback (paraphrased)
- **User Types**: Who benefits most

Categories to cover:
- Core Functionality
- Ease of Use
- Performance & Reliability
- Support & Documentation
- Value & Pricing
- Integration Capabilities

### What Users DISLIKE 👎

For each major negative aspect:
- **Issue/Complaint**: What frustrates users
- **Frequency**: How often mentioned (% of negative reviews)
- **Severity**: Impact on user experience
- **Affected Users**: Who experiences this problem
- **Example Feedback**: Representative complaints (paraphrased)

Categories to cover:
- Bugs & Technical Issues
- Missing Features
- Usability Problems
- Performance Issues
- Support Concerns
- Compatibility Problems

### Feature Requests Portfolio 🎯

**High-Demand Features** (mentioned in multiple reviews)
- Feature description
- User benefit
- Frequency of request

**Quick Wins** (frequently requested, seemingly simple enhancements)
- Simple enhancements with clear value
- UI/UX improvements
- Configuration options

**Strategic Opportunities** (game-changing additions)
- Major feature additions
- New use cases enabled
- Market expansion potential

**Integration Requests**
- Third-party tool connections
- API improvements
- Workflow automations

### User Satisfaction Insights

**Power Users vs. Beginners**
- What each group values
- Different pain points
- Feature prioritization differences

**Use Case Analysis**
- How different users apply the plugin
- Industry-specific needs
- Workflow patterns

**Loyalty Indicators**
- Long-term user retention signals
- Recommendation likelihood
- Brand advocacy

### Competitive Intelligence

**Plugin Comparisons**
- Alternatives users mention
- Competitive advantages cited
- Where plugin excels vs. competitors
- Migration risks

**Market Position**
- How users describe the plugin's value
- Price/value perception
- Target audience fit

### Sentiment & Community Health

**Overall Sentiment Breakdown**
- Positive: % and themes
- Mixed: % and common "but" statements
- Negative: % and main complaints

**Emotional Tone Analysis**
- Anger & frustration indicators (words like "disaster", "shameful", "nightmare")
- Disbelief & shock (questioning if official plugin, expecting better)
- Resignation & abandonment ("giving up", "avoid at all costs")
- Business impact emphasis (revenue loss, customer trust damage)

**Review Quality**
- Detailed vs. brief reviews
- Constructive feedback ratio
- Emotional vs. factual reviews
- Language diversity (note non-English reviews)

**Community Engagement**
- Developer responses to reviews
- User interaction patterns (user-to-user help)
- Support visibility in reviews

**Community Health Score**
- Trust in developers (shattered/high/low)
- Hope for improvement (none/some/strong)
- Active support (absent/minimal/good)
- User advocacy (negative/neutral/positive)

### Competitive Opportunity Assessment (NEW)

**Market Gaps This Plugin Creates**
For each major gap:
- Gap size (huge/large/medium/small)
- Market size estimate
- Willingness to pay (high/medium/low)
- Barrier to entry
- Specific opportunity description

**Unmet Market Needs**
- Ranked list of needs not being met by current plugin
- Validation from user complaints

**Threats from Current Plugin**
- How competitive is the current plugin?
- What's the opportunity window?
- Market validation through pain points

**Recommendations for Competitors**
- Immediate market opportunities
- Marketing strategy suggestions
- Target audience identification
- Key messaging based on user pain points

### Trend Analysis (NEW)

**Temporal Patterns**
- Identify crisis periods (mass 1-star reviews on specific dates)
- Ongoing vs. one-time issues
- Pattern recognition across time

**Version-Specific Issues**
- Table of versions and their problems
- Recommended vs. broken versions
- Plugin getting better or worse over time?

**Recovery Patterns**
- How users fix issues when they occur
- Recovery time estimates
- Business impact of downtime

### Appendices

**Appendix A: Data Sources**
- Date range of reviews analyzed
- Total review count per rating
- Version coverage
- Extraction methodology

**Appendix B: Keyword Frequency**
- Most common positive terms (with frequency)
- Most common negative terms (with frequency)
- Most common problem areas (with frequency)
- Feature request keywords
- Language distribution

**Appendix C: Technical Error Details** (if applicable)
- Common fatal errors with stack traces
- Root causes identified
- User workarounds documented

**Appendix D: Review Authenticity Assessment**
- Indicators of genuine reviews
- Confidence level in data
- Any evidence of manipulation or spam

## Output Format

Generate the report as a well-structured Markdown document with:
- Clear headings and subheadings
- Emoji indicators for sections (❤️ 👎 🎯 ⭐)
- Bullet points for scannability
- Tables for rating distribution
- Blockquotes for paraphrased user feedback
- Visual emphasis (bold) for key findings
- Star ratings displayed clearly (★★★★★)

## Quality Checks

Before finalizing:
- ✓ Verify rating distribution adds up to 100%
- ✓ Cross-reference patterns across multiple reviews
- ✓ Include specific examples (paraphrased, not quoted)
- ✓ Maintain objectivity in analysis
- ✓ Balance positive and negative findings fairly
- ✓ Prioritize insights by frequency and impact

## Implementation Best Practices

### Python Environment Setup
**ALWAYS create a virtual environment** to avoid system package conflicts:
```bash
python3 -m venv /tmp/venv
/tmp/venv/bin/pip install beautifulsoup4 -q
```

Use `/tmp/venv/bin/python3` for all Python scripts (NOT just `python3`).

### curl Best Practices
**ALWAYS include these flags** when fetching from WordPress.org:
- `-L` : Follow redirects
- `-A "Mozilla/5.0"` : Set user agent (required!)
- `-s` : Silent mode (optional)

**Example:** `curl -L -A "Mozilla/5.0" -s "URL" -o output.html`

Without `-L` and `-A`, you may get empty responses or 403 errors.

### HTML Parsing Strategy
**DO NOT use grep/sed/awk for HTML parsing** - structure is too complex.

**USE BeautifulSoup** to extract from bbPress forum structure:
- Review topics: `soup.find_all('ul', id=lambda x: x and x.startswith('bbp-topic-'))`
- Rating: Count `<span class="dashicons-star-filled">` within `<div class="wporg-ratings">`
- Title: `review_ul.find('a', class_='bbp-topic-permalink').get_text(strip=True)`
- Author: `review_ul.find('span', class_='bbp-author-name').get_text(strip=True)`
- Date: `review_ul.find('li', class_='bbp-topic-freshness').find('a').get('title')`
- Topic URL: `review_ul.find('a', class_='bbp-topic-permalink').get('href')`

**For full review content**, fetch individual topic pages and look for:
- `soup.find('div', class_='bbp-topic-content')` - the main review text
- Remove nested `<div class="bbp-reply-content">` if present (those are replies, not the review)

**Important:** WordPress.org uses bbPress forum software for reviews, not a custom review system. Always inspect HTML structure first before writing extraction code.

### Work Directory
- Save all fetched HTML to `/tmp/` directory
- Save processed data (JSON) to `/tmp/` for easy access
- Save final report to current working directory: `{plugin-slug}-reviews-analysis.md`

### Rate Limiting
**Always add delays** between page requests to WordPress.org:
```bash
sleep 1  # 1 second between page fetches
```

### Analysis Scope
- For most plugins, **pages 1-2 (20-30 reviews) is sufficient** for comprehensive analysis
- Each page typically shows 15-30 reviews
- Include reviews from all rating levels for balanced perspective
- If plugin has 100+ reviews, sample across different time periods

### Content Fetching Strategy
**Two-phase approach:**
1. **Phase 1 (Fast):** Parse review list pages to get titles, ratings, authors, dates, URLs
2. **Phase 2 (Slower):** Fetch individual topic pages for full review content

**Optimization:**
- For 60 reviews across 2 pages, fetch content for first 30-40 reviews (most recent)
- This balances analysis depth with execution time
- Use `subprocess.run(['curl', '-L', '-A', 'Mozilla/5.0', '-s', url], capture_output=True)` in Python
- Add `time.sleep(1)` between fetches to be respectful to WordPress.org servers

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

If the plugin slug is invalid or inaccessible, provide guidance on correct plugin identification. If reviews are minimal or non-existent, adjust the analysis scope accordingly and note limitations in the report.

**Important:** WordPress.org review pages may require careful inspection to identify the correct HTML structure and CSS classes for parsing. Start by examining the HTML structure before writing extraction code.

**Output Location:** Save the final markdown report to the current working directory with filename: `{plugin-slug}-competitive-analysis.md`

Begin the analysis now and provide comprehensive competitive intelligence that highlights competitor strengths, weaknesses, and unmet market needs.