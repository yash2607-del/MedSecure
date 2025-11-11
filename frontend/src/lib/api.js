import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
if (!import.meta.env.VITE_API_URL) {
  // eslint-disable-next-line no-console
  console.warn('[api] VITE_API_URL not set, defaulting to', baseURL);
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
});
