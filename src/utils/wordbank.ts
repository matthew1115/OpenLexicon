import type { WordRecord } from "./file";

/**
 * Key used in localStorage for storing the word bank.
 * @private
 */
const WORD_BANK_KEY = "wordbank";

/**
 * Retrieves all words from localStorage.
 * @returns {WordRecord[]} Array of WordRecord objects.
 */
export function getWords(): WordRecord[] {
  const data = localStorage.getItem(WORD_BANK_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Adds a word to the word bank in localStorage.
 * @param {WordRecord} word - The word record to add.
 */
export function addWord(word: WordRecord): void {
  const words = getWords();
  words.push(word);
  localStorage.setItem(WORD_BANK_KEY, JSON.stringify(words));
}

/**
 * Removes a word from the word bank by its word string.
 * @param {string} wordStr - The word string to remove.
 */
export function removeWord(wordStr: string): void {
  const words = getWords().filter(w => (w as any).word !== wordStr);
  localStorage.setItem(WORD_BANK_KEY, JSON.stringify(words));
}

/**
 * Replaces all words in the word bank with the provided array.
 * @param {WordRecord[]} words - Array of WordRecord objects to set.
 */
export function setWords(words: WordRecord[]): void {
  localStorage.setItem(WORD_BANK_KEY, JSON.stringify(words));
}

/**
 * Calculates the next review interval for a word based on SRS algorithm.
 * @param {number} difficulty - The difficulty level of the word (1-5, where 5 is hardest)
 * @param {number} shownTimes - Number of times the word has been shown
 * @param {boolean} wasCorrect - Whether the last answer was correct
 * @returns {number} Interval in milliseconds until next review
 */
function calculateNextInterval(difficulty: number, shownTimes: number, wasCorrect: boolean): number {
  const baseInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (!wasCorrect) {
    // If incorrect, review again soon (within 1-4 hours based on difficulty)
    return baseInterval * (difficulty * 0.1 + 0.1);
  }
  
  // Progressive intervals for correct answers
  const intervals = [
    1,    // First review: 1 day
    3,    // Second review: 3 days
    7,    // Third review: 1 week
    14,   // Fourth review: 2 weeks
    30,   // Fifth review: 1 month
    90,   // Sixth review: 3 months
    180   // Seventh+ review: 6 months
  ];
  
  const intervalIndex = Math.min(shownTimes, intervals.length - 1);
  const baseMultiplier = intervals[intervalIndex];
  
  // Adjust based on difficulty (harder words reviewed more frequently)
  const difficultyMultiplier = Math.max(0.5, 2 - (difficulty * 0.3));
  
  return baseInterval * baseMultiplier * difficultyMultiplier;
}

/**
 * Calculates a priority score for a word based on SRS algorithm.
 * Higher scores indicate words that should be reviewed sooner.
 * @param {WordRecord} word - The word record to calculate priority for
 * @returns {number} Priority score (higher = more urgent)
 */
function calculateWordPriority(word: WordRecord): number {
  const now = Date.now();
  const timeSinceLastShown = now - word.last_shown_timestamp;
  const timeSinceLastCorrect = now - word.last_correct_timestamp;
  
  // Determine if last answer was likely correct
  const wasLastCorrect = word.last_correct_timestamp >= word.last_shown_timestamp;
  
  // Calculate expected interval for this word
  const expectedInterval = calculateNextInterval(word.difficulty, word.shown_times, wasLastCorrect);
  
  // Calculate how overdue this word is
  const overdueRatio = timeSinceLastShown / expectedInterval;
  
  // Base priority starts with how overdue the word is
  let priority = overdueRatio;
  
  // Boost priority for new words (never shown or shown very few times)
  if (word.shown_times === 0) {
    priority += 100; // New words get highest priority
  } else if (word.shown_times < 3) {
    priority += 10; // Recently added words get high priority
  }
  
  // Boost priority for difficult words
  priority += word.difficulty * 0.5;
  
  // Boost priority for words that were answered incorrectly recently
  if (!wasLastCorrect && timeSinceLastCorrect > timeSinceLastShown) {
    priority += 5;
  }
  
  // Slight boost for words not seen in a very long time
  const daysSinceLastShown = timeSinceLastShown / (24 * 60 * 60 * 1000);
  if (daysSinceLastShown > 180) { // More than 6 months
    priority += 2;
  }
  
  return priority;
}

/**
 * Automatically selects the next word to review using SRS algorithm.
 * Prioritizes words based on review schedule, difficulty, and past performance.
 * @returns {WordRecord | null} The next word to review, or null if no words available
 */
export function autoGetNextWord(): WordRecord | null {
  const words = getWords();
  
  if (words.length === 0) {
    return null;
  }
  
  // Calculate priority for each word
  const wordsWithPriority = words.map(word => ({
    word,
    priority: calculateWordPriority(word)
  }));
  
  // Sort by priority (highest first)
  wordsWithPriority.sort((a, b) => b.priority - a.priority);
  
  // Return the highest priority word
  return wordsWithPriority[0].word;
}

/**
 * Updates a word's review data after it has been shown to the user.
 * @param {string} wordStr - The word string to update
 * @param {boolean} wasCorrect - Whether the user answered correctly
 */
export function updateWordReview(wordStr: string, wasCorrect: boolean): void {
  const words = getWords();
  const wordIndex = words.findIndex(w => w.word === wordStr);
  
  if (wordIndex === -1) {
    return; // Word not found
  }
  
  const now = Date.now();
  const word = words[wordIndex];
  
  // Update timestamps and shown count
  word.last_shown_timestamp = now;
  word.shown_times += 1;
  
  if (wasCorrect) {
    word.last_correct_timestamp = now;
    // Optionally decrease difficulty for words consistently answered correctly
    if (word.shown_times > 3 && word.difficulty > 1) {
      // Check if the word has been answered correctly in recent attempts
      const recentCorrectRate = word.last_correct_timestamp === now ? 1 : 0;
      if (recentCorrectRate > 0.8) {
        word.difficulty = Math.max(1, word.difficulty - 0.1);
      }
    }
  } else {
    // Increase difficulty for incorrectly answered words
    word.difficulty = Math.min(5, word.difficulty + 0.2);
  }
  
  // Save updated words back to localStorage
  setWords(words);
}
