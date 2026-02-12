import { Router } from 'express';
import { SearchController } from './search.controller.js';
import { searchLimiter } from '../../shared/middleware/rateLimit.middleware.js';

const router = Router();

router.get('/', searchLimiter, SearchController.universalSearch);
router.get('/users', searchLimiter, SearchController.searchUsers);
router.get('/posts', searchLimiter, SearchController.searchPosts);
router.get('/hashtags', searchLimiter, SearchController.searchHashtags);
router.get('/hashtag/:tag', searchLimiter, SearchController.getPostsByHashtag);

export default router;
