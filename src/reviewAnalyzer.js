/**
 * ReviewAnalyzer - Analyzes WordPress plugin reviews for competitive intelligence
 */
export class ReviewAnalyzer {
  constructor(data) {
    this.data = data;
    this.reviews = data.reviews || [];
  }

  /**
   * Calculate rating statistics
   */
  getRatingStats() {
    const stats = {
      total: this.reviews.length,
      byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      averageRating: 0,
    };

    let totalRating = 0;
    this.reviews.forEach(review => {
      const rating = review.rating;
      if (rating >= 1 && rating <= 5) {
        stats.byRating[rating]++;
        totalRating += rating;
      }
    });

    if (stats.total > 0) {
      stats.averageRating = parseFloat((totalRating / stats.total).toFixed(2));
    }

    return stats;
  }

  /**
   * Group reviews by rating
   */
  groupByRating() {
    const groups = { 5: [], 4: [], 3: [], 2: [], 1: [] };

    this.reviews.forEach(review => {
      const rating = review.rating;
      if (rating >= 1 && rating <= 5) {
        groups[rating].push(review);
      }
    });

    return groups;
  }

  /**
   * Extract negative keywords from reviews
   */
  extractKeywords(reviews, keywords) {
    const counts = {};

    keywords.forEach(keyword => {
      const pattern = new RegExp(keyword, 'gi');
      let count = 0;

      reviews.forEach(review => {
        const text = `${review.title} ${review.content}`.toLowerCase();
        const matches = text.match(pattern);
        if (matches) {
          count += matches.length;
        }
      });

      if (count > 0) {
        counts[keyword] = count;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
  }

  /**
   * Analyze sentiment
   */
  analyzeSentiment() {
    const stats = this.getRatingStats();
    const total = stats.total;

    const sentiment = {
      positive: ((stats.byRating[5] + stats.byRating[4]) / total * 100).toFixed(1),
      mixed: (stats.byRating[3] / total * 100).toFixed(1),
      negative: ((stats.byRating[2] + stats.byRating[1]) / total * 100).toFixed(1),
    };

    let overall;
    if (stats.averageRating < 2.0) overall = 'EXTREMELY NEGATIVE';
    else if (stats.averageRating < 3.0) overall = 'NEGATIVE';
    else if (stats.averageRating < 4.0) overall = 'MIXED';
    else overall = 'POSITIVE';

    return { sentiment, overall, averageRating: stats.averageRating };
  }

  /**
   * Print comprehensive analysis
   */
  printAnalysis() {
    const stats = this.getRatingStats();
    const groups = this.groupByRating();
    const sentiment = this.analyzeSentiment();

    console.log('\n' + '='.repeat(60));
    console.log('REVIEW ANALYSIS SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nPlugin: ${this.data.pluginSlug}`);
    console.log(`Analysis Period: ${new Date(this.data.cutoffDate).toDateString()} - ${new Date(this.data.fetchDate).toDateString()}`);
    console.log(`Total Unique Reviews: ${stats.total}`);

    console.log('\nRating Distribution:');
    for (let rating = 5; rating >= 1; rating--) {
      const count = stats.byRating[rating];
      const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0';
      console.log(`  ${rating}★: ${count} (${pct}%)`);
    }

    console.log(`\nAverage Rating: ${stats.averageRating} stars`);
    console.log(`Overall Sentiment: ${sentiment.overall}`);

    console.log('\nSentiment Breakdown:');
    console.log(`  Positive (4-5★): ${sentiment.sentiment.positive}%`);
    console.log(`  Mixed (3★): ${sentiment.sentiment.mixed}%`);
    console.log(`  Negative (1-2★): ${sentiment.sentiment.negative}%`);

    // Analyze negative themes
    const negativeReviews = [...groups[1], ...groups[2]];
    if (negativeReviews.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('NEGATIVE THEMES ANALYSIS');
      console.log('='.repeat(60));

      const negativeKeywords = [
        'crash', 'crashed', 'broken', 'broke', 'bug', 'bugs', 'error', 'errors',
        'problem', 'problems', 'issue', 'issues', 'terrible', 'worst', 'avoid',
        'mess', 'connection', 'disconnect', 'pixel', 'disappear',
        'unstable', 'unreliable', 'not working', "doesn't work", "didn't work",
        'failed', 'fail', 'fails'
      ];

      const keywordCounts = this.extractKeywords(negativeReviews, negativeKeywords);

      console.log(`\nAnalyzed ${negativeReviews.length} negative reviews`);
      console.log('\nTop Negative Keywords:');

      Object.entries(keywordCounts).slice(0, 15).forEach(([keyword, count]) => {
        console.log(`  - '${keyword}': ${count} mention${count > 1 ? 's' : ''}`);
      });
    }

    // Show sample reviews by rating
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE REVIEWS BY RATING');
    console.log('='.repeat(60));

    for (let rating = 5; rating >= 1; rating--) {
      const reviewList = groups[rating];
      if (reviewList.length > 0) {
        console.log(`\n${rating}-STAR REVIEWS (${reviewList.length} total)`);
        console.log('-'.repeat(60));

        reviewList.slice(0, 3).forEach((review, index) => {
          console.log(`\n${index + 1}. ${review.title}`);
          console.log(`   Author: ${review.author} | Date: ${review.date}`);

          if (review.content) {
            const content = review.content.substring(0, 150);
            console.log(`   ${content}${review.content.length > 150 ? '...' : ''}`);
          }
        });

        if (reviewList.length > 3) {
          console.log(`\n   ... and ${reviewList.length - 3} more`);
        }
      }
    }

    // Competitive opportunity assessment
    console.log('\n' + '='.repeat(60));
    console.log('COMPETITIVE OPPORTUNITY ASSESSMENT');
    console.log('='.repeat(60));

    const negativePercent = parseFloat(sentiment.sentiment.negative);
    const positivePercent = parseFloat(sentiment.sentiment.positive);

    if (negativePercent > 50) {
      console.log('\n🚨 CRITICAL OPPORTUNITY - User satisfaction crisis detected');
      console.log(`   ${negativePercent}% negative reviews indicates major market gap`);
    } else if (negativePercent > 30) {
      console.log('\n⚠️  SIGNIFICANT OPPORTUNITY - Notable user dissatisfaction');
      console.log(`   ${negativePercent}% negative reviews suggests improvement potential`);
    } else {
      console.log('\n✓ Limited opportunity - Plugin generally satisfies users');
    }

    if (stats.total < 10) {
      console.log(`\n⚠️  NOTE: Low review volume (${stats.total} reviews) may indicate:`);
      console.log('   - Low user engagement');
      console.log('   - Users abandoning without reviewing');
      console.log('   - Limited active user base');
    }

    console.log('\nKey Pain Points:');
    const painPoints = this.identifyPainPoints(negativeReviews);
    painPoints.forEach((point, index) => {
      console.log(`   ${index + 1}. ${point}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('Analysis complete!');
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Identify key pain points from negative reviews
   */
  identifyPainPoints(negativeReviews) {
    const painPoints = [];

    // Check for crash/stability issues
    const crashKeywords = ['crash', 'broke', 'broken', 'unstable'];
    const hasCrashIssues = negativeReviews.some(r => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      return crashKeywords.some(kw => text.includes(kw));
    });
    if (hasCrashIssues) {
      painPoints.push('Site crashes and instability (CRITICAL)');
    }

    // Check for connection issues
    const connectionKeywords = ['connection', 'disconnect', 'connect', 'recognize'];
    const hasConnectionIssues = negativeReviews.some(r => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      return connectionKeywords.some(kw => text.includes(kw));
    });
    if (hasConnectionIssues) {
      painPoints.push('Connection failures and authentication problems');
    }

    // Check for pixel/tracking issues
    const pixelKeywords = ['pixel', 'tracking', 'disappear'];
    const hasPixelIssues = negativeReviews.some(r => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      return pixelKeywords.some(kw => text.includes(kw));
    });
    if (hasPixelIssues) {
      painPoints.push('Facebook Pixel tracking issues');
    }

    // Check for error messages
    const errorKeywords = ['error', 'errors'];
    const hasErrorIssues = negativeReviews.some(r => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      return errorKeywords.some(kw => text.includes(kw));
    });
    if (hasErrorIssues) {
      painPoints.push('Frequent errors with unclear messages');
    }

    // Check for update problems
    const updateKeywords = ['update', 'upgrade'];
    const hasUpdateIssues = negativeReviews.some(r => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      return updateKeywords.some(kw => text.includes(kw));
    });
    if (hasUpdateIssues) {
      painPoints.push('Problems with plugin updates');
    }

    if (painPoints.length === 0) {
      painPoints.push('General dissatisfaction with plugin functionality');
    }

    return painPoints;
  }

  /**
   * Generate comprehensive markdown report
   */
  generateMarkdownReport() {
    const stats = this.getRatingStats();
    const groups = this.groupByRating();
    const sentiment = this.analyzeSentiment();
    const negativeReviews = [...groups[1], ...groups[2]];
    const positiveReviews = [...groups[5], ...groups[4]];

    const negativeKeywords = [
      'crash', 'crashed', 'broken', 'broke', 'bug', 'bugs', 'error', 'errors',
      'problem', 'problems', 'issue', 'issues', 'terrible', 'worst', 'avoid',
      'mess', 'connection', 'disconnect', 'pixel', 'disappear',
      'unstable', 'unreliable', 'not working', "doesn't work", 'failed'
    ];

    const keywordCounts = this.extractKeywords(negativeReviews, negativeKeywords);
    const painPoints = this.identifyPainPoints(negativeReviews);

    const date = new Date(this.data.fetchDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const cutoffDate = new Date(this.data.cutoffDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let report = `# ${this.data.pluginSlug} - Competitive Analysis Report

**Generated:** ${date}
**Analysis Period:** ${cutoffDate} - ${date}
**Data Source:** WordPress.org Plugin Reviews

---

## Executive Summary

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Reviews** | ${stats.total} |
| **Average Rating** | ${stats.averageRating}★ / 5.0 |
| **Overall Sentiment** | **${sentiment.overall}** |
| **Positive Reviews** | ${sentiment.sentiment.positive}% |
| **Negative Reviews** | ${sentiment.sentiment.negative}% |

### Rating Distribution

| Rating | Count | Percentage |
|--------|-------|------------|
| 5★ | ${stats.byRating[5]} | ${stats.total > 0 ? ((stats.byRating[5]/stats.total)*100).toFixed(1) : '0.0'}% |
| 4★ | ${stats.byRating[4]} | ${stats.total > 0 ? ((stats.byRating[4]/stats.total)*100).toFixed(1) : '0.0'}% |
| 3★ | ${stats.byRating[3]} | ${stats.total > 0 ? ((stats.byRating[3]/stats.total)*100).toFixed(1) : '0.0'}% |
| 2★ | ${stats.byRating[2]} | ${stats.total > 0 ? ((stats.byRating[2]/stats.total)*100).toFixed(1) : '0.0'}% |
| 1★ | ${stats.byRating[1]} | ${stats.total > 0 ? ((stats.byRating[1]/stats.total)*100).toFixed(1) : '0.0'}% |

### Critical Findings

`;

    // Add critical findings based on sentiment
    const negativePercent = parseFloat(sentiment.sentiment.negative);
    if (negativePercent > 50) {
      report += `🚨 **CRITICAL OPPORTUNITY** - User satisfaction crisis detected with ${negativePercent}% negative reviews.\n\n`;
    } else if (negativePercent > 30) {
      report += `⚠️ **SIGNIFICANT OPPORTUNITY** - Notable user dissatisfaction with ${negativePercent}% negative reviews.\n\n`;
    } else {
      report += `✓ **Limited Opportunity** - Plugin generally satisfies users.\n\n`;
    }

    if (stats.total < 10) {
      report += `⚠️ **Low Review Volume** (${stats.total} reviews) may indicate low user engagement or abandonment.\n\n`;
    }

    report += `**Key Pain Points:**\n`;
    painPoints.forEach((point, index) => {
      report += `${index + 1}. ${point}\n`;
    });

    report += `\n---

## Detailed Analysis

### Positive Feedback (${positiveReviews.length} reviews)

`;

    if (positiveReviews.length > 0) {
      report += `**What Users Love:**\n\n`;
      positiveReviews.slice(0, 5).forEach((review, index) => {
        report += `**${index + 1}. ${review.title}** (${review.rating}★)\n`;
        report += `*By ${review.author} on ${review.date}*\n\n`;
        if (review.content) {
          const content = review.content.substring(0, 200);
          report += `> ${content}${review.content.length > 200 ? '...' : ''}\n\n`;
        }
      });
    } else {
      report += `No positive reviews found in this period.\n\n`;
    }

    report += `### Negative Feedback (${negativeReviews.length} reviews)

**Common Complaints:**

`;

    // Add keyword analysis
    const topKeywords = Object.entries(keywordCounts).slice(0, 10);
    if (topKeywords.length > 0) {
      report += `**Top Negative Keywords:**\n\n`;
      report += `| Keyword | Mentions |\n`;
      report += `|---------|----------|\n`;
      topKeywords.forEach(([keyword, count]) => {
        report += `| ${keyword} | ${count} |\n`;
      });
      report += `\n`;
    }

    report += `**Sample Negative Reviews:**\n\n`;
    negativeReviews.slice(0, 5).forEach((review, index) => {
      report += `**${index + 1}. ${review.title}** (${review.rating}★)\n`;
      report += `*By ${review.author} on ${review.date}*\n\n`;
      if (review.content) {
        const content = review.content.substring(0, 300);
        report += `> ${content}${review.content.length > 300 ? '...' : ''}\n\n`;
      }
    });

    report += `---

## Market Opportunity Assessment

### Competitive Gaps

`;

    if (negativePercent > 50) {
      report += `**Market Opportunity: CRITICAL**

The high percentage of negative reviews (${negativePercent}%) indicates severe user dissatisfaction. This represents a **major market opportunity** for competitors to capture frustrated users with a more reliable solution.

**Why This Matters:**
- Users are actively seeking this type of solution (they installed the plugin)
- Current solution is failing to meet needs
- High switching motivation among current users
- Demand is validated but supply is inadequate

`;
    } else if (negativePercent > 30) {
      report += `**Market Opportunity: SIGNIFICANT**

With ${negativePercent}% negative reviews, there's notable room for improvement. A competitor could differentiate by addressing the key pain points.

`;
    } else {
      report += `**Market Opportunity: LIMITED**

The plugin generally satisfies users with only ${negativePercent}% negative feedback. Competition would need significant differentiation.

`;
    }

    report += `### Recommendations

**For Competitors:**
1. Focus on reliability and stability (if crash issues present)
2. Simplify user experience (if complexity issues present)
3. Provide superior customer support
4. Position as the "enterprise-grade" alternative

**For Plugin Developers:**
1. Address the most common complaints immediately
2. Improve documentation and error messages
3. Enhance testing before updates
4. Engage more actively with user feedback

---

## Review Samples by Rating

`;

    // Add sample reviews for each rating
    for (let rating = 5; rating >= 1; rating--) {
      const reviewList = groups[rating];
      if (reviewList.length > 0) {
        report += `### ${rating}-Star Reviews (${reviewList.length} total)\n\n`;
        reviewList.slice(0, 3).forEach((review, index) => {
          report += `**${index + 1}. ${review.title}**\n`;
          report += `*By ${review.author} on ${review.date}*\n\n`;
          if (review.content) {
            const content = review.content.substring(0, 250);
            report += `${content}${review.content.length > 250 ? '...' : ''}\n\n`;
          }
          if (review.topicUrl) {
            report += `[View Full Review](${review.topicUrl})\n\n`;
          }
          report += `---\n\n`;
        });
      }
    }

    report += `## Data Summary

- **Plugin:** ${this.data.pluginSlug}
- **Reviews Analyzed:** ${stats.total}
- **Analysis Date:** ${date}
- **Time Range:** ${this.data.monthsBack} months
- **Pages Fetched:** ${this.data.pagesFetched || 'N/A'}

---

*Report generated by WordPress Plugin Review Analyzer*
`;

    return report;
  }
}
