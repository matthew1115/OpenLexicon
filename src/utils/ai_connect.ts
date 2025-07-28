import OpenAI from 'openai';

interface WordAnalysis {
    word: string;
    definition: string;
    examples: string[];
    synonyms: string[];
    context: string;
}

class AIConnect {
    private client: OpenAI | null;
    private isInitialized: boolean;
    private modelName: string;

    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.modelName = 'gpt-4o-mini';
    }

    /**
     * Initialize the OpenAI client with API key and base URL
     * @param apiKey - The API key for OpenAI or compatible API
     * @param baseURL - The base URL for the API (default: https://api.openai.com/v1)
     * @param modelName - The model name to use (default: gpt-4o-mini)
     */
    initialize(apiKey: string, baseURL: string = 'https://api.openai.com/v1', modelName: string = 'gpt-4o-mini'): void {
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
     * @returns True if connection is successful
     */
    async testConnection(): Promise<boolean> {
        if (!this.isInitialized) {
            throw new Error('AI client not initialized. Call initialize() first.');
        }

        try {
            const response = await this.client!.chat.completions.create({
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
     * Generate four choices for a word, only one of which is the correct meaning.
     * The format is strict JSON: an array of objects with 'choice' and 'isCorrect' fields.
     * @param word - The word to generate choices for
     * @returns An array of four objects: { choice: string, isCorrect: boolean }
     */
    async generateWordChoices(word: string, retry: number = 1): Promise<{ choice: string, isCorrect: boolean }[]> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

            const prompt = `For the word "${word}", generate four answer choices as an array of JSON objects. Each object must have two fields: 'choice' (string, the meaning) and 'isCorrect' (boolean, true only for the correct meaning). Only one object should have isCorrect: true. The other three should be plausible but incorrect. Return only the JSON array, nothing else.`;
            const system = 'You are a helpful assistant that creates multiple-choice vocabulary questions. Always return a strict JSON array of objects with fields: choice (string), isCorrect (boolean). Do not include any explanation or text outside the JSON.';

            const getChoices = async (): Promise<{ choice: string, isCorrect: boolean }[] | null> => {
                const response = await this.client!.chat.completions.create({
                    model: this.modelName,
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                });
                const content = response.choices[0].message.content?.trim() || '';
                try {
                    const choices = JSON.parse(content);
                    if (Array.isArray(choices) && choices.length === 4 && choices.every(c => typeof c.choice === 'string' && typeof c.isCorrect === 'boolean')) {
                        return choices;
                    }
                    return null;
                } catch (e) {
                    console.error('Failed to parse word choices JSON:', content);
                    return null;
                }
            };

            let choices = await getChoices();
            let attempts = retry;
            while (!choices && attempts > 0) {
                attempts--;
                choices = await getChoices();
            }
            return choices || [];
        } catch (error) {
            console.error('Error generating word choices:', error);
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return [];
        }
    }

    /**
     * Generate a definition for a word
     * @param word - The word to define
     * @param context - Optional context where the word was found
     * @returns The definition of the word
     */
    async generateDefinition(word: string, context: string = ''): Promise<string> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

            const prompt = context
                ? `Define the word "${word}" as used in this context: "${context}". Provide a clear, concise definition.`
                : `Define the word "${word}". Provide a clear, concise definition.`;

            const response = await this.client!.chat.completions.create({
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

            return response.choices[0].message.content?.trim() || '';
        } catch (error) {
            console.error('Error generating definition:', error);
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return "";
        }
    }

    /**
     * Generate example sentences for a word
     * @param word - The word to create examples for
     * @param count - Number of examples to generate (default: 3)
     * @returns Array of example sentences
     */
    async generateExamples(word: string, count: number = 3): Promise<string[]> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

            const prompt = `Create ${count} example sentences using the word "${word}". Each sentence should demonstrate different uses or meanings of the word. Return only the sentences, one per line.`;

            const response = await this.client!.chat.completions.create({
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

            const examples = response.choices[0].message.content?.trim().split('\n') || [];
            return examples.filter((example: string) => example.trim().length > 0);
        } catch (error) {
            console.error('Error generating examples:', error);
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return [];
        }
    }

    /**
     * Generate synonyms for a word
     * @param word - The word to find synonyms for
     * @param count - Number of synonyms to generate (default: 5)
     * @returns Array of synonyms
     */
    async generateSynonyms(word: string, count: number = 5): Promise<string[]> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

            const prompt = `Provide ${count} synonyms for the word "${word}". Return only the synonyms, separated by commas.`;

            const response = await this.client!.chat.completions.create({
                model: this.modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that provides synonyms. Return only the synonyms, separated by commas.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 50,
                temperature: 0.3
            });

            const synonyms = response.choices[0].message.content?.trim().split(',') || [];
            return synonyms.map((synonym: string) => synonym.trim()).filter((synonym: string) => synonym.length > 0);
        } catch (error) {
            console.error('Error generating synonyms:', error);
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return [];
        }
    }

    /**
     * Generate a comprehensive word analysis including definition, examples, and synonyms
     * @param word - The word to analyze
     * @param context - Optional context where the word was found
     * @returns Object containing definition, examples, and synonyms
     */
    async analyzeWord(word: string, context: string = ''): Promise<WordAnalysis> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

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
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return {
                word,
                definition: "",
                examples: [],
                synonyms: [],
                context
            };
        }
    }

    /**
     * Check if a given example sentence is a correct usage of the word
     * @param word - The word to check
     * @param example - The example sentence to check
     * @returns True if the example is a correct usage, false otherwise
     */
    async checkExample(word: string, example: string): Promise<boolean> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

            const prompt = `Is the following sentence a correct example of the word "${word}" with no grammar errors? "${example}" Respond with "yes" or "no".`;

            const response = await this.client!.chat.completions.create({
                model: this.modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that verifies example sentences for words.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 10,
                temperature: 0.0
            });

            return response.choices[0].message.content?.trim().toLowerCase() === 'yes';
        } catch (error) {
            console.error('Error checking example:', error);
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return false;
        }
    }

    /**
     * Refine an example sentence for clarity and conciseness
     * @param word - The word to refine the example for
     * @param example - The example sentence to refine
     * @returns The refined example sentence
     */
    async refineExample(word: string, example: string): Promise<string> {
        try {
            if (!this.isInitialized) {
                throw new Error('AI client not initialized. Call initialize() first.');
            }

            const prompt = `Refine the following example sentence for the word "${word}" to make it grammatically correct and more concise: "${example}". Provide only the refined sentence.`;

            const response = await this.client!.chat.completions.create({
                model: this.modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that refines example sentences for clarity and conciseness.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.5
            });

            return response.choices[0].message.content?.trim() || '';
        } catch (error) {
            console.error('Error refining example:', error);
            if (typeof window !== "undefined" && window.alert) {
                window.alert('AI error: ' + ((error as Error)?.message || error));
            }
            return "";
        }
    }

    /**
     * Get the current model name
     * @returns The current model name
     */
    getCurrentModel(): string {
        return this.modelName;
    }

    /**
     * Check if the AI client is initialized
     * @returns True if initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

export default AIConnect;
