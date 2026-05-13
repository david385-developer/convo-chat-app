/**
 * API SERVICE LAYER
 * Centralized request handler for all HTTP communication.
 * Handles JWT inclusion, error parsing, and session expiration redirects.
 */

const BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://127.0.0.1:5000';

const API_URL = `${BASE_URL}/api`;
export const FILE_URL = BASE_URL;

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('convo_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Avoid redirecting to login if the error is already from an auth attempt
      const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
      
      if (response.status === 401 && !isAuthRoute) {
        localStorage.removeItem('convo_token');
        window.location.href = '/login';
        return;
      }
      
      const errorMessage = data.error || (data.errors && data.errors[0].msg) || 'Something went wrong';
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
};

/**
 * FILE UPLOAD HANDLER
 * Fetch needs the browser to set the multipart/form-data boundary 
 * automatically, so we omit the Content-Type header here.
 */
const upload = (endpoint, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('convo_token');
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${API_URL}${endpoint}`);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const errorMessage = data.error || 'Upload failed';
        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
};

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  del: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload
};

export default api;
