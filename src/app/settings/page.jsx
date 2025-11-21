'use client';

import AdminLayout from '../layout-admin';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
}
const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Settings API URL:', API_URL);

function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  });
  
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
      });
      return Promise.reject(error);
    }
  );
  
  return instance;
}

function SettingsContent() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    heroB2CTitle: '',
    heroB2CSubtext: '',
    heroB2BTitle: '',
    heroB2BSubtext: '',
    heroEducationTitle: '',
    heroEducationSubtext: '',
    tagline: '',
    metaTitle: '',
    metaDescription: '',
    founderQuote: '',
    founderName: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/settings');
      setSettings(res.data);
      setFormData({
        heroB2CTitle: res.data.heroB2CTitle,
        heroB2CSubtext: res.data.heroB2CSubtext,
        heroB2BTitle: res.data.heroB2BTitle,
        heroB2BSubtext: res.data.heroB2BSubtext,
        heroEducationTitle: res.data.heroEducationTitle,
        heroEducationSubtext: res.data.heroEducationSubtext,
        tagline: res.data.tagline,
        metaTitle: res.data.metaTitle,
        metaDescription: res.data.metaDescription,
        founderQuote: res.data.founderQuote || '',
        founderName: res.data.founderName || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const api = getApiInstance();
      await api.put('/settings', formData);
      setSnackbar({ open: true, message: 'Settings updated successfully', severity: 'success' });
      fetchSettings();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating settings', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Site Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage global site content and settings
      </Typography>

      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
        <Typography variant="h6">Hero Section - B2C</Typography>
        <TextField
          label="B2C Title"
          fullWidth
          value={formData.heroB2CTitle}
          onChange={(e) => setFormData({ ...formData, heroB2CTitle: e.target.value })}
        />
        <TextField
          label="B2C Subtext"
          fullWidth
          multiline
          rows={2}
          value={formData.heroB2CSubtext}
          onChange={(e) => setFormData({ ...formData, heroB2CSubtext: e.target.value })}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>Hero Section - B2B</Typography>
        <TextField
          label="B2B Title"
          fullWidth
          value={formData.heroB2BTitle}
          onChange={(e) => setFormData({ ...formData, heroB2BTitle: e.target.value })}
        />
        <TextField
          label="B2B Subtext"
          fullWidth
          multiline
          rows={2}
          value={formData.heroB2BSubtext}
          onChange={(e) => setFormData({ ...formData, heroB2BSubtext: e.target.value })}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>Hero Section - Education</Typography>
        <TextField
          label="Education Title"
          fullWidth
          value={formData.heroEducationTitle}
          onChange={(e) => setFormData({ ...formData, heroEducationTitle: e.target.value })}
        />
        <TextField
          label="Education Subtext"
          fullWidth
          multiline
          rows={2}
          value={formData.heroEducationSubtext}
          onChange={(e) => setFormData({ ...formData, heroEducationSubtext: e.target.value })}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>General</Typography>
        <TextField
          label="Tagline"
          fullWidth
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
        />
        <TextField
          label="Meta Title"
          fullWidth
          value={formData.metaTitle}
          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
        />
        <TextField
          label="Meta Description"
          fullWidth
          multiline
          rows={2}
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>Founder Quote</Typography>
        <TextField
          label="Founder Quote"
          fullWidth
          multiline
          rows={3}
          value={formData.founderQuote}
          onChange={(e) => setFormData({ ...formData, founderQuote: e.target.value })}
        />
        <TextField
          label="Founder Name"
          fullWidth
          value={formData.founderName}
          onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
        />

        <Button variant="contained" size="large" onClick={handleSubmit} sx={{ mt: 2 }}>
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default function Settings() {
  return (
    <AdminLayout>
      <SettingsContent />
    </AdminLayout>
  );
}

