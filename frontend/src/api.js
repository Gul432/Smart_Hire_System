import axios from 'axios';

const API_URL = 'http://127.0.0.1:8080/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getJobs = () => api.get('/jobs/');
export const createJob = (jobData) => api.post('/jobs/', jobData);

export const uploadCandidate = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/candidates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadBulkCandidates = (files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  return api.post('/candidates/upload-bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getCandidates = () => api.get('/candidates/');
export const scoreCandidate = (jobId, candidateId) => api.post(`/jobs/${jobId}/score/${candidateId}`);

// Auth API
export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email); // OAuth2 requires 'username' key
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};
export const register = (userData) => api.post('/auth/register', userData);
