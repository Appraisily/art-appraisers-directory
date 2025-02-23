const storageService = require('./storage.service');
const perplexityService = require('../perplexity.service');

class ArtAppraiserDataService {
  /**
   * Get or generate art appraiser data for a city
   * @param {string} city 
   * @param {string} state 
   */
  async getCityData(city, state) {
    // Check if data exists
    const existingData = await storageService.getData(city, state);
    if (existingData) {
      return existingData;
    }

    // Generate new data
    const data = await this.generateCityData(city, state);
    
    // Store data
    await storageService.storeData(city, state, data);

    return data;
  }

  /**
   * Generate art appraiser data for a city
   * @param {string} city 
   * @param {string} state 
   */
  async generateCityData(city, state) {
    const keyword = `art appraiser ${city} ${state}`;

    console.log('[ART-APPRAISER] Generating data for:', { city, state });
    
    // Get insights from Perplexity
    try {
      console.log('[ART-APPRAISER] Fetching Perplexity insights');

      // Get raw response first
      const rawResponse = await perplexityService.getArtAppraiserData(city, state);

      // Store raw response for debugging
      await storageService.storeData(city, state, {
        type: 'raw_response',
        content: rawResponse,
        timestamp: new Date().toISOString()
      }, 'raw-response');

      console.log('[ART-APPRAISER] Processing insights');

      // Process the text response into structured data
      const processedData = {
        city,
        state,
        content: rawResponse,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'art_appraiser_data',
          source: 'perplexity',
          processedAt: new Date().toISOString()
        }
      };

      return processedData;
    } catch (error) {
      console.error('[ART-APPRAISER] Error generating city data:', error);
      throw error;
    }
  }
}

module.exports = new ArtAppraiserDataService();