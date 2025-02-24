const express = require('express');
const router = express.Router();
const dataService = require('../services/art-appraiser/data.service');
const storageService = require('../services/art-appraiser/storage.service');
const citiesData = require('../services/art-appraiser/cities.json');
const CITIES_TO_PROCESS = 5;

// Process first 5 cities
router.post('/process-cities', async (req, res) => {
  try {
    const citiesToProcess = citiesData.cities.slice(0, CITIES_TO_PROCESS);
    console.log(`[ART-APPRAISER] Processing first ${CITIES_TO_PROCESS} cities`);

    const results = [];
    for (const city of citiesToProcess) {
      console.log('[ART-APPRAISER] Processing city:', city.name);
      try {
        const data = await dataService.getCityData(city.name, city.state);
        results.push({
          city: city.name,
          state: city.state,
          success: true,
          data: data
        });
      } catch (error) {
        console.error(`[ART-APPRAISER] Error processing ${city.name}:`, error);
        results.push({
          city: city.name,
          state: city.state,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${CITIES_TO_PROCESS} cities`,
      results
    });
  } catch (error) {
    console.error('[ART-APPRAISER] Error processing cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get data for a specific city
router.get('/:state/:city', async (req, res) => {
  try {
    const { city, state } = req.params;
    const data = await dataService.getCityData(city, state);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[ART-APPRAISER] Error getting city data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all cities in a state
router.get('/state/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const cities = await storageService.listCities(state);
    res.json({ success: true, cities });
  } catch (error) {
    console.error('[ART-APPRAISER] Error listing cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search cities by criteria
router.get('/search', async (req, res) => {
  try {
    const { state, region, population, specialty } = req.query;
    const results = await storageService.searchCities({
      state,
      region,
      population: population ? parseInt(population) : undefined,
      specialty
    });
    res.json({ success: true, results });
  } catch (error) {
    console.error('[ART-APPRAISER] Error searching cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;