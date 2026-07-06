import apiClient from './client';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

interface TwoFactorStatus {
  enabled: boolean;
}

export const twoFactorApi = {
  generateSecret: async (): Promise<TwoFactorSetup> => {
    const response = await apiClient.post<{ data: TwoFactorSetup }>('/auth/2fa/generate');
    return response.data.data;
  },

  enable: async (token: string): Promise<void> => {
    await apiClient.post('/auth/2fa/enable', { token });
  },

  disable: async (token: string): Promise<void> => {
    await apiClient.post('/auth/2fa/disable', { token });
  },

  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await apiClient.get<{ data: TwoFactorStatus }>('/auth/2fa/status');
    return response.data.data;
  },
};
