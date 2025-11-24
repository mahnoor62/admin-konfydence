'use client';

import AdminLayout from '../layout-admin';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
}
const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Testimonials API URL:', API_URL);

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

function TestimonialsContent() {
  const [testimonials, setTestimonials] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    organization: '',
    quote: '',
    segment: 'b2c',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/testimonials`;
      console.log('📡 API: GET', url);
      const res = await axios.get(url, { headers });
      const data = Array.isArray(res.data) ? res.data : [];
      setTestimonials(data);
    } catch (error) {
      console.error('❌ Error fetching testimonials:', {
        url: `${API_URL}/testimonials`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setTestimonials([]);
    }
  };

  const handleOpen = (testimonial) => {
    if (testimonial) {
      setEditing(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        organization: testimonial.organization,
        quote: testimonial.quote,
        segment: testimonial.segment,
        isActive: testimonial.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        role: '',
        organization: '',
        quote: '',
        segment: 'b2c',
        isActive: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      const headers = getAuthHeaders();
      if (editing) {
        const url = `${API_URL}/testimonials/${editing._id}`;
        console.log('📡 API: PUT', url, formData);
        await axios.put(url, formData, { headers });
        setSnackbar({ open: true, message: 'Testimonial updated successfully', severity: 'success' });
      } else {
        const url = `${API_URL}/testimonials`;
        console.log('📡 API: POST', url, formData);
        await axios.post(url, formData, { headers });
        setSnackbar({ open: true, message: 'Testimonial created successfully', severity: 'success' });
      }
      handleClose();
      fetchTestimonials();
    } catch (error) {
      console.error('❌ Error saving testimonial:', {
        url: editing ? `${API_URL}/testimonials/${editing._id}` : `${API_URL}/testimonials`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error saving testimonial', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      try {
        const headers = getAuthHeaders();
        const url = `${API_URL}/testimonials/${id}`;
        console.log('📡 API: DELETE', url);
        await axios.delete(url, { headers });
        setSnackbar({ open: true, message: 'Testimonial deleted successfully', severity: 'success' });
        fetchTestimonials();
      } catch (error) {
        console.error('❌ Error deleting testimonial:', {
          url: `${API_URL}/testimonials/${id}`,
          error: error.response?.data || error.message,
          status: error.response?.status,
        });
        setSnackbar({ open: true, message: 'Error deleting testimonial', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Testimonials</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Add Testimonial
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No testimonials found. Click &ldquo;Add Testimonial&rdquo; to create your first testimonial.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((testimonial) => (
                <TableRow key={testimonial._id}>
                <TableCell>{testimonial.name}</TableCell>
                <TableCell>{testimonial.role}</TableCell>
                <TableCell>{testimonial.organization}</TableCell>
                <TableCell>{testimonial.segment.toUpperCase()}</TableCell>
                <TableCell>{testimonial.isActive ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(testimonial)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(testimonial._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Role"
              fullWidth
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <TextField
              label="Organization"
              fullWidth
              required
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
            />
            <TextField
              label="Quote"
              fullWidth
              multiline
              rows={4}
              required
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            />
            <TextField
              select
              label="Segment"
              fullWidth
              required
              value={formData.segment}
              onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
            >
              <MenuItem value="b2b">B2B</MenuItem>
              <MenuItem value="b2c">B2C</MenuItem>
              <MenuItem value="b2e">B2E</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default function Testimonials() {
  return (
    <AdminLayout>
      <TestimonialsContent />
    </AdminLayout>
  );
}

