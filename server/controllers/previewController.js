const axios = require('axios');
const cheerio = require('cheerio');

const cache = new Map();

/**
 * PREVIEW CONTROLLER
 * Fetches OpenGraph metadata for a given URL to provide rich link previews.
 */
const previewController = {
  getPreview: async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    if (cache.has(url)) {
      console.log(`[Preview] Cache hit for: ${url}`);
      return res.status(200).json({ success: true, ...cache.get(url) });
    }

    try {
      console.log(`[Preview] Fetching metadata for: ${url}`);
      const response = await axios.get(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'ConvoBot/1.0 (LinkPreview)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      const metadata = {
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || url,
        description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        siteName: $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname
      };

      // Simple persistence in memory
      cache.set(url, metadata);

      res.status(200).json({ success: true, ...metadata });
    } catch (err) {
      console.error(`[Preview] Failed to fetch: ${url}`, err.message);
      // Fallback for failed fetches
      res.status(200).json({ 
        success: true, 
        title: new URL(url).hostname, 
        description: 'No preview available', 
        image: '',
        siteName: new URL(url).hostname
      });
    }
  }
};

module.exports = previewController;
