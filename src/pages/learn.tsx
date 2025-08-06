import { useEffect, useState, useRef } from "react";
import { autoGetNextWord, updateWordReview } from "../utils/wordbank";
import { QuizCard } from "../components/learn_cards";
import { Spinner } from "../components/ui/spinner";
import { createAIInstance } from "../utils/ai_instance";
import type { WordRecord } from "../utils/file";
import type AIConnect from "../utils/ai_connect";

// Quiz step types for different learning modes
type QuizStep =
  | { type: "judge"; word: WordRecord }
  | { type: "input_sentence"; word: WordRecord; definition: string }
  | { type: "input_meaning"; word: WordRecord }
  | { type: "multiple"; word: WordRecord; choices: { choice: string; isCorrect: boolean }[] }
  | { type: "done" };

// Constants
const MULTIPLE_CHOICE_PROBABILITY = 0.5;

export default function LearnPage() {
  const [currentStep, setCurrentStep] = useState<QuizStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const aiInstance = useRef<AIConnect | null>(null);

  // Initialize or get AI instance
  const getAIInstance = (): AIConnect | null => {
    if (!aiInstance.current) {
      aiInstance.current = createAIInstance();
    }
    return aiInstance.current;
  };

  // Navigate to next word (reload page)
  const moveToNextWord = () => {
    window.location.reload();
  };

  // Show error and reload
  const handleError = (message: string) => {
    alert(message);
    moveToNextWord();
  };

  // Generate quiz step for a new word (first time seeing it)
  const createJudgeStep = (word: WordRecord): QuizStep => ({
    type: "judge",
    word
  });

  // Generate quiz step for a known word
  const createKnownWordStep = async (word: WordRecord): Promise<QuizStep> => {
    const shouldUseMultipleChoice = Math.random() < MULTIPLE_CHOICE_PROBABILITY;
    
    if (!shouldUseMultipleChoice) {
      return { type: "input_meaning", word };
    }

    // Try to create multiple choice with AI
    const ai = getAIInstance();
    if (!ai) {
      return { type: "input_meaning", word };
    }

    try {
      let choices;
      if (word.definition?.trim()) {
        choices = await ai.generateWordChoicesWithDefinition(word.word, word.definition);
      } else {
        choices = await ai.generateWordChoices(word.word);
      }
      return { type: "multiple", word, choices };
    } catch (error) {
      console.error("Failed to generate multiple choice:", error);
      return { type: "input_meaning", word };
    }
  };

  // Generate definition for a word
  const generateDefinition = async (word: string): Promise<string> => {
    const ai = getAIInstance();
    if (!ai) {
      throw new Error("AI not configured");
    }
    return await ai.generateDefinition(word);
  };

  // Initialize the learning session
  const initializeLearningSession = async () => {
    setIsLoading(true);
    
    try {
      const word = await autoGetNextWord();
      
      if (!word) {
        setCurrentStep({ type: "done" });
        return;
      }

      if (word.shown_times === 0) {
        setCurrentStep(createJudgeStep(word));
      } else {
        const step = await createKnownWordStep(word);
        setCurrentStep(step);
      }
    } catch (error) {
      console.error("Failed to initialize learning session:", error);
      handleError("Failed to load word. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeLearningSession();
  }, []);

  // Event handlers for different quiz types
  
  // Handle judge card response (Yes/No for word recognition)
  const handleJudgeResponse = async (knowsWord: boolean) => {
    if (!currentStep || currentStep.type !== "judge") return;

    if (knowsWord) {
      await updateWordReview(currentStep.word.word, true);
      moveToNextWord();
    } else {
      setIsLoading(true);
      
      try {
        // Get definition from wordbank or generate with AI
        let definition = currentStep.word.definition;
        
        if (!definition?.trim()) {
          const generatedDefinition = await generateDefinition(currentStep.word.word);
          definition = generatedDefinition;
        }
        
        setCurrentStep({ 
          type: "input_sentence", 
          word: currentStep.word, 
          definition 
        });
      } catch (error) {
        console.error("Failed to get definition:", error);
        handleError("Failed to generate definition. Please check your AI configuration.");
        return;
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle sentence input submission
  const handleSentenceInput = async (sentence: string) => {
    if (!currentStep || currentStep.type !== "input_sentence") return;

    const ai = getAIInstance();
    if (!ai) {
      handleError("AI not configured. Please set up your API key in settings.");
      return;
    }

    setIsLoading(true);
    
    try {
      const isCorrect = await ai.checkExample(currentStep.word.word, sentence);
      await updateWordReview(currentStep.word.word, isCorrect);
      moveToNextWord();
    } catch (error) {
      console.error("Failed to check sentence:", error);
      handleError("Failed to check sentence. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle meaning input submission
  const handleMeaningInput = async (userMeaning: string) => {
    if (!currentStep || 
        (currentStep.type !== "input_meaning" && currentStep.type !== "input_sentence")) {
      return;
    }

    const correctDefinition = currentStep.word.definition?.trim().toLowerCase() || "";
    const userDefinition = userMeaning.trim().toLowerCase();
    const isCorrect = userDefinition === correctDefinition;
    
    await updateWordReview(currentStep.word.word, isCorrect);
    moveToNextWord();
  };

  // Handle multiple choice selection
  const handleMultipleChoice = async (selectedOption: string) => {
    if (!currentStep || currentStep.type !== "multiple") return;

    const selectedChoice = currentStep.choices.find(choice => choice.choice === selectedOption);
    const isCorrect = selectedChoice?.isCorrect || false;
    
    await updateWordReview(currentStep.word.word, isCorrect);
    moveToNextWord();
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <Spinner size="xl" className="text-primary" />
      <p className="text-sm text-muted-foreground">Preparing your next word...</p>
    </div>
  );

  // Render completion state
  const renderCompletionState = () => (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-semibold">All caught up!</h2>
      <p className="text-muted-foreground">
        No words to review. Please add more words or select a new wordbank.
      </p>
    </div>
  );

  // Render quiz card based on current step
  const renderQuizCard = () => {
    if (!currentStep) return null;

    const cardProps = {
      className: "h-screen flex items-center justify-center"
    };

    switch (currentStep.type) {
      case "judge":
        return (
          <div {...cardProps}>
            <QuizCard
              type="judge"
              question={`Do you know the word "${currentStep.word.word}"?`}
              onJudge={handleJudgeResponse}
            />
          </div>
        );

      case "input_sentence":
        return (
          <div {...cardProps}>
            <QuizCard
              type="input"
              question={`The meaning of "${currentStep.word.word}" is:\n"${currentStep.definition}"\n\nWrite an example sentence using this word.`}
              onSubmit={handleSentenceInput}
            />
          </div>
        );

      case "input_meaning":
        return (
          <div {...cardProps}>
            <QuizCard
              type="input"
              question={`What is the meaning of "${currentStep.word.word}"?`}
              onSubmit={handleMeaningInput}
            />
          </div>
        );

      case "multiple":
        return (
          <div {...cardProps}>
            <QuizCard
              type="multiple"
              question={`What is the meaning of "${currentStep.word.word}"?`}
              options={currentStep.choices.map(choice => choice.choice)}
              onSelect={handleMultipleChoice}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Main render logic
  if (isLoading) {
    return renderLoadingState();
  }

  if (!currentStep) {
    return renderLoadingState();
  }

  if (currentStep.type === "done") {
    return renderCompletionState();
  }

  return renderQuizCard();
}
