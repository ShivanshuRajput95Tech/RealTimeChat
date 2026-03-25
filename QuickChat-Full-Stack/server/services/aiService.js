import logger from "../lib/logger.js";

const AI_API_KEY = process.env.OPENAI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const QUICKBOT_ID = "000000000000000000000001";

const isOllama = AI_BASE_URL?.includes('localhost:11434') || AI_BASE_URL?.includes('ollama');
const DEFAULT_MODEL = isOllama ? "llama3.2" : "llama-3.3-70b-versatile";
const DEFAULT_EMBEDDING_MODEL = isOllama ? "nomic-embed-text" : "text-embedding-3-small";

// Fallback responses when AI is unavailable
const FALLBACK_RESPONSES = {
    suggestions: ["Got it!", "Sounds good!", "Thanks!", "I agree!", "Let me think about it."],
    summary: "I couldn't generate a summary right now. Please try again later.",
    translation: null,
    draft: "I couldn't draft a message right now. Please try again later.",
    toxicity: { toxic: false, confidence: 0, category: "none" },
    sentiment: { score: 0, label: "neutral", confidence: 0 },
    autocomplete: [],
};

class AIService {
    constructor() {
        this.usageTracker = new Map();
        this.lastError = null;
        this.errorCount = 0;
    }

    isAvailable() {
        if (!AI_API_KEY || AI_API_KEY.length === 0) return false;
        if (AI_API_KEY === 'ollama') return true;
        return true;
    }

    getHeaders() {
        const headers = { "Content-Type": "application/json" };
        if (!isOllama && AI_API_KEY && AI_API_KEY !== 'ollama') {
            headers["Authorization"] = `Bearer ${AI_API_KEY}`;
        }
        return headers;
    }

