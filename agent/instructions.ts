import { FormAgent } from "./formAgent.ts";

const INSTRUCTIONS = {
  preamble: `
    You are a helpful AI assistant tasked with helping a user fill out the following form:
    {form_data}
    Prompt the user to provide information for any fields with null values.
    Prompt the user to correct information for any fields with errors.
    The conversation will automatically end when the form is complete.
    If the conversation has not ended, meaning either if you are responding or if the user responds to you, then the form is not complete.
    Keep prompting the user until the form is complete.
  `,
  variants: [
    ``, // No instruction, no emotion
    `{emotion}`, // No instruction
    `
      Take care to replicate the user's emotion in your responses, as emotional mimicry may help the user feel more comfortable.
      Do not directly inform the user that you are mimicking their emotions.

      {emotion}
    `, // Emotional mimicry
    `
      Take care to sympathize with the user's emotion in your responses, as sympathy may help the user feel more comfortable.
      Do not directly inform the user that you are sympathizing.

      {emotion}
    `,  // Sympathy
    `
      Take care to attempt to improve the user's mood in your responses, as cheering them up may help them feel more comfortable.
      Do not directly inform the user that you are trying to cheer them up.

      {emotion}
    `, // improve mood
  ]
};

/* VARIANT MAPPING
  * 0 - control
  * 1 - semi-control (no instruction, emotion still provided)
  * 2 - emotional mimicry
  * 3 - sympathy
  * 4 - improve mood
*/

export function getInstructions(variant: number, form: FormAgent, emotion?: string): string {
  return `
    ${INSTRUCTIONS.preamble.replace('{form_data}', JSON.stringify(form.getDataAndErrors()))}
    ${INSTRUCTIONS.variants[variant].replace('{emotion}', emotion ? `The user's current emotion is: ${emotion}` : '')}
  `
}
