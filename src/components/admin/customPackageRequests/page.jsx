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
    contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
    seatLimit: '',
    contract: { startDate: '', endDate: '' },
    addedCardIds: [],
    removedCardIds: []
  });
  const [creating, setCreating] = useState(false);
  const [allCards, setAllCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/organizations');
      setOrganizations(res.data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
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
  }, [fetchRequests, fetchOrganizations]);

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
    
    // Fetch cards when opening dialog
    await fetchCards();
    
    // Get base package cards
    const basePackageCardIds = request.basePackageId?.cardIds || [];
    const requestedCardsToAdd = request.requestedModifications?.cardsToAdd || [];
    const requestedCardsToRemove = request.requestedModifications?.cardsToRemove || [];
    
    // Start with base package cards, add requested cards, remove requested removals
    const initialCardIds = [
      ...basePackageCardIds.filter(id => !requestedCardsToRemove.some(removeId => removeId.toString() === id.toString())),
      ...requestedCardsToAdd
    ];
    
    setCreatePackageData({
      organizationId: '',
      contractPricing: { 
        amount: request.requestedModifications?.customPricing?.amount || '', 
        currency: request.requestedModifications?.customPricing?.currency || 'EUR', 
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
      addedCardIds: initialCardIds,
      removedCardIds: []
    });
    setCreatePackageDialog(true);
  };

  const handleStatusUpdateSubmit = async () => {
    if (!selectedRequest) return;

    try {
      const api = getApiInstance();
      await api.put(`/custom-package-requests/${selectedRequest._id}/status`, statusUpdateData);
      setStatusUpdateDialog(false);
      setSelectedRequest(null);
      setStatusUpdateData({ status: '', adminNotes: '' });
      fetchRequests();
      setError(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleCreatePackageSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setCreating(true);
      const api = getApiInstance();
      
      // First check/create organization
      let organizationId = createPackageData.organizationId;
      
      if (!organizationId) {
        // Create organization from request
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

      // Create custom package
      const customPackageData = {
        organizationId: organizationId,
        basePackageId: selectedRequest.basePackageId._id || selectedRequest.basePackageId,
        addedCardIds: createPackageData.addedCardIds || selectedRequest.requestedModifications?.cardsToAdd || [],
        removedCardIds: createPackageData.removedCardIds || selectedRequest.requestedModifications?.cardsToRemove || [],
        contractPricing: {
          amount: createPackageData.contractPricing.amount || selectedRequest.requestedModifications?.customPricing?.amount || 0,
          currency: createPackageData.contractPricing.currency || 'EUR',
          billingType: createPackageData.contractPricing.billingType || selectedRequest.requestedModifications?.customPricing?.billingType || 'one_time',
          notes: selectedRequest.requestedModifications?.customPricing?.notes || ''
        },
        seatLimit: createPackageData.seatLimit || selectedRequest.requestedModifications?.seatLimit || 1,
        contract: {
          startDate: createPackageData.contract.startDate 
            ? new Date(createPackageData.contract.startDate)
            : (selectedRequest.requestedModifications?.contractDuration?.startDate 
              ? new Date(selectedRequest.requestedModifications.contractDuration.startDate)
              : new Date()),
          endDate: createPackageData.contract.endDate
            ? new Date(createPackageData.contract.endDate)
            : (selectedRequest.requestedModifications?.contractDuration?.endDate
              ? new Date(selectedRequest.requestedModifications.contractDuration.endDate)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
          status: 'active'
        },
        status: 'active'
      };

      const customPackageRes = await api.post('/custom-packages', customPackageData);

      // Update request status to completed
      await api.put(`/custom-package-requests/${selectedRequest._id}/status`, {
        status: 'completed',
        customPackageId: customPackageRes.data._id
      });

      setCreatePackageDialog(false);
      setSelectedRequest(null);
      setCreatePackageData({
        organizationId: '',
        contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
        seatLimit: '',
        contract: { startDate: '', endDate: '' }
      });
      fetchRequests();
      setError(null);
    } catch (err) {
      console.error('Error creating custom package:', err);
      setError(err.response?.data?.error || 'Failed to create custom package');
    } finally {
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
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Custom Package Requests</Typography>
        <FormControl size="small" sx={{ minWidth: 180, mt: 0.5 }}>
          <InputLabel id="status-filter-label" sx={{ 
            backgroundColor: 'white',
            mt:.5,
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
              <TableCell>Organization</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Base Package</TableCell>
              <TableCell>Seats</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
                    <Typography variant="caption" color="text.secondary">
                      {request.contactEmail}
                    </Typography>
                    {request.contactPhone && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {request.contactPhone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {request.basePackageId?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {request.requestedModifications?.seatLimit || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
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
                    {request.status !== 'completed' && (
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
                {selectedRequest.contactPhone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedRequest.contactPhone}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Base Package
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRequest.basePackageId?.name || 'N/A'}
                  </Typography>
                </Grid>
                {selectedRequest.requestedModifications?.seatLimit && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Number of Seats
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedRequest.requestedModifications.seatLimit}
                    </Typography>
                  </Grid>
                )}
                {selectedRequest.requestedModifications?.customPricing?.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Custom Pricing Requirements
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedRequest.requestedModifications.customPricing.notes}
                    </Typography>
                  </Grid>
                )}
                {selectedRequest.requestedModifications?.additionalNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Additional Requirements
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {selectedRequest.requestedModifications.additionalNotes}
                    </Typography>
                  </Grid>
                )}
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
          setStatusUpdateDialog(false);
          setSelectedRequest(null);
          setStatusUpdateData({ status: '', adminNotes: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Request Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusUpdateData.status}
                label="Status"
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setStatusUpdateDialog(false);
            setSelectedRequest(null);
            setStatusUpdateData({ status: '', adminNotes: '' });
          }}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdateSubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Custom Package Dialog */}
      <Dialog
        open={createPackageDialog}
        onClose={() => {
          setCreatePackageDialog(false);
          setSelectedRequest(null);
          setCreatePackageData({
            organizationId: '',
            contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
            seatLimit: '',
            contract: { startDate: '', endDate: '' },
            addedCardIds: [],
            removedCardIds: []
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Package</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Organization: {selectedRequest.organizationName}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Base Package: {selectedRequest.basePackageId?.name || 'N/A'}
                  </Typography>
                </Grid>
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
                  <TextField
                    fullWidth
                    label="Contract End Date"
                    type="date"
                    value={createPackageData.contract.endDate}
                    onChange={(e) => setCreatePackageData({ 
                      ...createPackageData, 
                      contract: { ...createPackageData.contract, endDate: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
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
                      ? `Requested: €${selectedRequest.requestedModifications.customPricing.amount}` 
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
                
                {/* Included Cards Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Included Cards
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select which cards should be included in this custom package
                  </Typography>
                  
                  {loadingCards ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      maxHeight: 300, 
                      overflowY: 'auto', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 1, 
                      p: 2,
                      backgroundColor: '#f9f9f9'
                    }}>
                      <FormGroup>
                        {allCards.map((card) => {
                          const cardIdStr = card._id?.toString();
                          const isSelected = createPackageData.addedCardIds?.some(id => id?.toString() === cardIdStr);
                          const isBasePackageCard = selectedRequest?.basePackageId?.cardIds?.some(id => id?.toString() === cardIdStr);
                          
                          return (
                            <FormControlLabel
                              key={card._id}
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const currentIds = createPackageData.addedCardIds || [];
                                    const cardIdStr = card._id?.toString();
                                    if (e.target.checked) {
                                      setCreatePackageData({
                                        ...createPackageData,
                                        addedCardIds: [...currentIds.filter(id => id?.toString() !== cardIdStr), card._id],
                                        removedCardIds: createPackageData.removedCardIds?.filter(id => id?.toString() !== cardIdStr) || []
                                      });
                                    } else {
                                      setCreatePackageData({
                                        ...createPackageData,
                                        addedCardIds: currentIds.filter(id => id?.toString() !== cardIdStr),
                                        removedCardIds: isBasePackageCard 
                                          ? [...(createPackageData.removedCardIds || []).filter(id => id?.toString() !== cardIdStr), card._id]
                                          : createPackageData.removedCardIds?.filter(id => id?.toString() !== cardIdStr) || []
                                      });
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body2">
                                    {card.title || card.name || 'Untitled Card'}
                                  </Typography>
                                  {isBasePackageCard && (
                                    <MuiChip 
                                      label="Base Package" 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined"
                                    />
                                  )}
                                  {selectedRequest?.requestedModifications?.cardsToAdd?.some(id => id?.toString() === cardIdStr) && (
                                    <MuiChip 
                                      label="Requested" 
                                      size="small" 
                                      color="success" 
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                            />
                          );
                        })}
                      </FormGroup>
                      
                      {allCards.length === 0 && (
                        <Typography variant="body2" color="text.secondary" align="center" p={2}>
                          No cards available
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selected: {createPackageData.addedCardIds?.length || 0} card(s)
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
            setCreatePackageData({
              organizationId: '',
              contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
              seatLimit: '',
              contract: { startDate: '', endDate: '' }
            });
          }} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreatePackageSubmit} variant="contained" color="success" disabled={creating}>
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
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

