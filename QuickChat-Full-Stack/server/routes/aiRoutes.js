import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import {
  summarizeMessage,
  analyzeSentiment,
  suggestReplies,
  translateMessage,
  detectLanguage,
  filterContent,
} from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/summarize', protectRoute, summarizeMessage);
aiRouter.post('/sentiment', protectRoute, analyzeSentiment);
aiRouter.post('/suggest', protectRoute, suggestReplies);
aiRouter.post('/translate', protectRoute, translateMessage);
aiRouter.post('/detect-language', protectRoute, detectLanguage);
aiRouter.post('/filter', protectRoute, filterContent);

export default aiRouter;
