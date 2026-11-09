import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, ShieldCheck, Save, AlertCircle, CheckCircle2, Lock, KeyRound } from 'lucide-react';

export default function UserProfile() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [locationConsent, setLocationConsent] = useState(user?.location_consent || false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      if (!locationConsent && location.trim()) {
        throw new Error('Explicit consent is required before saving location data.');
      }

      await updateProfile({
        name: name.trim(),
        location: locationConsent ? location.trim() : null,
        location_consent: locationConsent,
      });

      setStatusMsg({ type: 'success', text: 'Farm profile and agronomic preferences updated successfully.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Your password was changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
          Account & Security
        </span>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          Farm Profile & Settings
        </h1>
        <p className="text-xs text-ink/70 mt-1">
          Manage your grower credentials, farm geolocation preferences, and account security.
        </p>
      </div>

      {/* Profile & Geolocation Card */}
      <div className="leaf-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-pine/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pine/10 text-pine flex items-center justify-center font-heading font-bold text-base">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-ink">Grower Profile</h2>
              <p className="text-xs text-ink/60">Agronomic identity and station location.</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider ${
              user?.role === 'admin'
                ? 'bg-deeprust text-paper'
                : 'bg-moss text-paper'
            }`}
          >
            Role: {user?.role}
          </span>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-moss/10 border border-moss/30 text-moss-dark'
                : 'bg-rust/10 border border-rust/30 text-rust-dark'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-moss" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Full Name / Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Eleanor Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Account Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input-field bg-ink/5 text-ink/60 cursor-not-allowed border-pine/15"
              />
            </div>
          </div>

          {/* Location Consent Toggle */}
          <div className="p-4 rounded-xl bg-pine/5 border border-pine/20 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={locationConsent}
                onChange={(e) => {
                  setLocationConsent(e.target.checked);
                  if (!e.target.checked) setLocation('');
                }}
                className="mt-1 w-4 h-4 text-pine rounded border-pine/40 focus:ring-pine cursor-pointer"
              />
              <label htmlFor="consent" className="text-xs text-ink leading-relaxed cursor-pointer font-medium">
                <strong className="text-pine font-heading block text-sm mb-0.5">
                  Explicit Geolocation Consent
                </strong>
                I explicitly consent to storing my farm coordinates / agricultural region in Leafline.
                This information is used strictly to query weather forecasts and run microclimate
                pathogen risk projections.
              </label>
            </div>
          </div>

          {/* Location Input (Active only if consented) */}
          <div>
            <label className="block text-xs font-mono font-semibold text-ink/80 uppercase mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-pine" />
              Agricultural Region / Farm Station
            </label>
            <input
              type="text"
              disabled={!locationConsent}
              placeholder={locationConsent ? "e.g. Salina, KS or Cass County, ND" : "Enable consent above to record location"}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field disabled:bg-ink/5 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving Profile...' : 'Save Profile & Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="leaf-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-pine/15">
          <div className="w-10 h-10 rounded-xl bg-pine/10 text-pine flex items-center justify-center font-heading font-bold text-base">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-ink">Change Account Password</h2>
            <p className="text-xs text-ink/60">Update your security credentials at any time.</p>
          </div>
        </div>

        {passwordMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              passwordMsg.type === 'success'
                ? 'bg-moss/10 border border-moss/30 text-moss-dark'
                : 'bg-rust/10 border border-rust/30 text-rust-dark'
            }`}
          >
            {passwordMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-moss" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
              Current Password
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                New Password
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
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn-primary"
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
