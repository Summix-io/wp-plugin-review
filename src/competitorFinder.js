import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * CompetitorFinder - Finds WordPress plugin competitors based on category and functionality
 */
export class CompetitorFinder {
  constructor(pluginSlug, options = {}) {
    this.pluginSlug = pluginSlug;
    this.baseUrl = `https://wordpress.org/plugins/${pluginSlug}/`;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.maxCompetitors = options.maxCompetitors || 10;
  }

  /**
   * Fetch plugin page HTML
   */
  async fetchPluginPage(slug) {
    const url = `https://wordpress.org/plugins/${slug}/`;

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
      console.error(`Error fetching plugin page for ${slug}:`, error.message);
      throw error;
    }
  }

  /**
   * Decode HTML entities
   */
  decodeHTML(text) {
    if (!text) return '';
    const $ = cheerio.load('<div>' + text + '</div>');
    return $('div').text();
  }

  /**
   * Fetch plugin info from WordPress.org Plugin API
   */
  async getPluginInfoFromAPI(slug) {
    const url = `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${slug}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data || !data.name) {
        return null;
      }

      // Decode HTML entities in name and description
      const name = this.decodeHTML(data.name);

      // Try to get description from different fields
      let description = '';
      if (data.short_description) {
        description = this.decodeHTML(data.short_description);
      } else if (data.description) {
        description = this.decodeHTML(data.description);
      } else if (data.sections && data.sections.description) {
        // Extract first paragraph from full description
        const $ = cheerio.load(data.sections.description);
        description = $('p').first().text().trim();
      }

      return {
        slug: data.slug,
        name,
        url: `https://wordpress.org/plugins/${data.slug}/`,
        description,
        category: data.sections?.description?.match(/<strong>Category:<\/strong>\s*([^<]+)/)?.[1]?.trim() || '',
        tags: Object.keys(data.tags || {}),
        activeInstalls: data.active_installs ? `${data.active_installs.toLocaleString()}+` : '0',
        rating: data.rating ? (data.rating / 20).toFixed(1) : 'N/A', // API returns rating as 0-100
        ratingCount: data.num_ratings?.toString() || '0',
        lastUpdated: data.last_updated || '',
      };
    } catch (error) {
      console.warn(`Failed to fetch API data for ${slug}:`, error.message);
      return null;
    }
  }

  /**
   * Extract plugin information from WordPress.org page (fallback)
   */
  async getPluginInfo(slug) {
    console.log(`Fetching plugin info for: ${slug}`);

    // Try API first - it's more reliable
    const apiInfo = await this.getPluginInfoFromAPI(slug);
    if (apiInfo) {
      return apiInfo;
    }

    // Fallback to HTML scraping
    try {
      const html = await this.fetchPluginPage(slug);
      const $ = cheerio.load(html);

      // Extract basic info - try multiple selectors
      const name = $('.plugin-title').first().text().trim() ||
                   $('h1.plugin-title').text().trim() ||
                   $('h2.plugin-title').text().trim();

      const description = $('.plugin-subtitle').first().text().trim() ||
                         $('meta[name="description"]').attr('content') ||
                         $('p.plugin-description').first().text().trim() || '';

      // Extract metrics - try multiple selectors
      let activeInstalls = '';

      // Try various selectors
      const selectors = [
        '.active-installs .value-data',
        '.active-installs strong',
        '.plugin-stats .active-installs strong',
        'li:contains("Active installations:") strong',
        'li:contains("Active installs") strong',
        '.entry-meta .active-installs',
      ];

      for (const selector of selectors) {
        const value = $(selector).first().text().trim();
        if (value) {
          activeInstalls = value;
          break;
        }
      }

      // If still empty, try to find it in any li containing "active"
      if (!activeInstalls) {
        $('li').each((_, el) => {
          const text = $(el).text();
          if (text.toLowerCase().includes('active install')) {
            const match = text.match(/([\d,]+\+?\s*(?:million)?)/i);
            if (match) {
              activeInstalls = match[1].trim();
            }
          }
        });
      }

      // Extract rating - try multiple approaches
      let rating = 'N/A';
      let ratingCount = '0';

      // Try to find rating in title attribute
      const ratingText = $('.wporg-ratings .star-rating').attr('title') ||
                        $('.star-rating').attr('title') ||
                        $('[class*="rating"]').attr('title') || '';

      let ratingMatch = ratingText.match(/([\d.]+)\s*out of 5 stars/i);
      if (ratingMatch) {
        rating = ratingMatch[1];
      }

      // If no rating found in title, try to extract from aria-label
      if (rating === 'N/A') {
        const ariaLabel = $('.star-rating').attr('aria-label') || '';
        ratingMatch = ariaLabel.match(/([\d.]+)\s*out of 5 stars/i);
        if (ratingMatch) {
          rating = ratingMatch[1];
        }
      }

      // If still no rating, try to find it in text content
      if (rating === 'N/A') {
        $('.wporg-ratings, .plugin-rating').each((_, el) => {
          const text = $(el).text();
          const match = text.match(/([\d.]+)\s*(?:out of 5|\/5)/i);
          if (match) {
            rating = match[1];
          }
        });
      }

      // Try to calculate rating from the width percentage of star rating bar
      if (rating === 'N/A') {
        const starWidth = $('.star-rating .stars').attr('style') || '';
        const widthMatch = starWidth.match(/width:\s*([\d.]+)%/);
        if (widthMatch) {
          const percentage = parseFloat(widthMatch[1]);
          rating = (percentage / 20).toFixed(1); // Convert percentage to 0-5 scale
        }
      }

      // Try to find rating count
      const ratingCountSelectors = [
        '.wporg-ratings .rating-count a',
        '.rating-count a',
        'a[href*="reviews"]',
        '.reviews-count',
      ];

      for (const selector of ratingCountSelectors) {
        const text = $(selector).text();
        const countMatch = text.match(/[\d,]+/);
        if (countMatch) {
          ratingCount = countMatch[0].replace(/,/g, '');
          break;
        }
      }

      // Fallback: search all text for rating count pattern like "(2,140 ratings)"
      if (ratingCount === '0') {
        $('body').find('*').each((_, el) => {
          const text = $(el).text();
          const match = text.match(/\(?([\d,]+)\s*ratings?\)?/i);
          if (match) {
            const count = match[1].replace(/,/g, '');
            if (parseInt(count) > parseInt(ratingCount)) {
              ratingCount = count;
            }
          }
        });
      }

      // Extract last updated - try multiple selectors and text searches
      let lastUpdated = '';

      // Try specific selectors first
      const updateSelectors = [
        'li:contains("Last updated") strong',
        'li:contains("Last updated") time',
        '.plugin-meta time',
        'time[datetime]',
      ];

      for (const selector of updateSelectors) {
        const value = $(selector).first().text().trim();
        if (value) {
          lastUpdated = value;
          break;
        }
      }

      // Fallback: search through all li elements
      if (!lastUpdated) {
        $('li').each((_, el) => {
          const text = $(el).text();
          if (text.includes('Last updated') || text.includes('Updated')) {
            // Extract date pattern from the text
            const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
            if (dateMatch) {
              lastUpdated = dateMatch[1];
            } else {
              // Try to extract "X days/weeks/months ago" pattern
              const agoMatch = text.match(/(\d+\s+(?:day|week|month|year)s?\s+ago)/i);
              if (agoMatch) {
                lastUpdated = agoMatch[1];
              }
            }
          }
        });
      }

      // Extract tags - try multiple selectors
      const tags = [];
      $('a[href*="/plugins/tags/"]').each((_, el) => {
        const tag = $(el).text().trim();
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      });

      // Also try .widget-tags specifically
      if (tags.length === 0) {
        $('.widget-tags a, .tags a, a.tag').each((_, el) => {
          const tag = $(el).text().trim();
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }

      // Extract category from breadcrumbs or meta
      let category = '';
      $('nav.breadcrumbs a, .breadcrumb a').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text !== 'Plugin Directory' && text !== 'WordPress.org') {
          category = text;
        }
      });

      // Fallback: use first tag as category
      if (!category && tags.length > 0) {
        category = tags[0];
      }

      return {
        slug,
        name,
        url: `https://wordpress.org/plugins/${slug}/`,
        description,
        category,
        tags,
        activeInstalls,
        rating,
        ratingCount,
        lastUpdated,
      };
    } catch (error) {
      console.error(`Failed to get plugin info for ${slug}:`, error.message);
      return null;
    }
  }

  /**
   * Extract plugin slugs from a WordPress.org search or category page
   */
  parsePluginSlugsFromPage(html) {
    const $ = cheerio.load(html);
    const slugs = [];

    // Try different selectors for plugin links
    $('.plugin-card h3 a, .plugin-card-top a.plugin-icon, article.plugin h2 a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/plugins/')) {
        const match = href.match(/\/plugins\/([^\/]+)\/?/);
        if (match && match[1]) {
          slugs.push(match[1]);
        }
      }
    });

    return [...new Set(slugs)]; // Remove duplicates
  }

  /**
   * Search WordPress.org for plugins by tag or category
   */
  async searchPluginsByTag(tag, limit = 20) {
    // Use search API with tag filter - more reliable than browse
    const url = `https://wordpress.org/plugins/search/${encodeURIComponent(tag)}/`;
    console.log(`Searching plugins by tag: ${tag}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const slugs = this.parsePluginSlugsFromPage(html);
      return slugs.slice(0, limit);
    } catch (error) {
      console.warn(`Failed to search by tag "${tag}":`, error.message);
      return [];
    }
  }

  /**
   * Fetch popular plugins from a category
   */
  async searchPluginsByCategory(category, limit = 20) {
    // Use search with category name
    const url = `https://wordpress.org/plugins/search/${encodeURIComponent(category)}/`;
    console.log(`Searching plugins by category: ${category}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const slugs = this.parsePluginSlugsFromPage(html);
      return slugs.slice(0, limit);
    } catch (error) {
      console.warn(`Failed to search by category "${category}":`, error.message);
      return [];
    }
  }

  /**
   * Delay execution
   */
  async delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Prioritize tags based on relevance (skip generic tags, prioritize specific functionality)
   */
  prioritizeTags(tags) {
    // Universal low-value tags that should be deprioritized for ANY plugin type
    const universalLowPriorityTags = [
      'wordpress', 'plugin', 'plugins', 'free', 'premium', 'pro',
      'lite', 'shortcode', 'widget', 'widgets', 'admin'
    ];

    // Very generic marketing/monetization tags (usually secondary features)
    const secondaryFeatureTags = [
      'email', 'marketing', 'analytics', 'seo', 'social',
      'coupon', 'coupons', 'discount', 'affiliate'
    ];

    // Score each tag
    const scoredTags = tags.map(tag => {
      const tagLower = tag.toLowerCase();
      let score = 10; // Base score

      // Heavily penalize universal generic tags
      if (universalLowPriorityTags.includes(tagLower)) {
        score = -20;
      }
      // Slightly penalize common secondary feature tags
      else if (secondaryFeatureTags.some(secondary => tagLower === secondary)) {
        score = -5;
      }

      // Boost longer, more specific tags (compound tags like "woocommerce-reviews")
      const hyphenCount = (tag.match(/-/g) || []).length;
      if (hyphenCount >= 2) {
        score += 15; // Very specific tag
      } else if (hyphenCount === 1) {
        score += 8; // Moderately specific tag
      }

      // Boost tags that appear more "technical" or specific (longer tags)
      if (tag.length > 15) {
        score += 5;
      }

      return { tag, score };
    });

    // Sort by score (descending)
    scoredTags.sort((a, b) => b.score - a.score);

    // Filter out very low priority tags
    const relevantTags = scoredTags.filter(t => t.score > 0).map(t => t.tag);

    console.log(`Tag prioritization:`);
    scoredTags.forEach(t => {
      console.log(`  ${t.tag}: ${t.score}`);
    });
    console.log(`Selected tags for search: ${relevantTags.slice(0, 5).join(', ')}\n`);

    return relevantTags;
  }

  /**
   * Find competitor plugins
   */
  async findCompetitors() {
    console.log(`\nFinding competitors for: ${this.pluginSlug}\n`);

    // Step 1: Get target plugin info
    const targetPlugin = await this.getPluginInfo(this.pluginSlug);

    if (!targetPlugin) {
      throw new Error(`Could not fetch information for plugin: ${this.pluginSlug}`);
    }

    console.log(`\nTarget Plugin: ${targetPlugin.name}`);
    console.log(`Category: ${targetPlugin.category}`);
    console.log(`Tags: ${targetPlugin.tags.join(', ')}\n`);

    // Step 2: Find potential competitors using multiple strategies
    const competitorSlugs = new Set();

    // Strategy 1: Search by prioritized tags
    const prioritizedTags = this.prioritizeTags(targetPlugin.tags);
    const tagsToSearch = prioritizedTags.slice(0, 5); // Use top 5 relevant tags

    for (const tag of tagsToSearch) {
      const slugs = await this.searchPluginsByTag(tag, 15);
      slugs.forEach(slug => {
        if (slug !== this.pluginSlug) {
          competitorSlugs.add(slug);
        }
      });
      await this.delay(1000);
    }

    // Strategy 2: Search by category if available
    if (targetPlugin.category) {
      const slugs = await this.searchPluginsByCategory(targetPlugin.category, 15);
      slugs.forEach(slug => {
        if (slug !== this.pluginSlug) {
          competitorSlugs.add(slug);
        }
      });
      await this.delay(1000);
    }

    console.log(`\nFound ${competitorSlugs.size} potential competitors. Fetching details...\n`);

    // Step 3: Fetch detailed info for each competitor
    const competitors = [];
    let processed = 0;

    for (const slug of competitorSlugs) {
      if (competitors.length >= this.maxCompetitors) {
        break;
      }

      try {
        const info = await this.getPluginInfo(slug);

        if (info && this.isValidCompetitor(info, targetPlugin)) {
          competitors.push(info);
          console.log(`✓ Added competitor: ${info.name}`);
        }

        processed++;

        // Rate limiting
        if (processed % 5 === 0) {
          await this.delay(2000);
        } else {
          await this.delay(1000);
        }
      } catch (error) {
        console.warn(`Skipped ${slug}:`, error.message);
      }
    }

    // Sort by active installs (descending)
    competitors.sort((a, b) => {
      const aInstalls = this.parseInstallCount(a.activeInstalls);
      const bInstalls = this.parseInstallCount(b.activeInstalls);
      return bInstalls - aInstalls;
    });

    return {
      targetPlugin,
      competitors: competitors.slice(0, this.maxCompetitors),
      totalFound: competitors.length,
    };
  }

  /**
   * Calculate relevance score for a competitor based on similarity to target plugin
   */
  calculateRelevanceScore(competitor, targetPlugin) {
    let score = 0;

    const targetTagsLower = targetPlugin.tags.map(t => t.toLowerCase());
    const competitorTagsLower = competitor.tags.map(t => t.toLowerCase());

    // 1. Exact tag matches (strongest signal)
    const exactMatches = competitorTagsLower.filter(tag => targetTagsLower.includes(tag));
    score += exactMatches.length * 15;

    // 2. Partial tag matches (e.g., "woocommerce" in both "woocommerce-reviews" and "woocommerce-seo")
    for (const compTag of competitorTagsLower) {
      for (const targetTag of targetTagsLower) {
        if (compTag !== targetTag) { // Don't double-count exact matches
          // Check if tags share meaningful substrings (at least 5 chars to avoid noise)
          const compParts = compTag.split('-');
          const targetParts = targetTag.split('-');

          for (const compPart of compParts) {
            for (const targetPart of targetParts) {
              if (compPart === targetPart && compPart.length >= 5) {
                score += 8;
              }
            }
          }
        }
      }
    }

    // 3. Category match (if available)
    if (targetPlugin.category && competitor.category) {
      if (targetPlugin.category.toLowerCase() === competitor.category.toLowerCase()) {
        score += 20;
      }
    }

    // 4. Penalize widely-used utility/framework plugins (unlikely to be direct competitors)
    const frameworkPlugins = [
      'elementor', 'woocommerce', 'wordpress', 'jetpack', 'gutenberg',
      'yoast', 'yoast-seo', 'wp-optimize', 'wp-rocket', 'wordfence',
      'akismet', 'wpforms', 'contact-form-7', 'classic-editor'
    ];

    if (frameworkPlugins.includes(competitor.slug)) {
      score -= 100;
    }

    // 5. Check name/description for shared terminology
    const targetNameDesc = `${targetPlugin.name} ${targetPlugin.description}`.toLowerCase();
    const competitorNameDesc = `${competitor.name} ${competitor.description}`.toLowerCase();

    // Extract meaningful words (3+ chars) from target plugin
    const targetWords = targetNameDesc
      .split(/\s+/)
      .filter(w => w.length >= 4)
      .filter(w => !['wordpress', 'plugin', 'free', 'premium', 'with', 'from', 'that', 'this', 'your'].includes(w));

    // Count how many meaningful words appear in competitor
    let sharedWords = 0;
    for (const word of targetWords) {
      if (competitorNameDesc.includes(word)) {
        sharedWords++;
      }
    }

    // Bonus for shared terminology (capped to avoid over-weighting)
    score += Math.min(sharedWords * 5, 30);

    return score;
  }

  /**
   * Validate if a plugin is a suitable competitor
   */
  isValidCompetitor(competitor, targetPlugin) {
    // Must have a name
    if (!competitor.name) {
      console.log(`  Rejected ${competitor.slug}: No name`);
      return false;
    }

    // Must have reasonable install count (at least 100+)
    const installs = this.parseInstallCount(competitor.activeInstalls);
    if (installs < 100) {
      console.log(`  Rejected ${competitor.slug}: Low installs (${installs})`);
      return false;
    }

    // Prefer plugins with ratings
    const rating = parseFloat(competitor.rating);
    if (rating > 0 && rating < 3.0) {
      console.log(`  Rejected ${competitor.slug}: Low rating (${rating})`);
      return false;
    }

    // Calculate relevance score
    const relevanceScore = this.calculateRelevanceScore(competitor, targetPlugin);

    // Require minimum relevance score (higher threshold ensures better quality matches)
    if (relevanceScore < 30) {
      console.log(`  Rejected ${competitor.slug}: Low relevance score (${relevanceScore})`);
      return false;
    }

    console.log(`  Relevance score for ${competitor.slug}: ${relevanceScore}`);
    return true;
  }

  /**
   * Parse install count string to number
   */
  parseInstallCount(installString) {
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
}
