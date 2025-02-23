const openaiService = require('../openai.service');

class ContentGeneratorService {
  async generateStructure(keyword, keywordData, paaData, serpData) {
    const messages = [
      {
        role: 'assistant',
        content: `Create a detailed content structure for a blog post about "${keyword}".
Use this keyword research data to optimize the content structure:
${JSON.stringify(keywordData, null, 2)}

And incorporate these related questions:
${JSON.stringify(paaData.results, null, 2)}

And use these search results for competitive analysis:
${JSON.stringify(serpData.serp, null, 2)}

Return ONLY valid JSON with this structure:
{
  "title": "SEO optimized title",
  "sections": [
    {
      "type": "introduction|main|conclusion",
      "title": "Section title",
      "content": "Detailed outline of section content"
    }
  ],
  "meta": {
    "description": "SEO meta description",
    "keywords": ["relevant", "keywords"],
    "search_volume": number,
    "related_questions": ["questions", "from", "PAA", "data"]
  }}`
      }
    ];

    const completion = await openaiService.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return JSON.parse(completion.data.choices[0].message.content);
  }

  async generateContent(structure) {
    const messages = [
      {
        role: 'assistant',
        content: `Create detailed blog post content based on this structure. 
Return ONLY valid JSON with this structure:
{
  "title": "Post title",
  "content": "Full markdown content",
  "meta": {
    "description": "Meta description",
    "keywords": ["keywords"]
  }}`
      },
      {
        role: 'user',
        content: JSON.stringify(structure)
      }
    ];

    const completion = await openaiService.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return JSON.parse(completion.data.choices[0].message.content);
  }
}

module.exports = new ContentGeneratorService();