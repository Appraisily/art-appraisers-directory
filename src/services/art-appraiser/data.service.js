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
    console.log('[ART-APPRAISER] Fetching Perplexity insights');

    const appraiserData = await perplexityService.getArtAppraiserData(city, state);

    console.log('[ART-APPRAISER] Processing insights');

    return JSON.parse(appraiserData);
  }
}

module.exports = new ArtAppraiserDataService();