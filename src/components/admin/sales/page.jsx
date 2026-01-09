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
        // Filter out transactions without organizationId or customPackageId
        const transactions = (b2bRes.data || []).filter(tx => 
          tx.organizationId || tx.customPackageId
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

  const handleOpenDelete = (item, isContract = false) => {
    setItemToDelete({ ...item, isContract });
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.isContract) {
        setIsDeletingContract(true);
        const api = getApiInstance();
        // Delete custom package
        await api.delete(`/custom-packages/${itemToDelete._id}`);
      } else {
        setDeleting(true);
        const api = getApiInstance();
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
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDelete(tx, false)} 
                          color="error"
                          title="Delete Transaction"
                        >
                          <DeleteIcon />
                        </IconButton>
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
                <TableCell>Organization</TableCell>
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
                    <TableCell>{contract.organizationId?.name || 'N/A'}</TableCell>
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
                  <TableCell>Created At</TableCell>
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
                        {membership.createdAt ? new Date(membership.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete {itemToDelete?.isContract ? 'Contract' : 'Transaction'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {itemToDelete?.isContract ? 'contract' : 'transaction'}? 
            This action cannot be undone.
            {itemToDelete?.isContract && (
              <>
                <br />
                <br />
                This will also delete the custom package associated with this contract.
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
    </Box>
  );
}

