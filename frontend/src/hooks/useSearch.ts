import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search';

export const useUniversalSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.universalSearch(query),
    enabled: query.length >= 2,
  });
};

export const useSearchUsers = (query: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['search', 'users', query, page, limit],
    queryFn: () => searchApi.searchUsers(query, page, limit),
    enabled: query.length >= 2,
  });
};

export const useSearchPosts = (query: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['search', 'posts', query, page, limit],
    queryFn: () => searchApi.searchPosts(query, page, limit),
    enabled: query.length >= 2,
  });
};

export const useSearchHashtags = (query: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['search', 'hashtags', query, page, limit],
    queryFn: () => searchApi.searchHashtags(query, page, limit),
    enabled: query.length >= 1,
  });
};

export const usePostsByHashtag = (tag: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['hashtag', tag, page, limit],
    queryFn: () => searchApi.getPostsByHashtag(tag, page, limit),
    enabled: !!tag,
  });
};
