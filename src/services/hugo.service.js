const path = require('path');
const fs = require('fs').promises;
const contentStorage = require('../utils/storage');
const openaiService = require('./openai.service');

class HugoService {
  constructor() {
    this.contentDir = path.join(process.cwd(), 'content');
    this.blogDir = path.join(this.contentDir, 'blog');
  }

  async initialize() {
    try {
      // Ensure Hugo content directories exist
      await fs.access(this.contentDir).catch(async () => {
        console.log('[HUGO] Content directory does not exist, creating it');
        await fs.mkdir(this.contentDir, { recursive: true });
      });
      
      await fs.access(this.blogDir).catch(async () => {
        console.log('[HUGO] Blog directory does not exist, creating it');
        await fs.mkdir(this.blogDir, { recursive: true });
      });

      console.log('[HUGO] Content directory initialized:', this.contentDir);
      return true;
    } catch (error) {
      console.error('[HUGO] Initialization failed:', error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      console.log('[HUGO] Creating post for:', postData.metadata.keyword);

      // Generate content with OpenAI
      const content = await this.generateContent(postData.metadata.keyword);

      // Generate front matter
      const frontMatter = this.generateFrontMatter(content);

      // Combine front matter and content
      const fullContent = `${frontMatter}\n\n${content.markdown}`;

      // Create the file
      const slug = this.createSlug(postData.metadata.keyword);
      const filePath = path.join(this.contentDir, `${slug}.md`);
      
      await fs.writeFile(filePath, fullContent, 'utf8');
      
      console.log('[HUGO] Successfully created post:', filePath);
      return { success: true, slug, filePath };
    } catch (error) {
      console.error('[HUGO] Error creating post:', error);
      throw error;
    }
  }

  generateFrontMatter(content) {
    const date = new Date();
    
    return `---
title: "${content.title}"
date: ${date.toISOString()}
lastmod: ${new Date().toISOString()}
draft: false
description: "${content.description}"
slug: "${content.slug}"
keywords: ${JSON.stringify(content.keywords)}
tags: ["antiques", "valuation"]
categories: ["Antiques"]
author: "Appraisily"
---`;
  }

  async generateContent(keyword) {
    const messages = [
      {
        role: 'assistant',
        content: `Create a detailed blog post about "${keyword}". Return ONLY valid JSON with this structure:
{
  "title": "SEO optimized title",
  "description": "Meta description (150-160 chars)",
  "slug": "url-friendly-slug",
  "keywords": ["relevant", "keywords"],
  "markdown": "Complete post content in markdown format"
}`
      }
    ];

    const completion = await openaiService.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return JSON.parse(completion.data.choices[0].message.content);
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new HugoService();