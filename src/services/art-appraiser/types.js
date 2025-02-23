/**
 * @typedef {Object} ArtAppraiserData
 * @property {string} city
 * @property {string} state
 * @property {Object} demographics
 * @property {number} demographics.population
 * @property {number} demographics.medianIncome
 * @property {Object} artMarket
 * @property {number} artMarket.galleries
 * @property {number} artMarket.museums
 * @property {number} artMarket.auctionHouses
 * @property {Array<string>} specialties
 * @property {Object} demand
 * @property {string} demand.level
 * @property {Array<string>} demand.topCategories
 */

/**
 * @typedef {Object} CitySearchParams
 * @property {string} [state]
 * @property {string} [region]
 * @property {number} [population]
 * @property {string} [specialty]
 */