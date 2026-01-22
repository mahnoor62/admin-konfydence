'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
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

export default function Sales() {
  const [tabValue, setTabValue] = useState(0);
  const [allTransactions, setAllTransactions] = useState([]);
  const [b2bB2eContracts, setB2bB2eContracts] = useState([]);
  const [allMemberships, setAllMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingContract, setIsDeletingContract] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      
      if (tabValue === 0) {
        // Fetch all transactions - ensure we get ALL transaction types
        const params = {};
        if (typeFilter && typeFilter !== 'all') {
          params.type = typeFilter;
        }
        // When filter is 'all' or undefined, don't pass type param to get ALL transactions
        
        const allTxRes = await api.get('/transactions/all', { params });
        
        // Set all transactions - this will show ALL transaction types
        setAllTransactions(allTxRes.data || []);
        
        // Also fetch B2B/B2E contracts and custom packages for the contracts tab (tabValue === 1)
        // Use Promise.allSettled to handle errors gracefully - don't let these break transactions display
        const [b2bResult, customPackagesResult] = await Promise.allSettled([
          api.get('/transactions/b2b-b2e').catch(() => ({ data: [] })),
          api.get('/custom-packages').catch(() => ({ data: [] })),
        ]);
        
        const b2bRes = b2bResult.status === 'fulfilled' ? b2bResult.value : { data: [] };
        const customPackagesRes = customPackagesResult.status === 'fulfilled' ? customPackagesResult.value : { data: [] };
        
        // Combine B2B/B2E transactions with custom packages
        // Filter out transactions without organizationId, schoolId, or customPackageId
        const transactions = (b2bRes.data || []).filter(tx => 
          tx.organizationId || tx.schoolId || tx.customPackageId
        );
        
        // Filter out custom packages without organizationId
        const customPackages = (customPackagesRes.data || [])
          .filter(pkg => pkg.organizationId) // Only include packages with organizationId
          .map(pkg => ({
            _id: pkg._id,
            organizationId: pkg.organizationId,
            customPackageId: pkg,
            type: pkg.organizationId?.segment === 'B2E' ? 'b2e_contract' : 'b2b_contract',
            amount: pkg.contractPricing?.amount || 0,
            currency: pkg.contractPricing?.currency || 'USD',
            status: pkg.contract?.status === 'active' ? 'paid' : pkg.contract?.status === 'expired' ? 'expired' : 'pending',
            contractPeriod: {
              startDate: pkg.contract?.startDate,
              endDate: pkg.contract?.endDate
            },
            createdAt: pkg.createdAt
          }));
        
        // Combine and sort by date
        const allContracts = [...transactions, ...customPackages].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setB2bB2eContracts(allContracts);
      } else if (tabValue === 1) {
        // Fetch contracts
        const [b2bRes, customPackagesRes] = await Promise.all([
          api.get('/transactions/b2b-b2e'),
          api.get('/custom-packages'),
        ]);
        
        // Combine B2B/B2E transactions with custom packages
        const transactions = (b2bRes.data || []).filter(tx => 
          tx.organizationId || tx.customPackageId
        );
        
        const customPackages = (customPackagesRes.data || [])
          .filter(pkg => pkg.organizationId)
          .map(pkg => ({
            _id: pkg._id,
            organizationId: pkg.organizationId,
            customPackageId: pkg,
            type: pkg.organizationId?.segment === 'B2E' ? 'b2e_contract' : 'b2b_contract',
            amount: pkg.contractPricing?.amount || 0,
            currency: pkg.contractPricing?.currency || 'USD',
            status: pkg.contract?.status === 'active' ? 'paid' : pkg.contract?.status === 'expired' ? 'expired' : 'pending',
            contractPeriod: {
              startDate: pkg.contract?.startDate,
              endDate: pkg.contract?.endDate
            },
            createdAt: pkg.createdAt
          }));
        
        const allContracts = [...transactions, ...customPackages].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setB2bB2eContracts(allContracts);
      } else if (tabValue === 2) {
        // Fetch memberships
        const params = {};
        if (membershipStatusFilter !== 'all') params.status = membershipStatusFilter;
        
        const membershipsRes = await api.get('/users/memberships', { params });
        setAllMemberships(membershipsRes.data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load sales data';
      // If error is "User not found" or 404 from B2B/B2E endpoint, don't break transactions display
      // Only show error if we actually failed to get the main data for the current tab
      if (errorMessage === 'User not found' || err.response?.status === 404) {
        setError(null); // Hide error - transactions might still be available
        // If transactions weren't set yet, set empty arrays
        if (tabValue === 0 && allTransactions.length === 0) {
          setAllTransactions([]); // Show "No transactions found"
        } else if (tabValue === 1 && b2bB2eContracts.length === 0) {
          setB2bB2eContracts([]); // Show "No B2B/B2E contracts found"
        } else if (tabValue === 2 && allMemberships.length === 0) {
          setAllMemberships([]); // Show "No memberships found"
        }
      } else {
        // Only show error for actual failures, not for optional endpoints
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [tabValue, typeFilter, membershipStatusFilter]);

  useEffect(() => {
    fetchData();
  }, [typeFilter, tabValue, fetchData]);

  const handleOpenDelete = (item, isContract = false, isMembership = false) => {
    setItemToDelete({ ...item, isContract, isMembership });
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleOpenView = (transaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const api = getApiInstance();
      
      if (itemToDelete.isContract) {
        setIsDeletingContract(true);
        // Delete custom package
        await api.delete(`/custom-packages/${itemToDelete._id}`);
      } else if (itemToDelete.isMembership) {
        setDeleting(true);
        // Delete membership - _id is the user's ID
        await api.delete(`/users/${itemToDelete._id}/membership`);
      } else {
        setDeleting(true);
        // Delete transaction
        await api.delete(`/transactions/${itemToDelete._id}`);
      }
      
      fetchData();
      handleCloseDelete();
      setError(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.response?.data?.error || 'Failed to delete item');
    } finally {
      setDeleting(false);
      setIsDeletingContract(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
    return `${currencySymbol} ${(amount || 0).toFixed(2)}`;
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
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={{ xs: 2, md: 0 }}
        mb={2}
      >
        <Typography variant="h4">
          Sales & Memberships
        </Typography>
        {tabValue === 0 && (
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <InputLabel id="type-filter-label" sx={{ 
              px: 1,
              mt: 0.5,
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75)'
              }
            }}>
              Filter by Type
            </InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              label="Filter by Type"
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ 
                height: '40px',
                '& .MuiSelect-select': {
                  paddingTop: '12px',
                  paddingBottom: '12px'
                }
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="b2c_purchase">B2C Purchase</MenuItem>
              <MenuItem value="b2c_renewal">B2C Renewal</MenuItem>
              <MenuItem value="b2b_contract">B2B Contract</MenuItem>
              <MenuItem value="b2e_contract">B2E Contract</MenuItem>
            </Select>
          </FormControl>
        )}
        {tabValue === 2 && (
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <InputLabel id="membership-status-filter-label" sx={{ 
              px: 1,
              mt: 0.5,
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75)'
              }
            }}>
              Filter by Status
            </InputLabel>
            <Select
              labelId="membership-status-filter-label"
              value={membershipStatusFilter}
              label="Filter by Status"
              onChange={(e) => {
                setMembershipStatusFilter(e.target.value);
                fetchData();
              }}
              sx={{ 
                height: '40px',
                '& .MuiSelect-select': {
                  paddingTop: '12px',
                  paddingBottom: '12px'
                }
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)} 
        sx={{ 
          mb: 3,
          '& .MuiTabs-flexContainer': {
            flexWrap: { xs: 'wrap', md: 'nowrap' }
          }
        }}
      >
        <Tab 
          label="Transactions" 
          sx={{ 
            minWidth: { xs: 'auto', md: 72 },
            flex: { xs: 'none', md: '0 1 auto' }
          }} 
        />
        <Tab 
          label="B2B/B2E Contracts" 
          sx={{ 
            minWidth: { xs: 'auto', md: 72 },
            flex: { xs: 'none', md: '0 1 auto' }
          }} 
        />
        <Tab 
          label="Memberships" 
          sx={{ 
            minWidth: { xs: 'auto', md: 72 },
            flex: { xs: 'none', md: '0 1 auto' }
          }} 
        />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User/Organization</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Stripe Payment ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No transactions found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  allTransactions.map((tx) => {
                    // Handle missing/deleted users - show "User Deleted" if userId exists but user data is missing/null
                    let userDisplay = 'N/A';
                    if (tx.userId) {
                      // Check if userId is an object (populated) or just an ID
                      if (typeof tx.userId === 'object' && tx.userId !== null) {
                        // User is populated - check if it has name or email
                        if (tx.userId.name || tx.userId.email) {
                          userDisplay = tx.userId.name || tx.userId.email;
                        } else {
                          // userId exists but no user data - user was deleted
                          userDisplay = 'User Deleted';
                        }
                      } else {
                        // userId is just an ID but not populated - user might be deleted
                        userDisplay = 'User Deleted';
                      }
                    } else if (tx.organizationId?.name) {
                      userDisplay = tx.organizationId.name;
                    } else if (tx.schoolId?.name) {
                      userDisplay = tx.schoolId.name;
                    }
                    
                    return (
                    <TableRow key={tx._id}>
                      <TableCell>
                        {userDisplay}
                      </TableCell>
                      <TableCell>
                        {tx.packageId?.name || tx.customPackageId?.name || (tx.packageType ? tx.packageType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A')}
                      </TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>{formatCurrency(tx.amount, tx.currency)}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          color={
                            tx.status === 'paid' ? 'success' :
                            tx.status === 'pending' ? 'warning' :
                            tx.status === 'failed' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {tx.stripePaymentIntentId ? (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {tx.stripePaymentIntentId.substring(0, 20)}...
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenView(tx)} 
                            color="primary"
                            title="View Details"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDelete(tx, false)} 
                            color="error"
                            title="Delete Transaction"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Organization/School</TableCell>
                <TableCell>Custom Package</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Contract Period</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {b2bB2eContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">No B2B/B2E contracts found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                b2bB2eContracts.map((contract) => (
                  <TableRow key={contract._id}>
                    <TableCell>
                      {contract.organizationId?.name || contract.schoolId?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {contract.customPackageId?.name || 
                       contract.customPackageId?.basePackageId?.name || 
                       'N/A'}
                    </TableCell>
                    <TableCell>{contract.type}</TableCell>
                    <TableCell>{formatCurrency(contract.amount, contract.currency)}</TableCell>
                    <TableCell>
                      <Chip
                        label={contract.status}
                        color={
                          contract.status === 'paid' ? 'success' :
                          contract.status === 'pending' ? 'warning' :
                          contract.status === 'expired' ? 'error' :
                          contract.status === 'failed' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {contract.contractPeriod?.startDate && contract.contractPeriod?.endDate
                        ? `${new Date(contract.contractPeriod.startDate).toLocaleDateString()} - ${new Date(contract.contractPeriod.endDate).toLocaleDateString()}`
                        : contract.customPackageId?.contract?.startDate && contract.customPackageId?.contract?.endDate
                        ? `${new Date(contract.customPackageId.contract.startDate).toLocaleDateString()} - ${new Date(contract.customPackageId.contract.endDate).toLocaleDateString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDelete(contract, true)} 
                        color="error"
                        title="Delete Contract"
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

      {tabValue === 2 && (
        <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Membership Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allMemberships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No memberships found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  allMemberships.map((membership) => (
                    <TableRow key={membership._id}>
                      <TableCell>{membership.userName || 'N/A'}</TableCell>
                      <TableCell>{membership.userEmail || 'N/A'}</TableCell>
                      <TableCell>{membership.packageName || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={membership.membershipType?.toUpperCase() || 'N/A'}
                          color={
                            membership.membershipType === 'b2c' ? 'primary' :
                            membership.membershipType === 'b2b' ? 'secondary' :
                            membership.membershipType === 'b2e' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={membership.status}
                          color={
                            membership.status === 'active' ? 'success' :
                            membership.status === 'expired' ? 'error' :
                            membership.status === 'cancelled' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {membership.startDate ? new Date(membership.startDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {membership.endDate ? new Date(membership.endDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDelete(membership, false, true)} 
                          color="error"
                          title="Delete Membership"
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

      <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} maxWidth="sm" fullWidth>
        <DialogTitle>
          Delete {itemToDelete?.isContract ? 'Contract' : itemToDelete?.isMembership ? 'Membership' : 'Transaction'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {itemToDelete?.isContract ? 'contract' : itemToDelete?.isMembership ? 'membership' : 'transaction'}? 
            This action cannot be undone.
            {itemToDelete?.isContract && (
              <>
                <br />
                <br />
                This will also delete the custom package associated with this contract.
              </>
            )}
            {itemToDelete?.isMembership && (
              <>
                <br />
                <br />
                <strong>Membership Details:</strong>
                <br />
                User: {itemToDelete?.userName || 'N/A'}
                <br />
                Email: {itemToDelete?.userEmail || 'N/A'}
                <br />
                Package: {itemToDelete?.packageName || 'N/A'}
                <br />
                Type: {itemToDelete?.membershipType?.toUpperCase() || 'N/A'}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} disabled={deleting || isDeletingContract}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            disabled={deleting || isDeletingContract}
          >
            {deleting || isDeletingContract ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Transaction Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          Transaction Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedTransaction && (
            <Box>
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Basic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedTransaction._id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Chip label={selectedTransaction.type} size="small" color="primary" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedTransaction.status}
                    size="small"
                    color={
                      selectedTransaction.status === 'paid' ? 'success' :
                      selectedTransaction.status === 'pending' ? 'warning' :
                      selectedTransaction.status === 'failed' ? 'error' : 'default'
                    }
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </Typography>
                </Box>
              </Box>

              {/* Contract Period */}
              {(selectedTransaction.contractPeriod?.startDate || selectedTransaction.contractPeriod?.endDate) && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 3 }}>
                    Contract Period
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                    {selectedTransaction.contractPeriod.startDate && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                        <Typography variant="body2">
                          {new Date(selectedTransaction.contractPeriod.startDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                    {selectedTransaction.contractPeriod.endDate && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                        <Typography variant="body2">
                          {new Date(selectedTransaction.contractPeriod.endDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* Stripe Information */}
              {(selectedTransaction.stripePaymentIntentId || selectedTransaction.stripeSessionId) && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 3 }}>
                    Stripe Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mb: 3 }}>
                    {selectedTransaction.stripePaymentIntentId && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Payment Intent ID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {selectedTransaction.stripePaymentIntentId}
                        </Typography>
                      </Box>
                    )}
                    {selectedTransaction.stripeSessionId && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Session ID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {selectedTransaction.stripeSessionId}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* User/Organization Information */}
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 3 }}>
                Customer Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                {selectedTransaction.userId && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {typeof selectedTransaction.userId === 'object' ? selectedTransaction.userId._id : selectedTransaction.userId}
                      </Typography>
                    </Box>
                    {typeof selectedTransaction.userId === 'object' && selectedTransaction.userId.name && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">User Name</Typography>
                        <Typography variant="body2">{selectedTransaction.userId.name}</Typography>
                      </Box>
                    )}
                    {typeof selectedTransaction.userId === 'object' && selectedTransaction.userId.email && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">User Email</Typography>
                        <Typography variant="body2">{selectedTransaction.userId.email}</Typography>
                      </Box>
                    )}
                  </>
                )}
                {selectedTransaction.organizationId && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
                      <Typography variant="body2">
                        {selectedTransaction.organizationId.name || 'N/A'}
                      </Typography>
                    </Box>
                    {selectedTransaction.organizationId.segment && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Segment</Typography>
                        <Chip label={selectedTransaction.organizationId.segment} size="small" />
                      </Box>
                    )}
                  </>
                )}
                {selectedTransaction.schoolId && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">School</Typography>
                    <Typography variant="body2">
                      {selectedTransaction.schoolId.name || 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Package Information */}
              {(selectedTransaction.packageId || selectedTransaction.customPackageId) && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 3 }}>
                    Package Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                    {selectedTransaction.packageId && (
                      <>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Package Name</Typography>
                          <Typography variant="body2">{selectedTransaction.packageId.name || 'N/A'}</Typography>
                        </Box>
                        {selectedTransaction.packageId.description && (
                          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body2">{selectedTransaction.packageId.description}</Typography>
                          </Box>
                        )}
                      </>
                    )}
                    {selectedTransaction.customPackageId && (
                      <>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Custom Package ID</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {selectedTransaction.customPackageId._id || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Custom Package Name</Typography>
                          <Typography variant="body2">
                            {selectedTransaction.customPackageId.name || 'N/A'}
                          </Typography>
                        </Box>
                        {selectedTransaction.customPackageId.description && (
                          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body2">{selectedTransaction.customPackageId.description}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Entity Type</Typography>
                          <Chip 
                            label={selectedTransaction.customPackageId.entityType || 'N/A'} 
                            size="small" 
                            color="secondary"
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={selectedTransaction.customPackageId.status || 'N/A'} 
                            size="small"
                            color={
                              selectedTransaction.customPackageId.status === 'active' ? 'success' :
                              selectedTransaction.customPackageId.status === 'pending' ? 'warning' :
                              'default'
                            }
                          />
                        </Box>
                        {selectedTransaction.customPackageId.basePackageId && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Base Package</Typography>
                            <Typography variant="body2">
                              {selectedTransaction.customPackageId.basePackageId.name || 'N/A'}
                            </Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Seat Limit</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {selectedTransaction.customPackageId.seatLimit || 'N/A'}
                          </Typography>
                        </Box>
                        {selectedTransaction.customPackageId.contractPricing && (
                          <>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Contract Amount</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {formatCurrency(
                                  selectedTransaction.customPackageId.contractPricing.amount,
                                  selectedTransaction.customPackageId.contractPricing.currency
                                )}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Billing Type</Typography>
                              <Chip 
                                label={selectedTransaction.customPackageId.contractPricing.billingType || 'N/A'} 
                                size="small"
                                color="info"
                              />
                            </Box>
                            {selectedTransaction.customPackageId.contractPricing.notes && (
                              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                                <Typography variant="subtitle2" color="text.secondary">Pricing Notes</Typography>
                                <Typography variant="body2">
                                  {selectedTransaction.customPackageId.contractPricing.notes}
                                </Typography>
                              </Box>
                            )}
                          </>
                        )}
                        {selectedTransaction.customPackageId.contract && (
                          <>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Contract Start</Typography>
                              <Typography variant="body2">
                                {selectedTransaction.customPackageId.contract.startDate 
                                  ? new Date(selectedTransaction.customPackageId.contract.startDate).toLocaleDateString()
                                  : 'N/A'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Contract End</Typography>
                              <Typography variant="body2">
                                {selectedTransaction.customPackageId.contract.endDate 
                                  ? new Date(selectedTransaction.customPackageId.contract.endDate).toLocaleDateString()
                                  : 'N/A'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Contract Status</Typography>
                              <Chip 
                                label={selectedTransaction.customPackageId.contract.status || 'N/A'} 
                                size="small"
                                color={
                                  selectedTransaction.customPackageId.contract.status === 'active' ? 'success' :
                                  selectedTransaction.customPackageId.contract.status === 'pending' ? 'warning' :
                                  selectedTransaction.customPackageId.contract.status === 'expired' ? 'error' :
                                  'default'
                                }
                              />
                            </Box>
                          </>
                        )}
                        {selectedTransaction.customPackageId.expiryTime && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Expiry Time</Typography>
                            <Typography variant="body2">
                              {selectedTransaction.customPackageId.expiryTime} {selectedTransaction.customPackageId.expiryTimeUnit || 'months'}
                            </Typography>
                          </Box>
                        )}
                        {selectedTransaction.customPackageId.productIds && selectedTransaction.customPackageId.productIds.length > 0 && (
                          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Included Products ({selectedTransaction.customPackageId.productIds.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {selectedTransaction.customPackageId.productIds.map((product, idx) => (
                                <Chip 
                                  key={idx}
                                  label={product.name || `Product ${idx + 1}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        {selectedTransaction.customPackageId.assignedCohorts && selectedTransaction.customPackageId.assignedCohorts.length > 0 && (
                          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Assigned Cohorts
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {selectedTransaction.customPackageId.assignedCohorts.map((cohort, idx) => (
                                <Chip 
                                  key={idx}
                                  label={cohort}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </>
              )}

              {/* Seats & Usage Information */}
              {(selectedTransaction.maxSeats || selectedTransaction.usedSeats !== undefined || selectedTransaction.codeApplications !== undefined) && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 3 }}>
                    Seats & Usage
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                    {selectedTransaction.uniqueCode && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Unique Code</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem', color: 'primary.main' }}>
                          {selectedTransaction.uniqueCode}
                        </Typography>
                      </Box>
                    )}
                    {selectedTransaction.maxSeats && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Max Seats</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedTransaction.maxSeats}
                        </Typography>
                      </Box>
                    )}
                    {selectedTransaction.usedSeats !== undefined && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Used Seats</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedTransaction.usedSeats}
                        </Typography>
                      </Box>
                    )}
                    {selectedTransaction.codeApplications !== undefined && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Code Applications</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedTransaction.codeApplications}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* Additional Fields */}
              {(selectedTransaction.notes || selectedTransaction.metadata || selectedTransaction.webhookData) && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 3 }}>
                    Additional Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                    {selectedTransaction.notes && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                        <Typography variant="body2">{selectedTransaction.notes}</Typography>
                      </Box>
                    )}
                    {selectedTransaction.webhookData && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Webhook Data</Typography>
                        <Box 
                          component="pre" 
                          sx={{ 
                            backgroundColor: 'grey.100', 
                            p: 2, 
                            borderRadius: 1, 
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: '200px'
                          }}
                        >
                          {JSON.stringify(selectedTransaction.webhookData, null, 2)}
                        </Box>
                      </Box>
                    )}
                    {selectedTransaction.metadata && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Metadata</Typography>
                        <Box 
                          component="pre" 
                          sx={{ 
                            backgroundColor: 'grey.100', 
                            p: 2, 
                            borderRadius: 1, 
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: '200px'
                          }}
                        >
                          {JSON.stringify(selectedTransaction.metadata, null, 2)}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Button onClick={handleCloseView} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

