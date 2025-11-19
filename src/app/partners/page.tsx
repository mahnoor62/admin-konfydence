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
import api from '@/lib/api';
import { PartnerLogo } from '@/lib/types';

function PartnersContent() {
  const [partners, setPartners] = useState<PartnerLogo[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerLogo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    linkUrl: '',
    type: 'partner' as 'press' | 'partner' | 'event',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await api.get<PartnerLogo[]>('/partners');
      setPartners(res.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleOpen = (partner?: PartnerLogo) => {
    if (partner) {
      setEditing(partner);
      setFormData({
        name: partner.name,
        logoUrl: partner.logoUrl,
        linkUrl: partner.linkUrl || '',
        type: partner.type,
        isActive: partner.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        logoUrl: '',
        linkUrl: '',
        type: 'partner',
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
      if (editing) {
        await api.put(`/partners/${editing._id}`, formData);
        setSnackbar({ open: true, message: 'Partner logo updated successfully', severity: 'success' });
      } else {
        await api.post('/partners', formData);
        setSnackbar({ open: true, message: 'Partner logo created successfully', severity: 'success' });
      }
      handleClose();
      fetchPartners();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error saving partner logo', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this partner logo?')) {
      try {
        await api.delete(`/partners/${id}`);
        setSnackbar({ open: true, message: 'Partner logo deleted successfully', severity: 'success' });
        fetchPartners();
      } catch (error) {
        setSnackbar({ open: true, message: 'Error deleting partner logo', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Partner Logos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Partner Logo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Logo</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner._id}>
                <TableCell>{partner.name}</TableCell>
                <TableCell>{partner.type}</TableCell>
                <TableCell>
                  <Box
                    component="img"
                    src={partner.logoUrl}
                    alt={partner.name}
                    sx={{ maxWidth: 100, maxHeight: 50, objectFit: 'contain' }}
                  />
                </TableCell>
                <TableCell>{partner.isActive ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(partner)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(partner._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Partner Logo' : 'Add Partner Logo'}</DialogTitle>
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
              label="Logo URL"
              fullWidth
              required
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            />
            <TextField
              label="Link URL (optional)"
              fullWidth
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
            />
            <TextField
              select
              label="Type"
              fullWidth
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <MenuItem value="press">Press</MenuItem>
              <MenuItem value="partner">Partner</MenuItem>
              <MenuItem value="event">Event</MenuItem>
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

export default function Partners() {
  return (
    <AdminLayout>
      <PartnersContent />
    </AdminLayout>
  );
}

