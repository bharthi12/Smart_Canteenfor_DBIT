export async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    credentials: 'include', // Send session cookie with cross-origin or proxy requests
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'Request failed' };
    }
    const error = new Error(errorData.message || 'An unexpected error occurred');
    error.status = response.status;
    error.code = errorData.code;
    throw error;
  }

  // If 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
