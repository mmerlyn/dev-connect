import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mock = (fn: unknown) => fn as jest.Mock<(...args: any[]) => any>;

jest.unstable_mockModule('../../src/shared/database/client.js', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    hashtag: { upsert: jest.fn() },
    notification: { create: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/shared/socket/socket.service.js', () => ({
  SocketService: {
    initialize: jest.fn(),
    sendNotification: jest.fn(),
    sendMessage: jest.fn(),
    emitToUser: jest.fn(),
    notifyNewPost: jest.fn(),
    shutdown: jest.fn(),
  },
}));

const { prisma } = await import('../../src/shared/database/client.js');
const { PostsService } = await import('../../src/modules/posts/posts.service.js');
const { SocketService } = await import('../../src/shared/socket/socket.service.js');

describe('PostsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('extracts hashtags from content', async () => {
      mock(prisma.post.create).mockResolvedValue({
        id: 'post-1',
        content: 'Hello #typescript #react world',
        hashtags: ['#typescript', '#react'],
        authorId: 'user-1',
        author: { id: 'user-1', username: 'testuser', displayName: 'Test', avatar: null },
        _count: { likes: 0, comments: 0 },
      });
      mock(prisma.hashtag.upsert).mockResolvedValue({});

      await PostsService.createPost('user-1', {
        content: 'Hello #typescript #react world',
      });

      const createCall = mock(prisma.post.create).mock.calls[0] as any[];
      expect(createCall[0].data.hashtags).toEqual(['#typescript', '#react']);
      expect(prisma.hashtag.upsert).toHaveBeenCalledTimes(2);
    });

    it('handles post with no hashtags', async () => {
      mock(prisma.post.create).mockResolvedValue({
        id: 'post-1',
        content: 'Just a normal post',
        hashtags: [],
        authorId: 'user-1',
        author: { id: 'user-1', username: 'testuser', displayName: 'Test', avatar: null },
        _count: { likes: 0, comments: 0 },
      });

      await PostsService.createPost('user-1', {
        content: 'Just a normal post',
      });

      const createCall = mock(prisma.post.create).mock.calls[0] as any[];
      expect(createCall[0].data.hashtags).toEqual([]);
      expect(prisma.hashtag.upsert).not.toHaveBeenCalled();
    });

    it('deduplicates hashtags case-insensitively', async () => {
      mock(prisma.post.create).mockResolvedValue({
        id: 'post-1',
        content: 'I love #React and #REACT and #react',
        hashtags: ['#react'],
        authorId: 'user-1',
        author: { id: 'user-1', username: 'testuser', displayName: 'Test', avatar: null },
        _count: { likes: 0, comments: 0 },
      });
      mock(prisma.hashtag.upsert).mockResolvedValue({});

      await PostsService.createPost('user-1', {
        content: 'I love #React and #REACT and #react',
      });

      const createCall = mock(prisma.post.create).mock.calls[0] as any[];
      expect(createCall[0].data.hashtags).toEqual(['#react']);
      expect(prisma.hashtag.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('likePost', () => {
    it('creates like and sends notification for other user post', async () => {
      mock(prisma.post.findUnique).mockResolvedValue({
        id: 'post-1',
        authorId: 'author-1',
      });
      mock(prisma.like.findUnique).mockResolvedValue(null);
      mock(prisma.like.create).mockResolvedValue({
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      });
      mock(prisma.notification.create).mockResolvedValue({
        id: 'notif-1',
        type: 'LIKE_POST',
        recipientId: 'author-1',
        senderId: 'user-1',
        sender: { id: 'user-1', username: 'testuser', displayName: 'Test', avatar: null },
      });

      await PostsService.likePost('post-1', 'user-1');

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'LIKE_POST',
            recipientId: 'author-1',
            senderId: 'user-1',
          }),
        })
      );
      expect(SocketService.sendNotification).toHaveBeenCalledWith('author-1', expect.anything());
    });

    it('skips notification when liking own post', async () => {
      mock(prisma.post.findUnique).mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });
      mock(prisma.like.findUnique).mockResolvedValue(null);
      mock(prisma.like.create).mockResolvedValue({
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      await PostsService.likePost('post-1', 'user-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(SocketService.sendNotification).not.toHaveBeenCalled();
    });
  });
});