    async callLLM(systemPrompt, userMessage, options = {}) {
        if (!this.isAvailable()) {
            return null;
        }
        
        try {
            const { model = DEFAULT_MODEL, maxTokens = 500, temperature = 0.7 } = options;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage },
                    ],
                    max_tokens: maxTokens,
                    temperature,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                this.errorCount++;
                this.lastError = data.error?.message || "AI API error";
                logger.error("AI API error:", this.lastError);
                throw new Error(this.lastError);
            }

            this.errorCount = 0;
            return data.choices[0].message.content;
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.error("AI callLLM timeout");
            } else {
                logger.error("AI callLLM error:", error.message);
            }
            return null;
        }
    }

    async callLLMStream(systemPrompt, userMessage, options = {}) {
        if (!this.isAvailable()) return null;
        
        try {
            const { model = DEFAULT_MODEL, maxTokens = 500, temperature = 0.7 } = options;

            const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage },
                    ],
                    max_tokens: maxTokens,
                    temperature,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || "AI streaming error");
            }

            return response.body;
        } catch (error) {
            logger.error("AI callLLMStream error:", error.message);
            return null;
        }
    }

    async callLLMWithMessages(messages, options = {}) {
        if (!this.isAvailable()) return null;
        
        try {
            const { model = DEFAULT_MODEL, maxTokens = 500, temperature = 0.7 } = options;

            const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model,
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "AI API error");
            return data.choices[0].message.content;
        } catch (error) {
            logger.error("AI callLLMWithMessages error:", error.message);
            return null;
        }
    }

    async generateEmbedding(text) {
        if (!this.isAvailable()) return null;
        
        try {
            const response = await fetch(`${AI_BASE_URL}/embeddings`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model: DEFAULT_EMBEDDING_MODEL,
                    input: text,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || "Embedding API error");
            }

            return data.data?.[0]?.embedding || data.embedding || null;
        } catch (error) {
            logger.error("AI generateEmbedding error:", error.message);
            return null;
        }
    }

    async trackUsage(userId) {
        const key = `ai:${userId}:${new Date().toISOString().slice(0, 10)}`;
        const count = this.usageTracker.get(key) || 0;
        const limit = parseInt(process.env.AI_DAILY_LIMIT || "50");
        if (count >= limit) return false;
        this.usageTracker.set(key, count + 1);
        return true;
    }

    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async ragSearch(query, messagesWithEmbeddings, topK = 5) {
        const queryEmbedding = await this.generateEmbedding(query);
        if (!queryEmbedding) return [];

        const scored = messagesWithEmbeddings
            .filter(m => m.embedding && m.embedding.length > 0)
            .map(m => ({
                ...m,
                similarity: this.cosineSimilarity(queryEmbedding, m.embedding),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);

        return scored.filter(m => m.similarity > 0.3);
    }

    async answerFromContext(query, relevantMessages) {
        const context = relevantMessages
            .map((m, i) => `[${i + 1}] ${m.senderName || "User"}: ${m.text}`)
            .join("\n");

        const systemPrompt = `You are an AI assistant that answers questions based on chat history. Use ONLY the provided context to answer. If the context doesn't contain enough information, say so honestly. Be concise and cite which messages you used (e.g., "According to [1]...").`;

        const userMessage = `Context:\n${context}\n\nQuestion: ${query}`;

        return await this.callLLM(systemPrompt, userMessage, { maxTokens: 400, temperature: 0.3 });
    }

    async generateReplySuggestions(conversationContext, lastMessage) {
        try {
            const systemPrompt = `You are an AI assistant in a chat app. Generate 3 short, natural reply suggestions based on the conversation context. Return ONLY a JSON array of strings, nothing else. Each suggestion should be 5-15 words, natural and conversational.`;

            const userMessage = `Last message: "${lastMessage}"\nContext:\n${conversationContext}`;

            const response = await this.callLLM(systemPrompt, userMessage, { maxTokens: 150, temperature: 0.8 });
            if (!response) return FALLBACK_RESPONSES.suggestions.slice(0, 3);

            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : FALLBACK_RESPONSES.suggestions.slice(0, 3);
        } catch {
            return FALLBACK_RESPONSES.suggestions.slice(0, 3);
        }
    }

    async summarizeConversation(messages) {
        try {
            const systemPrompt = `Summarize the following conversation into key points, decisions made, and action items. Be concise and use bullet points.`;

            const formatted = messages
                .map((m) => `${m.senderName || "User"}: ${m.text}`)
                .join("\n");

            const result = await this.callLLM(systemPrompt, formatted, { maxTokens: 400, temperature: 0.3 });
            return result || FALLBACK_RESPONSES.summary;
        } catch {
            return FALLBACK_RESPONSES.summary;
        }
    }

    async detectToxicity(text) {
        try {
            const systemPrompt = `Analyze the following message for toxicity, harassment, hate speech, or spam. Return ONLY a JSON object with: {"toxic": boolean, "confidence": 0-1, "category": "none"|"harassment"|"hate"|"spam"|"explicit"}`;

            const response = await this.callLLM(systemPrompt, text, { maxTokens: 100, temperature: 0.1 });
            if (!response) return FALLBACK_RESPONSES.toxicity;

            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return FALLBACK_RESPONSES.toxicity;
        }
    }

    async translateText(text, targetLang) {
        try {
            const systemPrompt = `Translate the following text to ${targetLang}. Return ONLY the translated text, nothing else.`;
            return await this.callLLM(systemPrompt, text, { maxTokens: Math.ceil(text.length * 2.5), temperature: 0.3 });
        } catch {
            return null;
        }
    }

    async detectLanguage(text) {
        try {
            const systemPrompt = `Detect the language of the following text. Return ONLY the ISO 639-1 language code (e.g., "en", "es", "fr"), nothing else.`;

            const response = await this.callLLM(systemPrompt, text, { maxTokens: 10, temperature: 0.1 });
            return response?.trim().toLowerCase() || "en";
        } catch {
            return "en";
        }
    }

    async draftMessage(instructions) {
        try {
            const systemPrompt = `You are a helpful writing assistant. Draft a clear, professional message based on the user's instructions. Return ONLY the message text, no explanations.`;
            return await this.callLLM(systemPrompt, instructions, { maxTokens: 300, temperature: 0.7 });
        } catch {
            return null;
        }
    }

    async detectSentiment(text) {
        try {
            const systemPrompt = `Analyze the sentiment of this message. Return ONLY a JSON object: {"score": -1 to 1 (negative to positive), "label": "positive"|"neutral"|"negative", "confidence": 0 to 1}`;

            const response = await this.callLLM(systemPrompt, text, { maxTokens: 80, temperature: 0.1 });
            if (!response) return FALLBACK_RESPONSES.sentiment;

            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return FALLBACK_RESPONSES.sentiment;
        }
    }

    async generateMeetingNotes(messages, participants) {
        try {
            const formatted = messages.map(m => `${m.senderName || "User"}: ${m.text}`).join("\n");
            const participantNames = participants.map(p => p.fullName || p.name).join(", ");

            const systemPrompt = `You are an AI meeting assistant. Generate structured meeting notes from the following conversation. Include:
- **Summary**: 2-3 sentence overview
- **Key Decisions**: Bullet list of decisions made
- **Action Items**: Bullet list with assigned owners when mentioned
- **Open Questions**: Any unresolved questions

Participants: ${participantNames}
Be concise and actionable.`;

            return await this.callLLM(systemPrompt, formatted, { maxTokens: 600, temperature: 0.3 });
        } catch {
            return "Unable to generate meeting notes at this time.";
        }
    }

    async coachMessage(text, tone = "professional") {
        try {
            const systemPrompt = `You are a writing coach. Analyze this message and provide feedback for "${tone}" tone. Return ONLY a JSON object:
{
  "clarity": 1-10,
  "toneMatch": 1-10,
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"],
  "revisedText": "improved version of the message (or original if already good)",
  "overallScore": 1-10
}`;

            const response = await this.callLLM(systemPrompt, text, { maxTokens: 300, temperature: 0.4 });
            if (!response) return null;

            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    }

    async quickBotRespond(message, workspaceContext, conversationHistory) {
        try {
            const contextStr = conversationHistory
                .slice(-10)
                .map(m => `${m.senderName || m.role}: ${m.text || m.content}`)
                .join("\n");

            const systemPrompt = `You are QuickBot, an AI assistant in the QuickChat communication platform. You help users with:
- Answering questions about past conversations
- Summarizing discussions
- Setting reminders (respond with JSON action: {"action": "set_reminder", "message": "reminder text", "delay": "2h"})
- Creating polls (respond with JSON action: {"action": "create_poll", "question": "poll question", "options": ["opt1", "opt2"]})
- General helpful conversation

Be concise, friendly, and helpful. If the user wants a reminder or poll, output the JSON action at the end of your response, wrapped in \`\`\`action\`\`\` blocks.

${workspaceContext ? `Workspace context: ${workspaceContext}\n` : ""}`;

            const userMessage = contextStr ? `Conversation history:\n${contextStr}\n\nUser message: ${message}` : message;

            return await this.callLLM(systemPrompt, userMessage, { maxTokens: 400, temperature: 0.7 });
        } catch {
            return "I'm having trouble responding right now. Please try again later.";
        }
    }

    async autoComplete(partial) {
        try {
            const systemPrompt = `Complete the following partial message naturally. Return 3 possible completions as a JSON array of strings. Each should be 5-20 words longer than the input.`;

            const response = await this.callLLM(systemPrompt, `Partial message: "${partial}"`, {
                maxTokens: 150,
                temperature: 0.8,
            });

            if (!response) return FALLBACK_RESPONSES.autocomplete;
            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return FALLBACK_RESPONSES.autocomplete;
        }
    }

    async generateTopicClusters(messages) {
        try {
            const formatted = messages.map(m => m.text).filter(Boolean).join("\n---\n");
            if (formatted.length < 50) return [];

            const systemPrompt = `Analyze these messages and identify 3-7 main topic clusters. Return ONLY a JSON array of objects: [{"topic": "topic name", "keywords": ["word1", "word2"], "messageCount": estimated count}]`;

            const response = await this.callLLM(systemPrompt, formatted.slice(0, 3000), { maxTokens: 300, temperature: 0.3 });
            if (!response) return [];

            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return [];
        }
    }

    extractAction(response) {
        if (!response) return { text: response, action: null };
        const actionMatch = response.match(/```action\n([\s\S]*?)\n```/);
        if (actionMatch) {
            try {
                const action = JSON.parse(actionMatch[1]);
                const text = response.replace(/```action\n[\s\S]*?\n```/, "").trim();
                return { text, action };
            } catch {
                return { text: response, action: null };
            }
        }
        return { text: response, action: null };
    }
}

export const aiService = new AIService();
export { QUICKBOT_ID };
export default aiService;
