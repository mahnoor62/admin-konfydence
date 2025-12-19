'use client';
export const dynamic = 'force-dynamic';
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  Business,
  Search,
  CheckCircle,
  Cancel,
  LocalFireDepartment,
  Whatshot,
  NewReleases,
  AttachMoney,
  PlayArrow,
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

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState('');
  const [convertForm, setConvertForm] = useState({
    name: '',
    type: '',
    customType: '',
    segment: '',
    primaryContact: {
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
    },
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (segmentFilter !== 'all') params.segment = segmentFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await api.get('/leads/unified', { params });
      setLeads(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.response?.data?.error || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [statusFilter, segmentFilter, searchQuery]);

  const handleViewDetail = async (leadId) => {
    try {
      const api = getApiInstance();
      const response = await api.get(`/leads/unified/${leadId}`);
      setSelectedLead(response.data);
      setDetailOpen(true);
    } catch (err) {
      console.error('Error fetching lead detail:', err);
      setError(err.response?.data?.error || 'Failed to load lead details');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const api = getApiInstance();
      await api.put(`/leads/unified/${leadId}`, { status: newStatus });
      fetchLeads();
      if (selectedLead && selectedLead._id === leadId) {
        const updatedLead = { ...selectedLead, status: newStatus };
        setSelectedLead(updatedLead);
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
      setError(err.response?.data?.error || 'Failed to update lead status');
    }
  };

  const handleUpdateLead = async (field, value) => {
    if (!selectedLead) return;
    try {
      const api = getApiInstance();
      const updateData = {};
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updateData[parent] = { ...selectedLead[parent], [child]: value };
      } else {
        updateData[field] = value;
      }
      
      await api.put(`/leads/unified/${selectedLead._id}`, updateData);
      const response = await api.get(`/leads/unified/${selectedLead._id}`);
      setSelectedLead(response.data);
      fetchLeads();
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err.response?.data?.error || 'Failed to update lead');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedLead) return;
    try {
      const api = getApiInstance();
      await api.post(`/leads/unified/${selectedLead._id}/notes`, { text: noteText });
      setNoteText('');
      const response = await api.get(`/leads/unified/${selectedLead._id}`);
      setSelectedLead(response.data);
      fetchLeads();
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err.response?.data?.error || 'Failed to add note');
    }
  };

  const handleTrackDemoRequest = async () => {
    if (!selectedLead) return;
    try {
      const api = getApiInstance();
      await api.post(`/leads/unified/${selectedLead._id}/demo-request`);
      const response = await api.get(`/leads/unified/${selectedLead._id}`);
      setSelectedLead(response.data);
      fetchLeads();
    } catch (err) {
      console.error('Error tracking demo request:', err);
      setError(err.response?.data?.error || 'Failed to track demo request');
    }
  };

  const handleTrackDemoComplete = async () => {
    if (!selectedLead) return;
    try {
      const api = getApiInstance();
      await api.post(`/leads/unified/${selectedLead._id}/demo-complete`);
      const response = await api.get(`/leads/unified/${selectedLead._id}`);
      setSelectedLead(response.data);
      fetchLeads();
    } catch (err) {
      console.error('Error tracking demo completion:', err);
      setError(err.response?.data?.error || 'Failed to track demo completion');
    }
  };

  const handleTrackQuoteRequest = async () => {
    if (!selectedLead) return;
    try {
      const api = getApiInstance();
      await api.post(`/leads/unified/${selectedLead._id}/quote-request`);
      const response = await api.get(`/leads/unified/${selectedLead._id}`);
      setSelectedLead(response.data);
      fetchLeads();
    } catch (err) {
      console.error('Error tracking quote request:', err);
      setError(err.response?.data?.error || 'Failed to track quote request');
    }
  };

  const handleOpenConvert = () => {
    if (!selectedLead) return;
    setConvertForm({
      name: selectedLead.organizationName || '',
      type: '',
      customType: '',
      segment: selectedLead.segment === 'other' ? 'B2B' : selectedLead.segment,
      primaryContact: {
        name: selectedLead.name,
        email: selectedLead.email,
        phone: selectedLead.phone || '',
        jobTitle: selectedLead.jobTitle || '',
      },
    });
    setConvertOpen(true);
  };

  const handleConvertToOrganization = async () => {
    if (!selectedLead) return;
    try {
      const api = getApiInstance();
      await api.post(`/leads/unified/${selectedLead._id}/convert`, convertForm);
      setConvertOpen(false);
      fetchLeads();
      setDetailOpen(false);
      setSelectedLead(null);
    } catch (err) {
      console.error('Error converting lead:', err);
      setError(err.response?.data?.error || 'Failed to convert lead');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'hot':
        return <LocalFireDepartment sx={{ color: '#f44336' }} />;
      case 'warm':
        return <Whatshot sx={{ color: '#ff9800' }} />;
      case 'new':
        return <NewReleases sx={{ color: '#2196f3' }} />;
      case 'converted':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'lost':
        return <Cancel sx={{ color: '#9e9e9e' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot':
        return 'error';
      case 'warm':
        return 'warning';
      case 'new':
        return 'info';
      case 'converted':
        return 'success';
      case 'lost':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (segmentFilter !== 'all' && lead.segment !== segmentFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.organizationName?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate lead statistics
  const leadStats = {
    total: filteredLeads.length,
    new: filteredLeads.filter(l => l.status === 'new').length,
    warm: filteredLeads.filter(l => l.status === 'warm').length,
    hot: filteredLeads.filter(l => l.status === 'hot').length,
    converted: filteredLeads.filter(l => l.status === 'converted').length,
    needsDemo: filteredLeads.filter(l => l.demoRequested && !l.demoCompleted).length,
    needsQuote: filteredLeads.filter(l => l.quoteRequested).length,
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Leads Management</Typography>
        <Chip 
          label={`${filteredLeads.length} Lead${filteredLeads.length !== 1 ? 's' : ''}`} 
          color="primary" 
        />
      </Box>

      {/* Hot Leads Alert */}
      {leadStats.hot > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                setStatusFilter('hot');
                setSegmentFilter('all');
              }}
            >
              View Hot Leads
            </Button>
          }
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LocalFireDepartment sx={{ fontSize: 20 }} />
            <Typography variant="body1" fontWeight={600}>
              {leadStats.hot} HOT Lead{leadStats.hot !== 1 ? 's' : ''} Need Immediate Attention!
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Demo Needed Alert */}
      {leadStats.needsDemo > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                setStatusFilter('all');
                setSegmentFilter('all');
                // Filter leads with demo requested but not completed
                const demoLeads = leads.filter(l => l.demoRequested && !l.demoCompleted);
                if (demoLeads.length > 0) {
                  handleViewDetail(demoLeads[0]._id);
                }
              }}
            >
              View Demo Requests
            </Button>
          }
        >
          <Box display="flex" alignItems="center" gap={1}>
            <PlayArrow sx={{ fontSize: 20 }} />
            <Typography variant="body1" fontWeight={600}>
              {leadStats.needsDemo} Lead{leadStats.needsDemo !== 1 ? 's' : ''} Waiting for Demo!
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Quote Requested Alert */}
      {leadStats.needsQuote > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                const quoteLeads = leads.filter(l => l.quoteRequested);
                if (quoteLeads.length > 0) {
                  handleViewDetail(quoteLeads[0]._id);
                }
              }}
            >
              View Quote Requests
            </Button>
          }
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AttachMoney sx={{ fontSize: 20 }} />
            <Typography variant="body1" fontWeight={600}>
              {leadStats.needsQuote} Lead{leadStats.needsQuote !== 1 ? 's' : ''} Requested Quote - Send Pricing!
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Lead Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: leadStats.new > 0 ? '#e3f2fd' : 'white' }}>
            <CardContent>
              <Typography variant="h4" color="primary">{leadStats.new}</Typography>
              <Typography variant="body2" color="text.secondary">New Leads</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: leadStats.warm > 0 ? '#fff3e0' : 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>{leadStats.warm}</Typography>
              <Typography variant="body2" color="text.secondary">Warm Leads</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: leadStats.hot > 0 ? '#ffebee' : 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <LocalFireDepartment sx={{ color: '#f44336', fontSize: 28 }} />
                <Typography variant="h4" sx={{ color: '#f44336' }}>{leadStats.hot}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Hot Leads</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: leadStats.needsDemo > 0 ? '#fff9c4' : 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <PlayArrow sx={{ color: '#f57c00', fontSize: 28 }} />
                <Typography variant="h4" sx={{ color: '#f57c00' }}>{leadStats.needsDemo}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Need Demo</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: leadStats.needsQuote > 0 ? '#e1f5fe' : 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney sx={{ color: '#0288d1', fontSize: 28 }} />
                <Typography variant="h4" sx={{ color: '#0288d1' }}>{leadStats.needsQuote}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Quote Requested</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
                <TextField
                fullWidth
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
                <MenuItem value="hot">Hot</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Segment"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <MenuItem value="all">All Segments</MenuItem>
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2E">B2E</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Lead</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Engagement</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No leads found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead._id} 
                  hover
                  sx={{
                    bgcolor: lead.status === 'hot' ? '#ffebee' : 'inherit',
                    '&:hover': {
                      bgcolor: lead.status === 'hot' ? '#ffcdd2' : 'action.hover',
                    }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        {lead.status === 'hot' && (
                          <LocalFireDepartment sx={{ color: '#f44336', fontSize: 18 }} />
                        )}
                        <Typography variant="body2" fontWeight={600}>
                          {lead.name}
                        </Typography>
                      </Box>
                      {lead.jobTitle && (
                        <Typography variant="caption" color="text.secondary">
                          {lead.jobTitle}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{lead.email}</Typography>
                      {lead.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {lead.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{lead.organizationName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={lead.segment}
                      color={lead.segment === 'B2B' ? 'primary' : lead.segment === 'B2E' ? 'info' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(lead.status)}
                      <Chip
                        label={lead.status}
                        color={getStatusColor(lead.status)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {lead.engagementCount || 0} interaction{lead.engagementCount !== 1 ? 's' : ''}
                      </Typography>
                      {lead.demoRequested && (
                        <Chip
                          icon={<PlayArrow />}
                          label={lead.demoCompleted ? 'Demo Done' : 'Demo Requested'}
                          size="small"
                          color={lead.demoCompleted ? 'success' : 'info'}
                          sx={{ mt: 0.5 }}
                        />
                      )}
                      {lead.quoteRequested && (
                        <Chip
                          icon={<AttachMoney />}
                          label="Quote Requested"
                          size="small"
                          color="warning"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {lead.source?.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewDetail(lead._id)}>
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Lead Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Lead Details</Typography>
            {selectedLead && (
              <Box display="flex" alignItems="center" gap={1}>
                {getStatusIcon(selectedLead.status)}
                <Chip
                  label={selectedLead.status}
                  color={getStatusColor(selectedLead.status)}
                />
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  BASIC INFORMATION
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedLead.name || ''}
                  onChange={(e) => handleUpdateLead('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={selectedLead.email || ''}
                  onChange={(e) => handleUpdateLead('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedLead.phone || ''}
                  onChange={(e) => handleUpdateLead('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Organization"
                  value={selectedLead.organizationName || ''}
                  onChange={(e) => handleUpdateLead('organizationName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={selectedLead.jobTitle || ''}
                  onChange={(e) => handleUpdateLead('jobTitle', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead._id, e.target.value)}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="warm">Warm</MenuItem>
                  <MenuItem value="hot">Hot</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </TextField>
              </Grid>

              {/* Engagement Tracking */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  ENGAGEMENT TRACKING
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Engagement Count
                    </Typography>
                    <Typography variant="h5">{selectedLead.engagementCount || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Last Contacted
                    </Typography>
                    <Typography variant="body1">
                      {selectedLead.lastContactedAt
                        ? new Date(selectedLead.lastContactedAt).toLocaleString()
                        : 'Never'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Indicators */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  LEAD INDICATORS
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedLead.isDecisionMaker || false}
                      onChange={(e) => handleUpdateLead('isDecisionMaker', e.target.checked)}
                    />
                  }
                  label="Decision Maker"
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedLead.hasUrgentNeed || false}
                      onChange={(e) => handleUpdateLead('hasUrgentNeed', e.target.checked)}
                    />
                  }
                  label="Has Urgent Need"
                  sx={{ mb: 2 }}
                />
                {selectedLead.hasUrgentNeed && (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Urgent Need Description"
                    value={selectedLead.urgentNeedDescription || ''}
                    onChange={(e) => handleUpdateLead('urgentNeedDescription', e.target.value)}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant={selectedLead.demoRequested ? 'outlined' : 'contained'}
                    startIcon={<PlayArrow />}
                    onClick={handleTrackDemoRequest}
                    disabled={selectedLead.demoRequested}
                  >
                    {selectedLead.demoRequested ? 'Demo Requested' : 'Mark Demo Requested'}
                  </Button>
                  {selectedLead.demoRequested && !selectedLead.demoCompleted && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={handleTrackDemoComplete}
                    >
                      Mark Demo Completed
                    </Button>
                  )}
                  <Button
                    variant={selectedLead.quoteRequested ? 'outlined' : 'contained'}
                    startIcon={<AttachMoney />}
                    onClick={handleTrackQuoteRequest}
                    disabled={selectedLead.quoteRequested}
                    color="warning"
                  >
                    {selectedLead.quoteRequested ? 'Quote Requested' : 'Mark Quote Requested'}
                  </Button>
                </Box>
              </Grid>

              {/* Linked Trials */}
              {selectedLead.linkedTrialIds && selectedLead.linkedTrialIds.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                      LINKED DEMOS/TRIALS
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <List dense>
                      {selectedLead.linkedTrialIds.map((trial, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={`Trial Code: ${trial.uniqueCode}`}
                            secondary={`Status: ${trial.status} | Seats: ${trial.usedSeats}/${trial.maxSeats}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </>
              )}

              {/* Notes */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  NOTES & INTERNAL DISCUSSION
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {selectedLead.notes?.length > 0 ? (
                    selectedLead.notes.map((note, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={note.text}
                          secondary={`By ${note.createdBy?.name || 'Unknown'} on ${new Date(note.createdAt).toLocaleString()}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No notes yet
                    </Typography>
                  )}
                </List>
                <Box display="flex" gap={1} mt={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a note or internal discussion..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <Button variant="contained" onClick={handleAddNote} disabled={!noteText.trim()}>
                    Add Note
                  </Button>
                </Box>
              </Grid>

              {/* Conversion */}
              {selectedLead.convertedOrganizationId ? (
                <Grid item xs={12}>
                  <Alert severity="success">
                    This lead has been converted to an organization
                  </Alert>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Business />}
                    onClick={handleOpenConvert}
                    fullWidth
                  >
                    Convert to Organization
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Organization Dialog */}
      <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Convert Lead to Organization</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                required
                value={convertForm.name}
                onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Organization Type"
                required
                value={convertForm.type}
                onChange={(e) => setConvertForm({ ...convertForm, type: e.target.value })}
              >
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
                <MenuItem value="school">School</MenuItem>
                <MenuItem value="govt">Government</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            {convertForm.type === 'other' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custom Type"
                  value={convertForm.customType}
                  onChange={(e) => setConvertForm({ ...convertForm, customType: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Segment"
                required
                value={convertForm.segment}
                onChange={(e) => setConvertForm({ ...convertForm, segment: e.target.value })}
              >
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2E">B2E</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Primary Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name"
                required
                value={convertForm.primaryContact.name}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    primaryContact: { ...convertForm.primaryContact, name: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                required
                value={convertForm.primaryContact.email}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    primaryContact: { ...convertForm.primaryContact, email: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={convertForm.primaryContact.phone}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    primaryContact: { ...convertForm.primaryContact, phone: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={convertForm.primaryContact.jobTitle}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    primaryContact: { ...convertForm.primaryContact, jobTitle: e.target.value },
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConvertToOrganization}
            disabled={!convertForm.name || !convertForm.type || !convertForm.segment || !convertForm.primaryContact.name || !convertForm.primaryContact.email}
          >
            Convert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
