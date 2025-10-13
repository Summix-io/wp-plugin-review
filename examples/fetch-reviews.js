/**
 * Example: Fetch and analyze plugin reviews
 *
 * This example demonstrates how to use the ReviewFetcher
 * programmatically to fetch, analyze, and export reviews.
 */

import { ReviewFetcher, DataStore } from '../src/index.js';

async function analyzePlugin(pluginSlug, options = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Analyzing: ${pluginSlug}`);
  console.log('='.repeat(60));

  try {
    // Create fetcher with custom options
    const fetcher = new ReviewFetcher(pluginSlug, {
      monthsBack: options.monthsBack || 6,
      maxPages: options.maxPages || 5,
      delayMs: options.delayMs || 1000,
    });

    // Fetch reviews
    const data = await fetcher.fetchAllReviews();

    // Analyze reviews
    const stats = ReviewFetcher.getStatistics(data.reviews);

    // Display statistics
    console.log('\n--- Review Statistics ---');
    console.log(`Total reviews analyzed: ${stats.total}`);
    console.log(`Average rating: ${stats.averageRating} stars`);
    console.log('\nRating distribution:');
    for (let rating = 5; rating >= 1; rating--) {
      const count = stats.byRating[rating];
      const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
      const bar = '█'.repeat(Math.round(percentage / 2));
      console.log(`  ${rating}★: ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
    }

    // Find top positive and negative reviews
    const positiveReviews = data.reviews.filter(r => r.rating >= 4);
    const negativeReviews = data.reviews.filter(r => r.rating <= 2);

    console.log(`\n--- Sentiment Overview ---`);
    console.log(`Positive reviews (4-5★): ${positiveReviews.length} (${((positiveReviews.length/stats.total)*100).toFixed(1)}%)`);
    console.log(`Negative reviews (1-2★): ${negativeReviews.length} (${((negativeReviews.length/stats.total)*100).toFixed(1)}%)`);

    // Sample review excerpts
    if (positiveReviews.length > 0) {
      console.log('\n--- Sample Positive Review ---');
      const sample = positiveReviews[0];
      console.log(`${sample.rating}★ - "${sample.title}"`);
      console.log(`By ${sample.author} on ${sample.date}`);
      console.log(`"${sample.content.substring(0, 200)}${sample.content.length > 200 ? '...' : ''}"`);
    }

    if (negativeReviews.length > 0) {
      console.log('\n--- Sample Negative Review ---');
      const sample = negativeReviews[0];
      console.log(`${sample.rating}★ - "${sample.title}"`);
      console.log(`By ${sample.author} on ${sample.date}`);
      console.log(`"${sample.content.substring(0, 200)}${sample.content.length > 200 ? '...' : ''}"`);
    }

    // Save data
    const store = new DataStore();
    const jsonPath = await store.saveReviews(data);
    const csvPath = await store.saveAsCSV(data);

    console.log('\n--- Files Created ---');
    console.log(`JSON: ${jsonPath}`);
    console.log(`CSV: ${csvPath}`);

    return {
      data,
      stats,
      positiveReviews,
      negativeReviews,
    };

  } catch (error) {
    console.error('\nError analyzing plugin:', error.message);
    throw error;
  }
}

// Example: Analyze multiple plugins
async function comparePlugins() {
  const plugins = [
    { slug: 'woocommerce', name: 'WooCommerce' },
    { slug: 'elementor', name: 'Elementor' },
  ];

  console.log('\n' + '='.repeat(60));
  console.log('COMPETITIVE ANALYSIS: Multiple Plugins');
  console.log('='.repeat(60));

  const results = [];

  for (const plugin of plugins) {
    try {
      const result = await analyzePlugin(plugin.slug, {
        monthsBack: 6,
        maxPages: 3,
      });

      results.push({
        ...plugin,
        avgRating: result.stats.averageRating,
        totalReviews: result.stats.total,
        positivePercent: ((result.positiveReviews.length / result.stats.total) * 100).toFixed(1),
      });

      // Delay between plugins
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to analyze ${plugin.name}:`, error.message);
    }
  }

  // Comparison summary
  console.log('\n\n' + '='.repeat(60));
  console.log('COMPARISON SUMMARY');
  console.log('='.repeat(60));
  console.log('\nPlugin              | Avg Rating | Reviews | Positive %');
  console.log('-'.repeat(60));
  results.forEach(r => {
    console.log(
      `${r.name.padEnd(20)}| ${r.avgRating.padStart(10)} | ${r.totalReviews.toString().padStart(7)} | ${r.positivePercent.padStart(10)}%`
    );
  });
}

// Run example
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Example Usage:
  node examples/fetch-reviews.js <plugin-slug>
  node examples/fetch-reviews.js compare

Examples:
  node examples/fetch-reviews.js woocommerce
  node examples/fetch-reviews.js compare
  `);
  process.exit(0);
}

if (args[0] === 'compare') {
  comparePlugins().catch(console.error);
} else {
  analyzePlugin(args[0]).catch(console.error);
}
