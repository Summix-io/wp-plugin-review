import { ReviewFetcher } from './reviewFetcher.js';
import { DataStore } from './dataStore.js';
import { ReviewAnalyzer } from './reviewAnalyzer.js';

/**
 * Main entry point for the WP Plugin Review Fetcher
 */
export { ReviewFetcher, DataStore, ReviewAnalyzer };

/**
 * CLI interface when run directly
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
WordPress Plugin Review Fetcher
================================

Usage: node src/index.js <plugin-slug> [options]

Options:
  --months=N     Number of months to look back (default: 12)
  --max-pages=N  Maximum pages to fetch (default: 10)
  --csv          Also export as CSV
  --delay=N      Delay between requests in ms (default: 1000)

Examples:
  node src/index.js woocommerce
  node src/index.js elementor --months=6
  node src/index.js contact-form-7 --csv --months=24
    `);
    process.exit(0);
  }

  const pluginSlug = args[0];
  const options = {
    monthsBack: 12,
    maxPages: 10,
    delayMs: 1000,
  };

  let exportCSV = false;

  // Parse command line options
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--months=')) {
      options.monthsBack = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--max-pages=')) {
      options.maxPages = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--delay=')) {
      options.delayMs = parseInt(arg.split('=')[1]);
    } else if (arg === '--csv') {
      exportCSV = true;
    }
  });

  try {
    // Fetch reviews
    const fetcher = new ReviewFetcher(pluginSlug, options);
    const data = await fetcher.fetchAllReviews();

    // Deduplicate reviews before analysis
    const uniqueReviews = DataStore.deduplicateReviews(data.reviews);
    const deduplicatedData = {
      ...data,
      reviews: uniqueReviews,
      reviewsInRange: uniqueReviews.length,
      totalReviewsFetched: uniqueReviews.length,
    };

    // Save data
    const store = new DataStore();
    const filepath = await store.saveReviews(deduplicatedData);

    if (exportCSV) {
      await store.saveAsCSV(deduplicatedData);
    }

    // Analyze reviews
    const analyzer = new ReviewAnalyzer(deduplicatedData);
    analyzer.printAnalysis();

    // Generate and save markdown report
    const markdownReport = analyzer.generateMarkdownReport();
    await store.saveMarkdownReport(pluginSlug, markdownReport);

    // Show report location
    const reportInfo = store.getReportInfo(pluginSlug);
    console.log('\n' + '='.repeat(60));
    console.log('REPORT LOCATION');
    console.log('='.repeat(60));
    console.log(`\nAll files saved to: ${reportInfo.directory}`);
    console.log(`  - reviews.json (raw data)`);
    if (exportCSV) {
      console.log(`  - reviews.csv (spreadsheet format)`);
    }
    console.log(`  - report.md (analysis report)`);

    console.log('\nDone!');
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
// Check if this module is being run directly
const isMain = import.meta.url.endsWith(process.argv[1]) ||
               import.meta.url === `file://${process.argv[1]}`;

if (isMain || process.argv[1]?.includes('index.js')) {
  main();
}
