export const BUSINESS_QUESTIONNAIRE_ANSWER_MAX_LENGTH = 150;

export interface BusinessQuestionnaireAnswersDto {
  productOrService: string;
  idealCustomer: string;
  problemSolved: string;
  desiredResult: string;
  concernBeforeChoosing: string;
  whyTrust: string;
  oneMessageToRemember: string;
  nextAction: string;
  visualHappyOutcome: string;
  adTone: string;
}

export const BUSINESS_QUESTIONNAIRE_FIELD_META: ReadonlyArray<{
  key: keyof BusinessQuestionnaireAnswersDto;
  label: string;
}> = [
  { key: "productOrService", label: "What product or service do you offer?" },
  { key: "idealCustomer", label: "Who is your ideal customer?" },
  { key: "problemSolved", label: "What problem do you help them solve?" },
  { key: "desiredResult", label: "What result do they want after working with you?" },
  {
    key: "concernBeforeChoosing",
    label:
      "What concern or frustration do they usually have before choosing a business like yours?",
  },
  { key: "whyTrust", label: "Why should customers trust you?" },
  { key: "oneMessageToRemember", label: "What is the one message you want people to remember?" },
  { key: "nextAction", label: "What action should they take next?" },
  { key: "visualHappyOutcome", label: "What visual best represents the happy outcome?" },
  { key: "adTone", label: "What tone should the ad have?" },
];
