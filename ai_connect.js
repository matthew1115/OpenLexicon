const OpenAI = require('openai');

class AIConnect {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.modelName = 'gpt-3.5-turbo';
    }

    /**
     * Initialize the OpenAI client with API key and base URL
     * @param {string} apiKey - The API key for OpenAI or compatible API
     * @param {string} baseURL - The base URL for the API (default: https://api.openai.com/v1)
     * @param {string} modelName - The model name to use (default: gpt-3.5-turbo)
     */
    initialize(apiKey, baseURL = 'https://api.openai.com/v1', modelName = 'gpt-3.5-turbo') {
        if (!apiKey) {
            throw new Error('API key is required');
        }

        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL
        });

        this.modelName = modelName;
        this.isInitialized = true;
    }

    /**
     * Test the API connection
     * @returns {Promise<boolean>} - True if connection is successful
     */
    async testConnection() {
        if (!this.isInitialized) {
            throw new Error('AI client not initialized. Call initialize() first.');
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.modelName,
                messages: [
                    { role: 'user', content: 'Hello' }
                ],
                max_tokens: 5
            });

            return response && response.choices && response.choices.length > 0;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Generate a definition for a word
     * @param {string} word - The word to define
     * @param {string} context - Optional context where the word was found
     * @returns {Promise<string>} - The definition of the word
     */
    async generateDefinition(word, context = '') {
        if (!this.isInitialized) {
            throw new Error('AI client not initialized. Call initialize() first.');
        }

        try {
            const prompt = context 
                ? `Define the word "${word}" as used in this context: "${context}". Provide a clear, concise definition.`
                : `Define the word "${word}". Provide a clear, concise definition.`;

            const response = await this.client.chat.completions.create({
                model: this.modelName,
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a helpful assistant that provides clear, concise definitions of words. Keep definitions brief but informative.' 
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.3
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating definition:', error);
            throw new Error(`Failed to generate definition: ${error.message}`);
        }
    }

    /**
     * Generate example sentences for a word
     * @param {string} word - The word to create examples for
     * @param {number} count - Number of examples to generate (default: 3)
     * @returns {Promise<string[]>} - Array of example sentences
     */
    async generateExamples(word, count = 3) {
        if (!this.isInitialized) {
            throw new Error('AI client not initialized. Call initialize() first.');
        }

        try {
            const prompt = `Create ${count} example sentences using the word "${word}". Each sentence should demonstrate different uses or meanings of the word. Return only the sentences, one per line.`;

            const response = await this.client.chat.completions.create({
                model: this.modelName,
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a helpful assistant that creates example sentences. Provide clear, practical examples that demonstrate word usage.' 
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.5
            });

            const examples = response.choices[0].message.content.trim().split('\n');
            return examples.filter(example => example.trim().length > 0);
        } catch (error) {
            console.error('Error generating examples:', error);
            throw new Error(`Failed to generate examples: ${error.message}`);
        }
    }

    /**
     * Generate synonyms for a word
     * @param {string} word - The word to find synonyms for
     * @param {number} count - Number of synonyms to generate (default: 5)
     * @returns {Promise<string[]>} - Array of synonyms
     */
    async generateSynonyms(word, count = 5) {
        if (!this.isInitialized) {
            throw new Error('AI client not initialized. Call initialize() first.');
        }

        try {
            const prompt = `Provide ${count} synonyms for the word "${word}". Return only the synonyms, separated by commas.`;

            const response = await this.client.chat.completions.create({
                model: this.modelName,
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a helpful assistant that provides synonyms. Return only the synonyms, separated by commas.' 
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.3
            });

            const synonyms = response.choices[0].message.content.trim().split(',');
            return synonyms.map(synonym => synonym.trim()).filter(synonym => synonym.length > 0);
        } catch (error) {
            console.error('Error generating synonyms:', error);
            throw new Error(`Failed to generate synonyms: ${error.message}`);
        }
    }

    /**
     * Generate a comprehensive word analysis including definition, examples, and synonyms
     * @param {string} word - The word to analyze
     * @param {string} context - Optional context where the word was found
     * @returns {Promise<Object>} - Object containing definition, examples, and synonyms
     */
    async analyzeWord(word, context = '') {
        if (!this.isInitialized) {
            throw new Error('AI client not initialized. Call initialize() first.');
        }

        try {
            const [definition, examples, synonyms] = await Promise.all([
                this.generateDefinition(word, context),
                this.generateExamples(word, 3),
                this.generateSynonyms(word, 5)
            ]);

            return {
                word: word,
                definition: definition,
                examples: examples,
                synonyms: synonyms,
                context: context
            };
        } catch (error) {
            console.error('Error analyzing word:', error);
            throw new Error(`Failed to analyze word: ${error.message}`);
        }
    }

    /**
     * Get the current model name
     * @returns {string} - The current model name
     */
    getCurrentModel() {
        return this.modelName;
    }

    /**
     * Check if the AI client is initialized
     * @returns {boolean} - True if initialized
     */
    isReady() {
        return this.isInitialized;
    }
}

module.exports = AIConnect;
