'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  Grid,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
}
const API_URL = `${API_BASE_URL}/api`;

function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {};
  }
  const token = localStorage.getItem('admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function SettingsContent() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/auth/admin/me`, { headers });
      setAdmin(res.data);
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to load profile', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!formData.name || !formData.email) {
        setSnackbar({ open: true, message: 'Name and email are required', severity: 'error' });
        return;
      }

      const headers = getAuthHeaders();
      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      await axios.put(`${API_URL}/auth/admin/profile`, updateData, { headers });
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      fetchAdminProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to update profile', 
        severity: 'error' 
      });
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        setSnackbar({ open: true, message: 'All password fields are required', severity: 'error' });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
        return;
      }

      if (formData.newPassword.length < 8) {
        setSnackbar({ open: true, message: 'Password must be at least 8 characters long', severity: 'error' });
        return;
      }

      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/auth/admin/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }, { headers });

      setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to update password', 
        severity: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage your admin profile and account settings
      </Typography>

      <Grid container spacing={3} sx={{ maxWidth: 1200 }}>
        {/* Profile Information */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ 
            p: 3, 
            border: '1px solid #e0e0e0', 
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 'auto' }}>
                <Button 
                  variant="contained" 
                  onClick={handleUpdateProfile}
                  sx={{ mt: 1 }}
                >
                  Update Profile
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ 
            p: 3, 
            border: '1px solid #e0e0e0', 
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Current Password"
                  fullWidth
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New Password"
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  helperText="Password must be at least 8 characters long"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm New Password"
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 'auto' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleUpdatePassword}
                  sx={{ mt: 1 }}
                >
                  Update Password
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

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

