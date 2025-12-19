'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
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
  Chip,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  DialogContentText,
  Tabs,
  Tab,
  Snackbar,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

export default function Packages() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    status: 'active',
    visibility: 'public',
    pricing: {
      amount: '',
      currency: 'EUR',
      billingType: 'one_time',
    },
    packageType: 'standard',
    category: 'standard',
    targetAudiences: [],
    maxSeats: 5,
    expiryTime: null,
    expiryTimeUnit: null,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [packageToArchive, setPackageToArchive] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [mainTab, setMainTab] = useState(0); // 0: B2C, 1: B2B/B2E
  const [b2bTab, setB2bTab] = useState(0); // 0: B2B/B2E Standard, 1: Custom Packages
  const [requests, setRequests] = useState([]);
  const [customPackages, setCustomPackages] = useState([]);
  const [customPackagesLoading, setCustomPackagesLoading] = useState(false);
  const [editingCustomPackage, setEditingCustomPackage] = useState(null);
  const [editCustomPackageDialog, setEditCustomPackageDialog] = useState(false);
  const [deleteCustomPackageDialog, setDeleteCustomPackageDialog] = useState(false);
  const [customPackageToDelete, setCustomPackageToDelete] = useState(null);
  const [editCustomPackageData, setEditCustomPackageData] = useState({
    name: '',
    seatLimit: '',
    contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
    contract: { startDate: '', endDate: '', status: 'active' },
    expiryTime: null,
    expiryTimeUnit: null,
    selectedProductIds: [],
    status: 'active'
  });
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [viewRequestDialogOpen, setViewRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    adminNotes: ''
  });
  const [createPackageDialogOpen, setCreatePackageDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [createPackageData, setCreatePackageData] = useState({
    organizationId: '',
    contractPricing: {
      amount: '',
      currency: 'EUR',
      billingType: 'one_time'
    },
    seatLimit: '',
    contract: {
      startDate: '',
      endDate: ''
    }
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      // Filter by target audience based on current tab
      if (mainTab === 0) {
        // B2C tab
        params.targetAudience = 'B2C';
      } else if (mainTab === 1 && b2bTab === 0) {
        // B2B/B2E Standard tab - show packages that have either B2B or B2E or both
        params.targetAudience = 'B2B_B2E'; // Special flag for backend
      }
      
      const [packagesRes, cardsRes] = await Promise.all([
        api.get('/packages', { params }),
        api.get('/cards'),
      ]);
      setPackages(packagesRes.data);
      setCards(cardsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, mainTab, b2bTab]);

  const fetchCustomPackages = useCallback(async () => {
    try {
      setCustomPackagesLoading(true);
      const api = getApiInstance();
      const response = await api.get('/custom-packages');
      setCustomPackages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching custom packages:', err);
      setError(err.response?.data?.error || 'Failed to load custom packages');
    } finally {
      setCustomPackagesLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
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
  }, []);

  const handleEditCustomPackage = (pkg) => {
    setEditingCustomPackage(pkg);
    // Convert productIds to string array for dropdown
    const productIds = (pkg.productIds || []).map(p => {
      if (typeof p === 'object' && p._id) {
        return p._id.toString ? p._id.toString() : String(p._id);
      }
      return p.toString ? p.toString() : String(p);
    });
    
    setEditCustomPackageData({
      name: pkg.name || '',
      seatLimit: pkg.seatLimit || '',
      contractPricing: {
        amount: pkg.contractPricing?.amount || '',
        currency: pkg.contractPricing?.currency || 'EUR',
        billingType: pkg.contractPricing?.billingType || 'one_time'
      },
      contract: {
        startDate: pkg.contract?.startDate 
          ? new Date(pkg.contract.startDate).toISOString().split('T')[0]
          : '',
        endDate: pkg.contract?.endDate
          ? new Date(pkg.contract.endDate).toISOString().split('T')[0]
          : '',
        status: pkg.contract?.status || 'active'
      },
      expiryTime: pkg.expiryTime || null,
      expiryTimeUnit: pkg.expiryTimeUnit || null,
      selectedProductIds: productIds,
      status: pkg.status || 'active'
    });
    // Fetch products if not already loaded
    if (allProducts.length === 0) {
      fetchProducts();
    }
    setEditCustomPackageDialog(true);
  };

  const handleDeleteCustomPackage = (pkg) => {
    setCustomPackageToDelete(pkg);
    setDeleteCustomPackageDialog(true);
  };

  const handleUpdateCustomPackage = async () => {
    if (!editingCustomPackage) return;

    try {
      const api = getApiInstance();
      // Convert product IDs to strings
      const productIds = (editCustomPackageData.selectedProductIds || []).map(p => {
        if (typeof p === 'object' && p._id) {
          return p._id.toString ? p._id.toString() : String(p._id);
        }
        return p.toString ? p.toString() : String(p);
      });

      const updateData = {
        name: editCustomPackageData.name,
        seatLimit: parseInt(editCustomPackageData.seatLimit),
        contractPricing: {
          amount: parseFloat(editCustomPackageData.contractPricing.amount),
          currency: editCustomPackageData.contractPricing.currency,
          billingType: editCustomPackageData.contractPricing.billingType
        },
        contract: {
          startDate: new Date(editCustomPackageData.contract.startDate),
          endDate: new Date(editCustomPackageData.contract.endDate),
          status: editCustomPackageData.contract.status
        },
        expiryTime: editCustomPackageData.expiryTime || null,
        expiryTimeUnit: editCustomPackageData.expiryTimeUnit || null,
        productIds: productIds,
        status: editCustomPackageData.status
      };

      await api.put(`/custom-packages/${editingCustomPackage._id}`, updateData);
      setEditCustomPackageDialog(false);
      setEditingCustomPackage(null);
      fetchCustomPackages();
      setError(null);
    } catch (err) {
      console.error('Error updating custom package:', err);
      setError(err.response?.data?.error || 'Failed to update custom package');
    }
  };

  const handleConfirmDeleteCustomPackage = async () => {
    if (!customPackageToDelete) return;

    try {
      const api = getApiInstance();
      await api.delete(`/custom-packages/${customPackageToDelete._id}`);
      setDeleteCustomPackageDialog(false);
      setCustomPackageToDelete(null);
      fetchCustomPackages();
      setError(null);
    } catch (err) {
      console.error('Error deleting custom package:', err);
      setError(err.response?.data?.error || 'Failed to delete custom package');
    }
  };

  useEffect(() => {
    if (mainTab === 0) {
      // B2C tab
      fetchData();
    } else if (mainTab === 1) {
      // B2B/B2E tab
      if (b2bTab === 0) {
        // B2B/B2E Standard sub-tab
        fetchData();
      } else if (b2bTab === 1) {
        // Custom Packages sub-tab
        fetchCustomPackages();
      }
    }
  }, [statusFilter, mainTab, b2bTab, fetchData, fetchCustomPackages]);

  const handleOpen = (pkg = null) => {
    if (pkg) {
      setEditing(pkg);
      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        imageUrl: pkg.imageUrl || '',
        status: pkg.status || 'active',
        visibility: pkg.visibility || 'public',
        packageType: pkg.packageType || pkg.type || pkg.category || 'standard',
        category: pkg.category || pkg.packageType || pkg.type || 'standard',
        pricing: pkg.pricing || { amount: '', currency: 'EUR', billingType: 'one_time' },
    targetAudiences: pkg.targetAudiences || [],
    maxSeats: pkg.maxSeats || 5,
    expiryTime: pkg.expiryTime || null,
    expiryTimeUnit: pkg.expiryTimeUnit || null,
  });
    } else {
      setEditing(null);
      // Set default values based on current tab - completely separate for B2C and B2B/B2E
      if (mainTab === 0) {
        // B2C tab - allow user to select any package type, default to 'standard' but user can change
        setFormData({
          name: '',
          description: '',
          imageUrl: '',
          status: 'active',
          visibility: 'public',
          packageType: 'standard', // Default to standard for B2C, but user can select any option
          category: 'standard',
          pricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
          targetAudiences: ['B2C'],
          maxSeats: 5,
          expiryTime: null,
          expiryTimeUnit: null,
        });
      } else {
        // B2B/B2E tab - same as B2C, user can select any package type
        setFormData({
          name: '',
          description: '',
          imageUrl: '',
          status: 'active',
          visibility: 'public',
          packageType: 'standard', // Default to standard for B2B/B2E, but user can select any option
          category: 'standard',
          pricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
          targetAudiences: ['B2B', 'B2E'],
          maxSeats: 5,
          expiryTime: null,
          expiryTimeUnit: null,
        });
      }
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      const api = getApiInstance();
      // Ensure category and packageType are properly set
      // For B2C, use selected value, for B2B/B2E always use 'standard'
      const finalPackageType = formData.packageType || 'standard';
      
      const submitData = {
        ...formData,
        packageType: finalPackageType,
        category: finalPackageType,
        type: finalPackageType, // Also set type field for backward compatibility
        targetAudiences: Array.isArray(formData.targetAudiences) ? formData.targetAudiences : [formData.targetAudiences || (mainTab === 0 ? 'B2C' : 'B2B')],
        expiryTime: formData.expiryTime ? parseInt(formData.expiryTime) : null,
        expiryTimeUnit: formData.expiryTimeUnit || null
      };
      
      console.log('Submitting package data:', submitData); // Debug log
      
      if (editing) {
        await api.put(`/packages/${editing._id}`, submitData);
        setSnackbar({
          open: true,
          message: 'Package edited successfully',
          severity: 'success'
        });
      } else {
        await api.post('/packages', submitData);
        setSnackbar({
          open: true,
          message: 'Package created successfully',
          severity: 'success'
        });
      }
      fetchData();
      handleClose();
      setError(null);
    } catch (err) {
      console.error('Error saving package:', err);
      setError(err.response?.data?.error || 'Failed to save package');
    }
  };

  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;
    
    try {
      const api = getApiInstance();
      await api.delete(`/packages/${packageToDelete._id}`);
      setSnackbar({
        open: true,
        message: 'Package deleted successfully',
        severity: 'success'
      });
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
      fetchData();
      setError(null);
    } catch (err) {
      console.error('Error deleting package:', err);
      setError(err.response?.data?.error || 'Failed to delete package');
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  const handleArchiveClick = (pkg) => {
    setPackageToArchive(pkg);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!packageToArchive) return;
    
    try {
      const api = getApiInstance();
      const endpoint = packageToArchive.status === 'archived' 
        ? `/packages/${packageToArchive._id}/unarchive`
        : `/packages/${packageToArchive._id}/archive`;
      await api.put(endpoint);
      setArchiveDialogOpen(false);
      setPackageToArchive(null);
      fetchData();
      setError(null);
    } catch (err) {
      console.error('Error archiving package:', err);
      setError(err.response?.data?.error || 'Failed to archive package');
      setArchiveDialogOpen(false);
      setPackageToArchive(null);
    }
  };

  const handleArchiveCancel = () => {
    setArchiveDialogOpen(false);
    setPackageToArchive(null);
  };

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    try {
      setUploadingImage(true);
      const api = getApiInstance();
      const res = await api.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
      setError(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      setError(null);
      const api = getApiInstance();
      const params = {};
      if (requestStatusFilter !== 'all') {
        params.status = requestStatusFilter;
      }
      const res = await api.get('/custom-package-requests', { params });
      setRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleViewRequest = async (request) => {
    // Fetch fresh data for the request
    try {
      const api = getApiInstance();
      const res = await api.get(`/custom-package-requests/${request._id}`);
      setSelectedRequest(res.data);
    } catch (err) {
      console.error('Error fetching request:', err);
      setSelectedRequest(request);
    }
    setViewRequestDialogOpen(true);
  };

  const handleRequestStatusUpdate = (request) => {
    setSelectedRequest(request);
    setStatusUpdateData({
      status: request.status,
      adminNotes: request.adminNotes || ''
    });
    setStatusUpdateDialog(true);
  };

  const handleStatusUpdateSubmit = async () => {
    if (!selectedRequest) return;

    try {
      const api = getApiInstance();
      const response = await api.put(`/custom-package-requests/${selectedRequest._id}/status`, {
        status: statusUpdateData.status,
        adminNotes: '' // No notes needed
      });
      
      // Close dialog and reset state
      setStatusUpdateDialog(false);
      setSelectedRequest(null);
      setStatusUpdateData({ status: '', adminNotes: '' });
      
      // Refresh the requests list to show updated status
      await fetchRequests();
      setError(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const getRequestStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      reviewing: 'info',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
    };
    return colors[status] || 'default';
  };

  const getRequestStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      reviewing: 'Reviewing',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  const fetchOrganizations = async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.response?.data?.error || 'Failed to load organizations');
    }
  };

  const handleOpenCreatePackageDialog = () => {
    if (!selectedRequest) return;
    
    // Pre-fill data from request
    setCreatePackageData({
      organizationId: '',
      contractPricing: {
        amount: selectedRequest.requestedModifications?.customPricing?.amount || '',
        currency: selectedRequest.requestedModifications?.customPricing?.currency || 'EUR',
        billingType: selectedRequest.requestedModifications?.customPricing?.billingType || 'one_time'
      },
      seatLimit: selectedRequest.requestedModifications?.seatLimit || '',
      contract: {
        startDate: selectedRequest.requestedModifications?.contractDuration?.startDate 
          ? new Date(selectedRequest.requestedModifications.contractDuration.startDate).toISOString().split('T')[0]
          : '',
        endDate: selectedRequest.requestedModifications?.contractDuration?.endDate
          ? new Date(selectedRequest.requestedModifications.contractDuration.endDate).toISOString().split('T')[0]
          : ''
      }
    });
    
    fetchOrganizations();
    setCreatePackageDialogOpen(true);
  };

  const handleCreateCustomPackage = async () => {
    if (!selectedRequest) return;

    try {
      setCreatingPackage(true);
      setError(null);
      // First check/create organization
      let organizationId = createPackageData.organizationId;
      
      if (!organizationId) {
        // Create organization from request
        const api = getApiInstance();
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
      const api = getApiInstance();
      const customPackageData = {
        organizationId: organizationId,
        basePackageId: selectedRequest.basePackageId._id || selectedRequest.basePackageId,
        addedCardIds: selectedRequest.requestedModifications?.cardsToAdd || [],
        customPackageRequestId: selectedRequest._id, // Pass request ID so email can be sent to requester
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
          status: 'active'
        },
        expiryTime: createPackageData.expiryTime ? parseInt(createPackageData.expiryTime) : null,
        expiryTimeUnit: createPackageData.expiryTimeUnit || null,
        status: 'active'
      };

      console.log('📦 Creating custom package with data:', {
        organizationId: organizationId,
        customPackageRequestId: selectedRequest._id,
        contactEmail: selectedRequest.contactEmail
      });

      const customPackageRes = await api.post('/custom-packages', customPackageData);

      console.log('✅ Custom package created:', customPackageRes.data._id);
      console.log('📧 Email status from API:', {
        emailSent: customPackageRes.data.emailSent,
        emailRecipient: customPackageRes.data.emailRecipient,
        emailError: customPackageRes.data.emailError
      });

      // Show success message with email status
      if (customPackageRes.data.emailSent) {
        setSnackbar({
          open: true,
          message: `Custom package created successfully! Email sent to ${customPackageRes.data.emailRecipient}`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Custom package created successfully! ${customPackageRes.data.emailError || 'Email could not be sent'}`,
          severity: 'warning'
        });
      }

      // Update request status to completed (this will also trigger email if not already sent)
      await api.put(`/custom-package-requests/${selectedRequest._id}/status`, {
        status: 'completed',
        adminNotes: `Custom package created successfully. Package ID: ${customPackageRes.data._id}`,
        customPackageId: customPackageRes.data._id
      });

      console.log('✅ Request status updated to completed');

      setCreatePackageDialogOpen(false);
      setSelectedRequest(null);
      setCreatePackageData({
        organizationId: '',
        contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
        seatLimit: '',
        contract: { startDate: '' },
        expiryTime: null,
        expiryTimeUnit: null
      });
      fetchRequests();
      setError(null);
    } catch (err) {
      console.error('Error creating custom package:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create custom package');
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.error || err.message || 'Failed to create custom package'}`,
        severity: 'error'
      });
    } finally {
      setCreatingPackage(false);
    }
  };

  if (loading && (mainTab === 0 || (mainTab === 1 && b2bTab !== 2))) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h4">Packages</Typography>
          {(mainTab === 0 || (mainTab === 1 && b2bTab === 0)) && (
            <Box display="flex" gap={2} alignItems="center" sx={{ 
              flexWrap: 'wrap',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              '& > *': {
                width: { xs: 'auto', sm: 'auto' }
              }
            }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                overflow: 'visible',
                mt: 1,
                '& .MuiInputBase-root': {
                  overflow: 'visible',
                }
              }}
            >
              <InputLabel 
                id="status-filter-label"
                sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'translate(14px, 16px) scale(1)',
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  whiteSpace: 'nowrap',
                  maxWidth: 'none',
                  width: 'auto',
                  zIndex: 1,
                  backgroundColor: 'white',
                  px: 0.5,
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                    transformOrigin: 'top left',
                    maxWidth: 'calc(133% - 18.67px)',
                    backgroundColor: 'white',
                  },
                  '&.Mui-focused': {
                    color: 'primary.main',
                  }
                }}
              >
                Filter by Status
              </InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '1px',
                  },
                  '& .MuiSelect-select': {
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    minWidth: 'fit-content',
                  },
                  '& .MuiInputBase-root': {
                    overflow: 'visible',
                  }
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
            {/* Create Package button hidden - packages are predefined */}
            </Box>
          )}
        </Box>
      </Box>

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={mainTab}
          onChange={(e, newValue) => {
            setMainTab(newValue);
            if (newValue === 1) {
              setB2bTab(0); // Reset to B2B tab when switching to B2B/B2E
            }
          }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab label="B2C" />
          <Tab label="B2B/B2E" />
        </Tabs>
      </Box>

      {/* B2C Tab Content */}
      {mainTab === 0 && (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Visibility</TableCell>
                    <TableCell>Pricing</TableCell>
                    <TableCell>Max Seats</TableCell>
                    <TableCell>Expiry Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">No packages found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map((pkg) => (
                      <TableRow key={pkg._id}>
                        <TableCell>{pkg.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={pkg.category || pkg.packageType || 'standard'}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pkg.status}
                            color={pkg.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{pkg.visibility}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              €{pkg.pricing?.amount || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pkg.pricing?.billingType === 'one_time' ? 'One-time' :
                               pkg.pricing?.billingType === 'subscription' ? 'Subscription' :
                               pkg.pricing?.billingType === 'per_seat' ? 'Per Seat' : 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {pkg.maxSeats || 5}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pkg.expiryTime && pkg.expiryTimeUnit 
                              ? `${pkg.expiryTime} ${pkg.expiryTimeUnit === 'months' ? 'Month' : 'Year'}${pkg.expiryTime !== 1 ? 's' : ''}`
                              : 'No expiry'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <IconButton size="small" onClick={() => handleOpen(pkg)} title="Edit">
                              <EditIcon />
                            </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleArchiveClick(pkg)}
                                  title={pkg.status === 'archived' ? 'Unarchive' : 'Archive'}
                                  color={pkg.status === 'archived' ? 'primary' : 'default'}
                                >
                                  {pkg.status === 'archived' ? <UnarchiveIcon /> : <ArchiveIcon />}
                                </IconButton>
                                {/* Delete button commented out - only edit allowed */}
                                {/* <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteClick(pkg)}
                                  title="Permanently Delete"
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton> */}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* B2B/B2E Tab Content */}
      {mainTab === 1 && (
        <>
          {/* Sub-tabs for B2B/B2E */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={b2bTab}
              onChange={(e, newValue) => setB2bTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                },
              }}
            >
              <Tab label="B2B/B2E Standard" />
              <Tab label="Custom Packages" />
            </Tabs>
          </Box>

          {/* B2B/B2E Standard Sub-tab */}
          {b2bTab === 0 && (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Visibility</TableCell>
                        <TableCell>Pricing</TableCell>
                        <TableCell>Max Seats</TableCell>
                        <TableCell>Expiry Time</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {packages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography color="text.secondary">No packages found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        packages.map((pkg) => (
                          <TableRow key={pkg._id}>
                            <TableCell>{pkg.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={pkg.category || pkg.packageType || 'standard'}
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={pkg.status}
                                color={pkg.status === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{pkg.visibility}</TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  €{pkg.pricing?.amount || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {pkg.pricing?.billingType === 'one_time' ? 'One-time' :
                                   pkg.pricing?.billingType === 'subscription' ? 'Subscription' :
                                   pkg.pricing?.billingType === 'per_seat' ? 'Per Seat' : 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {pkg.maxSeats || 5}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {pkg.expiryTime && pkg.expiryTimeUnit 
                                  ? `${pkg.expiryTime} ${pkg.expiryTimeUnit === 'months' ? 'Month' : 'Year'}${pkg.expiryTime !== 1 ? 's' : ''}`
                                  : 'No expiry'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={0.5}>
                                <IconButton size="small" onClick={() => handleOpen(pkg)} title="Edit">
                                  <EditIcon />
                                </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleArchiveClick(pkg)}
                              title={pkg.status === 'archived' ? 'Unarchive' : 'Archive'}
                              color={pkg.status === 'archived' ? 'primary' : 'default'}
                            >
                              {pkg.status === 'archived' ? <UnarchiveIcon /> : <ArchiveIcon />}
                            </IconButton>
                            {/* Delete button commented out - only edit allowed */}
                            {/* <IconButton 
                              size="small" 
                              onClick={() => handleDeleteClick(pkg)}
                              title="Permanently Delete"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton> */}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
              )}
            </>
          )}

          {/* Custom Packages Sub-tab */}
          {b2bTab === 1 && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Custom Packages:</strong> These are custom packages created for B2B and B2E organizations. 
                  Custom packages are only available for B2B/B2E, not for B2C.
                </Typography>
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {customPackagesLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Organization/Institute</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Seat Limit</TableCell>
                        <TableCell>Contract Period</TableCell>
                        <TableCell>Pricing</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customPackages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">No custom packages found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        customPackages.map((pkg) => (
                          <TableRow key={pkg._id}>
                            <TableCell>{pkg.name || 'Unknown'}</TableCell>
                            <TableCell>
                              {pkg.organizationId?.name || pkg.schoolId?.name || 'N/A'}
                              {pkg.entityType && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  ({pkg.entityType === 'organization' ? 'Organization' : 'Institute'})
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={pkg.contract?.status || pkg.status || 'pending'}
                                color={
                                  pkg.contract?.status === 'active' || pkg.status === 'active' 
                                    ? 'success' 
                                    : pkg.contract?.status === 'expired' || pkg.status === 'archived'
                                    ? 'error'
                                    : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{pkg.seatLimit || 0}</TableCell>
                            <TableCell>
                              {pkg.contract?.startDate && pkg.contract?.endDate ? (
                                <Box>
                                  <Typography variant="body2">
                                    {new Date(pkg.contract.startDate).toLocaleDateString()} - {new Date(pkg.contract.endDate).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  €{pkg.contractPricing?.amount || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {pkg.contractPricing?.billingType || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditCustomPackage(pkg)}
                                color="primary"
                                title="Edit"
                              >
                                <EditIcon />
                              </IconButton>
                              {/* Delete button commented out - only edit allowed */}
                              {/* <IconButton 
                                size="small" 
                                onClick={() => handleDeleteCustomPackage(pkg)}
                                color="error"
                                title="Delete"
                              >
                                <DeleteIcon />
                              </IconButton> */}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </>
      )}

      {/* Old content - remove later */}
      {false && mainTab === 0 && (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Visibility</TableCell>
                  <TableCell>Pricing</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No packages found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <TableRow key={pkg._id}>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={pkg.status}
                          color={pkg.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{pkg.visibility}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            €{pkg.pricing?.amount || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pkg.pricing?.billingType === 'one_time' ? 'One-time' :
                             pkg.pricing?.billingType === 'subscription' ? 'Subscription' :
                             pkg.pricing?.billingType === 'per_seat' ? 'Per Seat' : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small" onClick={() => handleOpen(pkg)} title="Edit">
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleArchiveClick(pkg)}
                            title={pkg.status === 'archived' ? 'Unarchive' : 'Archive'}
                            color={pkg.status === 'archived' ? 'primary' : 'default'}
                          >
                            {pkg.status === 'archived' ? <UnarchiveIcon /> : <ArchiveIcon />}
                          </IconButton>
                          {/* Delete button commented out - only edit allowed */}
                          {/* <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(pkg)}
                            title="Permanently Delete"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton> */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Custom Package Requests Tab - Removed, moved to separate page or can be added back if needed */}
      {false && mainTab === 1 && b2bTab === 3 && (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={requestStatusFilter}
                label="Filter by Status"
                onChange={(e) => setRequestStatusFilter(e.target.value)}
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

          {requestsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : (
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
                          <Typography variant="caption" color="text.secondary" display="block">
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
                            label={getRequestStatusLabel(request.status)}
                            color={getRequestStatusColor(request.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewRequest(request)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Package' : 'Create Package'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="package-type-select-label">Package Type / Category</InputLabel>
                <Select
                  labelId="package-type-select-label"
                  id="package-type-select"
                  value={formData.packageType || 'standard'}
                  label="Package Type / Category"
                  onChange={(e) => {
                    const newPackageType = e.target.value;
                    console.log('Package type selected:', newPackageType); // Debug
                    setFormData(prev => ({ 
                      ...prev, 
                      packageType: newPackageType,
                      category: newPackageType // Sync category with packageType
                    }));
                  }}
                  required
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {/* Show all 5 package types for both B2C and B2B/B2E */}
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="digital">Digital</MenuItem>
                  <MenuItem value="physical">Physical Cards</MenuItem>
                  <MenuItem value="digital_physical">Digital + Physical Cards</MenuItem>
                  <MenuItem value="renewal">Yearly Digital Renewal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Visibility"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="hidden">Hidden</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price Amount"
                type="number"
                value={formData.pricing.amount}
                onChange={(e) => setFormData({
                  ...formData,
                  pricing: { ...formData.pricing, amount: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Billing Type"
                value={formData.pricing.billingType}
                onChange={(e) => setFormData({
                  ...formData,
                  pricing: { ...formData.pricing, billingType: e.target.value }
                })}
                required
              >
                <MenuItem value="one_time">One Time</MenuItem>
                <MenuItem value="subscription">Subscription</MenuItem>
                <MenuItem value="per_seat">Per Seat</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="target-audiences-label">Target Audiences</InputLabel>
                <Select
                  labelId="target-audiences-label"
                  multiple
                  value={formData.targetAudiences || []}
                  onChange={(e) => setFormData({ ...formData, targetAudiences: e.target.value })}
                  input={<OutlinedInput label="Target Audiences" />}
                  renderValue={(selected) => {
                    if (selected.length === 0) return '';
                    return selected.join(', ');
                  }}
                >
                  {mainTab === 0 ? (
                    // B2C tab - only B2C option
                    <MenuItem value="B2C">B2C</MenuItem>
                  ) : (
                    // B2B/B2E tab - B2B and B2E options
                    <>
                      <MenuItem value="B2B">B2B</MenuItem>
                      <MenuItem value="B2E">B2E</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Seats"
                type="number"
                value={formData.maxSeats || 5}
                onChange={(e) => setFormData({ ...formData, maxSeats: parseInt(e.target.value) || 5 })}
                inputProps={{ min: 1 }}
                helperText="Maximum number of seats/users allowed for this package"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Expiry Time Unit"
                value={formData.expiryTimeUnit || ''}
                onChange={(e) => setFormData({ ...formData, expiryTimeUnit: e.target.value })}
                helperText="Select months or years"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="months">Months</MenuItem>
                <MenuItem value="years">Years</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={formData.expiryTimeUnit === 'months' ? 'Number of Months' : formData.expiryTimeUnit === 'years' ? 'Number of Years' : 'Expiry Time'}
                type="number"
                value={formData.expiryTime || ''}
                onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value ? parseInt(e.target.value) : null })}
                inputProps={{ min: 1 }}
                disabled={!formData.expiryTimeUnit}
                helperText={formData.expiryTimeUnit ? `Enter number of ${formData.expiryTimeUnit}` : 'Select expiry time unit first'}
              />
            </Grid>
            {/* Included Cards field removed - packages are predefined */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={archiveDialogOpen}
        onClose={handleArchiveCancel}
        aria-labelledby="archive-dialog-title"
        aria-describedby="archive-dialog-description"
      >
        <DialogTitle id="archive-dialog-title">
          {packageToArchive?.status === 'archived' ? 'Unarchive' : 'Archive'} Package
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="archive-dialog-description">
            {packageToArchive?.status === 'archived' 
              ? `Are you sure you want to unarchive "${packageToArchive?.name}"? It will become active and visible again.`
              : `Are you sure you want to archive "${packageToArchive?.name}"? It will be hidden from public view but can be restored later.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleArchiveCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleArchiveConfirm} variant="contained" autoFocus>
            {packageToArchive?.status === 'archived' ? 'Unarchive' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Package
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to permanently delete <strong>{packageToDelete?.name}</strong>? 
            This action cannot be undone and the package will be removed from the database.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Request Details Dialog */}
      <Dialog
        open={viewRequestDialogOpen}
        onClose={() => {
          setViewRequestDialogOpen(false);
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
                    label={getRequestStatusLabel(selectedRequest.status)}
                    color={getRequestStatusColor(selectedRequest.status)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                {selectedRequest.adminNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Admin Notes
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRequest.adminNotes}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Requested Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewRequestDialogOpen(false);
            setSelectedRequest(null);
          }}>
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setViewRequestDialogOpen(false);
              handleRequestStatusUpdate(selectedRequest);
            }}
            startIcon={<EditIcon />}
          >
            Update Status
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setViewRequestDialogOpen(false);
              handleOpenCreatePackageDialog();
            }}
            startIcon={<CheckCircleIcon />}
            disabled={!selectedRequest}
          >
            Create Custom Package
          </Button>
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
            <FormControl fullWidth>
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
        open={createPackageDialogOpen}
        onClose={creatingPackage ? undefined : () => {
          setCreatePackageDialogOpen(false);
          setCreatePackageData({
            organizationId: '',
            contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
            seatLimit: '',
            contract: { startDate: '' },
            expiryTime: null,
            expiryTimeUnit: null
          });
        }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={creatingPackage}
      >
        <DialogTitle>
          Create Custom Package
          {creatingPackage && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Creating package and sending email...
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Organization</InputLabel>
                  <Select
                    value={createPackageData.organizationId}
                    label="Organization"
                    onChange={(e) => setCreatePackageData({ ...createPackageData, organizationId: e.target.value })}
                    disabled={creatingPackage}
                  >
                    <MenuItem value="">
                      <em>Create New Organization</em>
                    </MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org._id} value={org._id}>
                        {org.name} ({org.segment})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!createPackageData.organizationId && selectedRequest && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    New organization will be created: {selectedRequest.organizationName}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contract Amount (€)"
                  type="number"
                  value={createPackageData.contractPricing.amount}
                  onChange={(e) => setCreatePackageData({
                    ...createPackageData,
                    contractPricing: { ...createPackageData.contractPricing, amount: e.target.value }
                  })}
                  required
                  disabled={creatingPackage}
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
                      contractPricing: { ...createPackageData.contractPricing, billingType: e.target.value }
                    })}
                    disabled={creatingPackage}
                  >
                    <MenuItem value="one_time">One Time</MenuItem>
                    <MenuItem value="subscription">Subscription</MenuItem>
                    <MenuItem value="per_seat">Per Seat</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Seat Limit"
                  type="number"
                  value={createPackageData.seatLimit}
                  onChange={(e) => setCreatePackageData({ ...createPackageData, seatLimit: e.target.value })}
                  required
                  disabled={creatingPackage}
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
                  required
                  disabled={creatingPackage}
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
                    disabled={creatingPackage}
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
                  disabled={creatingPackage || !createPackageData.expiryTimeUnit}
                  helperText={createPackageData.expiryTimeUnit ? `Enter number of ${createPackageData.expiryTimeUnit}` : 'Select expiry time unit first'}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (!creatingPackage) {
                setCreatePackageDialogOpen(false);
                setCreatePackageData({
                  organizationId: '',
                  contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
                  seatLimit: '',
                  contract: { startDate: '', endDate: '' }
                });
              }
            }}
            disabled={creatingPackage}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCustomPackage} 
            variant="contained" 
            color="success"
            disabled={creatingPackage}
            startIcon={creatingPackage ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {creatingPackage ? 'Creating Package & Sending Email...' : 'Create Package'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Custom Package Dialog */}
      <Dialog
        open={editCustomPackageDialog}
        onClose={() => {
          setEditCustomPackageDialog(false);
          setEditingCustomPackage(null);
          setEditCustomPackageData({
            name: '',
            seatLimit: '',
            contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
            contract: { startDate: '', endDate: '', status: 'active' },
            expiryTime: null,
            expiryTimeUnit: null,
            selectedProductIds: [],
            status: 'active'
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Custom Package</DialogTitle>
        <DialogContent>
          {editingCustomPackage && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#063C5E', mb: 1 }}>
                    {editingCustomPackage.entityType === 'organization' ? 'Organization' : editingCustomPackage.entityType === 'institute' ? 'Institute' : 'Organization/Institute'}: {editingCustomPackage.organizationId?.name || editingCustomPackage.schoolId?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Package Name"
                    value={editCustomPackageData.name}
                    onChange={(e) => setEditCustomPackageData({ ...editCustomPackageData, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Seat Limit"
                    type="number"
                    value={editCustomPackageData.seatLimit}
                    onChange={(e) => setEditCustomPackageData({ ...editCustomPackageData, seatLimit: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contract Amount (€)"
                    type="number"
                    value={editCustomPackageData.contractPricing.amount}
                    onChange={(e) => setEditCustomPackageData({
                      ...editCustomPackageData,
                      contractPricing: { ...editCustomPackageData.contractPricing, amount: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Billing Type</InputLabel>
                    <Select
                      value={editCustomPackageData.contractPricing.billingType}
                      label="Billing Type"
                      onChange={(e) => setEditCustomPackageData({
                        ...editCustomPackageData,
                        contractPricing: { ...editCustomPackageData.contractPricing, billingType: e.target.value }
                      })}
                    >
                      <MenuItem value="one_time">One Time</MenuItem>
                      <MenuItem value="subscription">Subscription</MenuItem>
                      <MenuItem value="per_seat">Per Seat</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Contract Status</InputLabel>
                    <Select
                      value={editCustomPackageData.contract.status}
                      label="Contract Status"
                      onChange={(e) => setEditCustomPackageData({
                        ...editCustomPackageData,
                        contract: { ...editCustomPackageData.contract, status: e.target.value }
                      })}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contract Start Date"
                    type="date"
                    value={editCustomPackageData.contract.startDate}
                    onChange={(e) => setEditCustomPackageData({
                      ...editCustomPackageData,
                      contract: { ...editCustomPackageData.contract, startDate: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contract End Date"
                    type="date"
                    value={editCustomPackageData.contract.endDate}
                    onChange={(e) => setEditCustomPackageData({
                      ...editCustomPackageData,
                      contract: { ...editCustomPackageData.contract, endDate: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Expiry Time Unit</InputLabel>
                    <Select
                      value={editCustomPackageData.expiryTimeUnit || ''}
                      label="Expiry Time Unit"
                      onChange={(e) => setEditCustomPackageData({ 
                        ...editCustomPackageData, 
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
                    value={editCustomPackageData.expiryTime || ''}
                    onChange={(e) => setEditCustomPackageData({ 
                      ...editCustomPackageData, 
                      expiryTime: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    disabled={!editCustomPackageData.expiryTimeUnit}
                    helperText={editCustomPackageData.expiryTimeUnit ? `Enter number of ${editCustomPackageData.expiryTimeUnit}` : 'Select expiry time unit first'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Package Status</InputLabel>
                    <Select
                      value={editCustomPackageData.status}
                      label="Package Status"
                      onChange={(e) => setEditCustomPackageData({ ...editCustomPackageData, status: e.target.value })}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Products Section - Editable */}
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
                      <InputLabel id="edit-products-label">Select Products</InputLabel>
                      <Select
                        labelId="edit-products-label"
                        multiple
                        value={(editCustomPackageData.selectedProductIds || []).map(id => id?.toString ? id.toString() : String(id))}
                        onChange={(e) => {
                          const selectedIds = e.target.value;
                          // Convert back to product objects/IDs
                          const products = allProducts.filter(p => {
                            const pId = p._id?.toString ? p._id.toString() : String(p._id);
                            return selectedIds.includes(pId) && p.visibility === 'private';
                          });
                          setEditCustomPackageData({
                            ...editCustomPackageData,
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
                                    label={`${product.name} (€${product.price})`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(11, 120, 151, 0.1)',
                                      color: '#0B7897',
                                      fontWeight: 500
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
                        {loadingProducts ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading...
                          </MenuItem>
                        ) : allProducts.filter(p => p.visibility === 'private').length === 0 ? (
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
                                    €{product.price}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            );
                          })
                        )}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Selected: {editCustomPackageData.selectedProductIds?.length || 0} product(s)
                      </Typography>
                    </FormControl>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditCustomPackageDialog(false);
            setEditingCustomPackage(null);
            setEditCustomPackageData({
              name: '',
              seatLimit: '',
              contractPricing: { amount: '', currency: 'EUR', billingType: 'one_time' },
              contract: { startDate: '', endDate: '', status: 'active' },
              status: 'active'
            });
          }}>
            Cancel
          </Button>
          <Button onClick={handleUpdateCustomPackage} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Custom Package Dialog */}
      <Dialog
        open={deleteCustomPackageDialog}
        onClose={() => {
          setDeleteCustomPackageDialog(false);
          setCustomPackageToDelete(null);
        }}
      >
        <DialogTitle>Delete Custom Package</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the custom package for <strong>{customPackageToDelete?.organizationId?.name || 'this organization'}</strong>?
            <br />
            <br />
            This action cannot be undone. The package will be removed from the organization&apos;s custom packages list.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteCustomPackageDialog(false);
            setCustomPackageToDelete(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteCustomPackage} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

