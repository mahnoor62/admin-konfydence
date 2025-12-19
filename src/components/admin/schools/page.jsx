'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE_URL}/api`;

function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolToEdit, setSchoolToEdit] = useState(null);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'school',
    primaryContact: {
      name: '',
      email: '',
      phone: '',
    },
    status: 'prospect',
  });

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get('/schools/admin', { params });
      setSchools(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError(err.response?.data?.error || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSchools();
  }, [statusFilter, fetchSchools]);

  const handleViewDetail = async (schoolId) => {
    try {
      const api = getApiInstance();
      const response = await api.get(`/schools/${schoolId}`);
      setSelectedSchool(response.data);
      setDetailOpen(true);
    } catch (err) {
      console.error('Error fetching school detail:', err);
      setError(err.response?.data?.error || 'Failed to load school details');
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: 'school',
      primaryContact: {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
      },
      status: 'prospect',
    });
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setError(null);
    setFormData({
      name: '',
      type: 'school',
      primaryContact: {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
      },
      status: 'prospect',
    });
  };

  const handleSubmitCreate = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const api = getApiInstance();
      await api.post('/schools', formData);
      fetchSchools();
      handleCloseCreate();
      setError(null);
    } catch (err) {
      console.error('Error creating school:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create school';
      if (err.response?.data) {
        if (err.response.data.details && Array.isArray(err.response.data.details)) {
          errorMessage = err.response.data.details.map(d => d.message || d.msg || d).join(', ');
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
          if (err.response.data.message) {
            errorMessage += ': ' + err.response.data.message;
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = async (school) => {
    try {
      const api = getApiInstance();
      const response = await api.get(`/schools/${school._id}`);
      const schoolData = response.data;
      
      setSchoolToEdit(schoolData);
      setFormData({
        name: schoolData.name || '',
        type: schoolData.type || 'school',
        primaryContact: {
          name: schoolData.primaryContact?.name || '',
          email: schoolData.primaryContact?.email || '',
          phone: schoolData.primaryContact?.phone || '',
        },
        status: schoolData.status || 'prospect',
      });
      setEditOpen(true);
    } catch (err) {
      console.error('Error fetching school for edit:', err);
      setError(err.response?.data?.error || 'Failed to load school details');
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setSchoolToEdit(null);
    setError(null);
    setFormData({
      name: '',
      type: 'school',
      primaryContact: {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
      },
      status: 'prospect',
    });
  };

  const handleSubmitEdit = async () => {
    if (!schoolToEdit) return;

    try {
      setSubmitting(true);
      setError(null);
      const api = getApiInstance();
      await api.put(`/schools/${schoolToEdit._id}`, formData);
      fetchSchools();
      handleCloseEdit();
      setError(null);
    } catch (err) {
      console.error('Error updating school:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to update school';
      if (err.response?.data) {
        if (err.response.data.details && Array.isArray(err.response.data.details)) {
          errorMessage = err.response.data.details.map(d => d.message || d.msg || d).join(', ');
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
          if (err.response.data.message) {
            errorMessage += ': ' + err.response.data.message;
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (school) => {
    setSchoolToDelete(school);
    setDeleteError(null);
    setDeleteSuccess(false);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSchoolToDelete(null);
    setDeleting(false);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);
      const api = getApiInstance();
      await api.delete(`/schools/${schoolToDelete._id}`);
      
      // Show success message
      setDeleteSuccess(true);
      
      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        fetchSchools();
        handleCloseDelete();
      }, 1500);
    } catch (err) {
      console.error('Error deleting school:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to delete school';
      if (err.response?.data) {
        if (err.response.data.details && Array.isArray(err.response.data.details)) {
          errorMessage = err.response.data.details.map(d => d.message || d.msg || d).join(', ');
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
          if (err.response.data.message) {
            errorMessage += ': ' + err.response.data.message;
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setDeleteError(errorMessage);
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#063C5E' }}>
          Schools & Institutes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Filter by Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="prospect">Prospect</MenuItem>
            </Select>
          </FormControl> */}
          {/* <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ bgcolor: '#0B7897', '&:hover': { bgcolor: '#063C5E' } }}
          >
            Create School/Institute
          </Button> */}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !loading ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Seat Usage</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No schools found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                schools.map((school) => (
                  <TableRow key={school._id} hover>
                    <TableCell>{school.name}</TableCell>
                    <TableCell>
                      <Chip label={school.type || 'N/A'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={school.status || 'prospect'}
                        color={
                          school.status === 'active'
                            ? 'success'
                            : school.status === 'expired'
                            ? 'error'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {school.seatUsage?.usedSeats || 0} / {school.seatUsage?.seatLimit || 0}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewDetail(school._id)} color="info" title="View Details">
                        <VisibilityIcon />
                      </IconButton>
                      {/* <IconButton size="small" onClick={() => handleOpenEdit(school)} color="info" title="Edit School">
                        <EditIcon />
                      </IconButton> */}
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDelete(school)} 
                        color="error" 
                        title="Delete School"
                        disabled={deleting && schoolToDelete?._id === school._id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>School Details</DialogTitle>
        <DialogContent>
          {selectedSchool && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedSchool.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Type:</strong> {selectedSchool.type || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Status:</strong> {selectedSchool.status || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Unique Code:</strong> {selectedSchool.uniqueCode || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Seat Usage:</strong> {selectedSchool.seatUsage?.usedSeats || 0} / {selectedSchool.seatUsage?.seatLimit || 0}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Primary Contact
                </Typography>
                <Typography><strong>Name:</strong> {selectedSchool.primaryContact?.name || 'N/A'}</Typography>
                <Typography><strong>Email:</strong> {selectedSchool.primaryContact?.email || 'N/A'}</Typography>
                <Typography><strong>Phone:</strong> {selectedSchool.primaryContact?.phone || 'N/A'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth>
        <DialogTitle>Create School/Institute</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="School/Institute Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <MenuItem value="school">School</MenuItem>
                <MenuItem value="govt">Government</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Primary Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.primaryContact.name}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryContact: { ...formData.primaryContact, name: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.primaryContact.email}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryContact: { ...formData.primaryContact, email: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.primaryContact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryContact: { ...formData.primaryContact, phone: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmitCreate} variant="contained" disabled={!formData.name || !formData.type || !formData.primaryContact.name || !formData.primaryContact.email || submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit School/Institute</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="School/Institute Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <MenuItem value="school">School</MenuItem>
                <MenuItem value="govt">Government</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Primary Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.primaryContact.name}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryContact: { ...formData.primaryContact, name: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.primaryContact.email}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryContact: { ...formData.primaryContact, email: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.primaryContact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  primaryContact: { ...formData.primaryContact, phone: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmitEdit} variant="contained" disabled={!formData.name || !formData.type || !formData.primaryContact.name || !formData.primaryContact.email || submitting}>
            {submitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete School/Institute</DialogTitle>
        <DialogContent>
          {deleteSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              School/Institute <strong>{schoolToDelete?.name}</strong> has been deleted successfully!
            </Alert>
          ) : deleteError ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          ) : null}
          
          {!deleteSuccess && (
            <Typography>
              Are you sure you want to delete <strong>{schoolToDelete?.name}</strong>? This action cannot be undone.
              <br />
              <br />
              This will also delete:
              <ul>
                <li>All associated students</li>
                <li>All custom packages for this school</li>
                <li>School references in leads</li>
              </ul>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {!deleteSuccess && (
            <Button onClick={handleCloseDelete} disabled={deleting}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={deleteSuccess ? handleCloseDelete : handleConfirmDelete} 
            color={deleteSuccess ? "primary" : "error"} 
            variant="contained" 
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : deleteSuccess ? 'Close' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

