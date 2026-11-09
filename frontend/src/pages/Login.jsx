import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogIn, AlertCircle, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Sprout } from 'lucide-react';

export default function Login() {
  const { login, forgotPassword, resetPassword } = useAuth();

  // Mode: 'login' | 'forgot' | 'reset'
  const [viewMode, setViewMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot / Reset state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    setResetStatus(null);

    try {
      const res = await forgotPassword(forgotEmail);
      setResetStatus({
        type: 'success',
        text: res.message || 'Password reset token has been dispatched if account exists.',
      });
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setViewMode('reset');
      }
    } catch (err) {
      setErrorMsg('Unable to process password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await resetPassword(resetToken, newPassword);
      setResetStatus({
        type: 'success',
        text: 'Password successfully updated! You may now sign in.',
      });
      setViewMode('login');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Bold Confident Landing Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pine/10 border border-pine/20 text-pine text-xs font-mono font-semibold uppercase tracking-wider">
            <Sprout className="w-3.5 h-3.5 text-moss" />
            <span>Leafline · Foliar Intelligence</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight leading-tight pt-1">
            Sunflower Blight Diagnostics
          </h1>

          <p className="text-sm text-ink-muted font-body max-w-sm mx-auto leading-relaxed">
            Real PyTorch Alternaria severity estimation, CAM visual explanation, and 15-day weather-driven risk outlook.
          </p>
        </div>

        {/* Status Notification */}
        {resetStatus && (
          <div className="p-3.5 rounded-xl bg-moss/10 border border-moss/30 text-moss-dark text-xs flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-moss" />
            <span>{resetStatus.text}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rust/10 border border-rust/30 text-rust-dark text-xs flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="leaf-card p-6 sm:p-8 bg-white shadow-clean-md">
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="grower@sunfield.farm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-pine hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  autoComplete="current-password"
                />
              </div>

              {/* Single Clear Primary CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Farm Workspace
                  </>
                )}
              </button>

              {/* Demo Account Credentials Helper */}
              <div className="pt-4 border-t border-agri-border mt-4">
                <span className="text-[11px] font-mono text-ink-subtle uppercase tracking-wider block mb-2 text-center">
                  1-Click Demo Accounts:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('grower@sunfield.farm', 'GrowerPass123!')}
                    className="p-2 rounded-lg bg-paper border border-agri-border hover:border-pine text-left transition"
                  >
                    <span className="font-heading font-bold text-xs text-ink block">Grower Demo</span>
                    <span className="text-[10px] text-ink-subtle block font-mono truncate">grower@sunfield.farm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@leafline.ag', 'AdminPass123!')}
                    className="p-2 rounded-lg bg-paper border border-agri-border hover:border-pine text-left transition"
                  >
                    <span className="font-heading font-bold text-xs text-ink block">Agronomist Admin</span>
                    <span className="text-[10px] text-ink-subtle block font-mono truncate">admin@leafline.ag</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {viewMode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-ink-subtle hover:text-ink text-xs flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>

              <h3 className="font-heading font-bold text-lg text-ink">Reset Password</h3>
              <p className="text-xs text-ink-muted">Enter your email address to receive a secure password recovery token.</p>

              <div>
                <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="grower@sunfield.farm"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5 text-xs"
              >
                {isLoading ? 'Sending Token...' : 'Dispatch Reset Token'}
              </button>
            </form>
          )}

          {viewMode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <h3 className="font-heading font-bold text-lg text-ink">Set New Password</h3>
              <p className="text-xs text-ink-muted">Enter the reset token along with your new password.</p>

              <div>
                <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="New secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5 text-xs"
              >
                {isLoading ? 'Updating...' : 'Update Password & Sign In'}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-ink-subtle space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-moss" />
            <span>Authenticated Local Session · Production Model Active</span>
          </p>
        </div>

      </div>
    </div>
  );
}
