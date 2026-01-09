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
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Chip as MuiChip,
  Snackbar,
  OutlinedInput,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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

export default function CustomPackageRequests() {
  const [requests, setRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [createPackageDialog, setCreatePackageDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    adminNotes: ''
  });
  const [createPackageData, setCreatePackageData] = useState({
    organizationId: '',
    schoolId: '',
    entityType: '', // 'organization' or 'institute'
    contractPricing: { amount: '', currency: 'USD', billingType: 'one_time' },
    seatLimit: '',
    contract: { startDate: '' },
    expiryTime: null,
    expiryTimeUnit: null,
    addedCardIds: [],
    selectedProductIds: []
  });
  const [creating, setCreating] = useState(false);
  const [allCards, setAllCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchOrganizations = useCallback(async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/organizations');
      setOrganizations(res.data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/schools');
      setSchools(res.data || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const api = getApiInstance();
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      console.log('Fetching custom package requests with params:', params);
      const res = await api.get('/custom-package-requests', { params });
      console.log('Received requests:', res.data?.length || 0);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching requests:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      let errorMessage = 'Failed to load requests';
      
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to view custom package requests. Please contact your administrator.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
    fetchOrganizations();
    fetchSchools();
  }, [fetchRequests, fetchOrganizations, fetchSchools]);

  const fetchCards = async () => {
    try {
      setLoadingCards(true);
      const api = getApiInstance();
      const res = await api.get('/cards');
      setAllCards(res.data || []);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const api = getApiInstance();
      const res = await api.get('/products', {
        params: { includeInactive: true, all: true },
      });
      const productsData = Array.isArray(res.data) ? res.data : (res.data.products || []);
      setAllProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setAllProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleStatusUpdate = (request) => {
    setSelectedRequest(request);
    setStatusUpdateData({
      status: request.status,
      adminNotes: request.adminNotes || ''
    });
    setStatusUpdateDialog(true);
  };

  const handleCreatePackage = async (request) => {
    setSelectedRequest(request);
    
    // Fetch products when opening dialog (including private products)
    await fetchProducts();
    
    // Get cards from request (if any)
    const requestedCardsToAdd = request.requestedModifications?.cardsToAdd || [];
    
    // Use requested cards as initial selection
    const initialCardIds = requestedCardsToAdd;
    
    // Auto-detect entity type from request
    let entityType = '';
    let organizationId = '';
    let schoolId = '';
    
    if (request.entityType) {
      // If entityType is explicitly set in request
      entityType = request.entityType;
      if (entityType === 'organization') {
        organizationId = request.organizationId?._id || request.organizationId || '';
      } else if (entityType === 'institute') {
        schoolId = request.schoolId?._id || request.schoolId || '';
      }
    } else {
      // Auto-detect from organizationId/schoolId
      if (request.organizationId?._id || request.organizationId) {
        entityType = 'organization';
        organizationId = request.organizationId?._id || request.organizationId;
      } else if (request.schoolId?._id || request.schoolId) {
        entityType = 'institute';
        schoolId = request.schoolId?._id || request.schoolId;
      }
    }
    
    setCreatePackageData({
      organizationId: organizationId,
      schoolId: schoolId,
      entityType: entityType,
      contractPricing: { 
        amount: request.requestedModifications?.customPricing?.amount || '', 
        currency: request.requestedModifications?.customPricing?.currency || 'USD', 
        billingType: request.requestedModifications?.customPricing?.billingType || 'one_time' 
      },
      seatLimit: request.requestedModifications?.seatLimit || '',
      contract: { 
        startDate: request.requestedModifications?.contractDuration?.startDate 
          ? new Date(request.requestedModifications.contractDuration.startDate).toISOString().split('T')[0]
          : '', 
        endDate: request.requestedModifications?.contractDuration?.endDate
          ? new Date(request.requestedModifications.contractDuration.endDate).toISOString().split('T')[0]
          : '' 
      },
      addedCardIds: initialCardIds
    });
    setCreatePackageDialog(true);
  };

  const handleStatusUpdateSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setUpdatingStatus(true);
      const api = getApiInstance();
      const response = await api.put(`/custom-package-requests/${selectedRequest._id}/status`, statusUpdateData);
      
      // Check if email was sent
      const emailSent = response.data?.emailSent || false;
      const organizationName = selectedRequest.organizationName || 'the organization';
      
      // Show success message
      if (emailSent) {
        setSnackbar({
          open: true,
          message: `Status updated and email sent to to ${organizationName}`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Status updated',
          severity: 'success'
        });
      }
      
      setStatusUpdateDialog(false);
      setSelectedRequest(null);
      setStatusUpdateData({ status: '', adminNotes: '' });
      fetchRequests();
      setError(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to update status',
        severity: 'error'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreatePackageSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setCreating(true);
      const api = getApiInstance();
      
      // Get organizationId/schoolId based on entityType
      let organizationId = null;
      let schoolId = null;
      
      if (createPackageData.entityType === 'organization') {
        organizationId = createPackageData.organizationId || selectedRequest.organizationId?._id || selectedRequest.organizationId;
      } else if (createPackageData.entityType === 'institute') {
        schoolId = createPackageData.schoolId || selectedRequest.schoolId?._id || selectedRequest.schoolId;
      }
      
      // If not selected, try to find existing, then create if needed
      if (!organizationId && !schoolId) {
        // Try to find existing organization by name (for organization type)
        if (createPackageData.entityType === 'organization') {
          try {
            const orgsRes = await api.get('/organizations', {
              params: { search: selectedRequest.organizationName }
            });
            if (orgsRes.data && orgsRes.data.length > 0) {
              organizationId = orgsRes.data[0]._id;
            }
          } catch (e) {
            console.log('Could not find organization by name');
          }
        }
        
        // Try to find existing school by name (for institute type)
        if (createPackageData.entityType === 'institute') {
          try {
            const schoolsRes = await api.get('/schools', {
              params: { search: selectedRequest.organizationName }
            });
            if (schoolsRes.data && schoolsRes.data.length > 0) {
              schoolId = schoolsRes.data[0]._id;
            }
          } catch (e) {
            console.log('Could not find school by name');
          }
        }
        
        // If still not found, create organization/school based on entityType
        if (!organizationId && !schoolId) {
          try {
            if (createPackageData.entityType === 'institute') {
              // Create school for Institute
              const schoolRes = await api.post('/schools', {
                name: selectedRequest.organizationName,
                type: 'school',
                primaryContact: {
                  name: selectedRequest.contactName,
                  email: selectedRequest.contactEmail,
                  phone: selectedRequest.contactPhone || '',
                  jobTitle: ''
                },
                status: 'prospect'
              });
              schoolId = schoolRes.data._id;
            } else {
              // Default to organization for B2B
              const orgRes = await api.post('/organizations', {
                name: selectedRequest.organizationName,
                type: 'other',
                segment: 'B2B',
                primaryContact: {
                  name: selectedRequest.contactName,
                  email: selectedRequest.contactEmail,
                  phone: selectedRequest.contactPhone || '',
                  jobTitle: ''
                },
                status: 'prospect'
              });
              organizationId = orgRes.data._id;
            }
          } catch (createErr) {
            console.error('Error creating organization/school:', createErr);
            throw createErr; // Re-throw to be caught by outer catch
          }
        }
      }

      // Get selected products to attach
      const selectedProducts = createPackageData.selectedProductIds || [];
      
      if (selectedProducts.length === 0) {
        setError('Please select at least one product');
        setSnackbar({
          open: true,
          message: 'Please select at least one product',
          severity: 'error'
        });
        setCreating(false);
        return;
      }
      
      // Convert product IDs to strings
      const productIds = selectedProducts.map(p => {
        if (typeof p === 'object' && p._id) {
          return p._id.toString ? p._id.toString() : String(p._id);
        }
        return p.toString ? p.toString() : String(p);
      });
      
      // Prepare data for CustomPackage creation
      const packageData = {
        status: 'approved',
        productIds: productIds
      };

      // Add expiry data if available
      if (createPackageData.expiryTime && createPackageData.expiryTimeUnit) {
        packageData.expiryTime = createPackageData.expiryTime;
        packageData.expiryTimeUnit = createPackageData.expiryTimeUnit;
      }

      // Add contract pricing if available
      if (createPackageData.contractPricing?.amount) {
        packageData.contractPricing = {
          amount: createPackageData.contractPricing.amount,
          currency: createPackageData.contractPricing.currency || 'USD',
          billingType: createPackageData.contractPricing.billingType || 'one_time'
        };
      }

      // Add seat limit if available
      if (createPackageData.seatLimit) {
        packageData.seatLimit = createPackageData.seatLimit;
      }

      // Add contract start date if available
      if (createPackageData.contract?.startDate) {
        packageData.contract = {
          startDate: createPackageData.contract.startDate
        };
      }

      // Link selected products to the custom package request
      // Update request status to approved and link productIds
      // Also create CustomPackage entry
      const response = await api.put(`/custom-package-requests/${selectedRequest._id}/status`, packageData);

      // Verify the response was successful
      if (!response || !response.data) {
        throw new Error('No response from server');
      }

      // Verify productIds were saved
      const updatedRequest = response.data;
      if (!updatedRequest.productIds || updatedRequest.productIds.length === 0) {
        console.error('Products were not linked to the request. Response:', updatedRequest);
        throw new Error('Products were not linked to the request. Please try again.');
      }
      
      // Log success for debugging
      console.log('Custom package request updated successfully:', {
        requestId: updatedRequest._id,
        productIds: updatedRequest.productIds,
        status: updatedRequest.status
      });

      setCreatePackageDialog(false);
      setSelectedRequest(null);
      setCreatePackageData({
        organizationId: '',
        schoolId: '',
        entityType: '',
        contractPricing: { amount: '', currency: 'USD', billingType: 'one_time' },
        seatLimit: '',
        contract: { startDate: '' },
        expiryTime: null,
        expiryTimeUnit: null,
        addedCardIds: [],
        selectedProductIds: []
      });
      
      // Refresh requests list to show updated data
      await fetchRequests();
      
      setError(null);
      setSnackbar({
        open: true,
        message: `Custom package created successfully! ${productIds.length} product(s) linked.`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating custom package:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create custom package';
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
      
      // Don't close dialog on error - let user see the error and retry
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      setCreating(false);
    }
  };

  const handleDeleteRequest = (request) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRequest) return;

    try {
      setDeleting(true);
      const api = getApiInstance();
      await api.delete(`/custom-package-requests/${selectedRequest._id}`);
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
      setError(null);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.response?.data?.error || 'Failed to delete request');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      reviewing: 'info',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      reviewing: 'Reviewing',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };
    return labels[status] || status;
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
        <Typography variant="h4">Custom Package Requests</Typography>
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: { xs: '100%', md: 180 }, 
            mt: { xs: 0, md: 0.5 },
            width: { xs: '100%', md: 'auto' }
          }}
        >
          <InputLabel id="status-filter-label" sx={{ 
            backgroundColor: 'white',
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
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewing">Reviewing</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Organization/Institute</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Seats</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No requests found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {request.organizationName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.contactName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {request.contactEmail}
                    </Typography>
                    {request.contactPhone && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        📞 {request.contactPhone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.requestedModifications?.seatLimit !== undefined && request.requestedModifications?.seatLimit !== null 
                      ? request.requestedModifications.seatLimit 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        request.customPackageId 
                          ? (request.status === 'approved' ? 'Active' : getStatusLabel(request.status))
                          : getStatusLabel(request.status)
                      }
                      color={
                        request.customPackageId && request.status === 'approved'
                          ? 'success'
                          : getStatusColor(request.status)
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewRequest(request)}
                      title="View Details"
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleStatusUpdate(request)}
                      title="Update Status"
                      color="info"
                    >
                      <EditIcon />
                    </IconButton>
                    {request.status !== 'completed' && !request.customPackageId && (
                      <IconButton
                        size="small"
                        onClick={() => handleCreatePackage(request)}
                        title="Create Custom Package"
                        color="success"
                      >
                        <AddIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRequest(request)}
                      title="Delete Request"
                      color="error"
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

      {/* View Request Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedRequest(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Organization Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.organizationName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.contactName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.contactEmail}
                  </Typography>
                </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.contactPhone || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                    Number of Seats/Users
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.requestedModifications?.seatLimit !== undefined && selectedRequest.requestedModifications?.seatLimit !== null
                      ? selectedRequest.requestedModifications.seatLimit
                      : 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Custom Pricing Requirements
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.requestedModifications?.customPricing?.notes || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Additional Requirements
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {selectedRequest.requestedModifications?.additionalNotes || 'Not provided'}
                    </Typography>
                  </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedRequest.status)}
                    color={getStatusColor(selectedRequest.status)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            setSelectedRequest(null);
          }}>
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setViewDialogOpen(false);
              handleStatusUpdate(selectedRequest);
            }}
          >
            Update Status
          </Button>
          {selectedRequest && selectedRequest.status !== 'completed' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setViewDialogOpen(false);
                handleCreatePackage(selectedRequest);
              }}
            >
              Create Custom Package
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={statusUpdateDialog}
        onClose={() => {
          if (!updatingStatus) {
            setStatusUpdateDialog(false);
            setSelectedRequest(null);
            setStatusUpdateData({ status: '', adminNotes: '' });
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Request Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, position: 'relative' }}>
            {updatingStatus && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusUpdateData.status}
                label="Status"
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
                disabled={updatingStatus}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewing">Reviewing</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Admin Notes (Optional)"
              multiline
              rows={4}
              value={statusUpdateData.adminNotes}
              onChange={(e) => setStatusUpdateData({ ...statusUpdateData, adminNotes: e.target.value })}
              placeholder="Add any notes or comments for the customer..."
              helperText="These notes will be included in the email notification to the customer"
              disabled={updatingStatus}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setStatusUpdateDialog(false);
              setSelectedRequest(null);
              setStatusUpdateData({ status: '', adminNotes: '' });
            }}
            disabled={updatingStatus}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdateSubmit} 
            variant="contained"
            disabled={updatingStatus || !statusUpdateData.status}
            startIcon={updatingStatus ? <CircularProgress size={16} /> : null}
          >
            {updatingStatus ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Custom Package Dialog */}
      <Dialog
        open={createPackageDialog}
        onClose={() => {
          setCreatePackageDialog(false);
          setSelectedRequest(null);
          setError(null);
          setCreatePackageData({
            organizationId: '',
            contractPricing: { amount: '', currency: 'USD', billingType: 'one_time' },
            seatLimit: '',
            contract: { startDate: '' },
            expiryTime: null,
            expiryTimeUnit: null,
            addedCardIds: []
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Package</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Organization: {selectedRequest.organizationName}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Entity Type</InputLabel>
                    <Select
                      value={createPackageData.entityType}
                      label="Entity Type"
                      onChange={(e) => setCreatePackageData({ 
                        ...createPackageData, 
                        entityType: e.target.value,
                        organizationId: '', // Reset when type changes
                        schoolId: '' // Reset when type changes
                      })}
                    >
                      <MenuItem value="">Select Type</MenuItem>
                      <MenuItem value="organization">Organization</MenuItem>
                      <MenuItem value="institute">Institute</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {createPackageData.entityType === 'organization' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Organization (or leave empty to create new)</InputLabel>
                      <Select
                        value={createPackageData.organizationId}
                        label="Select Organization (or leave empty to create new)"
                        onChange={(e) => setCreatePackageData({ 
                          ...createPackageData, 
                          organizationId: e.target.value 
                        })}
                      >
                        <MenuItem value="">Create New Organization</MenuItem>
                        {organizations.map((org) => (
                          <MenuItem key={org._id} value={org._id}>
                            {org.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {createPackageData.entityType === 'institute' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Institute (or leave empty to create new)</InputLabel>
                      <Select
                        value={createPackageData.schoolId}
                        label="Select Institute (or leave empty to create new)"
                        onChange={(e) => setCreatePackageData({ 
                          ...createPackageData, 
                          schoolId: e.target.value 
                        })}
                      >
                        <MenuItem value="">Create New Institute</MenuItem>
                        {schools.map((school) => (
                          <MenuItem key={school._id} value={school._id}>
                            {school.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Seat Limit"
                    type="number"
                    value={createPackageData.seatLimit}
                    onChange={(e) => setCreatePackageData({ 
                      ...createPackageData, 
                      seatLimit: e.target.value 
                    })}
                    helperText={selectedRequest.requestedModifications?.seatLimit 
                      ? `Requested: ${selectedRequest.requestedModifications.seatLimit}` 
                      : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contract Start Date"
                    type="date"
                    value={createPackageData.contract.startDate}
                    onChange={(e) => setCreatePackageData({ 
                      ...createPackageData, 
                      contract: { ...createPackageData.contract, startDate: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Expiry Time Unit</InputLabel>
                    <Select
                      value={createPackageData.expiryTimeUnit || ''}
                      label="Expiry Time Unit"
                      onChange={(e) => setCreatePackageData({ 
                        ...createPackageData, 
                        expiryTimeUnit: e.target.value 
                      })}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="months">Months</MenuItem>
                      <MenuItem value="years">Years</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Time"
                    type="number"
                    value={createPackageData.expiryTime || ''}
                    onChange={(e) => setCreatePackageData({ 
                      ...createPackageData, 
                      expiryTime: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    disabled={!createPackageData.expiryTimeUnit}
                    helperText={createPackageData.expiryTimeUnit ? `Enter number of ${createPackageData.expiryTimeUnit}` : 'Select expiry time unit first'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pricing Amount"
                    type="number"
                    value={createPackageData.contractPricing.amount}
                    onChange={(e) => setCreatePackageData({ 
                      ...createPackageData, 
                      contractPricing: { 
                        ...createPackageData.contractPricing, 
                        amount: e.target.value 
                      }
                    })}
                    helperText={selectedRequest.requestedModifications?.customPricing?.amount 
                      ? `Requested: $${selectedRequest.requestedModifications.customPricing.amount}` 
                      : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Billing Type</InputLabel>
                    <Select
                      value={createPackageData.contractPricing.billingType}
                      label="Billing Type"
                      onChange={(e) => setCreatePackageData({ 
                        ...createPackageData, 
                        contractPricing: { 
                          ...createPackageData.contractPricing, 
                          billingType: e.target.value 
                        }
                      })}
                    >
                      <MenuItem value="one_time">One Time</MenuItem>
                      <MenuItem value="subscription">Subscription</MenuItem>
                      <MenuItem value="per_seat">Per Seat</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Select Products Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Select Products
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select private products to attach to this custom package
                  </Typography>
                  
                  {loadingProducts ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel id="products-label">Select Products</InputLabel>
                      <Select
                        labelId="products-label"
                        multiple
                        value={(createPackageData.selectedProductIds || []).map(id => id?.toString ? id.toString() : String(id))}
                        onChange={(e) => {
                          const selectedIds = e.target.value;
                          // Convert back to product objects/IDs
                          const products = allProducts.filter(p => {
                            const pId = p._id?.toString ? p._id.toString() : String(p._id);
                            return selectedIds.includes(pId) && p.visibility === 'private';
                          });
                          setCreatePackageData({
                            ...createPackageData,
                            selectedProductIds: products.map(p => p._id)
                          });
                        }}
                        input={<OutlinedInput label="Select Products" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                None selected
                              </Typography>
                            ) : (
                              selected.map((productIdStr) => {
                                const product = allProducts.find((p) => {
                                  const pId = p._id?.toString ? p._id.toString() : String(p._id);
                                  return pId === productIdStr && p.visibility === 'private';
                                });
                                if (!product) return null;
                                return (
                                  <Chip
                                    key={productIdStr}
                                    label={`${product.name} ($${product.price})`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(11, 120, 151, 0.1)',
                                      color: '#0B7897',
                                      fontWeight: 500,
                                    }}
                                  />
                                );
                              })
                            )}
                          </Box>
                        )}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              width: 'auto',
                            },
                          },
                        }}
                      >
                        {allProducts.filter(p => p.visibility === 'private').length === 0 ? (
                          <MenuItem disabled>No private products available</MenuItem>
                        ) : (
                          allProducts.filter(p => p.visibility === 'private').map((product) => {
                            const productId = product._id?.toString ? product._id.toString() : String(product._id);
                            return (
                              <MenuItem key={product._id} value={productId}>
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" sx={{ width: '100%' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {product.name || 'Untitled Product'}
                                  </Typography>
                                  <Chip
                                    label={product.visibility === 'private' ? 'Private' : 'Public'}
                                    size="small"
                                    sx={{
                                      backgroundColor: product.visibility === 'private'
                                        ? 'rgba(255, 152, 0, 0.1)'
                                        : 'rgba(76, 175, 80, 0.1)',
                                      color: product.visibility === 'private'
                                        ? '#FF9800'
                                        : '#4CAF50',
                                      fontSize: '0.7rem',
                                      height: '20px',
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ${product.price}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            );
                          })
                        )}
                      </Select>
                    </FormControl>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selected: {createPackageData.selectedProductIds?.length || 0} product(s)
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreatePackageDialog(false);
            setSelectedRequest(null);
            setError(null);
            setCreatePackageData({
              organizationId: '',
              schoolId: '',
              entityType: '',
              contractPricing: { amount: '', currency: 'USD', billingType: 'one_time' },
              seatLimit: '',
              contract: { startDate: '' },
              expiryTime: null,
              expiryTimeUnit: null,
              addedCardIds: [],
              selectedProductIds: []
            });
          }} disabled={creating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePackageSubmit} 
            variant="contained" 
            color="success" 
            disabled={creating}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {creating ? 'Creating...' : 'Create Package'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedRequest(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the request from <strong>{selectedRequest?.organizationName}</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedRequest(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

