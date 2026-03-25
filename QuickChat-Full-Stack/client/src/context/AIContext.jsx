import { createContext, useContext, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const AIContext = createContext();

export const AIProvider = ({ children }) => {
    const { axios } = useContext(AuthContext);
    const [aiMessages, setAiMessages] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [coachingResult, setCoachingResult] = useState(null);
    const [canvasData, setCanvasData] = useState(null);
    const [sentimentData, setSentimentData] = useState(null);
    const abortControllerRef = useRef(null);

    const getSmartReplies = useCallback(async (conversationMessages) => {
        try {
            setIsLoading(true);
            const { data } = await axios.get("/api/ai/smart-replies", {
                params: {
                    conversationId: conversationMessages[0]?._id,
                },
            });
            if (data.success) {
                setSuggestions(data.suggestions);
            }
        } catch {
            // Silent fail for smart replies
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const summarize = useCallback(async (conversationMessages) => {
        try {
            setIsLoading(true);
            const { data } = await axios.post("/api/ai/summarize", { messages: conversationMessages });
            if (data.success) {
                setAiMessages(prev => [...prev, {
                    role: "assistant",
                    content: data.summary,
                    type: "summary",
                }]);
                return data.summary;
            }
            return null;
        } catch {
            toast.error("Failed to summarize");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const translate = useCallback(async (text, targetLanguage = "English") => {
        try {
            setIsLoading(true);
            const { data } = await axios.post("/api/ai/translate", { text, targetLanguage });
            if (data.success) return data.translatedText;
            return text;
        } catch {
            toast.error("Translation failed");
            return text;
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const draftMessage = useCallback(async (instructions) => {
        try {
            setIsLoading(true);
            const { data } = await axios.post("/api/ai/draft", { instructions });
            if (data.success) return data.draft;
            return "";
        } catch {
            toast.error("Draft failed");
            return "";
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const moderate = useCallback(async (text) => {
        try {
            const { data } = await axios.post("/api/ai/moderate", { text });
            return data;
        } catch {
            return { toxic: false };
        }
    }, [axios]);

    const chatWithAI = useCallback(async (message) => {
        try {
            setIsLoading(true);
            setAiMessages(prev => [...prev, { role: "user", content: message }]);
            const { data } = await axios.post("/api/ai/chat", {
                message,
                history: aiMessages,
            });
            if (data.success) {
                setAiMessages(prev => [...prev, { role: "assistant", content: data.response }]);
            }
        } catch {
            toast.error("AI chat failed");
        } finally {
            setIsLoading(false);
        }
    }, [axios, aiMessages]);

    const quickBotChat = useCallback(async (message, channelId, groupId, conversationId) => {
        try {
            setIsLoading(true);
            setAiMessages(prev => [...prev, { role: "user", content: message }]);
            const { data } = await axios.post("/api/ai/quickbot", {
                message,
                history: aiMessages,
                channelId,
                groupId,
                conversationId,
            });
            if (data.success) {
                setAiMessages(prev => [...prev, { role: "assistant", content: data.response }]);
                if (data.action) {
                    return data.action;
                }
            }
            return null;
        } catch {
            toast.error("QuickBot is having trouble");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [axios, aiMessages]);

    const coachMessage = useCallback(async (text, tone = "professional") => {
        try {
            const { data } = await axios.post("/api/ai/coach", { text, tone });
            if (data.success && data.coaching) {
                setCoachingResult(data.coaching);
                return data.coaching;
            }
            return null;
        } catch {
            // Silent fail for coach
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const searchWithAI = useCallback(async (query) => {
        try {
            setIsLoading(true);
            const { data } = await axios.get("/api/ai/search", { params: { query } });
            return data;
        } catch {
            toast.error("Search failed");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const getConversationCanvas = useCallback(async (workspaceId) => {
        try {
            setIsLoading(true);
            const { data } = await axios.get("/api/ai/canvas", { params: { workspaceId } });
            if (data.success) {
                setCanvasData(data.canvas);
                return data.canvas;
            }
            return null;
        } catch {
            toast.error("Failed to load canvas");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const getSentimentDashboard = useCallback(async (workspaceId, days = 7) => {
        try {
            const { data } = await axios.get("/api/ai/sentiment-dashboard", {
                params: { workspaceId, days },
            });
            if (data.success) {
                setSentimentData(data);
                return data;
            }
            return null;
        } catch {
            // Silent fail for sentiment dashboard
        } finally {
            setIsLoading(false);
        }
    }, []);

    const abortStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const detectSentiment = useCallback(async (text) => {
        try {
            const { data } = await axios.post("/api/ai/sentiment", { text });
            if (data.success) return data.sentiment;
            return null;
        } catch {
            return null;
        }
    }, [axios]);

    const generateMeetingNotes = useCallback(async (messages) => {
        try {
            setIsLoading(true);
            const { data } = await axios.post("/api/ai/meeting-notes", { messages });
            if (data.success) return data.notes;
            return "";
        } catch {
            toast.error("Failed to generate meeting notes");
            return "";
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    const streamChat = useCallback(async (message, onChunk) => {
        try {
            setIsLoading(true);
            setAiMessages(prev => [...prev, { role: "user", content: message }]);
            const { data } = await axios.post("/api/ai/chat", {
                message,
                history: aiMessages,
            });
            if (data.success) {
                setAiMessages(prev => [...prev, { role: "assistant", content: data.response }]);
                if (onChunk) onChunk(data.response);
            }
        } catch {
            toast.error("AI chat failed");
        } finally {
            setIsLoading(false);
        }
    }, [axios, aiMessages]);

    const clearAIChat = useCallback(() => setAiMessages([]), []);
    const clearSuggestions = useCallback(() => setSuggestions([]), []);

    const value = {
        aiMessages, suggestions, isLoading, coachingResult, canvasData, sentimentData,
        getSmartReplies, summarize, translate,
        draftMessage, moderate, chatWithAI, quickBotChat,
        coachMessage, detectSentiment, generateMeetingNotes,
        searchWithAI, getConversationCanvas, getSentimentDashboard,
        streamChat, abortStream,
        clearAIChat, clearSuggestions,
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
};
