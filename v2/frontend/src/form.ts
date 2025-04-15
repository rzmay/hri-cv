export interface FormStep {
  id: string;
  question: string;
}

export const FORM_STEPS: FormStep[] = [
  { id: "name", question: "What is your full name?" },
  { id: "age", question: "How old are you?" },
  { id: "favoriteFood", question: "What is your favorite food?" },
];
