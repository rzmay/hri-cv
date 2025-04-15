import Sentiment from "npm:sentiment";

/**
 * Tracks the duration of the form, total time in each emotion,
 * and an aggregated sentiment score of user messages.
 */
class Stats {
  public static singleton: Stats;

  private startTime: number | null = null;
  private endTime: number | null = null;

  // For tracking emotion durations
  private lastEmotion: string | null = null;
  private lastEmotionChangeTime: number = 0;
  private emotionDurations: Record<string, number> = {};

  // For sentiment analysis
  private sentimentAnalyzer = new Sentiment();
  private totalSentimentScore = 0;
  private messageCount = 0;

  private messages: { message: string, sentiment: number }[] = [];

  constructor() { Stats.singleton = this; }

  /**
   * Call this once when the form starts
   */
  public startForm() {
    this.startTime = Date.now();
    // Initialize lastEmotionChangeTime so we can track from the start
    this.lastEmotionChangeTime = this.startTime;
  }

  /**
   * Call this once when the form is complete
   */
  public endForm() {
    this.endTime = Date.now();
    // Also finalize the last emotion block
    this.finalizeCurrentEmotion();
  }

  /**
   * Returns the total form completion time in milliseconds, or null if not finished
   */
  public getFormCompletionTime(): number | null {
    if (this.startTime !== null && this.endTime !== null) {
      return this.endTime - this.startTime;
    }
    return null;
  }

  /**
   * When the user's emotion changes, call this
   */
  public onEmotionChange(newEmotion: string) {
    const now = Date.now();
    // Finalize time spent in the previous emotion
    this.finalizeCurrentEmotion(now);

    // Update to the new emotion
    this.lastEmotion = newEmotion;
    this.lastEmotionChangeTime = now;
  }

  /**
   * When the user sends a message, call this to track sentiment
   */
  public onUserMessage(message: string) {
    const result = this.sentimentAnalyzer.analyze(message);
    this.messages.push({ message, sentiment: result.score });
    this.totalSentimentScore += result.score; // "score" is the overall numeric outcome
    this.messageCount += 1;
  }

  /**
   * Returns how many milliseconds total we've seen for each emotion
   */
  public getEmotionDurations(): Record<string, number> {
    return this.emotionDurations;
  }

  /**
   * Average sentiment = total score / # of messages
   * A positive score is more positive sentiment; negative is negative
   */
  public getAverageSentiment(): number {
    if (this.messageCount === 0) return 0;
    return this.totalSentimentScore / this.messageCount;
  }

  /**
   * Finalize the current emotion block up to "now" (or up to the end if specified)
   */
  private finalizeCurrentEmotion(now?: number) {
    if (!this.lastEmotion) return;
    const endTime = now ?? Date.now(); // If we didn't get a "now", use current time

    // Accumulate
    const duration = endTime - this.lastEmotionChangeTime;
    if (!this.emotionDurations[this.lastEmotion]) {
      this.emotionDurations[this.lastEmotion] = 0;
    }
    this.emotionDurations[this.lastEmotion] += duration;
  }

  public getStats() {
    return {
      duration: this.getFormCompletionTime(),
      sentiment: this.getAverageSentiment(),
      emotions: this.getEmotionDurations(),
      messages: this.messages,
    }
  }
}

new Stats();

export default Stats;
