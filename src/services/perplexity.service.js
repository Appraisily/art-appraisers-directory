const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const { secretNames } = require('../config');

class PerplexityService {
  constructor() {
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    this.apiKey = null;
  }

  async initialize() {
    try {
      this.apiKey = await getSecret(secretNames.perplexityKey);
      console.log('[PERPLEXITY] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Service initialization failed:', error);
      throw error;
    }
  }

  async makeRequest(prompt, type, options = {}) {
    const {
      model = 'sonar',
      maxTokens = 2000,
      temperature = 0.1,
      topP = 0.9
    } = options;

    try {
      console.log(`[PERPLEXITY] Making ${type} request for prompt:`, prompt.substring(0, 100) + '...');

      const requestData = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false
      };

      console.log('[PERPLEXITY] Request data:', JSON.stringify(requestData, null, 2));

      // For art appraiser data, use a structured prompt
      const systemPrompt = type === 'art_appraiser' ? 
        'You are an expert art appraiser data analyst. Return ONLY valid JSON matching the exact schema provided in the prompt.' : 
        'You are an art appraiser data analyst.';

      const response = await axios.post(
        this.apiUrl,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[PERPLEXITY] Response status:', response.status);
      console.log('[PERPLEXITY] Response data:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response structure from Perplexity API');
      }

      const result = response.data.choices[0].message.content;

      if (!result) {
        throw new Error('No content in Perplexity response');
      }

      console.log('[PERPLEXITY] Raw response:', result.substring(0, 100) + '...');

      // For art appraiser data, validate the JSON structure
      if (type === 'art_appraiser') {
        const parsed = JSON.parse(result);
        this.validateArtAppraiserData(parsed);
      }

      // Cache the result
      await this.cacheResult(prompt, result, type);

      return result;

    } catch (error) {
      console.error('[PERPLEXITY] API request failed:', error);
      throw error;
    }
  }

  async getArtAppraiserData(city, state) {
    const prompt = `Create a detailed art appraiser directory entry for ${city}, ${state}. Use realistic but fictional data.

Return ONLY a valid JSON object with EXACTLY this structure:
{
  "city": "${city}",
  "state": "${state}",
  "seo": {
    "title": "Art Appraisers in ${city} | Expert Art Valuation Services",
    "description": "Find certified art appraisers in ${city}, ${state}. Get expert art valuations, authentication services, and professional advice for your art collection.",
    "keywords": ["art appraisers ${city.toLowerCase()}", "${city.toLowerCase()} art valuation", "art authentication ${city.toLowerCase()}", "fine art appraisal ${state.toLowerCase()}"],
    "schema": {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Art Appraisers in ${city}",
      "description": "Find certified art appraisers in ${city}, ${state}. Professional art valuation and authentication services.",
      "areaServed": {
        "@type": "City",
        "name": "${city}",
        "state": "${state}"
      }
    }
  },
  "appraisers": [
    {
      "id": "generated-unique-id",
      "name": "Business Name",
      "image": "https://images.unsplash.com/photo-relevant-to-art-appraisal",
      "rating": number,
      "reviewCount": number,
      "address": "Full Address with ZIP",
      "specialties": ["array"],
      "phone": "(XXX) XXX-XXXX",
      "email": "contact@domain.com",
      "website": "https://domain.com",
      "seo": {
        "schema": {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Business Name",
          "image": "https://images.unsplash.com/photo-relevant-to-art-appraisal",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Street Address",
            "addressLocality": "${city}",
            "addressRegion": "${state}",
            "postalCode": "ZIP Code",
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "Actual Latitude",
            "longitude": "Actual Longitude"
          },
          "url": "https://domain.com",
          "telephone": "(XXX) XXX-XXXX",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5-5.0",
            "reviewCount": "50-200"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "09:00",
              "closes": "17:00"
            }
          ]
        }
      },
      "about": "Detailed business description with years of experience and expertise",
      "businessHours": [
        {
          "day": "Day Name",
          "hours": "HH:MM AM - HH:MM PM"
        }
      ],
      "certifications": ["Relevant Certifications"],
      "services": [
        {
          "name": "Service Name",
          "description": "Detailed service description",
          "price": "$XXX - $X,XXX"
        }
      ],
      "reviews": [
        {
          "id": "review-id",
          "author": "First Name L.",
          "rating": number,
          "date": "Recent Date",
          "content": "Detailed review content"
        }
      ]
    }
  ]
}`;

    return this.makeRequest(prompt, 'art_appraiser', {
      model: 'sonar',
      maxTokens: 2000,
      temperature: 0.1
    });
  }

  validateArtAppraiserData(data) {
    // Basic structure validation
    if (!data.city || !data.state || !data.seo || !Array.isArray(data.appraisers)) {
      console.error('[PERPLEXITY] Invalid data structure:', data);
      throw new Error('Invalid art appraiser data structure');
    }

    // SEO validation
    if (!data.seo.title || !data.seo.description || !Array.isArray(data.seo.keywords)) {
      console.error('[PERPLEXITY] Invalid SEO structure:', data.seo);
      throw new Error('Invalid SEO data structure');
    }

    // Appraisers validation
    data.appraisers.forEach((appraiser, index) => {
      if (!appraiser.id || !appraiser.name || !appraiser.address) {
        console.error('[PERPLEXITY] Invalid appraiser data:', appraiser);
        throw new Error(`Invalid appraiser data at index ${index}`);
      }
    });
  }

  async cacheResult(prompt, result, type) {
    const cacheData = {
      prompt,
      result,
      type,
      timestamp: new Date().toISOString()
    };

    const hash = Buffer.from(prompt).toString('base64').substring(0, 32);
    const filePath = `perplexity/${type}/${hash}.json`;

    await contentStorage.storeContent(
      filePath,
      cacheData,
      { type: 'perplexity_result', resultType: type }
    );
  }
}

module.exports = new PerplexityService();