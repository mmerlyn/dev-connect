import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';

export const useUserById = (userId: string) => {
  return useQuery({
    queryKey: ['user', 'id', userId],
    queryFn: () => usersApi.getUserById(userId),
    enabled: !!userId,
  });
};

export const useUser = (username: string) => {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => usersApi.getUserByUsername(username),
    enabled: !!username,
  });
};

export const useUserPosts = (userId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['userPosts', userId, page, limit],
    queryFn: () => usersApi.getUserPosts(userId, page, limit),
    enabled: !!userId,
  });
};

export const useUserLikedPosts = (userId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['userLikedPosts', userId, page, limit],
    queryFn: () => usersApi.getUserLikedPosts(userId, page, limit),
    enabled: !!userId,
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
