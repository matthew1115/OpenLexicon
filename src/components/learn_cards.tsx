// src/pages/learn.tsx

import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Judge Card: Yes/No style
type JudgeCardProps = {
  question: string;
  onJudge: (result: boolean) => void;
};
export function JudgeCard({ question, onJudge }: JudgeCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto px-6">
      <div className="mb-6 text-lg font-medium text-center">{question}</div>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => onJudge(true)} className="flex-1 max-w-[45%]">
          Yes
        </Button>
        <Button onClick={() => onJudge(false)} className="flex-1 max-w-[45%]">
          No
        </Button>
      </div>
    </Card>
  );
}

// Multiple Choice Card
type MultipleChoiceCardProps = {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
};
export function MultipleChoiceCard({
  question,
  options,
  onSelect,
}: MultipleChoiceCardProps) {
  return (
    <Card className="w-full max-w-lg mx-auto px-6">
      <div className="mb-6 text-lg font-medium text-center">{question}</div>
      <div className="space-y-3">
        {options.map((opt) => (
          <Button
            key={opt}
            onClick={() => onSelect(opt)}
            variant="outline"
            className="w-full px-6 py-4 h-auto text-left justify-start"
          >
            {opt}
          </Button>
        ))}
      </div>
    </Card>
  );
}

// Input Card: Free text input
type InputCardProps = {
  question: string;
  onSubmit: (answer: string) => void;
};
export function InputCard({ question, onSubmit }: InputCardProps) {
  const [value, setValue] = React.useState("");
  return (
    <Card className="w-full max-w-md mx-auto px-6">
      <div className="mb-6 text-lg font-medium text-center">{question}</div>
      <div className="space-y-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your answer"
          className="px-4 py-3"
        />
        <Button 
          onClick={() => onSubmit(value)} 
          disabled={!value}
          className="w-full px-6"
        >
          Submit
        </Button>
      </div>
    </Card>
  );
}

// QuizCard: Wrapper to render the correct card type
type QuizCardProps =
  | ({ type: "judge"; question: string; onJudge: (result: boolean) => void })
  | ({
      type: "multiple";
      question: string;
      options: string[];
      onSelect: (option: string) => void;
    })
  | ({ type: "input"; question: string; onSubmit: (answer: string) => void });

export function QuizCard(props: QuizCardProps) {
  switch (props.type) {
    case "judge":
      return (
        <JudgeCard question={props.question} onJudge={props.onJudge} />
      );
    case "multiple":
      return (
        <MultipleChoiceCard
          question={props.question}
          options={props.options}
          onSelect={props.onSelect}
        />
      );
    case "input":
      return (
        <InputCard question={props.question} onSubmit={props.onSubmit} />
      );
    default:
      return null;
  }
}
