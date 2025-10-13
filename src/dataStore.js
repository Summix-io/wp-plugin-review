import fs from 'fs/promises';
import path from 'path';

/**
 * DataStore - Handles saving and loading review data
 */
export class DataStore {
  constructor(baseDir = './reports') {
    this.baseDir = baseDir;
  }

  /**
   * Get report directory path for a plugin
   * Format: ./reports/{plugin-slug}/{date}
   */
  getReportDir(pluginSlug) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.baseDir, pluginSlug, date);
  }

  /**
   * Ensure report directory exists
   */
  async ensureReportDir(pluginSlug) {
    const reportDir = this.getReportDir(pluginSlug);
    try {
      await fs.mkdir(reportDir, { recursive: true });
      return reportDir;
    } catch (error) {
      console.error('Error creating report directory:', error.message);
      throw error;
    }
  }

  /**
   * Generate filename for plugin reviews
   */
  getFilename(pluginSlug, type = 'json') {
    return `reviews.${type}`;
  }

  /**
   * Deduplicate reviews by topic URL
   */
  static deduplicateReviews(reviews) {
    const unique = new Map();

    reviews.forEach(review => {
      const key = review.topicUrl || `${review.title}-${review.author}-${review.date}`;
      if (!unique.has(key)) {
        unique.set(key, review);
      }
    });

    return Array.from(unique.values());
  }

  /**
   * Save reviews to JSON file
   */
  async saveReviews(data) {
    const reportDir = await this.ensureReportDir(data.pluginSlug);
    const filename = this.getFilename(data.pluginSlug, 'json');
    const filepath = path.join(reportDir, filename);

    try {
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(filepath, jsonData, 'utf-8');
      console.log(`\nData saved to: ${filepath}`);
      console.log(`Unique reviews: ${data.reviews.length}`);
      return filepath;
    } catch (error) {
      console.error('Error saving data:', error.message);
      throw error;
    }
  }

  /**
   * Load reviews from JSON file
   */
  async loadReviews(filepath) {
    try {
      const jsonData = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Error loading data:', error.message);
      throw error;
    }
  }

  /**
   * Export reviews to CSV format
   */
  static toCSV(reviews) {
    const headers = ['Rating', 'Title', 'Author', 'Date', 'Content', 'TopicURL'];
    const rows = [headers.join(',')];

    reviews.forEach(review => {
      const row = [
        review.rating,
        `"${(review.title || '').replace(/"/g, '""')}"`,
        `"${(review.author || '').replace(/"/g, '""')}"`,
        review.date,
        `"${(review.content || '').replace(/"/g, '""')}"`,
        review.topicUrl || '',
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Save reviews as CSV
   */
  async saveAsCSV(data) {
    const reportDir = await this.ensureReportDir(data.pluginSlug);
    const filename = this.getFilename(data.pluginSlug, 'csv');
    const filepath = path.join(reportDir, filename);

    try {
      const csvData = DataStore.toCSV(data.reviews);
      await fs.writeFile(filepath, csvData, 'utf-8');
      console.log(`CSV saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving CSV:', error.message);
      throw error;
    }
  }

  /**
   * Save markdown report
   */
  async saveMarkdownReport(pluginSlug, content) {
    const reportDir = await this.ensureReportDir(pluginSlug);
    const filename = 'report.md';
    const filepath = path.join(reportDir, filename);

    try {
      await fs.writeFile(filepath, content, 'utf-8');
      console.log(`Report saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving report:', error.message);
      throw error;
    }
  }

  /**
   * List all reports for a plugin
   */
  async listReports(pluginSlug) {
    try {
      const pluginDir = path.join(this.baseDir, pluginSlug);
      const dates = await fs.readdir(pluginDir);
      return dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get report directory info
   */
  getReportInfo(pluginSlug) {
    const reportDir = this.getReportDir(pluginSlug);
    const date = new Date().toISOString().split('T')[0];
    return {
      directory: reportDir,
      pluginSlug,
      date,
      jsonFile: path.join(reportDir, 'reviews.json'),
      csvFile: path.join(reportDir, 'reviews.csv'),
      reportFile: path.join(reportDir, 'report.md'),
    };
  }
}
