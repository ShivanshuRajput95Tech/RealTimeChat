import AIService from '../services/aiService.js';
import { asyncHandler } from '../lib/errors.js';
import logger from '../lib/logger.js';

// Summarize a long message
export const summarizeMessage = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const userId = req.user._id;
    
    logger.debug('Summarizing message', { userId, textLength: text?.length });
    
    const result = await AIService.summarizeMessage(text);
    
    res.json({
        success: true,
        message: 'Message summarized successfully',
        data: result
    });
});

// Analyze sentiment of a message
export const analyzeSentiment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const userId = req.user._id;
    
    logger.debug('Analyzing sentiment', { userId, textLength: text?.length });
    
    const result = await AIService.analyzeSentiment(text);
    
    res.json({
        success: true,
        message: 'Sentiment analyzed successfully',
        data: result
    });
});

// Get smart reply suggestions
export const suggestReplies = asyncHandler(async (req, res) => {
    const { messageText, conversationContext } = req.body;
    const userId = req.user._id;
    
    logger.debug('Generating reply suggestions', { userId, messageLength: messageText?.length });
    
    const result = await AIService.suggestReplies(messageText, conversationContext || []);
    
    res.json({
        success: true,
        message: 'Reply suggestions generated successfully',
        data: result
    });
});

// Translate message to target language
export const translateMessage = asyncHandler(async (req, res) => {
    const { text, targetLanguage } = req.body;
    const userId = req.user._id;
    
    logger.debug('Translating message', { userId, targetLanguage, textLength: text?.length });
    
    const result = await AIService.translateMessage(text, targetLanguage);
    
    res.json({
        success: true,
        message: 'Message translated successfully',
        data: result
    });
});

// Detect language of a message
export const detectLanguage = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const userId = req.user._id;
    
    logger.debug('Detecting language', { userId, textLength: text?.length });
    
    const result = await AIService.detectLanguage(text);
    
    res.json({
        success: true,
        message: 'Language detected successfully',
        data: result
    });
});

// Filter inappropriate content
export const filterContent = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const userId = req.user._id;
    
    logger.debug('Filtering content', { userId, textLength: text?.length });
    
    const result = await AIService.filterContent(text);
    
    res.json({
        success: true,
        message: 'Content filtered successfully',
        data: result
    });
});
