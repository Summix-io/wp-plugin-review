import { CompetitorFinder } from './competitorFinder.js';
import { DataStore } from './dataStore.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Generate markdown report for competitors
 */
function generateCompetitorReport(data) {
  const { targetPlugin, competitors } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let report = `# Competitors Analysis for ${targetPlugin.name}\n\n`;
  report += `**Target Plugin:** [${targetPlugin.name}](${targetPlugin.url})\n`;
  report += `**Analysis Date:** ${currentDate}\n`;
  report += `**Competitors Found:** ${competitors.length}\n\n`;
  report += `---\n\n`;

  // Target Plugin Overview
  report += `## Target Plugin Overview\n\n`;
  report += `**Category:** ${targetPlugin.category || 'N/A'}\n`;
  report += `**Tags:** ${targetPlugin.tags.join(', ')}\n`;
  report += `**Description:** ${targetPlugin.description}\n`;
  report += `**Active Installations:** ${targetPlugin.activeInstalls}\n`;
  report += `**Rating:** ${targetPlugin.rating}/5 (${targetPlugin.ratingCount} ratings)\n\n`;
  report += `---\n\n`;

  // High-Level Comparison Table
  report += `## Quick Comparison\n\n`;
  report += `| Plugin | Active Installs | Rating | Last Updated | Key Focus |\n`;
  report += `|--------|----------------|--------|--------------|----------|\n`;

  // Add target plugin row
  const targetInstalls = parseInstallCount(targetPlugin.activeInstalls);
  const targetInstallsFormatted = formatInstallCount(targetInstalls);
  const targetLastUpdated = formatLastUpdated(targetPlugin.lastUpdated);
  report += `| **${targetPlugin.name}** (target) | ${targetInstallsFormatted} | ${targetPlugin.rating}/5 | ${targetLastUpdated} | ${extractKeyFocus(targetPlugin.description)} |\n`;

  // Add competitor rows
  competitors.forEach(comp => {
    const installs = parseInstallCount(comp.activeInstalls);
    const installsFormatted = formatInstallCount(installs);
    const lastUpdated = formatLastUpdated(comp.lastUpdated);
    const keyFocus = extractKeyFocus(comp.description);
    report += `| ${comp.name} | ${installsFormatted} | ${comp.rating}/5 | ${lastUpdated} | ${keyFocus} |\n`;
  });

  report += `\n---\n\n`;

  // Competitor Plugins
  report += `## Competitor Plugins\n\n`;

  competitors.forEach((competitor, index) => {
    report += `### ${index + 1}. ${competitor.name}\n\n`;
    report += `**Slug:** \`${competitor.slug}\`\n`;
    report += `**URL:** [WordPress.org](${competitor.url})\n\n`;

    report += `**Metrics:**\n`;
    report += `- Active Installations: ${competitor.activeInstalls}\n`;
    report += `- Rating: ${competitor.rating}/5 (${competitor.ratingCount} ratings)\n`;
    report += `- Last Updated: ${competitor.lastUpdated || 'N/A'}\n\n`;

    report += `**Description:**\n`;
    report += `${competitor.description}\n\n`;

    report += `**Tags:**\n`;
    if (competitor.tags && competitor.tags.length > 0) {
      report += competitor.tags.map(tag => `- ${tag}`).join('\n') + '\n\n';
    } else {
      report += `- N/A\n\n`;
    }

    // Calculate common tags with target
    const commonTags = competitor.tags.filter(tag =>
      targetPlugin.tags.includes(tag)
    );
    if (commonTags.length > 0) {
      report += `**Common Tags with Target:** ${commonTags.join(', ')}\n\n`;
    }

    report += `---\n\n`;
  });

  // Competitive Landscape Summary
  report += `## Competitive Landscape Summary\n\n`;

  // Count plugins by install tiers
  const installTiers = {
    'Million+': 0,
    '100K-1M': 0,
    '10K-100K': 0,
    '1K-10K': 0,
    'Under 1K': 0,
  };

  competitors.forEach(comp => {
    const installs = parseInstallCount(comp.activeInstalls);
    if (installs >= 1000000) installTiers['Million+']++;
    else if (installs >= 100000) installTiers['100K-1M']++;
    else if (installs >= 10000) installTiers['10K-100K']++;
    else if (installs >= 1000) installTiers['1K-10K']++;
    else installTiers['Under 1K']++;
  });

  report += `### Market Position by Install Count\n\n`;
  Object.entries(installTiers).forEach(([tier, count]) => {
    if (count > 0) {
      report += `- **${tier}:** ${count} plugin${count !== 1 ? 's' : ''}\n`;
    }
  });
  report += `\n`;

  // Average rating
  const validRatings = competitors
    .map(c => parseFloat(c.rating))
    .filter(r => !isNaN(r) && r > 0);

  if (validRatings.length > 0) {
    const avgRating = (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2);
    report += `### Average Competitor Rating\n\n`;
    report += `**${avgRating}/5** (across ${validRatings.length} competitors with ratings)\n\n`;
  }

  // Most common tags across competitors
  const tagCounts = {};
  competitors.forEach(comp => {
    comp.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (topTags.length > 0) {
    report += `### Most Common Tags Across Competitors\n\n`;
    topTags.forEach(([tag, count]) => {
      report += `- **${tag}:** ${count} plugin${count !== 1 ? 's' : ''}\n`;
    });
    report += `\n`;
  }

  report += `### Key Insights\n\n`;
  report += `- Total competitors analyzed: ${competitors.length}\n`;
  report += `- Competitive landscape: ${competitors.length >= 8 ? 'Highly competitive' : competitors.length >= 4 ? 'Moderately competitive' : 'Limited competition'}\n`;
  report += `- Market maturity: ${installTiers['Million+'] > 0 ? 'Mature market with established leaders' : 'Emerging market with growth opportunities'}\n\n`;

  return report;
}

/**
 * Parse install count string to number
 */
function parseInstallCount(installString) {
  if (!installString) return 0;

  const str = installString.toLowerCase().trim();

  // Handle "5+ million", "1+ million"
  if (str.includes('million')) {
    const match = str.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) * 1000000 : 0;
  }

  // Handle "500,000+", "50,000+"
  const numberMatch = str.match(/([\d,]+)\+?/);
  if (numberMatch) {
    const number = parseInt(numberMatch[1].replace(/,/g, ''));
    return number || 0;
  }

  return 0;
}

/**
 * Format install count for display in table
 */
function formatInstallCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M+`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K+`;
  }
  return count.toString();
}

