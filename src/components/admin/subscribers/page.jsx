'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Pagination,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Email,
} from '@mui/icons-material';
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

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const subscriptionTypes = [
    { label: 'All', value: 'all' },
    { label: 'Waitlist', value: 'waitlist' },
    { label: 'Newsletter', value: 'general' },
    { label: 'Latest News', value: 'latest-news' },
    { label: 'Weekly Insights', value: 'weekly-insights' },
  ];

  useEffect(() => {
    fetchSubscribers();
  }, [page, activeTab]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = getApiInstance();
      const selectedType = subscriptionTypes[activeTab].value;
      
      const response = await api.get('/subscribers/list', {
        params: {
          page,
          limit: 50,
          subscriptionType: selectedType === 'all' ? undefined : selectedType,
        },
      });

      if (response.data.success) {
        setSubscribers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch subscribers');
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError(err.response?.data?.message || 'Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'newsletter-form':
        return 'Newsletter Form';
      case 'insights-form':
        return 'Latest Insights Form';
      case 'waitlist-form':
        return 'Waitlist Form';
      case 'early-access-form':
        return 'Early Access Form';
      default:
        return 'Other';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Subscribers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage and view all email subscribers by subscription type
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="subscription type tabs">
          {subscriptionTypes.map((type, index) => (
            <Tab key={type.value} label={type.label} />
          ))}
        </Tabs>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <TextField
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 250 } }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subscription Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subscribed At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 'No subscribers found matching your search.' : 'No subscribers yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((subscriber) => {
                    const getTypeLabel = (type) => {
                      switch (type) {
                        case 'waitlist':
                          return 'Waitlist';
                        case 'latest-news':
                          return 'Latest News';
                        case 'weekly-insights':
                          return 'Weekly Insights';
                        case 'general':
                          return 'Newsletter';
                        default:
                          return type || 'General';
                      }
                    };

                    const getTypeColor = (type) => {
                      switch (type) {
                        case 'waitlist':
                          return 'warning';
                        case 'latest-news':
                          return 'primary';
                        case 'weekly-insights':
                          return 'success';
                        case 'general':
                          return 'default';
                        default:
                          return 'default';
                      }
                    };

                    return (
                      <TableRow key={subscriber._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="body2">{subscriber.email}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTypeLabel(subscriber.subscriptionType)}
                            color={getTypeColor(subscriber.subscriptionType)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {getSourceLabel(subscriber.source)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(subscriber.subscribedAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}

          {/* Summary */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Total: ${pagination.total} subscribers`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </>
      )}
    </Box>
  );
}

