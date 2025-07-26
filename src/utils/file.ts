// src/utils/load_file.ts

import localforage from "localforage";

// WordRecord interface (should match src/utils/wordbank.ts)
export interface WordRecord {
  id: number;
  word: string;
  definition: string;
  last_shown_timestamp: number;
  last_correct_timestamp: number;
  shown_times: number;
  difficulty: number;
  example: string;
}

const WORDBANK_KEY = "wordbank";

/**
 * Loads a wordbank JSON file and stores it in localforage.
 * Only one wordbank is stored at a time (overwrites previous).
 */
export async function loadWordbankFromFile(file: File): Promise<void> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid JSON file.");
  }

  if (!Array.isArray(data)) {
    throw new Error("Wordbank JSON must be an array.");
  }

  // Validate each entry
  for (const entry of data) {
    if (
      typeof entry.id !== "number" ||
      typeof entry.word !== "string" ||
      typeof entry.definition !== "string" ||
      typeof entry.last_shown_timestamp !== "number" ||
      typeof entry.last_correct_timestamp !== "number" ||
      typeof entry.shown_times !== "number" ||
      typeof entry.difficulty !== "number" ||
      typeof entry.example !== "string"
    ) {
      throw new Error("Invalid wordbank entry format.");
    }
  }

  await localforage.setItem(WORDBANK_KEY, data);
}

/**
 * Retrieves the wordbank from localforage.
 */
export async function getStoredWordbank(): Promise<WordRecord[] | null> {
  const data = await localforage.getItem(WORDBANK_KEY);
  if (!data) return null;
  return data as WordRecord[];
}

/**
 * Checks if a wordbank exists in localforage.
 */
export async function hasStoredWordbank(): Promise<boolean> {
  const data = await localforage.getItem(WORDBANK_KEY);
  return Array.isArray(data) && data.length > 0;
}

/**
 * Saves the stored wordbank as a downloadable JSON file.
 */
export async function saveWordbankToFile(): Promise<void> {
  const wordbank = await getStoredWordbank();
  if (!wordbank) throw new Error("No wordbank found in storage.");

  const blob = new Blob([JSON.stringify(wordbank, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  // Create a temporary link and trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = "wordbank.json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
