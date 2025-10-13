import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * ReviewFetcher - Fetches WordPress plugin reviews from wordpress.org
 */
export class ReviewFetcher {
  constructor(pluginSlug, options = {}) {
    this.pluginSlug = pluginSlug;
    this.baseUrl = `https://wordpress.org/support/plugin/${pluginSlug}/reviews/`;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.delayMs = options.delayMs || 1000; // Delay between requests
    this.maxPages = options.maxPages || 10;
    this.monthsBack = options.monthsBack || 12;
  }

  /**
   * Calculate cutoff date for review filtering
   */
  getCutoffDate() {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - this.monthsBack);
    return cutoff;
  }

  /**
   * Parse date from review string (e.g., "January 15, 2025")
   */
  parseReviewDate(dateString) {
    try {
      return new Date(dateString);
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`);
      return null;
    }
  }

  /**
   * Fetch a single review page
   */
  async fetchPage(pageNumber = 1) {
    const url = pageNumber === 1
      ? this.baseUrl
      : `${this.baseUrl}page/${pageNumber}/`;

    console.log(`Fetching: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Error fetching page ${pageNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse reviews from HTML content
   */
  parseReviews(html) {
    const $ = cheerio.load(html);
    const reviews = [];

    $('ul[id^="bbp-topic-"]').each((index, element) => {
      try {
        const $topic = $(element);

        // Extract title and rating from the topic title link
        const $titleLink = $topic.find('.bbp-topic-title a.bbp-topic-permalink');
        const titleWithRating = $titleLink.text().trim();

        // Extract rating from the wporg-ratings div inside the title link
        const ratingText = $titleLink.find('.wporg-ratings').attr('title') || '';
        const ratingMatch = ratingText.match(/(\d+) out of 5 stars/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

        // Remove rating stars from title text
        const title = titleWithRating.replace(/\s*\n\s*/g, ' ').trim();

        // Extract author from bbp-topic-started-by
        const author = $topic.find('.bbp-topic-started-by .bbp-author-name').text().trim();

        // Extract date from freshness link title attribute
        const dateLink = $topic.find('.bbp-topic-freshness a');
        const dateText = dateLink.attr('title') || dateLink.text().trim();

        // Clean up date text - extract just the date part
        const dateMatch = dateText.match(/([A-Z][a-z]+ \d+, \d{4})/);
        const cleanDate = dateMatch ? dateMatch[1] : dateText;

        // Extract topic URL
        const topicUrl = $titleLink.attr('href') || '';

        // Note: Content is not available on the listing page, would need to fetch individual topic
        const content = ''; // Content not available in listing

        reviews.push({
          rating,
          title,
          author,
          date: cleanDate,
          content,
          topicUrl: topicUrl,
          dateObject: this.parseReviewDate(cleanDate),
        });
      } catch (error) {
        console.warn(`Failed to parse review at index ${index}:`, error.message);
      }
    });

    return reviews;
  }

  /**
   * Get the oldest review date from a list of reviews
   */
  getOldestReviewDate(reviews) {
    const dates = reviews
      .map(r => r.dateObject)
      .filter(d => d !== null)
      .sort((a, b) => a - b);

    return dates.length > 0 ? dates[0] : null;
  }

  /**
   * Filter reviews by date cutoff
   */
  filterReviewsByDate(reviews, cutoffDate) {
    return reviews.filter(review => {
      if (!review.dateObject) return false;
      return review.dateObject >= cutoffDate;
    });
  }

  /**
   * Delay execution (to be respectful to the server)
   */
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  /**
   * Fetch all reviews within the specified time range
   */
  async fetchAllReviews() {
    const cutoffDate = this.getCutoffDate();
    console.log(`\nFetching reviews for: ${this.pluginSlug}`);
    console.log(`Time range: Last ${this.monthsBack} months (since ${cutoffDate.toDateString()})`);
    console.log(`Max pages: ${this.maxPages}\n`);

    const allReviews = [];
    let pageNumber = 1;
    let shouldContinue = true;

    while (shouldContinue && pageNumber <= this.maxPages) {
      try {
        // Fetch page
        const html = await this.fetchPage(pageNumber);

        // Parse reviews
        const reviews = this.parseReviews(html);

        if (reviews.length === 0) {
          console.log(`Page ${pageNumber}: No reviews found. Stopping.`);
          break;
        }

        console.log(`Page ${pageNumber}: Found ${reviews.length} reviews`);

        // Check oldest review date
        const oldestDate = this.getOldestReviewDate(reviews);

        if (oldestDate) {
          console.log(`  Oldest review on this page: ${oldestDate.toDateString()}`);

          if (oldestDate < cutoffDate) {
            console.log(`  Reached cutoff date. Stopping pagination.`);
            shouldContinue = false;
          }
        }

        // Add reviews to collection
        allReviews.push(...reviews);

        // Delay before next request
        if (shouldContinue && pageNumber < this.maxPages) {
          await this.delay();
        }

        pageNumber++;
      } catch (error) {
        console.error(`Error on page ${pageNumber}:`, error.message);
        break;
      }
    }

    // Filter reviews by date
    const filteredReviews = this.filterReviewsByDate(allReviews, cutoffDate);

    console.log(`\nTotal reviews collected: ${allReviews.length}`);
    console.log(`Reviews within time range: ${filteredReviews.length}`);

    return {
      pluginSlug: this.pluginSlug,
      fetchDate: new Date().toISOString(),
      monthsBack: this.monthsBack,
      cutoffDate: cutoffDate.toISOString(),
      totalReviewsFetched: allReviews.length,
      reviewsInRange: filteredReviews.length,
      pagesFetched: pageNumber - 1,
      reviews: filteredReviews,
    };
  }

  /**
   * Get statistics from reviews
   */
  static getStatistics(reviews) {
    const stats = {
      total: reviews.length,
      byRating: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
      averageRating: 0,
    };

    let totalRating = 0;
    reviews.forEach(review => {
      const rating = review.rating;
      if (rating >= 1 && rating <= 5) {
        stats.byRating[rating]++;
        totalRating += rating;
      }
    });

    if (stats.total > 0) {
      stats.averageRating = (totalRating / stats.total).toFixed(2);
    }

    return stats;
  }
}
