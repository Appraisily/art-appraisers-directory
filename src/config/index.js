const port = process.env.PORT || 8080;

module.exports = {
  port,
  secretNames: {
    openAiKey: 'OPENAI_API_KEY',
    perplexityKey: 'PERPLEXITY_API_KEY'
  }
};