/**
 * Format last updated date for table
 */
function formatLastUpdated(dateString) {
  if (!dateString) return 'N/A';

  // If it's already in relative format (e.g., "3 weeks ago")
  if (dateString.includes('ago')) {
    return dateString;
  }

  // If it's a full timestamp, extract just the date
  const match = dateString.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  return dateString;
}

/**
 * Extract key focus from description (first sentence or key phrase)
 */
function extractKeyFocus(description) {
  if (!description) return 'N/A';

  // Get first sentence (up to first period or 80 chars)
  let focus = description.split('.')[0].trim();

  // Truncate if too long
  if (focus.length > 80) {
    focus = focus.substring(0, 77) + '...';
  }

  return focus || 'N/A';
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
WordPress Plugin Competitor Finder
===================================

Usage: node src/findCompetitors.js <plugin-slug> [options]

Options:
  --max=N        Maximum competitors to find (default: 10)

Examples:
  node src/findCompetitors.js woocommerce
  node src/findCompetitors.js contact-form-7 --max=5
    `);
    process.exit(0);
  }

  const pluginSlug = args[0];
  const options = {
    maxCompetitors: 10,
  };

  // Parse command line options
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--max=')) {
      options.maxCompetitors = parseInt(arg.split('=')[1]);
    }
  });

  try {
    // Find competitors
    const finder = new CompetitorFinder(pluginSlug, options);
    const data = await finder.findCompetitors();

    console.log(`\n✓ Found ${data.competitors.length} competitors\n`);

    // Generate report
    const report = generateCompetitorReport(data);

    // Create reports directory structure
    const store = new DataStore();
    const reportInfo = store.getReportInfo(pluginSlug);

    // Ensure directory exists
    await fs.mkdir(reportInfo.directory, { recursive: true });

    // Save report
    const reportPath = path.join(reportInfo.directory, 'competitors.md');
    await fs.writeFile(reportPath, report, 'utf-8');

    console.log('='.repeat(60));
    console.log('COMPETITOR REPORT SAVED');
    console.log('='.repeat(60));
    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`\nCompetitors analyzed: ${data.competitors.length}`);
    console.log('\nDone!');
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
const isMain = import.meta.url.endsWith(process.argv[1]) ||
               import.meta.url === `file://${process.argv[1]}`;

if (isMain || process.argv[1]?.includes('findCompetitors.js')) {
  main();
}
