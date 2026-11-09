import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForceChangePasswordModal() {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user?.must_change_password) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Check your current temporary password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-paper border-2 border-pine/40 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-5 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber/20 text-amber-dark flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-amber" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase font-bold text-pine tracking-wider">
              Security Verification Required
            </span>
            <h3 className="font-heading font-bold text-xl text-ink">
              Change Initial Password
            </h3>
          </div>
        </div>

        <p className="text-xs text-ink/75 leading-relaxed">
          Your account was provisioned with a temporary password by an administrator.
          For agricultural data protection, you must choose a permanent password before accessing Leafline.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rust/10 border border-rust/30 text-rust-dark text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
              Temporary / Current Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
              New Permanent Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? 'Securing Account...' : 'Set Permanent Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
