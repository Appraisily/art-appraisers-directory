const { port } = require('./config');
const express = require('express');
const sheetsService = require('./services/sheets.service');
const hugoService = require('./services/hugo.service');
const contentStorage = require('./utils/storage');
const hugoProcessor = require('./services/hugo-processor.service');
const keywordResearchService = require('./services/keyword-research.service');
const paaService = require('./services/paa.service');
const serpService = require('./services/serp.service');
const perplexityService = require('./services/perplexity.service');
const artAppraiserRoutes = require('./routes/art-appraiser.routes');

async function initializeService(service, name) {
  try {
    await service.initialize();
    console.log(`[SERVER] ${name} service initialized successfully`);
    return true;
  } catch (error) {
    console.error(`[SERVER] ${name} service failed to initialize:`, error);
    return false;
  }
}

async function initialize() {
  console.log('[SERVER] Starting server initialization...');

  const app = express();
  app.use(express.json());
  
  // Initialize storage first as other services depend on it
  try {
    await contentStorage.initialize();
    console.log('[SERVER] Storage service initialized successfully');
  } catch (error) {
    console.error('[SERVER] Storage service failed to initialize:', error);
    throw error;
  }

  const serviceStatus = {
    storage: false,
    sheets: false,
    hugo: false,
    keyword: false,
    paa: false,
    serp: false,
    perplexity: false
  };

  try {
    [serviceStatus.storage, serviceStatus.sheets, serviceStatus.hugo, serviceStatus.keyword, serviceStatus.paa, serviceStatus.serp, serviceStatus.perplexity] = await Promise.all([
      initializeService(contentStorage, 'Storage'),
      initializeService(sheetsService, 'Sheets'),
      initializeService(hugoService, 'Hugo'),
      initializeService(keywordResearchService, 'Keyword Research'),
      initializeService(paaService, 'People Also Ask'),
      initializeService(serpService, 'SERP'),
      initializeService(perplexityService, 'Perplexity')
    ]);
  } catch (error) {
    console.error('[SERVER] Error initializing services:', error);
  }

  // Set up routes
  app.post('/api/hugo/process', async (req, res) => {
    try {
      const result = await hugoProcessor.processWorkflow();
      res.json(result);
    } catch (error) {
      console.error('[SERVER] Error processing Hugo workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Art Appraiser routes
  app.use('/api/art-appraiser', artAppraiserRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      services: {
        storage: serviceStatus.storage ? 'connected' : 'disconnected',
        sheets: serviceStatus.sheets ? 'connected' : 'disconnected',
        hugo: serviceStatus.hugo ? 'connected' : 'disconnected',
        keyword: serviceStatus.keyword ? 'connected' : 'disconnected',
        paa: serviceStatus.paa ? 'connected' : 'disconnected',
        serp: serviceStatus.serp ? 'connected' : 'disconnected',
        perplexity: serviceStatus.perplexity ? 'connected' : 'disconnected'
      }
    });
  });

  // Start server
  app.listen(port, () => {
    console.log(`[SERVER] Server listening on port ${port}`);
  });

  return app;
}

// Start the server
initialize().catch(error => {
  console.error('[SERVER] Failed to initialize server:', error);
  process.exit(1);
});