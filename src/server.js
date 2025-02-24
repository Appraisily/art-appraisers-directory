const { port } = require('./config');
const express = require('express');
const contentStorage = require('./utils/storage');
const perplexityService = require('./services/perplexity.service');
const openAIService = require('./services/openai.service');
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

  try {
    await contentStorage.initialize();
    console.log('[SERVER] Storage service initialized successfully');
  } catch (error) {
    console.error('[SERVER] Storage service failed to initialize:', error);
    throw error;
  }

  const serviceStatus = {
    storage: false,
    perplexity: false,
    openai: false
  };

  try {
    [serviceStatus.storage, serviceStatus.perplexity, serviceStatus.openai] = await Promise.all([
      initializeService(contentStorage, 'Storage'),
      initializeService(perplexityService, 'Perplexity'),
      initializeService(openAIService, 'OpenAI')
    ]);
  } catch (error) {
    console.error('[SERVER] Error initializing services:', error);
  }

  // Art Appraiser routes
  app.use('/api/art-appraiser', artAppraiserRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      services: {
        storage: serviceStatus.storage ? 'connected' : 'disconnected',
        perplexity: serviceStatus.perplexity ? 'connected' : 'disconnected',
        openai: serviceStatus.openai ? 'connected' : 'disconnected'
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