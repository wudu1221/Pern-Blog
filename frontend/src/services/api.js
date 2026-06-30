// frontend/src/services/api.js
import axios from 'axios';


const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Automatically inject JWT token into request headers if it exists in storage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('blog_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;