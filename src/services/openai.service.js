const OpenAI = require('openai');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');

class OpenAIService {
  constructor() {
    this.isInitialized = false;
    this.openai = null;
  }

  async initialize() {
    try {
      const apiKey = await getSecret(secretNames.openAiKey);
      this.openai = new OpenAI({ apiKey });
      this.isInitialized = true;
      console.log('[OPENAI] Successfully initialized');
    } catch (error) {
      console.error('[OPENAI] Initialization failed:', error);
      throw error;
    }
  }

  async generateImage(prompt, size = "1024x1024") {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      console.log('[OPENAI] Generating image with prompt:', prompt);
      
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality: "standard",
        response_format: "url"
      });

      if (!response || !response.data || !response.data[0] || !response.data[0].url) {
        throw new Error('Invalid response from DALL-E 3');
      }

      const imageUrl = response.data[0].url;
      console.log('[OPENAI] Successfully generated image:', imageUrl);
      
      return {
        success: true,
        url: imageUrl
      };
    } catch (error) {
      console.error('[OPENAI] Error generating image:', error);
      
      // Log detailed API error if available
      if (error.response) {
        console.error('[OPENAI] API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async enhanceContent(prompt, keyword, version = 'v1') {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }
    
    const systemPrompt = version === 'v3' ? 
      `You are an AI assistant that processes information about art appraisers and outputs it in a structured JSON format. Each appraiser entry should include:
      - name (string)
      - specialties (array of strings)
      - pricing (array of strings or string)
      - services_offered (array of strings)
      - certifications (array of strings)
      - years_in_business (string or number)
      - city (string)
      - state (string)
      - phone (string)
      - website (string)
      - notes (string)
      
      Output only valid JSON that can be parsed. Format as {"appraisers": [...]}` 
      : "You are an expert content enhancer specializing in antiques and art valuation. Your task is to enhance WordPress content while maintaining HTML structure and adding compelling CTAs. Return only the enhanced content with HTML formatting.";

    try {
      console.log(`[OPENAI] Sending request to enhance content (${version}) with keyword:`, keyword);
      
      // Use o3-mini for v3, gpt-4o for others
      const model = version === 'v3' ? 'o3-mini' : 'gpt-4o';
      
      // Use 'assistant' role for o1-mini, 'system' for others
      const instructionRole = model === 'o3-mini' ? 'assistant' : 'system';
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: instructionRole,
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const enhancedContent = completion.choices[0].message.content;
      
      // Validate JSON for v3 responses
      if (version === 'v3') {
        try {
          JSON.parse(enhancedContent);
        } catch (error) {
          console.error('[OPENAI] Invalid JSON response:', error);
          throw new Error('Response was not valid JSON');
        }
      }
      
      // Check for truncation
      if (completion.choices[0].finish_reason === 'length') {
        console.error(`[OPENAI] Response was truncated (${version})`);
        throw new Error(`Response truncated - content too long (${version})`);
      }

      console.log(`[OPENAI] Successfully received enhanced content (${version})`);
      
      return enhancedContent;
    } catch (error) {
      // Log the full error response from OpenAI
      console.error(`[OPENAI] Full error response:`, error.response?.data);
      console.error('[OPENAI] Error details:', error.response?.data?.error);
      
      // Check for specific OpenAI errors
      if (error.response?.data?.error?.code === 'context_length_exceeded') {
        console.error(`[OPENAI] Context length exceeded (${version}):`, error.response.data.error);
        throw new Error(`Content too long for processing (${version})`);
      }
      
      console.error(`[OPENAI] Error enhancing content (${version}):`, error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();