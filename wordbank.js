const Database = require('better-sqlite3');

class Wordbank {
    constructor(dbPath) {
        this.db = new Database(dbPath, {
            readonly: false,
            fileMustExist: false,
            timeout: 5000
        });

        this.initializeDatabase();
    }

    // Initialize the database schema
    initializeDatabase() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL UNIQUE,
                definition TEXT NOT NULL,
                last_shown_timestamp INTEGER DEFAULT 0,
                last_correct_timestamp INTEGER DEFAULT 0,
                shown_times INTEGER DEFAULT 0,
                difficulty REAL DEFAULT 0.0,
                example TEXT DEFAULT ''
            )
        `;

        this.db.exec(createTableQuery);

        // Create index on word column if it doesn't exist
        try {
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_words_word ON words(word)');
        } catch (error) {
            // Index already exists or error, ignore
        }

        console.log('Wordbank database initialized');
    }

    // Get wordbank statistics
    getStats() {
        const totalWordsQuery = this.db.prepare('SELECT COUNT(*) as total FROM words');
        const neverShownQuery = this.db.prepare('SELECT COUNT(*) as never_shown FROM words WHERE last_shown_timestamp = 0');
        const shownWordsQuery = this.db.prepare('SELECT COUNT(*) as shown FROM words WHERE last_shown_timestamp > 0');

        const totalWords = totalWordsQuery.get().total;
        const neverShown = neverShownQuery.get().never_shown;
        const shownWords = shownWordsQuery.get().shown;

        return {
            totalWords,
            neverShown,
            shownWords,
            averageShownTimes: totalWords > 0 ? this.getAverageShownTimes() : 0
        };
    }

    // Helper method to get average shown times
    getAverageShownTimes() {
        const avgQuery = this.db.prepare('SELECT AVG(shown_times) as avg_shown FROM words');
        const result = avgQuery.get();
        return Math.round((result.avg_shown || 0) * 100) / 100; // Round to 2 decimal places
    }

    // Add a new word to the wordbank
    addWord(word, definition, example = '', difficulty = 0.0) {
        try {
            const insertQuery = this.db.prepare(`
                INSERT INTO words (word, definition, example, difficulty) 
                VALUES (?, ?, ?, ?)
            `);

            const result = insertQuery.run(word.toLowerCase().trim(), definition.trim(), example.trim(), difficulty);
            console.log(`Added word: ${word}`);
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return { success: false, error: 'Word already exists in wordbank' };
            }
            console.error('Error adding word:', error);
            return { success: false, error: error.message };
        }
    }

    // Remove a word from the wordbank
    removeWord(word) {
        try {
            const deleteQuery = this.db.prepare('DELETE FROM words WHERE word = ?');
            const result = deleteQuery.run(word.toLowerCase().trim());

            if (result.changes > 0) {
                console.log(`Removed word: ${word}`);
                return { success: true };
            } else {
                return { success: false, error: 'Word not found in wordbank' };
            }
        } catch (error) {
            console.error('Error removing word:', error);
            return { success: false, error: error.message };
        }
    }

    // Get a specific word from the wordbank
    getWord(word) {
        try {
            const selectQuery = this.db.prepare(`
                SELECT * FROM words WHERE word = ?
            `);

            const result = selectQuery.get(word.toLowerCase().trim());

            if (result) {
                return {
                    success: true,
                    word: {
                        id: result.id,
                        word: result.word,
                        definition: result.definition,
                        lastShownTimestamp: result.last_shown_timestamp,
                        lastCorrectTimestamp: result.last_correct_timestamp,
                        shownTimes: result.shown_times,
                        difficulty: result.difficulty,
                        example: result.example
                    }
                };
            } else {
                return { success: false, error: 'Word not found in wordbank' };
            }
        } catch (error) {
            console.error('Error getting word:', error);
            return { success: false, error: error.message };
        }
    }

    // Auto get next word (placeholder - implementation to be defined later)
    autoGetNextWord() {
        // TODO: Implement logic for automatically selecting the next word
        // This could be based on:
        // - Words never shown (priority)
        // - Words shown least recently
        // - Words with lowest shown_times count
        // - Some combination of factors

        console.log('autoGetNextWord: Implementation pending');
        return { success: false, error: 'Method not yet implemented' };
    }

    // Update word statistics when shown
    markWordAsShown(word) {
        try {
            const updateQuery = this.db.prepare(`
                UPDATE words 
                SET last_shown_timestamp = ?, shown_times = shown_times + 1 
                WHERE word = ?
            `);

            const timestamp = Date.now();
            const result = updateQuery.run(timestamp, word.toLowerCase().trim());

            if (result.changes > 0) {
                console.log(`Marked word as shown: ${word}`);
                return { success: true };
            } else {
                return { success: false, error: 'Word not found in wordbank' };
            }
        } catch (error) {
            console.error('Error marking word as shown:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all words (useful for debugging or export)
    getAllWords() {
        try {
            const selectAllQuery = this.db.prepare('SELECT * FROM words ORDER BY word ASC');
            const words = selectAllQuery.all();

            return {
                success: true,
                words: words.map(row => ({
                    id: row.id,
                    word: row.word,
                    definition: row.definition,
                    lastShownTimestamp: row.last_shown_timestamp,
                    lastCorrectTimestamp: row.last_correct_timestamp,
                    shownTimes: row.shown_times,
                    difficulty: row.difficulty,
                    example: row.example
                }))
            };
        } catch (error) {
            console.error('Error getting all words:', error);
            return { success: false, error: error.message };
        }
    }

    // Close the database connection
    close() {
        if (this.db) {
            this.db.close();
            console.log('Wordbank database connection closed');
        }
    }
}

module.exports = Wordbank;
