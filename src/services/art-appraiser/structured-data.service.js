const { structuredDataPrompt } = require('./prompts/structured-data');
const openAIService = require('../openai.service');
const storageService = require('./storage.service');

class StructuredDataService {
  /**
   * Process city data into structured JSON format
   * @param {string} city 
   * @param {string} state 
   */
  async processCity(city, state) {
    try {
      console.log('[STRUCTURED-DATA] Processing city:', { city, state });

      // Get raw data from storage
      const data = await storageService.getData(city, state);
      if (!data || !data.data || !data.data.content) {
        throw new Error('No raw data found for city');
      }

      // Create prompt with the raw data
      const prompt = structuredDataPrompt.replace(
        '[DATA BEGINS]\n\nHere is the information about art appraisers we\'ve collected:',
        `[DATA BEGINS]\n\nHere is the information about art appraisers in ${city}, ${state}:\n\n${data.data.content}`
      );

      // Process with OpenAI
      console.log('[STRUCTURED-DATA] Sending to OpenAI for processing');
      const structuredData = await openAIService.enhanceContent(prompt, '', 'v3');

      // Store structured result
      await storageService.storeData(
        city,
        state,
        { 
          data: JSON.parse(structuredData),
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'openai',
            version: 'v3',
            originalDataTimestamp: data.timestamp
          }
        },
        'structured-data'
      );

      return JSON.parse(structuredData);
    } catch (error) {
      console.error('[STRUCTURED-DATA] Error processing city:', error);
      throw error;
    }
  }
}

module.exports = new StructuredDataService();