const contentStorage = require('../../utils/storage');
const keywordResearchService = require('../keyword-research.service');
const paaService = require('../paa.service');
const serpService = require('../serp.service');
const perplexityService = require('../perplexity.service');

class DataCollectorService {
  async collectData(keyword, folderPath) {
    // Get keyword research data
    console.log('[HUGO] Fetching keyword data for:', keyword);
    const keywordData = await this.getKeywordData(keyword, folderPath);

    // Get People Also Ask questions
    console.log('[HUGO] Fetching PAA data for:', keyword);
    const paaData = await this.getPaaData(keyword, folderPath);

    // Get SERP data
    console.log('[HUGO] Fetching SERP data for:', keyword);
    const serpData = await this.getSerpData(keyword, keywordData.volume || 0, folderPath);

    // Get Perplexity insights
    console.log('[HUGO] Fetching Perplexity insights for:', keyword);
    const perplexityData = await this.getPerplexityData(keyword, serpData, folderPath);

    return {
      keywordData,
      paaData,
      serpData,
      perplexityData
    };
  }

  async getKeywordData(keyword, folderPath) {
    try {
      const existingData = await contentStorage.getContent(`${folderPath}/keyword-data.json`);
      if (existingData?.data) {
        console.log('[HUGO] Using existing keyword data');
        return existingData.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing keyword data, fetching fresh');
    }

    const data = await keywordResearchService.getKeywordData(keyword);
    await contentStorage.storeContent(
      `${folderPath}/keyword-data.json`,
      data,
      { type: 'keyword_data', keyword }
    );
    return data;
  }

  async getPaaData(keyword, folderPath) {
    try {
      const existingPaa = await contentStorage.getContent(`${folderPath}/paa-data.json`);
      if (existingPaa?.data) {
        console.log('[HUGO] Using existing PAA data');
        return existingPaa.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing PAA data, fetching fresh');
    }

    const data = await paaService.getQuestions(keyword);
    await contentStorage.storeContent(
      `${folderPath}/paa-data.json`,
      data,
      { type: 'paa_data', keyword }
    );
    return data;
  }

  async getSerpData(keyword, volume, folderPath) {
    try {
      const existingSerp = await contentStorage.getContent(`${folderPath}/serp-data.json`);
      if (existingSerp?.data) {
        console.log('[HUGO] Using existing SERP data');
        return existingSerp.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing SERP data, fetching fresh');
    }

    const data = await serpService.getSearchResults(keyword, volume);
    await contentStorage.storeContent(
      `${folderPath}/serp-data.json`,
      data,
      { type: 'serp_data', keyword }
    );
    return data;
  }

  async getPerplexityData(keyword, serpData, folderPath) {
    try {
      const existingData = await contentStorage.getContent(`${folderPath}/perplexity-data.json`);
      if (existingData?.data) {
        console.log('[HUGO] Using existing Perplexity data');
        return existingData.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing Perplexity data, fetching fresh');
    }

    const variations = await perplexityService.generateKeywordVariations(keyword);
    const intent = await perplexityService.analyzeSearchIntent(keyword);
    const context = await perplexityService.getContextualExpansion(keyword);
    const topics = await perplexityService.generateContentTopics(keyword);
    const complement = await perplexityService.complementStructuredData(keyword, serpData);

    const data = {
      variations,
      intent,
      context,
      topics,
      complement,
      timestamp: new Date().toISOString()
    };

    await contentStorage.storeContent(
      `${folderPath}/perplexity-data.json`,
      data,
      { type: 'perplexity_data', keyword }
    );

    return data;
  }
}

module.exports = new DataCollectorService();