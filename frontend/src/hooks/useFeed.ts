import { useQuery } from '@tanstack/react-query';
import { feedApi } from '../api/feed';

export const usePersonalizedFeed = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['feed', 'personalized', page, limit],
    queryFn: () => feedApi.getPersonalizedFeed(page, limit),
  });
};

export const useTrendingPosts = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['feed', 'trending', page, limit],
    queryFn: () => feedApi.getTrendingPosts(page, limit),
  });
};

export const useFollowingFeed = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['feed', 'following', page, limit],
    queryFn: () => feedApi.getFollowingFeed(page, limit),
  });
};
