const express = require('express');
const router = express.Router();
const dataService = require('../services/art-appraiser/data.service');
const storageService = require('../services/art-appraiser/storage.service');
const citiesData = require('../services/art-appraiser/cities.json');

// Process first city
router.post('/process-first-city', async (req, res) => {
  try {
    const firstCity = citiesData.cities[0];
    console.log('[ART-APPRAISER] Processing first city:', firstCity.name);

    // Check if data already exists
    const existingData = await storageService.getData(firstCity.name, firstCity.state);
    if (existingData) {
      return res.json({
        success: true,
        message: 'Data already exists for this city',
        data: existingData
      });
    }

    // Generate and store data
    const data = await dataService.getCityData(firstCity.name, firstCity.state);

    res.json({
      success: true,
      message: 'Successfully processed first city',
      city: firstCity.name,
      state: firstCity.state,
      data
    });
  } catch (error) {
    console.error('[ART-APPRAISER] Error processing first city:', error);
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