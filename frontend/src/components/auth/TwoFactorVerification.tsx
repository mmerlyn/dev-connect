import { useState } from 'react';

interface TwoFactorVerificationProps {
  error: string | null;
  isLoading: boolean;
  onVerify: (code: string) => void;
  onBack: () => void;
}

export const TwoFactorVerification = ({ error, isLoading, onVerify, onBack }: TwoFactorVerificationProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-blue-600 mb-2">DevConnect</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="twoFactorCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
