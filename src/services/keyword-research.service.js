const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');

class KeywordResearchService {
  constructor() {
    this.apiUrl = 'https://keywordresearch.api.kwrds.ai/keywords-with-volumes';
    this.apiKey = null;
    this.bucketName = 'hugo-posts-content';
  }

  async initialize() {
    try {
      this.apiKey = await getSecret('KWRDS_API_KEY');
      console.log('[KEYWORD] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[KEYWORD] Service initialization failed:', error);
      throw error;
    }
  }

  async getKeywordData(keyword) {
    try {
      // Check if we have cached data
      console.log('[KEYWORD] Checking cache for keyword:', keyword);
      const cacheResult = await this.checkCache(keyword);
      
      if (cacheResult) {
        console.log('[KEYWORD] Cache hit for keyword:', {
          keyword,
          dataAge: new Date() - new Date(cacheResult.timestamp),
          dataSize: JSON.stringify(cacheResult.data).length
        });
        return cacheResult;
      }

      console.log('[KEYWORD] Cache miss, fetching fresh data for:', keyword);
      
      const startTime = Date.now();
      const response = await axios.post(this.apiUrl, {
        search_question: keyword,
        search_country: 'en-US'
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const apiCallDuration = Date.now() - startTime;
      console.log('[KEYWORD] API call completed:', {
        keyword,
        duration: apiCallDuration,
        status: response.status,
        dataSize: JSON.stringify(response.data).length
      });

      const data = response.data;
      
      // Cache the result
      console.log('[KEYWORD] Caching API response for:', keyword);
      await this.cacheResult(keyword, data);

      return data;
    } catch (error) {
      console.error('[KEYWORD] Error fetching keyword data:', error);
      throw error;
    }
  }

  async checkCache(keyword) {
    try {
      const slug = this.createSlug(keyword);
      const filePath = `research/${slug}/keyword-data.json`;
      
      console.log('[KEYWORD] Checking cache file:', filePath);
      
      const content = await contentStorage.getContent(filePath);
      
      if (!content) {
        console.log('[KEYWORD] No cache found for:', keyword);
        return null;
      }

      // Validate cache data structure
      if (!content.data || !content.timestamp) {
        console.warn('[KEYWORD] Invalid cache data structure for:', keyword);
        return null;
      }

      return content;
    } catch (error) {
      if (error.message.includes('File not found')) {
        console.log('[KEYWORD] Cache file not found for:', keyword);
      } else {
        console.error('[KEYWORD] Cache check error:', {
          keyword,
          error: error.message,
          stack: error.stack
        });
      }
      return null;
    }
  }

  async cacheResult(keyword, data) {
    const slug = this.createSlug(keyword);
    const filePath = `research/${slug}/keyword-data.json`;
    
    const cacheData = {
      keyword,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        dataSize: JSON.stringify(data).length,
        keywordLength: keyword.length,
        hasVolume: Boolean(data.volume),
        hasIntent: Boolean(data['search-intent'])
      }
    };
    
    console.log('[KEYWORD] Saving cache file:', {
      keyword,
      filePath,
      dataSize: JSON.stringify(cacheData).length
    });

    const savedPath = await contentStorage.storeContent(
      filePath,
      cacheData,
      { type: 'keyword_research', keyword }
    );

    console.log('[KEYWORD] Cache file saved:', {
      keyword,
      path: savedPath
    });

    return savedPath;
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new KeywordResearchService();