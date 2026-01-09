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
  Autocomplete,
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

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgToEdit, setOrgToEdit] = useState(null);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customPackageRequests, setCustomPackageRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    segment: '',
    primaryContact: {
      name: '',
      email: '',
      phone: '',
    },
    status: 'prospect',
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get('/organizations/admin', { params });
      setOrganizations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.response?.data?.error || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCustomPackageRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const api = getApiInstance();
      const response = await api.get('/custom-package-requests', { params: { status: 'all' } });
      // Filter unique organizations by organizationName
      const uniqueOrgs = [];
      const seenNames = new Set();
      response.data.forEach(request => {
        if (request.organizationName && !seenNames.has(request.organizationName.toLowerCase())) {
          seenNames.add(request.organizationName.toLowerCase());
          uniqueOrgs.push({
            _id: request._id,
            organizationName: request.organizationName,
            contactName: request.contactName,
            contactEmail: request.contactEmail,
            contactPhone: request.contactPhone,
          });
        }
      });
      setCustomPackageRequests(uniqueOrgs);
    } catch (err) {
      console.error('Error fetching custom package requests:', err);
      // Don't show error, just log it - this is optional data
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter, fetchOrganizations]);

  useEffect(() => {
    fetchCustomPackageRequests();
  }, [fetchCustomPackageRequests]);

  const handleViewDetail = async (orgId) => {
    try {
      setError(null);
      const api = getApiInstance();
      const response = await api.get(`/organizations/${orgId}`);
      // Handle both response.data and response.data.organization
      const orgData = response.data.organization || response.data;
      setSelectedOrg(orgData ? { organization: orgData, orgUsers: response.data.orgUsers || [] } : response.data);
      setDetailOpen(true);
    } catch (err) {
      console.error('Error fetching organization detail:', err);
      setError(err.response?.data?.error || 'Failed to load organization details');
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: '',
      segment: '',
      primaryContact: {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
      },
      status: 'prospect',
    });
    setSelectedRequestId('');
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setError(null);
    setFormData({
      name: '',
      type: '',
      segment: '',
      primaryContact: {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
      },
      status: 'prospect',
    });
    setSelectedRequestId('');
  };

  const handleRequestSelect = (value) => {
    if (!value || typeof value === 'string') {
      // User cleared or typed manually - just update name if it's a string
      if (typeof value === 'string') {
        setFormData({
          ...formData,
          name: value,
        });
      }
      setSelectedRequestId('');
    } else {
      // User selected from dropdown - it's an object
      const selectedRequest = value;
      setSelectedRequestId(selectedRequest._id);
      setFormData({
        ...formData,
        name: selectedRequest.organizationName || '',
        primaryContact: {
          ...formData.primaryContact,
          name: selectedRequest.contactName || '',
          email: selectedRequest.contactEmail || '',
          phone: selectedRequest.contactPhone || '',
        },
      });
    }
  };

  const handleSubmitCreate = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const api = getApiInstance();
      
      await api.post('/organizations', formData);
      fetchOrganizations();
      handleCloseCreate();
      setError(null);
    } catch (err) {
      console.error('Error creating organization:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create organization';
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

  const handleOpenEdit = async (org) => {
    try {
      setError(null);
      const api = getApiInstance();
      const response = await api.get(`/organizations/${org._id}`);
      // Handle both response.data and response.data.organization
      const orgData = response.data.organization || response.data;
      
      if (!orgData) {
        setError('Organization data not found');
        return;
      }
      
      setOrgToEdit(orgData);
      setFormData({
        name: orgData.name || '',
        type: orgData.type || '',
        segment: orgData.segment || '',
        primaryContact: {
          name: orgData.primaryContact?.name || '',
          email: orgData.primaryContact?.email || '',
          phone: orgData.primaryContact?.phone || '',
        },
        status: orgData.status || 'prospect',
      });
      setEditOpen(true);
    } catch (err) {
      console.error('Error fetching organization for edit:', err);
      setError(err.response?.data?.error || 'Failed to load organization details');
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setOrgToEdit(null);
    setFormData({
      name: '',
      type: '',
      segment: '',
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
    if (!orgToEdit) return;

    try {
      setSubmitting(true);
      const api = getApiInstance();
      await api.put(`/organizations/${orgToEdit._id}`, formData);
      fetchOrganizations();
      handleCloseEdit();
      setError(null);
    } catch (err) {
      console.error('Error updating organization:', err);
      setError(err.response?.data?.error || 'Failed to update organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (org) => {
    setOrgToDelete(org);
    setDeleteError(null);
    setDeleteSuccess(false);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setOrgToDelete(null);
    setDeleting(false);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleConfirmDelete = async () => {
    if (!orgToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);
      const api = getApiInstance();
      await api.delete(`/organizations/${orgToDelete._id}`);
      
      // Show success message
      setDeleteSuccess(true);
      
      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        fetchOrganizations();
        handleCloseDelete();
      }, 1500);
    } catch (err) {
      console.error('Error deleting organization:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to delete organization';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', md: 'flex-start' }}
        mb={3} 
        gap={2}
      >
        <Typography variant="h4">Organizations</Typography>
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2} 
          alignItems="center" 
          width={{ xs: '100%', md: 'auto' }}
        >
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: '100%', sm: 180 },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <InputLabel id="status-filter-label" sx={{ 
              px: 1,
              mt: 0.5,
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75)'
              }
            }}>
              Filter by Status
            </InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ 
                height: '40px',
                '& .MuiSelect-select': {
                  paddingTop: '12px',
                  paddingBottom: '12px'
                }
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="prospect">Prospect</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            fullWidth={{ xs: true, sm: false }}
          >
            Create Organization
          </Button>
        </Box>
      </Box>

      {/* Error display removed from here - errors now show in dialogs */}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active Contracts</TableCell>
              <TableCell>Seat Usage</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">No organizations found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org._id}>
                  <TableCell>{org.name}</TableCell>
                  <TableCell>{org.type}</TableCell>
                  <TableCell>
                    {org.segment ? (
                      <Chip label={org.segment} color={org.segment === 'B2B' ? 'primary' : 'info'} size="small" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={org.status}
                      color={
                        org.status === 'active' ? 'success' :
                        org.status === 'expired' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{org.activeContractsCount || 0}</TableCell>
                  <TableCell>
                    {org.seatUsage?.usedSeats || 0} / {org.seatUsage?.seatLimit || 0}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewDetail(org._id)} color="primary" title="View Details">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenEdit(org)} color="info" title="Edit Organization">
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDelete(org)} 
                      color="error" 
                      title="Delete Organization"
                      disabled={deleting && orgToDelete?._id === org._id}
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

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth>
        <DialogTitle>Create Organization</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={customPackageRequests}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    return option;
                  }
                  return option.organizationName || '';
                }}
                value={selectedRequestId ? customPackageRequests.find(req => req._id === selectedRequestId) : null}
                inputValue={formData.name}
                onChange={(event, newValue) => {
                  handleRequestSelect(newValue);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  // Update name field when user types
                  if (reason === 'input') {
                    setFormData({ ...formData, name: newInputValue });
                    setSelectedRequestId('');
                  }
                }}
                loading={loadingRequests}
                disabled={loadingRequests}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Organization Name (Select from Requests or Type)"
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option._id}>
                    {option.organizationName}
                  </Box>
                )}
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
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
                <MenuItem value="school">School/Institute</MenuItem>
                <MenuItem value="govt">Government</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Segment"
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                required
              >
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2E">B2E</MenuItem>
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
          <Button onClick={handleSubmitCreate} variant="contained" disabled={!formData.name || !formData.type || !formData.segment || !formData.primaryContact.name || !formData.primaryContact.email || submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Organization</DialogTitle>
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
                label="Organization Name"
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
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
                <MenuItem value="govt">Government</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Segment"
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                required
              >
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2E">B2E</MenuItem>
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
          <Button onClick={handleSubmitEdit} variant="contained" disabled={!formData.name || !formData.type || !formData.segment || !formData.primaryContact.name || !formData.primaryContact.email || submitting}>
            {submitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Organization Details</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {selectedOrg && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedOrg.organization?.name || selectedOrg.name || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Type"
                  value={selectedOrg.organization?.type || selectedOrg.type || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Segment"
                  value={selectedOrg.organization?.segment || selectedOrg.segment || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedOrg.organization?.status || selectedOrg.status || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Contact Name"
                  value={selectedOrg.organization?.primaryContact?.name || selectedOrg.primaryContact?.name || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Contact Email"
                  value={selectedOrg.organization?.primaryContact?.email || selectedOrg.primaryContact?.email || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Contact Phone"
                  value={selectedOrg.organization?.primaryContact?.phone || selectedOrg.primaryContact?.phone || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unique Code"
                  value={selectedOrg.organization?.uniqueCode || selectedOrg.uniqueCode || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Custom Packages
                </Typography>
                {(selectedOrg.organization?.customPackages?.length > 0 || selectedOrg.customPackages?.length > 0) ? (
                  (() => {
                    // Remove duplicates using Set
                    const packages = selectedOrg.organization?.customPackages || selectedOrg.customPackages || [];
                    const seen = new Set();
                    const uniquePackages = packages.filter((pkg) => {
                      const id = pkg._id?.toString() || pkg.id?.toString() || JSON.stringify(pkg);
                      if (seen.has(id)) {
                        return false;
                      }
                      seen.add(id);
                      return true;
                    });
                    return uniquePackages.map((pkg) => (
                      <Box key={pkg._id || pkg.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography><strong>Name:</strong> {pkg.name || pkg.basePackageId?.name || 'Unknown'}</Typography>
                        <Typography><strong>Status:</strong> {pkg.contract?.status || pkg.status || 'N/A'}</Typography>
                        <Typography><strong>Seat Limit:</strong> {pkg.seatLimit || 0}</Typography>
                        {pkg.contract?.startDate && (
                          <Typography><strong>Start Date:</strong> {new Date(pkg.contract.startDate).toLocaleDateString()}</Typography>
                        )}
                        {pkg.contract?.endDate && (
                          <Typography><strong>End Date:</strong> {new Date(pkg.contract.endDate).toLocaleDateString()}</Typography>
                        )}
                        {pkg.contractPricing?.amount && (
                          <Typography><strong>Price:</strong> ${pkg.contractPricing.amount} ({pkg.contractPricing.billingType || 'N/A'})</Typography>
                        )}
                      </Box>
                    ));
                  })()
                ) : (
                  <Typography color="text.secondary">No custom packages</Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Organization Users
                </Typography>
                {(selectedOrg.orgUsers?.length > 0 || selectedOrg.schoolUsers?.length > 0) ? (
                  (selectedOrg.orgUsers || selectedOrg.schoolUsers || []).map((orgUser, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography><strong>Name:</strong> {orgUser.userId?.name || 'N/A'}</Typography>
                      <Typography><strong>Email:</strong> {orgUser.userId?.email || 'N/A'}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No users assigned</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Organization</DialogTitle>
        <DialogContent>
          {deleteSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Organization <strong>{orgToDelete?.name}</strong> has been deleted successfully!
            </Alert>
          ) : deleteError ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          ) : null}
          
          {!deleteSuccess && (
            <Typography>
              Are you sure you want to delete <strong>{orgToDelete?.name}</strong>? This action cannot be undone.
              <br />
              <br />
              This will also delete:
              <ul>
                <li>All associated organization users</li>
                <li>All custom packages for this organization</li>
                <li>Organization references in leads</li>
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

