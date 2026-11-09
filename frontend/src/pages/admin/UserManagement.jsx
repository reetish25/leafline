import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  Check,
  X,
  Download,
  Key,
  Copy,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    location: '',
    role: 'user',
    autoGeneratePassword: true,
    customPassword: '',
  });

  // Provisioned Success Modal State (One-time password display)
  const [provisionedResult, setProvisionedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Unable to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await api.admin.exportUsers();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        name: addFormData.name.trim() || undefined,
        email: addFormData.email.trim(),
        location: addFormData.location.trim() || undefined,
        role: addFormData.role,
        password: addFormData.autoGeneratePassword ? undefined : addFormData.customPassword,
      };

      const result = await api.admin.createUser(payload);
      setShowAddModal(false);
      setAddFormData({
        name: '',
        email: '',
        location: '',
        role: 'user',
        autoGeneratePassword: true,
        customPassword: '',
      });
      setProvisionedResult(result);
      fetchUsers();
    } catch (err) {
      alert(`User creation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const actionWord = currentStatus ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${actionWord} this account? Scans and history will remain intact.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this account's role to ${newRole}?`)) return;

    setActionLoading(true);
    try {
      await api.admin.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(`Role update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const copyPasswordToClipboard = () => {
    if (provisionedResult?.temporary_password) {
      navigator.clipboard.writeText(provisionedResult.temporary_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
            Administrative Management
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Customer & Agronomist Accounts
          </h1>
          <p className="text-xs text-ink/70 mt-1">
            Provision user accounts, configure administrative privileges, toggle account access, and export registries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCSV}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export Users CSV'}
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="leaf-card p-12 text-center text-xs font-mono text-ink/60 animate-pulse">
          Loading provisioned accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="leaf-card py-16 px-6 text-center border-2 border-dashed border-pine/25 space-y-3">
          <Users className="w-12 h-12 text-pine/30 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-ink">No Accounts Found</h3>
          <p className="text-xs text-ink/70">Click "+ Add User" above to provision a customer or admin account.</p>
        </div>
      ) : (
        <div className="leaf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pine/5 text-ink uppercase font-mono border-b border-pine/20">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User ID</th>
                  <th className="py-3.5 px-4 font-semibold">User Details</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Location / Consent</th>
                  <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine/10">
                {users.map((u) => {
                  const isActive = u.is_active !== false;
                  return (
                    <tr
                      key={u.id}
                      className={`transition ${!isActive ? 'bg-ink/5 opacity-60' : 'hover:bg-pine/5'}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-pine">
                        #{u.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-heading font-bold text-ink">
                          {u.name || 'Unnamed Grower'}
                        </div>
                        <div className="text-[11px] font-mono text-ink/65">
                          {u.email}
                        </div>
                        {u.must_change_password && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-amber-dark font-bold bg-amber/15 px-1.5 py-0.5 rounded">
                            Pending First-Login Password Change
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-deeprust text-paper'
                              : 'bg-moss text-paper'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-moss-dark">
                            <span className="w-2 h-2 rounded-full bg-moss" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rust-dark">
                            <span className="w-2 h-2 rounded-full bg-rust" />
                            Deactivated
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-ink/80">
                          <MapPin className="w-3.5 h-3.5 text-pine flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{u.location || 'None'}</span>
                        </div>
                        <span className="text-[10px] text-ink/50 mt-0.5 block font-mono">
                          {u.location_consent ? 'Consent Granted' : 'No Geolocation Consent'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink/60">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* Toggle Active / Deactivate */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(u.id, isActive)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                            isActive
                              ? 'border-rust/30 text-rust hover:bg-rust hover:text-paper'
                              : 'border-moss/30 text-moss-dark hover:bg-moss hover:text-paper'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Reactivate'}
                        </button>

                        {/* Toggle Role */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="px-2.5 py-1 rounded-lg border border-pine/30 hover:bg-pine hover:text-paper text-pine font-medium text-[11px] transition"
                        >
                          Make {u.role === 'admin' ? 'Grower' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateUser}
            className="leaf-card max-w-lg w-full p-6 sm:p-8 space-y-4 border-2 border-pine/40 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-pine/15">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pine/10 text-pine flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-ink">
                    Provision New User Account
                  </h3>
                  <p className="text-[11px] text-ink/60">
                    Direct account creation by system administrator.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-ink/60 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Samuel Green"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Email Address <span className="text-rust">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="grower@farm.org"
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Farm Station / Agricultural Region
              </label>
              <input
                type="text"
                placeholder="e.g. Fargo, Cass County, ND"
                value={addFormData.location}
                onChange={(e) => setAddFormData({ ...addFormData, location: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Assigned Platform Role
              </label>
              <select
                value={addFormData.role}
                onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                className="input-field"
              >
                <option value="user">Grower (Standard Customer)</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>

            {/* Password Configuration */}
            <div className="p-4 rounded-xl bg-pine/5 border border-pine/20 space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-ink font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.autoGeneratePassword}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, autoGeneratePassword: e.target.checked })
                  }
                  className="w-4 h-4 text-pine rounded border-pine/40 focus:ring-pine"
                />
                <span>Auto-generate secure temporary password (Recommended)</span>
              </label>

              {!addFormData.autoGeneratePassword && (
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                    Set Specific Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={addFormData.customPassword}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, customPassword: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              )}

              <p className="text-[11px] text-ink/65 leading-tight">
                All provisioned accounts are strictly required to change their password on first login.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-primary text-xs"
              >
                {actionLoading ? 'Provisioning...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* One-Time Password Modal */}
      {provisionedResult && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="leaf-card max-w-md w-full p-6 sm:p-8 space-y-5 border-2 border-pine/40 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-moss/20 text-moss-dark flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-moss" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-pine tracking-wider">
                  Account Provisioned
                </span>
                <h3 className="font-heading font-bold text-xl text-ink">
                  Temporary Credentials
                </h3>
              </div>
            </div>

            <p className="text-xs text-ink/75 leading-relaxed">
              Account created for <strong>{provisionedResult.user.email}</strong>.
              Provide this temporary password to the user. They will be prompted to choose a permanent password upon first sign in.
            </p>

            <div className="p-4 rounded-xl bg-ink/5 border border-pine/20 space-y-2">
              <label className="block text-[11px] font-mono uppercase font-bold text-ink/70">
                One-Time Temporary Password
              </label>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono font-bold text-pine bg-paper px-3 py-1.5 rounded-lg border border-pine/30 flex-1 truncate select-all">
                  {provisionedResult.temporary_password}
                </code>
                <button
                  type="button"
                  onClick={copyPasswordToClipboard}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-moss" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber/10 border border-amber/30 text-amber-dark text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber" />
              <span>
                <strong>Warning:</strong> This password will not be displayed again once you close this window.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setProvisionedResult(null)}
                className="btn-primary text-xs w-full justify-center"
              >
                I Have Saved / Transmitted These Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
