const STORAGE_KEYS = {
  TOKEN: 'haunted_auth_token',
  BASE_URL: 'haunted_api_base_url',
};

export function getAuthToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || import.meta.env.VITE_AUTH_TOKEN || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    window.dispatchEvent(new CustomEvent('haunted:auth-change', { detail: { token } }));
  } catch {}
}

export function getApiBaseUrl() {
  try {
    return localStorage.getItem(STORAGE_KEYS.BASE_URL) || import.meta.env.VITE_API_BASE_URL || '';
  } catch {
    return '';
  }
}

export function setApiBaseUrl(url) {
  try {
    if (url) {
      localStorage.setItem(STORAGE_KEYS.BASE_URL, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(STORAGE_KEYS.BASE_URL);
    }
    window.dispatchEvent(new CustomEvent('haunted:base-url-change', { detail: { url } }));
  } catch {}
}

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const url = `${baseUrl}${endpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    const message = err?.message || 'Network request failed';
    throw new Error(
      `Unable to reach the investigation server at ${url || endpoint}. Check that the backend is running. (${message})`,
      { cause: err }
    );
  }

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    let errorMsg;
    if (data && typeof data === 'object' && data.error) {
      errorMsg = data.error;
    } else if (typeof data === 'string' && data.trim()) {
      errorMsg = data;
    } else {
      errorMsg = `Server returned HTTP ${res.status} ${res.statusText}`;
    }

    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  checkHealth() {
    return request('/api/health');
  },

  listPortals() {
    return request('/api/portals');
  },

  getPortal(id) {
    return request(`/api/portals/${encodeURIComponent(id)}`);
  },

  createPortal(name) {
    return request('/api/portals', {
      method: 'POST',
      body: { name: (name || '').trim() },
    });
  },

  deletePortal(id) {
    return request(`/api/portals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  listPortalRequests(portalId, { page = 1, limit = 20, method, since } = {}) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (method) params.set('method', method);
    if (since) params.set('since', since);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/portals/${encodeURIComponent(portalId)}/requests${query}`);
  },

  getRequest(id) {
    return request(`/api/requests/${encodeURIComponent(id)}`);
  },

  runAutopsy(requestId) {
    return request(`/api/requests/${encodeURIComponent(requestId)}/autopsy`, {
      method: 'POST',
    });
  },

  autopsyRequest(requestId) {
    return request(`/api/requests/${encodeURIComponent(requestId)}/autopsy`, {
      method: 'POST',
    });
  },

  generateCode(requestId, task) {
    return request(`/api/requests/${encodeURIComponent(requestId)}/generate-code`, {
      method: 'POST',
      body: { task },
    });
  },

  async loginGuest(guestId) {
    const data = await request('/api/auth/guest', {
      method: 'POST',
      body: { guestId },
    });
    if (data?.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  getMe() {
    return request('/api/auth/me');
  },

  getDiscordLoginUrl(returnUrl) {
    const baseUrl = getApiBaseUrl();
    const redirect = returnUrl || `${window.location.origin}/dashboard`;
    return `${baseUrl}/api/auth/discord?redirect=${encodeURIComponent(redirect)}`;
  },

  logout() {
    setAuthToken('');
  },
};
