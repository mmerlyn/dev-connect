import { useState, useEffect } from 'react';
import { twoFactorApi } from '../../api/twoFactor';

export const TwoFactorSection = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await twoFactorApi.getStatus();
        setEnabled(status.enabled);
      } catch (err) {
        console.error('Failed to fetch 2FA status:', err);
      }
    };
    fetchStatus();
  }, []);

  const handleSetup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await twoFactorApi.generateSecret();
      setSetup(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await twoFactorApi.enable(code);
      setEnabled(true);
      setSetup(null);
      setCode('');
      setSuccess('Two-factor authentication has been enabled successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await twoFactorApi.disable(code);
      setEnabled(false);
      setCode('');
      setSuccess('Two-factor authentication has been disabled.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {enabled ? (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Two-factor authentication is enabled</p>
              <p className="text-sm text-gray-500">Your account is protected with an authenticator app</p>
            </div>
          </div>

          <form onSubmit={handleDisable} className="space-y-4">
            <div>
              <label htmlFor="disable2fa" className="block text-sm font-medium text-gray-700 mb-1">
                Enter code from authenticator to disable
              </label>
              <input
                type="text"
                id="disable2fa"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest"
                placeholder="000000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </form>
        </div>
      ) : setup ? (
        <div>
          <p className="text-gray-600 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          <div className="flex justify-center mb-4">
            <img src={setup.qrCode} alt="2FA QR Code" className="w-48 h-48 border rounded-lg" />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-xs text-gray-500 mb-1">Or enter this code manually:</p>
            <code className="text-sm font-mono text-gray-900 break-all">{setup.secret}</code>
          </div>

          <form onSubmit={handleEnable} className="space-y-4">
            <div>
              <label htmlFor="verify2fa" className="block text-sm font-medium text-gray-700 mb-1">
                Enter code from authenticator to verify
              </label>
              <input
                type="text"
                id="verify2fa"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest"
                placeholder="000000"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => { setSetup(null); setCode(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Two-factor authentication is not enabled</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
          </div>

          <button
            onClick={handleSetup}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Set up 2FA'}
          </button>
        </div>
      )}
    </div>
  );
};
