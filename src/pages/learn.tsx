import React, { useEffect, useState, useRef } from "react";
import { autoGetNextWord, updateWordReview } from "../utils/wordbank";
import { QuizCard } from "../components/learn_cards";
import { createAIInstance, isAIConfigured } from "../utils/ai_instance";
import type { WordRecord } from "../utils/file";
import type AIConnect from "../utils/ai_connect";

function getAI(aiRef: React.RefObject<AIConnect | null>) {
  if (!aiRef.current) {
    aiRef.current = createAIInstance();
  }
  return aiRef.current;
}

type Step =
  | { type: "judge"; word: WordRecord }
  | { type: "input_sentence"; word: WordRecord; definition: string }
  | { type: "input_meaning"; word: WordRecord }
  | { type: "multiple"; word: WordRecord; choices: { choice: string; isCorrect: boolean }[] }
  | { type: "done" };

export default function LearnPage() {
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const ai = useRef<AIConnect | null>(null);

  useEffect(() => {
    async function prepare() {
      setLoading(true);
      const word = await autoGetNextWord();
      if (!word) {
        setStep({ type: "done" });
        setLoading(false);
        return;
      }
      if (word.shown_times === 0) {
        setStep({ type: "judge", word });
        setLoading(false);
      } else {
        // Randomly choose input or multiple choice
        const rand = Math.random();
        if (rand < 0.5) {
          setStep({ type: "input_meaning", word });
          setLoading(false);
        } else {
          setLoading(true);
          try {
            const aiInst = getAI(ai);
            if (!aiInst) {
              // AI not configured, fall back to input mode
              setStep({ type: "input_meaning", word });
            } else {
              const choices = await aiInst.generateWordChoices(word.word);
              setStep({ type: "multiple", word, choices });
            }
          } catch {
            setStep({ type: "input_meaning", word });
          }
          setLoading(false);
        }
      }
    }
    prepare();
  }, []);

  // Handler for judge card
  const handleJudge = async (result: boolean) => {
    if (step && step.type === "judge") {
      if (result) {
        await updateWordReview(step.word.word, true);
        window.location.reload();
      } else {
        const aiInst = getAI(ai);
        if (!aiInst) {
          alert('AI not configured. Please set up your API key in settings.');
          window.location.reload();
          return;
        }
        setLoading(true);
        aiInst.generateDefinition(step.word.word).then((definition) => {
          setStep({ type: "input_sentence", word: step.word, definition });
          setLoading(false);
        });
      }
    }
  };

  // Handler for input card (example sentence)
  const handleInputSentence = async (sentence: string) => {
    if (step && step.type === "input_sentence") {
      const aiInst = getAI(ai);
      if (!aiInst) {
        alert('AI not configured. Please set up your API key in settings.');
        window.location.reload();
        return;
      }
      setLoading(true);
      const ok = await aiInst.checkExample(step.word.word, sentence);
      await updateWordReview(step.word.word, ok);
      setLoading(false);
      window.location.reload();
    }
  };

  // Handler for input card (meaning)
  const handleInputMeaning = async (meaning: string) => {
    if (
      step &&
      (step.type === "input_meaning" || step.type === "input_sentence")
    ) {
      const correct =
        meaning.trim().toLowerCase() === step.word.definition.trim().toLowerCase();
      await updateWordReview(step.word.word, correct);
      window.location.reload();
    }
  };

  // Handler for multiple choice
  const handleMultiple = async (option: string) => {
    if (step && step.type === "multiple") {
      const correct = step.choices.find((c) => c.choice === option)?.isCorrect;
      await updateWordReview(step.word.word, !!correct);
      window.location.reload();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!step) {
    return <div>Loading...</div>;
  }

  if (step.type === "done") {
    return <div>No words to review. Please add more words or select a new wordbank.</div>;
  } else if (step.type === "judge") {
    return (
      <div className="h-screen flex items-center justify-center">
        <QuizCard
          type="judge"
          question={`Do you know the word "${step.word.word}"?`}
          onJudge={handleJudge}
        />
      </div>
    );
  } else if (step.type === "input_sentence") {
    return (
      <div className="h-screen flex items-center justify-center">
        <QuizCard
          type="input"
          question={`The meaning of "${step.word.word}" is: ${step.definition}. Please write an example sentence using this word.`}
          onSubmit={handleInputSentence}
        />
      </div>
    );
  } else if (step.type === "input_meaning") {
    return (
      <div className="h-screen flex items-center justify-center">
        <QuizCard
          type="input"
          question={`What is the meaning of "${step.word.word}"?`}
          onSubmit={handleInputMeaning}
        />
      </div>
    );
  } else if (step.type === "multiple") {
    return (
      <div className="h-screen flex items-center justify-center">
        <QuizCard
          type="multiple"
          question={`What is the meaning of "${step.word.word}"?`}
          options={step.choices.map((c: { choice: string; isCorrect: boolean }) => c.choice)}
          onSelect={handleMultiple}
        />
      </div>
    );
  }

  return null;
}
