// src/pages/learn.tsx

import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// Judge Card: Yes/No style
type JudgeCardProps = {
  question: string;
  onJudge: (result: boolean) => void;
};
export function JudgeCard({ question, onJudge }: JudgeCardProps) {
  return (
    <Card>
      <div style={{ marginBottom: 16 }}>{question}</div>
      <Button onClick={() => onJudge(true)} style={{ marginRight: 8 }}>
        Yes
      </Button>
      <Button onClick={() => onJudge(false)}>No</Button>
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
    <Card>
      <div style={{ marginBottom: 16 }}>{question}</div>
      {options.map((opt) => (
        <Button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{ display: "block", marginBottom: 8, width: "100%" }}
        >
          {opt}
        </Button>
      ))}
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
    <Card>
      <div style={{ marginBottom: 16 }}>{question}</div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer"
        style={{ marginBottom: 8 }}
      />
      <Button onClick={() => onSubmit(value)} disabled={!value}>
        Submit
      </Button>
    </Card>
  );
}

// QuizCard: Wrapper to render the correct card type
type QuizType = "judge" | "multiple" | "input";
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
