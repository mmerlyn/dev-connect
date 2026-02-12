import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { OAuthButtons } from '../components/auth/OAuthButtons';
import { TwoFactorVerification } from '../components/auth/TwoFactorVerification';
import { LoginForm } from '../components/auth/LoginForm';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, verify2FA, isLoading, error, clearError, pending2FAUserId, clear2FA } = useAuthStore();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_failed') {
      setOauthError('OAuth authentication failed. Please try again.');
    }
  }, [searchParams]);

  useEffect(() => {
    return () => { clear2FA(); };
  }, [clear2FA]);

  const handleLogin = async (email: string, password: string) => {
    clearError();
    try {
      const result = await login({ email, password });
      if (!result.requires2FA) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleVerify2FA = async (code: string) => {
    clearError();
    try {
      await verify2FA(pending2FAUserId!, code);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('2FA verification failed:', err);
    }
  };

  const handleBackToLogin = () => {
    clear2FA();
    clearError();
  };

  if (pending2FAUserId) {
    return (
      <TwoFactorVerification
        error={error}
        isLoading={isLoading}
        onVerify={handleVerify2FA}
        onBack={handleBackToLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-blue-600 mb-2">DevConnect</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to connect with developers worldwide
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {(error || oauthError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || oauthError}
            </div>
          )}

          <OAuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <LoginForm isLoading={isLoading} onSubmit={handleLogin} />
        </div>
      </div>
    </div>
  );
};
