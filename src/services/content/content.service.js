const openaiService = require('../openai.service');
const wordpressService = require('../wordpress');
const contentStorage = require('../../utils/storage');
const TurndownService = require('turndown');
const path = require('path');
const fs = require('fs').promises;

class ContentService {
  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '_'
    });

    // Configure Turndown rules
    this.configureTurndownRules();
  }

  configureTurndownRules() {
    // Preserve line breaks
    this.turndown.addRule('lineBreaks', {
      filter: ['br'],
      replacement: () => '\n'
    });

    // Handle internal links
    this.turndown.addRule('internalLinks', {
      filter: (node, options) => {
        return (
          node.nodeName === 'A' &&
          node.getAttribute('href')?.includes(options.wordpressUrl)
        );
      },
      replacement: (content, node, options) => {
        const href = node.getAttribute('href');
        // Convert WordPress URL to relative path
        const relativePath = this.convertToRelativePath(href, options.wordpressUrl);
        return `[${content}](${relativePath})`;
      }
    });

    // Handle images with proper Hugo shortcodes
    this.turndown.addRule('images', {
      filter: 'img',
      replacement: (content, node) => {
        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title') || '';
        
        // Use Hugo's figure shortcode for images
        return `{{< figure src="${src}" alt="${alt}" title="${title}" >}}`;
      }
    });
  }

  convertToRelativePath(href, wordpressUrl) {
    if (!href || !wordpressUrl) return href;
    
    // Remove WordPress domain and get path
    const relativePath = href.replace(wordpressUrl, '');
    
    // Convert to Hugo blog path format
    return relativePath.replace(/^\/blog\//, '/');
  }

  async convertToMarkdown(htmlContent, options = {}) {
    try {
      console.log('[CONTENT] Starting HTML to Markdown conversion');

      // Initial conversion using Turndown
      const markdown = this.turndown.turndown(htmlContent);

      // Enhance with OpenAI if requested
      if (options.enhance) {
        return await this.enhanceMarkdown(markdown);
      }

      return markdown;
    } catch (error) {
      console.error('[CONTENT] Error converting HTML to Markdown:', error);
      throw error;
    }
  }

  async enhanceMarkdown(markdown) {
    try {
      console.log('[CONTENT] Enhancing markdown with OpenAI');
      
      const messages = [
        {
          role: 'assistant',
          content: `You are a markdown enhancement expert. Your task is to improve the provided markdown content while maintaining its structure and meaning.

CRITICAL REQUIREMENTS:
1. Preserve all headings and their levels
2. Maintain all links and references
3. Keep all code blocks intact
4. Preserve lists and their hierarchy
5. Maintain image references
6. Improve readability without changing meaning
7. Add front matter with:
   - title
   - date
   - lastmod
   - description
   - keywords
   - categories
   - tags

Return ONLY the enhanced markdown content with front matter.`
        },
        {
          role: 'user',
          content: markdown
        }
      ];

      const completion = await openaiService.openai.createChatCompletion({
        model: 'o3-mini',
        messages,
        temperature: 0.7
      });

      return completion.data.choices[0].message.content;
    } catch (error) {
      console.error('[CONTENT] Error enhancing markdown:', error);
      // Return original markdown if enhancement fails
      return markdown;
    }
  }

  async processPost(postData) {
    try {
      console.log(`[CONTENT] Processing post: ${postData.post.id}`);

      // Convert HTML to Markdown
      const markdown = await this.convertToMarkdown(postData.post.content, {
        enhance: true,
        wordpressUrl: process.env.WORDPRESS_URL
      });

      // Generate Hugo front matter
      const frontMatter = this.generateFrontMatter(postData);

      // Combine front matter and markdown
      const fullContent = `${frontMatter}\n\n${markdown}`;

      // Create Hugo content file
      await this.saveHugoContent(postData.post.id, fullContent, postData.metadata.keyword);

      return {
        success: true,
        postId: postData.post.id,
        slug: this.createSlug(postData.metadata.keyword)
      };
    } catch (error) {
      console.error(`[CONTENT] Error processing post ${postData.post.id}:`, error);
      throw error;
    }
  }

  generateFrontMatter(postData) {
    const { post, metadata } = postData;
    const date = new Date(metadata.processedDate);
    
    return `---
title: "${metadata.seoTitle || post.title}"
date: ${date.toISOString()}
lastmod: ${new Date().toISOString()}
draft: false
description: "${this.cleanDescription(post.content)}"
slug: "${this.createSlug(metadata.keyword)}"
keywords: ["${metadata.keyword}"]
tags: ["antiques", "valuation"]
categories: ["Antiques"]
author: "Appraisily"
---`;
  }

  async saveHugoContent(postId, content, keyword) {
    try {
      // Ensure Hugo content directory exists
      const contentDir = path.join(process.cwd(), 'content', 'blog');
      await fs.mkdir(contentDir, { recursive: true });

      // Create file with slug name
      const slug = this.createSlug(keyword);
      const filePath = path.join(contentDir, `${slug}.md`);

      await fs.writeFile(filePath, content, 'utf8');
      console.log(`[CONTENT] Saved Hugo content file: ${filePath}`);

      return filePath;
    } catch (error) {
      console.error('[CONTENT] Error saving Hugo content:', error);
      throw error;
    }
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  cleanDescription(html) {
    // Remove HTML tags and get first 160 characters
    const text = html.replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
    return text.substring(0, 157) + '...';
  }
}

module.exports = new ContentService();