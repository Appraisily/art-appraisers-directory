const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const { secretNames } = require('../config');

class PerplexityService {
  constructor() {
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    this.apiKey = null;
  }

  async initialize() {
    try {
      this.apiKey = await getSecret(secretNames.perplexityKey);
      console.log('[PERPLEXITY] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Service initialization failed:', error);
      throw error;
    }
  }

  async makeRequest(prompt, type, options = {}) {
    const {
      model = 'sonar',
      max_tokens = 1000,
      temperature = 0.1,
      top_p = 0.9,
      presence_penalty = 0,
      frequency_penalty = 0
    } = options;

    try {
      console.log(`[PERPLEXITY] Making ${type} request for prompt:`, prompt.substring(0, 100) + '...');

      const requestData = {
        model,
        messages: [
          { role: 'system', content: 'You are an expert art appraiser data analyst. Be detailed and precise.' },
          { role: 'user', content: prompt }
        ],
        max_tokens,
        temperature,
        top_p,
        stream: false,
        presence_penalty,
        frequency_penalty,
        search_domain_filter: null,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: null,
        top_k: 0,
        response_format: null
      };

      console.log('[PERPLEXITY] Request data:', JSON.stringify(requestData, null, 2));

      const response = await axios({
        method: 'POST',
        url: this.apiUrl,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: requestData
      });

      console.log('[PERPLEXITY] Response status:', response.status);
      console.log('[PERPLEXITY] Response data:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response structure from Perplexity API');
      }

      const result = response.data.choices[0].message.content;

      if (!result) {
        throw new Error('No content in Perplexity response');
      }

      console.log('[PERPLEXITY] Raw response:', result.substring(0, 100) + '...');

      // Cache the result
      await this.cacheResult(prompt, result, type);

      return result;

    } catch (error) {
      console.error('[PERPLEXITY] API request failed:', error);
      throw error;
    }
  }

  async getArtAppraiserData(city, state) {
    const prompt = `Create a detailed directory of art appraisers in ${city}, ${state}. Include:

1. Overview of the art appraisal services in ${city}
2. List of top art appraisers with:
   - Business name and contact details
   - Areas of expertise and specialties
   - Years of experience
   - Certifications and credentials
   - Types of services offered
   - Typical pricing ranges
3. Information about:
   - Business hours
   - Service areas
   - Customer reviews and ratings

Use realistic but fictional data and format the response in a clear, readable way.`;

    return this.makeRequest(prompt, 'art_appraiser', {
      model: 'sonar',
      max_tokens: 1000,
      temperature: 0.1
      top_p: 0.9,
      presence_penalty: 0,
      frequency_penalty: 0
    });
  }

  async cacheResult(prompt, result, type) {
    const cacheData = {
      prompt,
      result,
      type,
      timestamp: new Date().toISOString()
    };

    const hash = Buffer.from(prompt).toString('base64').substring(0, 32);
    const filePath = `perplexity/${type}/${hash}.json`;

    await contentStorage.storeContent(
      filePath,
      cacheData,
      { type: 'perplexity_result', resultType: type }
    );
  }
}

module.exports = new PerplexityService();