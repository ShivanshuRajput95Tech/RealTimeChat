import logger from '../lib/logger.js';
import { ValidationError } from '../lib/errors.js';

const POSITIVE_WORDS = ['great', 'good', 'awesome', 'thanks', 'thank you', 'perfect', 'love', 'happy', 'excellent', 'nice'];
const NEGATIVE_WORDS = ['issue', 'problem', 'blocked', 'delay', 'bad', 'angry', 'upset', 'wrong', 'bug', 'stuck'];
const FLAGGED_WORDS = ['hate', 'stupid', 'idiot', 'kill', 'damn'];
const QUESTION_WORDS = ['what', 'when', 'where', 'why', 'how', 'could', 'can', 'would', 'will'];

class AIService {
  static async summarizeMessage(text) {
    this.#requireText(text, 'Text is required for summarization');
    logger.debug('Summarizing message', { textLength: text.length });

    const cleaned = this.#normalizeText(text);
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
    const summary = sentences.slice(0, 2).join(' ').slice(0, 220) || cleaned.slice(0, 220);
    const keyPoints = cleaned
      .split(/\n|(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 20)
      .slice(0, 3);

    logger.info('Message summarized successfully', { originalLength: text.length, summaryLength: summary.length });
    return {
      success: true,
      summary: summary.endsWith('.') ? summary : `${summary}.`,
      keyPoints,
    };
  }

  static async analyzeSentiment(text) {
    this.#requireText(text, 'Text is required for sentiment analysis');
    logger.debug('Analyzing sentiment', { textLength: text.length });

    const normalized = this.#normalizeText(text).toLowerCase();
    let score = 0;

    POSITIVE_WORDS.forEach((word) => {
      if (normalized.includes(word)) score += 1;
    });
    NEGATIVE_WORDS.forEach((word) => {
      if (normalized.includes(word)) score -= 1;
    });

    if (normalized.includes('!')) score += 0.25;
    if (normalized.includes('?')) score += 0.1;

    const label = score > 0.5 ? 'positive' : score < -0.5 ? 'negative' : 'neutral';
    const confidence = Math.min(0.98, 0.55 + Math.abs(score) * 0.12);

    logger.info('Sentiment analyzed successfully', { label, confidence });
    return {
      success: true,
      sentiment: {
        label,
        score: Number(confidence.toFixed(2)),
      },
    };
  }

  static async suggestReplies(messageText, conversationContext = []) {
    this.#requireText(messageText, 'Message text is required for suggestions');
    logger.debug('Generating reply suggestions', { messageLength: messageText.length, contextLength: conversationContext.length });

    const normalized = this.#normalizeText(messageText).toLowerCase();
    const contextSummary = Array.isArray(conversationContext) ? conversationContext.slice(-3) : [];

    let suggestions;

    if (QUESTION_WORDS.some((word) => normalized.startsWith(word) || normalized.includes(`${word} `))) {
      suggestions = [
        'Yes — I’m looking into it now and will share an update shortly.',
        'Here’s the latest from my side. Do you want the short version or the full context?',
        'I can help with that. What outcome do you need most?',
      ];
    } else if (normalized.includes('thank')) {
      suggestions = [
        'Happy to help — let me know if you want me to keep this moving.',
        'Of course. I can also summarize the next steps if that helps.',
        'Anytime. If you want, I can handle the follow-up from here.',
      ];
    } else if (normalized.includes('schedule') || normalized.includes('meeting') || normalized.includes('tomorrow')) {
      suggestions = [
        'That works for me. I can confirm a time and send a quick agenda.',
        'Sounds good — I’m available and can block time for it.',
        'Let’s do it. Share the preferred slot and I’ll align on my side.',
      ];
    } else if (NEGATIVE_WORDS.some((word) => normalized.includes(word))) {
      suggestions = [
        'Thanks for flagging it. I’m checking the issue now and will update you with the fix.',
        'Understood — I’ll prioritize this and share the next action in a moment.',
        'I see the blocker. Let’s isolate the cause and move on the fastest workaround.',
      ];
    } else {
      suggestions = [
        'Sounds good — I’m aligned and ready for the next step.',
        'Got it. I can summarize the plan and keep momentum from here.',
        'That makes sense. Do you want me to turn this into an action list?',
      ];
    }

    if (contextSummary.length > 0) {
      suggestions[0] = `${suggestions[0]} (${contextSummary.length} recent updates reviewed.)`;
    }

    logger.info('Reply suggestions generated successfully', { suggestionCount: suggestions.length });
    return { success: true, suggestions };
  }

  static async translateMessage(text, targetLanguage) {
    this.#requireText(text, 'Text is required for translation');
    if (!targetLanguage || targetLanguage.trim().length === 0) {
      throw new ValidationError('Target language is required');
    }

    logger.debug('Translating message', { textLength: text.length, targetLanguage });

    return {
      success: true,
      translated: `[${targetLanguage}] ${this.#normalizeText(text)}`,
      targetLanguage,
      note: 'Demo translation placeholder — connect a provider for production-grade translation.',
    };
  }

  static async detectLanguage(text) {
    this.#requireText(text, 'Text is required for language detection');
    logger.debug('Detecting language', { textLength: text.length });

    const normalized = this.#normalizeText(text);
    const language = /[¿¡ñáéíóú]/i.test(normalized)
      ? { code: 'es', confidence: 0.71 }
      : /[àâçéèêëîïôûùüÿœ]/i.test(normalized)
        ? { code: 'fr', confidence: 0.68 }
        : { code: 'en', confidence: 0.92 };

    logger.info('Language detected successfully', language);
    return { success: true, language };
  }

  static async filterContent(text) {
    this.#requireText(text, 'Text is required for content filtering');
    logger.debug('Filtering content', { textLength: text.length });

    const normalized = this.#normalizeText(text).toLowerCase();
    const matches = FLAGGED_WORDS.filter((word) => normalized.includes(word));
    const riskLevel = matches.length >= 2 ? 'high' : matches.length === 1 ? 'medium' : 'low';

    logger.info('Content filtered successfully', { isClean: matches.length === 0, riskLevel });
    return {
      success: true,
      isClean: matches.length === 0,
      riskLevel,
      flaggedTerms: matches,
    };
  }

  static #requireText(text, errorMessage) {
    if (!text || text.trim().length === 0) {
      throw new ValidationError(errorMessage);
    }
  }

  static #normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }
}

export default AIService;
