const sheetsService = require('../services/sheets.service');
const wordpressService = require('../services/wordpress');
const contentStorage = require('../utils/storage');
const hugoService = require('../services/hugo.service');
const hugoProcessor = require('../services/hugo-processor.service');

class WorkerController {
  constructor() {
    this.isProcessing = false;
  }

  async processHugoMigration(req, res) {
    try {
      console.log('[WORKER] Starting Hugo migration process');
      const result = await hugoProcessor.processWorkflow();
      return res.json(result);
    } catch (error) {
      console.error('[WORKER] Error in Hugo migration:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async processWorkflow() {
    if (this.isProcessing) {
      console.log('[WORKER] Workflow already in progress');
      return {
        success: false,
        message: 'Workflow already in progress'
      };
    }

    try {
      this.isProcessing = true;
      console.log('[WORKER] Starting workflow processing');

      // Get all rows from the sheet
      const rows = await sheetsService.getAllRows();
      
      if (!rows || rows.length === 0) {
        console.log('[WORKER] No rows found in spreadsheet');
        return {
          success: true,
          message: 'No rows to process',
          processed: 0
        };
      }

      console.log(`[WORKER] Found ${rows.length} rows to process`);
      
      const results = [];
      for (const row of rows) {
        try {
          // Extract post ID and fetch WordPress content
          const postId = row['Post ID'];
          if (!postId) {
            console.warn('[WORKER] Missing Post ID in row:', row);
            continue;
          }

          console.log(`[WORKER] Processing Post ID: ${postId}`);
          
          // Fetch post content from WordPress
          const post = await wordpressService.getPost(postId);

          // Extract main image URL from post content
          const mainImageUrl = post.featured_media ? 
            await wordpressService.getMediaUrl(post.featured_media) :
            this.extractFirstImageUrl(post.content);

          // Create Hugo post
          const hugoResult = await hugoService.createPost({
            post: {
              id: postId,
              title: post.title,
              content: post.content,
              mainImageUrl,
              url: post.link
            },
            metadata: {
              keyword: row['KWs'],
              seoTitle: row['SEO TItle'],
              processedDate: row['2025-01-28T10:25:40.252Z']
            }
          });
          
          // Store the fetched content
          await contentStorage.storeContent(
            `seo/posts/${postId}/original.json`,
            {
              post: {
                id: postId,
                title: post.title,
                content: post.content,
                mainImageUrl,
                url: post.link
              },
              metadata: {
                keyword: row['KWs'],
                seoTitle: row['SEO TItle'],
                processedDate: row['2025-01-28T10:25:40.252Z'],
                fetchedAt: new Date().toISOString()
              }
            },
            {
              type: 'wordpress_post',
              postId,
              keyword: row['KWs']
            }
          );

          results.push({
            postId,
            keyword: row['KWs'],
            title: post.title,
            hugoSlug: hugoResult.slug,
            imageUrl: mainImageUrl,
            success: true
          });

        } catch (error) {
          console.error('[WORKER] Error processing row:', error);
          results.push({
            postId: row['Post ID'],
            keyword: row['KWs'],
            success: false,
            error: error.message
          });
        }
      }

      // Summarize results
      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };

      console.log('[WORKER] Workflow processing completed:', summary);

      return {
        success: true,
        message: 'Workflow processing completed',
        summary,
        results
      };

    } catch (error) {
      console.error('[WORKER] Critical error in workflow processing:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  extractFirstImageUrl(content) {
    // Extract first image URL from content using regex
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
  }
}

module.exports = new WorkerController();