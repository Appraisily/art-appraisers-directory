const { Storage } = require('@google-cloud/storage');

class ContentStorage {
  constructor() {
    this.storage = new Storage();
    this.bucketName = 'images_free_reports';
    this.isInitialized = false;
    this.bucket = null;
    console.log('[STORAGE] Initializing storage service with bucket:', this.bucketName);
  }

  async initialize() {
    try {
      console.log('[STORAGE] Attempting to connect to bucket:', this.bucketName);
      const [bucket] = await this.storage.bucket(this.bucketName).get();
      await bucket.exists(); // Verify bucket access
      this.bucket = bucket;
      this.isInitialized = true;
      
      console.log('[STORAGE] Successfully initialized bucket:', this.bucketName);
      return true;
    } catch (error) {
      console.error('[STORAGE] Initialization failed for bucket:', this.bucketName);
      throw error;
    }
  }

  async storeContent(filePath, content, metadata = {}) {
    console.log('[STORAGE] Starting content storage process:', {
      filePath,
      contentSize: JSON.stringify(content).length,
      metadata,
      isInitialized: this.isInitialized
    });

    if (!this.isInitialized || !this.bucket) {
      throw new Error('Storage not initialized');
    }

    const file = this.bucket.file(filePath);
    
    const fileMetadata = {
      contentType: 'application/json',
      metadata: {
        timestamp: new Date().toISOString(),
        contentLength: JSON.stringify(content).length,
        storagePath: filePath,
        ...metadata
      }
    };

    try {
      console.log('[STORAGE] Attempting to save file with metadata:', fileMetadata);
      await file.save(JSON.stringify(content, null, 2), {
        metadata: fileMetadata,
        resumable: false
      });
      
      console.log('[STORAGE] Successfully stored content:', {
        filePath,
        timestamp: fileMetadata.metadata.timestamp
      });

      // Verify the file was saved
      const [exists] = await file.exists();
      console.log('[STORAGE] File existence verification:', {
        filePath,
        exists,
        size: (await file.getMetadata())[0].size
      });

      return filePath;
    } catch (error) {
      console.error('[STORAGE] Failed to store content:', {
        filePath,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  async getContent(filePath) {
    console.log('[STORAGE] Attempting to retrieve content:', filePath);
    
    if (!this.bucket) {
      throw new Error('Storage service not initialized');
    }

    try {
      const file = this.bucket.file(filePath);
      
      // Check if file exists before attempting download
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log('[STORAGE] File found, retrieving content...');
      const [content] = await file.download();
      
      const contentString = content.toString();
      console.log('[STORAGE] Content retrieved successfully:', {
        filePath,
        contentSize: contentString.length,
        isJson: this.isValidJson(contentString)
      });

      return JSON.parse(contentString);
    } catch (error) {
      console.error('[STORAGE] Error retrieving content:', {
        filePath,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = new ContentStorage();