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
  Switch,
  FormControlLabel,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';

function AdminsContent() {
  const [admins, setAdmins] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/auth/admins');
      setAdmins(res.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleOpen = (admin) => {
    if (admin) {
      setEditing(admin);
      setFormData({
        name: admin.name || '',
        isActive: admin.isActive,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!editing) return;

    try {
      await api.put(`/auth/admins/${editing._id}`, formData);
      setSnackbar({ open: true, message: 'Admin updated successfully', severity: 'success' });
      handleClose();
      fetchAdmins();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error updating admin', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      try {
        await api.delete(`/auth/admins/${id}`);
        setSnackbar({ open: true, message: 'Admin deleted successfully', severity: 'success' });
        fetchAdmins();
      } catch (error) {
        setSnackbar({ open: true, message: error.response?.data?.error || 'Error deleting admin', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Admin Management</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin._id}>
                <TableCell>{admin.name || '-'}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Chip
                    label={admin.isActive ? 'Active' : 'Inactive'}
                    color={admin.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {admin.lastLogin
                    ? new Date(admin.lastLogin).toLocaleDateString()
                    : 'Never'}
                </TableCell>
                <TableCell>
                  {new Date(admin.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(admin)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(admin._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Admin</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
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
            Update
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

export default function Admins() {
  return (
    <AdminLayout>
      <AdminsContent />
    </AdminLayout>
  );
}

