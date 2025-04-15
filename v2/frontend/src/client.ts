import { client } from "./openai";
import { FORM_STEPS, FormStep } from "./form";

// A single conversation “item”
export interface ConversationItem {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Our ChatAgent. Tracks the entire conversation, including system, user, and assistant.
 * Fires a callback whenever there's a new message or partial token.
 */
export class ChatAgent {
  private conversation: ConversationItem[] = [];
  private showSystemMessages = false; // from query param
  private onMessageCallback?: (items: ConversationItem[]) => void;
  private onUserMessageCallback?: (message: string) => void;
  private onCompleteCallback?: () => void;

  private partialContent: string = ""; // for streaming tokens

  // We'll read from our shared form.ts
  private formSteps: FormStep[] = FORM_STEPS;
  private currentStepIndex = 0;

  constructor(includeSystemMessages: boolean) {
    this.showSystemMessages = includeSystemMessages;

    // Listen for streaming partial tokens
    client?.on("response.text.delta", (event: any) => {
      const token = event.delta;
      if (token) {
        this.partialContent += token;
        this.fireUpdate();
      }
    });

    // If you have an event for “response.text.done” or “response.complete”
    client?.on("response.text.done", () => {
      // Move partial content to conversation
      if (this.partialContent) {
        this.conversation.push({
          role: "assistant",
          content: this.partialContent,
        });
        this.partialContent = "";
        this.fireUpdate();
      }
    });
  }

  /**
   * Provide a callback that is invoked whenever the conversation changes
   * (i.e. new user message, partial token, or final assistant message).
   */
  public setOnUserMessageCallback(fn: (message: string) => void) {
    this.onUserMessageCallback = fn;
  }

  /**
   * Provide a callback that is invoked whenever the conversation changes
   * (i.e. new user message, partial token, or final assistant message).
   */
  public setOnMessageCallback(fn: (items: ConversationItem[]) => void) {
    this.onMessageCallback = fn;
  }

  /**
   * Provide a callback that is invoked when the final form step is handled
   */
  public setOnCompleteCallback(fn: () => void) {
    this.onCompleteCallback = fn;
  }

  /**
   * Called when the user sends a message (the answer to the current step).
   * We'll send it, then give the bot a system instruction containing the NEXT step.
   */
  public sendUserMessage(answer: string) {
    // 1) Push user answer
    this.conversation.push({ role: "user", content: answer });
    if (this.onUserMessageCallback) this.onUserMessageCallback(answer);
    this.fireUpdate();

    // 2) Send user answer to the server
    client?.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: answer }],
      },
    });

    // 3) Now get the next step from the form, if any
    const nextStep = this.getNextFormStep();
    if (nextStep) {
      // Instead of reciting the question verbatim as an assistant message,
      // we embed it in a system instruction telling the bot what to ask the user.
      const systemMsg = `The next form step is: "${nextStep.question}".
Ask the user this question in your own words.
Consider they have just answered the previous question: "${answer}".`;

      // Push that system instruction locally
      this.conversation.push({ role: "system", content: systemMsg });
      this.fireUpdate();

      // Send system instruction to the chatbot
      client?.send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text: systemMsg }],
        },
      });

      // 4) Now request a response that incorporates both the user’s message + this new system instruction
      this.requestResponse();
    } else {
      // No more steps remain: call onComplete
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }

  /**
   * Actually request a new assistant response from the AI
   */
  private requestResponse() {
    // Clear partial content
    this.partialContent = "";
    client?.send({
      type: "response.create",
    });
  }

  /**
   * Called when we want to inject the user’s current emotion as a system message
   */
  public sendEmotionSystemMessage(emotion: string) {
    const systemMessage = `The user is now feeling ${emotion}.`;
    this.conversation.push({ role: "system", content: systemMessage });
    this.fireUpdate();

    client?.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "system",
        content: [{ type: "input_text", text: systemMessage }],
      },
    });
  }

  /**
   * Return the conversation items, optionally filtering out system messages if desired
   */
  public getConversation(): ConversationItem[] {
    if (this.showSystemMessages) {
      return this.conversationWithPartial();
    }
    // Filter out system messages
    const filtered = this.conversation.filter((item) => item.role !== "system");
    return this.conversationWithPartial(filtered);
  }

  /**
   * Helper: if partialContent is present, treat it as an in-progress assistant message
   */
  private conversationWithPartial(base?: ConversationItem[]): ConversationItem[] {
    const copy = base ? [...base] : [...this.conversation];
    if (this.partialContent) {
      copy.push({ role: "assistant", content: this.partialContent });
    }
    return copy;
  }

  /**
   * Retrieve the next form step, or null if none remain.
   */
  private getNextFormStep(): FormStep | null {
    if (this.currentStepIndex < this.formSteps.length) {
      const step = this.formSteps[this.currentStepIndex];
      this.currentStepIndex += 1;
      return step;
    }
    return null;
  }

  /**
   * Helper to invoke our callback with the latest conversation
   */
  private fireUpdate() {
    if (this.onMessageCallback) {
      this.onMessageCallback(this.getConversation());
    }
  }
}
