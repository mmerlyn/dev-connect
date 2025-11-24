import { Router } from 'express';
import { PostsController } from './posts.controller.js';
import { AuthMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Post routes
router.get('/', AuthMiddleware.optionalAuthenticate, PostsController.getAllPosts);
router.get('/:id', AuthMiddleware.optionalAuthenticate, PostsController.getPost);
router.post('/', AuthMiddleware.authenticate, PostsController.createPost);
router.patch('/:id', AuthMiddleware.authenticate, PostsController.updatePost);
router.delete('/:id', AuthMiddleware.authenticate, PostsController.deletePost);

// Like routes
router.post('/:id/like', AuthMiddleware.authenticate, PostsController.likePost);
router.delete('/:id/like', AuthMiddleware.authenticate, PostsController.unlikePost);
router.get('/:id/likes', PostsController.getPostLikes);

// Comment routes
router.get('/:id/comments', PostsController.getPostComments);
router.post('/:id/comments', AuthMiddleware.authenticate, PostsController.addComment);

// Comment operations (separate router pattern for cleaner routing)
const commentsRouter = Router();
commentsRouter.patch('/:id', AuthMiddleware.authenticate, PostsController.updateComment);
commentsRouter.delete('/:id', AuthMiddleware.authenticate, PostsController.deleteComment);
commentsRouter.post('/:id/reply', AuthMiddleware.authenticate, PostsController.replyToComment);
commentsRouter.post('/:id/like', AuthMiddleware.authenticate, PostsController.likeComment);
commentsRouter.delete('/:id/like', AuthMiddleware.authenticate, PostsController.unlikeComment);
commentsRouter.get('/:id/replies', PostsController.getCommentReplies);

// Mount comments router
router.use('/comments', commentsRouter);

export default router;
