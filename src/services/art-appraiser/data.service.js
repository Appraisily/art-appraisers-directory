const storageService = require('./storage.service');
const perplexityService = require('../perplexity.service');
const serpService = require('../serp.service');

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

    // Get market data from SERP
    const serpData = await serpService.getSearchResults(keyword);

    // Get insights from Perplexity
    console.log('[ART-APPRAISER] Fetching Perplexity insights');

    const [marketInsights, demographicInsights] = await Promise.all([
      perplexityService.makeRequest(
        `Analyze the art market in ${city}, ${state}. Include: number of galleries, museums, auction houses, and main art categories.`,
        'market_analysis'
      ),
      perplexityService.makeRequest(
        `Provide demographic data for ${city}, ${state} relevant to art appraisal services: population, median income, cultural indicators.`,
        'demographics'
      )
    ]);

    console.log('[ART-APPRAISER] Processing insights');

    // Process and structure the data
    return this.processInsights(city, state, {
      serp: serpData,
      market: marketInsights,
      demographics: demographicInsights
    });
  }

  /**
   * Process raw insights into structured data
   * @param {string} city 
   * @param {string} state 
   * @param {Object} insights 
   */
  processInsights(city, state, insights) {
    console.log('[ART-APPRAISER] Structuring insights for:', { city, state });

    // Extract and structure the data
    // This is a simplified example - you'd want more robust parsing
    return {
      city,
      state,
      demographics: {
        population: this.extractPopulation(insights.demographics),
        medianIncome: this.extractMedianIncome(insights.demographics)
      },
      artMarket: {
        galleries: this.extractNumber(insights.market, /(\d+)\s+galleries/),
        museums: this.extractNumber(insights.market, /(\d+)\s+museums/),
        auctionHouses: this.extractNumber(insights.market, /(\d+)\s+auction houses/)
      },
      specialties: this.extractSpecialties(insights.market),
      demand: {
        level: this.assessDemandLevel(insights),
        topCategories: this.extractTopCategories(insights.market)
      },
      lastUpdated: new Date().toISOString()
    };
  }

  // Helper methods for data extraction
  extractPopulation(text) {
    const match = text.match(/population[^\d]*(\d[\d,]+)/i);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  extractMedianIncome(text) {
    const match = text.match(/median income[^\d]*\$?(\d[\d,]+)/i);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  extractNumber(text, regex) {
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 0;
  }

  extractSpecialties(text) {
    const specialties = text.match(/specialties include:?(.*?)(?:\.|$)/i);
    if (!specialties) return [];
    
    return specialties[1]
      .split(/,|\band\b/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  extractTopCategories(text) {
    const categories = text.match(/top categories:?(.*?)(?:\.|$)/i);
    if (!categories) return [];
    
    return categories[1]
      .split(/,|\band\b/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  assessDemandLevel(insights) {
    // Simple keyword-based assessment
    const text = `${insights.market} ${insights.demographics}`.toLowerCase();
    
    if (text.includes('high demand') || text.includes('strong market')) {
      return 'high';
    } else if (text.includes('moderate demand') || text.includes('stable market')) {
      return 'medium';
    } else if (text.includes('low demand') || text.includes('weak market')) {
      return 'low';
    }
    
    return 'medium';
  }
}

module.exports = new ArtAppraiserDataService();