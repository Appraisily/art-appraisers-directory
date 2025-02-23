const contentStorage = require('../utils/storage');
const workflowService = require('./hugo/workflow.service');

class HugoProcessorService {
  async processWorkflow() {
    try {
      return await workflowService.processWorkflow();
    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      throw error;
    }
  }
}

module.exports = new HugoProcessorService();