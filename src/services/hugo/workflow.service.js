const contentStorage = require('../../utils/storage');
const sheetsService = require('../sheets.service');
const dataCollector = require('./data-collector.service');
const contentGenerator = require('./content-generator.service');

class WorkflowService {
  constructor() {
    this.isProcessing = false;
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async processWorkflow() {
    if (this.isProcessing) {
      console.log('[HUGO] Workflow already in progress');
      return {
        success: false,
        message: 'Workflow already in progress'
      };
    }

    try {
      this.isProcessing = true;
      console.log('[HUGO] Starting workflow processing');

      // Create paths
      const date = new Date().toISOString().split('T')[0];
      const basePath = `content/${date}`;

      // Check for existing content
      if (await this.checkExistingContent(basePath)) {
        return {
          success: true,
          message: 'Content already exists for today',
          existingContent: true,
          path: basePath
        };
      }

      // Get row data
      const rows = await this.getRowData();
      if (!rows || rows.length === 0) {
        return {
          success: true,
          message: 'No rows to process',
          processed: 0
        };
      }

      // Process row
      const result = await this.processRow(rows[0], basePath);

      // Store final summary
      await this.storeSummary([result]);

      return {
        success: true,
        message: 'Workflow processing completed',
        summary: {
          total: 1,
          successful: result.success ? 1 : 0,
          failed: result.success ? 0 : 1
        },
        results: [result]
      };

    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async checkExistingContent(basePath) {
    try {
      console.log('[HUGO] Checking for existing content:', basePath);
      const existingContent = await contentStorage.getContent(`${basePath}/content.json`);
      return Boolean(existingContent);
    } catch (error) {
      return false;
    }
  }

  async getRowData() {
    console.log('[HUGO] Fetching row 2 from sheets');
    const rows = await sheetsService.getAllRows();
    
    if (!rows || rows.length === 0) {
      console.log('[HUGO] No rows found in spreadsheet');
      return null;
    }

    console.log('[HUGO] Row 2 data received:', {
      rowData: rows[0],
      hasKWs: Boolean(rows[0]?.['KWs']),
      hasTitle: Boolean(rows[0]?.['SEO TItle']),
      hasPostId: Boolean(rows[0]?.['Post ID']),
      hasDate: Boolean(rows[0]?.['2025-01-28T10:25:40.252Z'])
    });

    return rows;
  }

  async processRow(row, basePath) {
    try {
      const keyword = row['KWs'];
      
      if (!keyword) {
        throw new Error('Missing keyword in row 2');
      }

      console.log('[HUGO] Processing keyword:', keyword);

      // Create folder path
      const folderPath = `${basePath}/${this.createSlug(keyword)}`;

      // Collect data
      const { keywordData, paaData, serpData } = await dataCollector.collectData(keyword, folderPath);

      // Store collected data
      await contentStorage.storeContent(
        `${folderPath}/collected-data.json`,
        {
          keywordData,
          paaData,
          serpData,
          metadata: {
            keyword,
            processedDate: new Date().toISOString(),
            status: 'data_collected'
          }
        },
        { type: 'collected_data', keyword }
      );

      return {
        keyword,
        slug: this.createSlug(keyword),
        folderPath,
        dataCollected: {
          hasKeywordData: Boolean(keywordData),
          hasPaaData: Boolean(paaData?.results?.length),
          hasSerpData: Boolean(serpData?.serp?.length)
        },
        success: true
      };

    } catch (error) {
      console.error('[HUGO] Error processing row:', error);
      return {
        keyword: row['KWs'],
        success: false,
        error: error.message
      };
    }
  }

  async storeSummary(results) {
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    await contentStorage.storeContent(
      `logs/summary/${new Date().toISOString().split('T')[0]}.json`,
      { summary, results },
      { type: 'workflow_summary' }
    );
  }
}

module.exports = new WorkflowService();