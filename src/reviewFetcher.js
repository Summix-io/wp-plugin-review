import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * ReviewFetcher - Fetches WordPress plugin reviews from wordpress.org
 */
export class ReviewFetcher {
  constructor(pluginSlug, options = {}) {
    this.pluginSlug = pluginSlug;
    this.baseUrl = `https://wordpress.org/plugins/${pluginSlug}/reviews/`;
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

    $('.review').each((index, element) => {
      try {
        const $review = $(element);

        // Extract rating from data-rating attribute
        const rating = parseInt($review.find('.wporg-ratings').attr('data-rating') || '0');

        // Extract title from h3.review-title a
        const title = $review.find('.review-title a').text().trim();

        // Extract author from span.review-author a
        const author = $review.find('.review-author a').text().trim();

        // Extract date
        const dateText = $review.find('.review-date').text().trim();

        // Extract content from div.review-content
        const content = $review.find('.review-content').text().trim();

        // Extract topic URL (link to full review)
        const topicLink = $review.find('.review-title a').attr('href') || '';

        reviews.push({
          rating,
          title,
          author,
          date: dateText,
          content,
          topicUrl: topicLink,
          dateObject: this.parseReviewDate(dateText),
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
