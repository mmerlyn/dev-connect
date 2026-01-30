import apiClient from './client';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

interface TwoFactorStatus {
  enabled: boolean;
}

interface TwoFactorVerifyRequest {
  userId: string;
  token: string;
}

export const twoFactorApi = {
  // Generate 2FA secret and QR code
  generateSecret: async (): Promise<TwoFactorSetup> => {
    const response = await apiClient.post<{ data: TwoFactorSetup }>('/auth/2fa/generate');
    return response.data.data;
  },

  // Enable 2FA with verification token
  enable: async (token: string): Promise<void> => {
    await apiClient.post('/auth/2fa/enable', { token });
  },

  // Disable 2FA with verification token
  disable: async (token: string): Promise<void> => {
    await apiClient.post('/auth/2fa/disable', { token });
  },

  // Verify 2FA during login
  verify: async (data: TwoFactorVerifyRequest): Promise<any> => {
    const response = await apiClient.post('/auth/2fa/verify', data);
    return response.data.data;
  },

  // Get 2FA status
  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await apiClient.get<{ data: TwoFactorStatus }>('/auth/2fa/status');
    return response.data.data;
  },
};
