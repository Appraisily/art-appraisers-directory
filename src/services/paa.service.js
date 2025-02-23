const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');

class PeopleAlsoAskService {
  constructor() {
    this.apiUrl = 'https://paa.api.kwrds.ai/people-also-ask';
    this.apiKey = null;
  }

  async initialize() {
    try {
      this.apiKey = await getSecret('KWRDS_API_KEY');
      console.log('[PAA] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[PAA] Service initialization failed:', error);
      throw error;
    }
  }

  async getQuestions(keyword) {
    try {
      // Check cache first
      console.log('[PAA] Checking cache for keyword:', keyword);
      const cacheResult = await this.checkCache(keyword);
      
      if (cacheResult) {
        console.log('[PAA] Cache hit for keyword:', keyword);
        return cacheResult.data;
      }

      console.log('[PAA] Fetching PAA data for keyword:', keyword);
      
      const response = await axios.get(this.apiUrl, {
        params: {
          keyword,
          search_country: 'US',
          search_language: 'en'
        },
        headers: {
          'X-API-KEY': this.apiKey
        }
      });

      const data = response.data;
      
      // Cache the result
      await this.cacheResult(keyword, data);

      return data;
    } catch (error) {
      console.error('[PAA] Error fetching PAA data:', error);
      throw error;
    }
  }

  async checkCache(keyword) {
    try {
      const slug = this.createSlug(keyword);
      const filePath = `research/${slug}/paa-data.json`;
      
      const content = await contentStorage.getContent(filePath);
      
      if (!content || !content.data || !content.timestamp) {
        return null;
      }

      // Check if cache is older than 7 days
      const cacheAge = new Date() - new Date(content.timestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      if (cacheAge > maxAge) {
        console.log('[PAA] Cache expired for:', keyword);
        return null;
      }

      return content;
    } catch (error) {
      console.log('[PAA] Cache check error:', error);
      return null;
    }
  }

  async cacheResult(keyword, data) {
    const slug = this.createSlug(keyword);
    const filePath = `research/${slug}/paa-data.json`;
    
    const cacheData = {
      keyword,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        questionCount: data.results?.length || 0
      }
    };

    await contentStorage.storeContent(
      filePath,
      cacheData,
      { type: 'paa_data', keyword }
    );
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new PeopleAlsoAskService();