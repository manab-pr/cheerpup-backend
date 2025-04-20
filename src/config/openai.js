const { Configuration, OpenAIApi } = require('openai');

// openai setup

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = openai;
