const contentStorage = require('../../utils/storage');

class ArtAppraiserStorageService {
  constructor() {
    this.basePath = 'art-appraiser';
  }

  /**
   * Store city-specific art appraiser data
   * @param {string} city 
   * @param {string} state 
   * @param {Object} data 
   */
  async storeData(city, state, data) {
    const slug = this.createSlug(city);
    const filePath = `${this.basePath}/${state.toLowerCase()}/${slug}/data.json`;

    console.log('[ART-APPRAISER] Storing data:', {
      city,
      state,
      path: filePath
    });
    
    const storageData = {
      city,
      state,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        galleries: data.artMarket?.galleries || 0,
        museums: data.artMarket?.museums || 0,
        population: data.demographics?.population || 0
      }
    };

    await contentStorage.storeContent(
      filePath,
      storageData,
      { type: 'art_appraiser_data', city, state }
    );

    return filePath;
  }

  /**
   * Retrieve city-specific art appraiser data
   * @param {string} city 
   * @param {string} state 
   */
  async getData(city, state) {
    const slug = this.createSlug(city);
    const filePath = `${this.basePath}/${state.toLowerCase()}/${slug}/data.json`;

    console.log('[ART-APPRAISER] Retrieving data:', {
      city,
      state,
      path: filePath
    });
    
    try {
      const data = await contentStorage.getContent(filePath);
      console.log('[ART-APPRAISER] Data found for:', { city, state });
      return data;
    } catch (error) {
      if (error.message.includes('File not found')) {
        console.log('[ART-APPRAISER] No data found for:', { city, state });
        return null;
      }
      console.error('[ART-APPRAISER] Error retrieving data:', error);
      throw error;
    }
  }

  /**
   * List all cities with art appraiser data in a state
   * @param {string} state 
   */
  async listCities(state) {
    const prefix = `${this.basePath}/${state.toLowerCase()}/`;
    const [files] = await contentStorage.bucket.getFiles({ prefix });
    
    return files
      .filter(file => file.name.endsWith('data.json'))
      .map(file => {
        const parts = file.name.split('/');
        return {
          city: parts[parts.length - 2].replace(/-/g, ' '),
          state: state.toUpperCase(),
          path: file.name
        };
      });
  }

  /**
   * Search for cities matching criteria
   * @param {import('./types').CitySearchParams} params 
   */
  async searchCities(params) {
    const { state, region, population, specialty } = params;
    
    // Get all cities in state if specified
    let cities = [];
    if (state) {
      cities = await this.listCities(state);
    } else {
      // Get all states and their cities
      const [files] = await contentStorage.bucket.getFiles({ prefix: this.basePath });
      const states = [...new Set(files.map(f => f.name.split('/')[1]))];
      
      for (const st of states) {
        const stateCities = await this.listCities(st);
        cities.push(...stateCities);
      }
    }

    // Filter results
    const results = [];
    for (const city of cities) {
      const data = await this.getData(city.city, city.state);
      
      // Apply filters
      if (population && data.demographics.population < population) continue;
      if (specialty && !data.specialties.includes(specialty)) continue;
      if (region && data.region !== region) continue;

      results.push({
        city: city.city,
        state: city.state,
        data: data.data
      });
    }

    return results;
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new ArtAppraiserStorageService();