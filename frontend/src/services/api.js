const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('leafline_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // If body is not FormData, set Content-Type JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const rawText = await response.text();
    let errorDetail = rawText || response.statusText || 'An unexpected error occurred';
    try {
      const data = JSON.parse(rawText);
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          errorDetail = data.detail
            .map((item) => (typeof item === 'object' && item?.msg ? item.msg : String(item)))
            .join('; ');
        } else if (typeof data.detail === 'string') {
          errorDetail = data.detail;
        } else {
          errorDetail = JSON.stringify(data.detail);
        }
      } else if (data && data.message) {
        errorDetail = data.message;
      } else if (data) {
        errorDetail = JSON.stringify(data);
      }
    } catch {
      // Body was not JSON; rawText is preserved as errorDetail
    }
    const error = new Error(`HTTP ${response.status}: ${errorDetail}`);
    error.status = response.status;
    error.detail = errorDetail;
    throw error;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: { token, new_password: newPassword },
    }),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    }),
  getMe: () => request('/auth/me'),
  updateProfile: (payload) =>
    request('/auth/profile', {
      method: 'PUT',
      body: payload,
    }),

  // User Scans
  createScan: (formData) =>
    request('/scans', {
      method: 'POST',
      body: formData,
    }),
  getMyScans: (plantLabel) => {
    const q = plantLabel ? `?plant_label=${encodeURIComponent(plantLabel)}` : '';
    return request(`/scans/mine${q}`);
  },
  getScanDetails: (scanId) => request(`/scans/${scanId}`),

  // Public Settings & Models for User UI
  getModelsList: () => request('/scans/models'),

  // Admin APIs
  admin: {
    getUsers: () => request('/admin/users'),
    createUser: (payload) =>
      request('/admin/users', {
        method: 'POST',
        body: payload,
      }),
    updateUserStatus: (userId, isActive) =>
      request(`/admin/users/${userId}/status?is_active=${isActive}`, {
        method: 'PUT',
      }),
    updateUserRole: (userId, role) =>
      request(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: { role },
      }),
    getScans: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.userId) params.append('user_id', filters.userId);
      if (filters.plantLabel) params.append('plant_label', filters.plantLabel);
      if (filters.location) params.append('location', filters.location);
      if (filters.status) params.append('status_filter', filters.status);
      const qs = params.toString();
      return request(`/admin/scans${qs ? `?${qs}` : ''}`);
    },
    getPesticides: (includeArchived = false) =>
      request(`/admin/pesticide-table?include_archived=${includeArchived}`),
    createPesticide: (entry) =>
      request('/admin/pesticide-table', {
        method: 'POST',
        body: entry,
      }),
    updatePesticide: (id, entry) =>
      request(`/admin/pesticide-table/${id}`, {
        method: 'PUT',
        body: entry,
      }),
    getSettings: () => request('/admin/settings'),
    updateSettings: (settingsObj) =>
      request('/admin/settings', {
        method: 'PUT',
        body: settingsObj,
      }),
    getReviewQueue: (status = 'pending') =>
      request(`/admin/review-queue?queue_status=${status}`),
    takeReviewAction: (queueId, action, notes) =>
      request(`/admin/review-queue/${queueId}/action`, {
        method: 'POST',
        body: { action, notes },
      }),
    getModels: () => request('/admin/models'),
    setDefaultModel: (modelId) =>
      request(`/admin/models/${modelId}/set-default`, {
        method: 'POST',
      }),
    getRegionalSeverity: () => request('/admin/regional-severity'),
    getSystemStatus: () => request('/admin/system-status'),
    getAuditLogs: (action = null) => {
      const q = action ? `?action=${encodeURIComponent(action)}` : '';
      return request(`/admin/audit-logs${q}`);
    },
    exportScans: async () => {
      const res = await fetch(`${API_BASE}/admin/export/scans`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to export scans CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leafline_scans_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    exportUsers: async () => {
      const res = await fetch(`${API_BASE}/admin/export/users`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to export users CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leafline_users_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    exportPesticides: async () => {
      const res = await fetch(`${API_BASE}/admin/export/pesticides`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to export pesticides CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leafline_pesticides_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  },
};
