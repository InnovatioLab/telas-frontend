import { BusinessQuestionnaireAnswersDto } from "./business-questionnaire-answers.dto";

export interface ClientAdRequestDto {
  attachmentIds?: string[];
  businessAnswers: BusinessQuestionnaireAnswersDto;
}
