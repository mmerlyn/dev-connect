import { Router } from 'express';
import { SearchController } from './search.controller.js';

const router = Router();

router.get('/', SearchController.universalSearch);
router.get('/users', SearchController.searchUsers);
router.get('/posts', SearchController.searchPosts);
router.get('/hashtags', SearchController.searchHashtags);
router.get('/hashtag/:tag', SearchController.getPostsByHashtag);

export default router;
