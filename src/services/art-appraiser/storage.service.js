const contentStorage = require('../../utils/storage');

class ArtAppraiserStorageService {
  constructor() {
    this.basePath = 'cities';
    this.globalPath = 'Global';
  }

  /**
   * Store city-specific art appraiser data
   * @param {string} city 
   * @param {string} state 
   * @param {Object} data 
   * @param {string} [type='data'] - Type of data being stored
   */
  async storeData(city, state, data, type = 'data') {
    const slug = this.createSlug(city);
    const filePath = type === 'structured-data' 
      ? `${this.basePath}/${slug}.json`
      : `${this.basePath}/${slug}/${type}.json`;
    
    // For structured data, also save in Global folder
    const globalFilePath = type === 'structured-data' 
      ? `${this.globalPath}/${slug}.json`
      : null;

    console.log('[ART-APPRAISER] Storing data:', {
      city,
      state,
      path: filePath,
      globalPath: globalFilePath,
      type
    });
    
    const storageData = {
      city,
      state,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        type,
        city,
        state
      }
    };

    await contentStorage.storeContent(
      filePath,
      storageData,
      { type: `art_appraiser_${type}`, city, state }
    );

    // If this is structured data, also save in Global folder with just the data
    if (globalFilePath) {
      console.log('[ART-APPRAISER] Storing data in Global folder:', { city, globalPath: globalFilePath });
      await contentStorage.storeContent(
        globalFilePath,
        data.data, // Store only the data object, not the metadata wrapper
        { type: 'art_appraiser_global', city, state }
      );
    }

    return filePath;
  }

  /**
   * Check if structured data exists for a city
   * @param {string} city 
   * @param {string} state 
   */
  async hasStructuredData(city, state) {
    const slug = this.createSlug(city);
    const filePaths = [
      `${this.basePath}/${slug}.json`,
      `${this.globalPath}/${slug}.json`
    ];

    try {
      // Check both locations
      for (const path of filePaths) {
        try {
          await contentStorage.getContent(path);
          console.log('[ART-APPRAISER] Structured data found at:', path);
          return true;
        } catch (error) {
          if (!error.message.includes('File not found')) {
            throw error;
          }
        }
      }
      
      console.log('[ART-APPRAISER] No structured data found for:', { city, state });
      return false;
    } catch (error) {
      console.error('[ART-APPRAISER] Error checking structured data:', error);
      throw error;
    }
  }

  /**
   * Get structured data from Global folder
   * @param {string} city 
   * @param {string} state 
   */
  async getGlobalData(city, state) {
    const slug = this.createSlug(city);
    const filePath = `${this.globalPath}/${slug}.json`;

    try {
      const data = await contentStorage.getContent(filePath);
      console.log('[ART-APPRAISER] Structured data found for:', { city, state });
      return data;
    } catch (error) {
      if (error.message.includes('File not found')) {
        console.log('[ART-APPRAISER] No structured data found for:', { city, state });
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieve city-specific art appraiser data
   * @param {string} city 
   * @param {string} state 
   */
  async getData(city, state) {
    const slug = this.createSlug(city);
    const filePath = `${this.basePath}/${slug}/data.json`;

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
    const prefix = `${this.basePath}/`;
    const [files] = await contentStorage.bucket.getFiles({ prefix });
    
    return files
      .filter(file => file.name.endsWith('data.json'))
      .map(file => {
        const parts = file.name.split('/');
        const cityData = {
          city: parts[1].replace(/-/g, ' '),
          state: state.toUpperCase(),
          path: file.name
        };
        return cityData;
      });
  }

  /**
   * Search for cities matching criteria
   * @param {import('./types').CitySearchParams} params 
   */
  async searchCities(params) {
    const { state, region, population, specialty } = params;
    
    // Get all cities
    let cities = [];
    const [files] = await contentStorage.bucket.getFiles({ prefix: this.basePath });
    cities = files
      .filter(file => file.name.endsWith('data.json'))
      .map(file => {
        const parts = file.name.split('/');
        return {
          city: parts[1].replace(/-/g, ' '),
          path: file.name
        };
      });

    // Filter results
    const results = [];
    for (const city of cities) {
      const data = await this.getData(city.city, city.state);
      
      // Apply filters
      if (state && data.state.toLowerCase() !== state.toLowerCase()) continue;
      if (specialty && !data.appraisers.some(a => a.specialties.includes(specialty))) continue;

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