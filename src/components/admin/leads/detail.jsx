import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tabs,
  Tab,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Note,
  Timeline,
  Phone,
  Email,
  VideoCall,
  MoreHoriz,
  CheckCircle,
  Cancel,
  LocalFireDepartment,
  Whatshot,
  NewReleases,
  AttachMoney,
  PlayArrow,
  Download,
  Business,
  Gavel,
  Visibility,
  Info,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE_URL}/api`;

function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
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

const api = getApiInstance();

export default function LeadDetail() {
  const router = useRouter();
  const { id } = router.query || {};
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [engagementData, setEngagementData] = useState({
    type: 'call',
    summary: '',
  });
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [editDemoStatusOpen, setEditDemoStatusOpen] = useState(false);
  const [editQuoteStatusOpen, setEditQuoteStatusOpen] = useState(false);
  const [complianceTags, setComplianceTags] = useState([]);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [evidenceData, setEvidenceData] = useState({
    engagementEvidence: '',
    evidenceDate: '',
    facilitator: '',
  });
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [demoApprovalLoading, setDemoApprovalLoading] = useState(false);
  const [convertForm, setConvertForm] = useState({
    name: '',
    type: '',
    customType: '',
    segment: '',
    primaryContact: {
      name: '',
      email: '',
    },
  });

  const complianceTagOptions = [
    'NIS2',
    'Security Awareness',
    'Human Risk',
    'Social Engineering',
    'Incident Response',
    'Management Training',
    'ISO 27001',
    'Awareness',
    'Leadership',
  ];

  const fetchLeadDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leads/unified/${id}/detail`);
      setLead(response.data);
      setComplianceTags(response.data.complianceTags || []);
      setEvidenceData({
        engagementEvidence: response.data.engagementEvidence || '',
        evidenceDate: response.data.evidenceDate ? new Date(response.data.evidenceDate).toISOString().split('T')[0] : '',
        facilitator: response.data.facilitator || '',
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching lead:', err);
      setError('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLeadDetail();
    }
  }, [id]);

  // Don't render until id is available
  if (!id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const handleAddNote = async () => {
    try {
      setActionError(null);
      await api.post(`/leads/unified/${id}/notes`, { text: noteText });
      setNoteText('');
      setNoteDialogOpen(false);
      fetchLeadDetail();
    } catch (err) {
      console.error('Error adding note:', err);
      setActionError(err.response?.data?.error || 'Failed to add note');
    }
  };

  const handleLogEngagement = async () => {
    try {
      setActionError(null);
      await api.post(`/leads/unified/${id}/engagement`, engagementData);
      setEngagementData({ type: 'call', summary: '' });
      setEngagementDialogOpen(false);
      fetchLeadDetail();
    } catch (err) {
      console.error('Error logging engagement:', err);
      setActionError(err.response?.data?.error || 'Failed to log engagement');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setActionError(null);
      await api.put(`/leads/unified/${id}`, { status: newStatus });
      setEditStatusOpen(false);
      fetchLeadDetail();
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleUpdateDemoStatus = async (newStatus, scheduledAt = null) => {
    try {
      setActionError(null);
      await api.put(`/leads/unified/${id}/demo-status`, {
        status: newStatus,
        scheduledAt,
      });
      setEditDemoStatusOpen(false);
      fetchLeadDetail();
    } catch (err) {
      console.error('Error updating demo status:', err);
      setActionError(err.response?.data?.error || 'Failed to update demo status');
    }
  };

  // Demo leads: topic is demo-schools/demo-businesses or demoStatus is requested
  const isDemoLead = lead && (
    ['demo-schools', 'demo-businesses'].includes(lead.topic) ||
    lead.demoStatus === 'requested' ||
    (lead.demoRequested === true && (lead.topic || '').toLowerCase().includes('demo'))
  );

  const handleDemoApprovalChange = async (event) => {
    const checked = event.target.checked;
    try {
      setDemoApprovalLoading(true);
      setActionError(null);
      await api.put(`/leads/unified/${id}/demo-approval`, { demoApproved: checked });
      setSuccessMessage(checked ? 'Demo approved and email sent to lead.' : 'Demo not approved and rejection email sent to lead.');
      fetchLeadDetail();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error updating demo approval:', err);
      setActionError(err.response?.data?.error || 'Failed to update demo approval');
    } finally {
      setDemoApprovalLoading(false);
    }
  };

  const handleUpdateQuoteStatus = async (newStatus) => {
    try {
      setActionError(null);
      await api.put(`/leads/unified/${id}/quote-status`, { status: newStatus });
      setEditQuoteStatusOpen(false);
      fetchLeadDetail();
    } catch (err) {
      console.error('Error updating quote status:', err);
      setActionError(err.response?.data?.error || 'Failed to update quote status');
    }
  };

  const handleUpdateComplianceTags = async () => {
    try {
      setActionError(null);
      await api.put(`/leads/unified/${id}/compliance-tags`, { tags: complianceTags });
      fetchLeadDetail();
    } catch (err) {
      console.error('Error updating compliance tags:', err);
      setActionError(err.response?.data?.error || 'Failed to update compliance tags');
    }
  };

  const handleUpdateEvidence = async () => {
    try {
      setActionError(null);
      await api.put(`/leads/unified/${id}/evidence`, evidenceData);
      setEvidenceDialogOpen(false);
      fetchLeadDetail();
    } catch (err) {
      console.error('Error updating evidence:', err);
      setActionError(err.response?.data?.error || 'Failed to update evidence');
    }
  };

  const handleExport = async () => {
    try {
      setActionError(null);
      const response = await api.get(`/leads/unified/${id}/export`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `lead-${lead.name}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
      setActionError(err.response?.data?.error || 'Failed to export lead data');
    }
  };

  const handleExportOrganization = async () => {
    if (!lead.convertedOrganizationId) {
      setActionError('No organization linked to this lead');
      return;
    }
    try {
      setActionError(null);
      const response = await api.get(`/organizations/${lead.convertedOrganizationId._id}/export`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `organization-${lead.convertedOrganizationId.name}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting organization:', err);
      setActionError(err.response?.data?.error || 'Failed to export organization data');
    }
  };

  const handleOpenConvert = () => {
    if (!lead) return;
    setConvertForm({
      name: lead.organizationName || '',
      type: '',
      customType: '',
      segment: lead.segment === 'other' ? 'B2B' : lead.segment,
      primaryContact: {
        name: lead.name,
        email: lead.email,
      },
    });
    setConvertOpen(true);
  };

  const handleConvertToOrganization = async () => {
    if (!lead) return;
    try {
      setActionError(null);
      setSuccessMessage(null);
      setConvertLoading(true);
      const response = await api.post(`/leads/unified/${id}/convert`, convertForm);
      setConvertOpen(false);
      setConvertLoading(false);
      setSuccessMessage(`Organization "${response.data.organization.name}" created successfully!`);
      fetchLeadDetail(); // Refresh lead data
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error converting lead:', err);
      setActionError(err.response?.data?.error || 'Failed to convert lead');
      setConvertLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'info',
      warm: 'warning',
      hot: 'error',
      converted: 'success',
      lost: 'inherit',
    };
    return colors[status] || 'info';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'hot':
        return <LocalFireDepartment />;
      case 'warm':
        return <Whatshot />;
      case 'new':
        return <NewReleases />;
      case 'converted':
        return <CheckCircle />;
      default:
        return null;
    }
  };

  const getEngagementIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone />;
      case 'email':
        return <Email />;
      case 'meeting':
        return <VideoCall />;
      default:
        return <MoreHoriz />;
    }
  };

  const getTimelineIcon = (eventType) => {
    switch (eventType) {
      case 'created':
        return <CheckCircle color="success" />;
      case 'status_changed':
        return <Edit color="primary" />;
      case 'demo_requested':
      case 'demo_scheduled':
      case 'demo_completed':
        return <PlayArrow color="info" />;
      case 'quote_requested':
      case 'quote_sent':
      case 'quote_accepted':
        return <AttachMoney color="success" />;
      case 'note_added':
        return <Note color="secondary" />;
      case 'engagement_logged':
        return <Phone color="primary" />;
      case 'converted':
        return <Business color="success" />;
      default:
        return <Timeline />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lead) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Lead not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/leads')} sx={{ mt: 2 }}>
          Back to Leads
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Action Error Alert */}
      {actionError && (
        <Alert 
          severity="error" 
          onClose={() => setActionError(null)}
          sx={{ mb: 2 }}
        >
          {actionError}
        </Alert>
      )}
      
      {/* Success Message Alert */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}
      
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={{ xs: 2, md: 0 }}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2} width={{ xs: '100%', md: 'auto' }}>
          <IconButton onClick={() => router.push('/leads')}>
            <ArrowBack />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h4">{lead.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {lead.email} {lead.organizationName && `• ${lead.organizationName}`}
            </Typography>
          </Box>
        </Box>
        <Box 
          display="flex" 
          gap={2} 
          width={{ xs: '100%', md: 'auto' }}
          flexDirection={{ xs: 'column', md: 'row' }}
        >
          <Button
            startIcon={<Download />}
            variant="outlined"
            onClick={handleExport}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            Export
          </Button>
          <Button
            startIcon={getStatusIcon(lead.status)}
            variant="contained"
            color={getStatusColor(lead.status)}
            onClick={() => setEditStatusOpen(true)}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            {lead.status?.toUpperCase()}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ 
            '& .MuiTabs-flexContainer': {
              flexWrap: { xs: 'wrap', md: 'nowrap' }
            }
          }}
        >
          <Tab 
            label="Overview" 
            sx={{ 
              minWidth: { xs: 'auto', md: 72 },
              flex: { xs: 'none', md: '0 1 auto' }
            }} 
          />
          <Tab 
            label="Timeline" 
            sx={{ 
              minWidth: { xs: 'auto', md: 72 },
              flex: { xs: 'none', md: '0 1 auto' }
            }} 
          />
          <Tab 
            label="Notes" 
            sx={{ 
              minWidth: { xs: 'auto', md: 72 },
              flex: { xs: 'none', md: '0 1 auto' }
            }} 
          />
          <Tab 
            label="Engagements" 
            sx={{ 
              minWidth: { xs: 'auto', md: 72 },
              flex: { xs: 'none', md: '0 1 auto' }
            }} 
          />
          <Tab 
            label="Compliance" 
            sx={{ 
              minWidth: { xs: 'auto', md: 72 },
              flex: { xs: 'none', md: '0 1 auto' }
            }} 
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">{lead.name}</Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => setViewDetailsOpen(true)}
                        sx={{ ml: 1 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{lead.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Organization
                    </Typography>
                    <Typography variant="body1">
                      {lead.organizationName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Segment
                    </Typography>
                    <Box mt={1}>
                      <Chip 
                        label={lead.source === 'contact_form' ? (lead.topic || 'N/A') : (lead.segment || 'N/A')} 
                        size="small" 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Source
                    </Typography>
                    <Typography variant="body1">
                      {lead.source?.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  {lead.teamSize && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Team Size
                      </Typography>
                      <Typography variant="body1">
                        {lead.teamSize}
                      </Typography>
                    </Grid>
                  )}
                  {(lead.message || (lead.messages && lead.messages.length > 0)) && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        {lead.messages && lead.messages.length > 1 ? `Messages (${lead.messages.length})` : 'Message'}
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {lead.message}
                      </Typography>
                      {lead.messages && lead.messages.length > 1 && (
                        <Button
                          size="small"
                          onClick={() => setShowAllMessages((p) => !p)}
                          sx={{ mt: 1 }}
                        >
                          {showAllMessages ? 'Hide all messages' : `View all ${lead.messages.length} messages`}
                        </Button>
                      )}
                      {showAllMessages && lead.messages && lead.messages.length > 0 && (
                        <Stack spacing={1.5} sx={{ mt: 2, pl: 1, borderLeft: 2, borderColor: 'divider' }}>
                          {lead.messages.map((m, i) => (
                            <Box key={i}>
                              <Typography variant="caption" color="text.secondary">
                                {m.topic || 'Message'} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                              </Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {m.text}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Status & Tracking */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Status & Tracking
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Demo Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Chip
                        label={lead.demoStatus || 'none'}
                        onClick={() => setEditDemoStatusOpen(true)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Box>
                  {isDemoLead && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Approve Demo
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!lead.demoApproved}
                              onChange={handleDemoApprovalChange}
                              disabled={demoApprovalLoading}
                              color="primary"
                            />
                          }
                          label={lead.demoApproved ? 'Approved' : 'Not approved'}
                        />
                        {demoApprovalLoading && <CircularProgress size={20} />}
                      </Box>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Quote Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Chip
                        label={lead.quoteStatus || 'none'}
                        onClick={() => setEditQuoteStatusOpen(true)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Engagement Count
                    </Typography>
                    <Typography variant="h5">{lead.engagementCount || 0}</Typography>
                  </Box>
                  {lead.lastContactedAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Contacted
                      </Typography>
                      <Typography variant="body1">
                        {new Date(lead.lastContactedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Convert to Organization */}
          {lead.status !== 'converted' && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">Convert to Organization</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Convert this lead into an organization account
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Business />}
                      onClick={handleOpenConvert}
                    >
                      Convert
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Timeline Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Activity Timeline</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {lead.timeline && lead.timeline.length > 0 ? (
                lead.timeline.map((event, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>{getTimelineIcon(event.eventType)}</ListItemIcon>
                    <ListItemText
                      primary={event.description}
                      secondary={
                        <>
                          {event.createdBy?.name || 'System'} •{' '}
                          {new Date(event.createdAt).toLocaleString()}
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No timeline entries yet
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', md: 'row' }}
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={{ xs: 2, md: 0 }}
              mb={2}
            >
              <Typography variant="h6">Notes & Internal Discussion</Typography>
              <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                <Button
                  startIcon={<Note />}
                  variant="contained"
                  onClick={() => setNoteDialogOpen(true)}
                  sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                  Add Note
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes
                  .slice()
                  .reverse()
                  .map((note, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Note />
                      </ListItemIcon>
                      <ListItemText
                        primary={note.text}
                        secondary={
                          <>
                            {note.createdBy?.name || 'Unknown'} •{' '}
                            {new Date(note.createdAt).toLocaleString()}
                          </>
                        }
                      />
                    </ListItem>
                  ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No notes yet
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Engagements Tab */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', md: 'row' }}
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', md: 'center' }}
              gap={{ xs: 2, md: 0 }}
              mb={2}
            >
              <Typography variant="h6">Engagement History</Typography>
              <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                <Button
                  startIcon={<Phone />}
                  variant="contained"
                  onClick={() => setEngagementDialogOpen(true)}
                  sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                  Log Engagement
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {lead.engagements && lead.engagements.length > 0 ? (
                lead.engagements
                  .slice()
                  .reverse()
                  .map((engagement, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>{getEngagementIcon(engagement.type)}</ListItemIcon>
                      <ListItemText
                        primary={engagement.summary}
                        secondary={
                          <>
                            {engagement.type.toUpperCase()} •{' '}
                            {engagement.createdBy?.name || 'Unknown'} •{' '}
                            {new Date(engagement.createdAt).toLocaleString()}
                          </>
                        }
                      />
                    </ListItem>
                  ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No engagements logged yet
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Compliance Tab */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Tags
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControl fullWidth>
                  <InputLabel>Compliance Tags</InputLabel>
                  <Select
                    multiple
                    value={complianceTags}
                    onChange={(e) => setComplianceTags(e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {complianceTagOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleUpdateComplianceTags}
                  sx={{ mt: 2 }}
                >
                  Save Tags
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Engagement Evidence</Typography>
                  <Button onClick={() => setEvidenceDialogOpen(true)}>Edit</Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {lead.engagementEvidence ? (
                  <Typography variant="body2">{lead.engagementEvidence}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No evidence documented
                  </Typography>
                )}
                {lead.evidenceDate && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Date: {new Date(lead.evidenceDate).toLocaleDateString()}
                  </Typography>
                )}
                {lead.facilitator && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Facilitator: {lead.facilitator}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="start" gap={2}>
                  <Gavel color="primary" />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Legal Disclaimer
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Konfydence provides documented evidence of human-risk awareness activities.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Konfydence supports NIS2 Articles 21 and 23 for the human layer.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Our admin system allows organizations to document and export awareness
                      activities for audits.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      It does not replace technical, organizational, or legal compliance measures.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialogs */}
      {/* Add Note Dialog */}
      <Dialog 
        open={noteDialogOpen} 
        onClose={() => setNoteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '450px',
            maxWidth: '600px',
            minHeight: '250px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Add Note</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Note"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!noteText.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Engagement Dialog */}
      <Dialog
        open={engagementDialogOpen}
        onClose={() => setEngagementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '450px',
            maxWidth: '600px',
            minHeight: '320px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Log Engagement</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <FormControl fullWidth>
            <InputLabel shrink>Type</InputLabel>
            <Select
              value={engagementData.type}
              onChange={(e) =>
                setEngagementData({ ...engagementData, type: e.target.value })
              }
              label="Type"
              sx={{ mt: 1 }}
            >
              <MenuItem value="call">Call</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Summary"
            value={engagementData.summary}
            onChange={(e) =>
              setEngagementData({ ...engagementData, summary: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEngagementDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleLogEngagement}
            variant="contained"
            disabled={!engagementData.summary.trim()}
          >
            Log
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog 
        open={editStatusOpen} 
        onClose={() => setEditStatusOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '420px',
            maxWidth: '500px',
            minHeight: '200px',
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle sx={{ pt: 2, px: 3, pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Update Status</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <FormControl fullWidth>
            <InputLabel shrink sx={{mt:1}}>Status</InputLabel>
            <Select
              value={lead.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              label="Status"
              sx={{ mt: 1 }}
            >
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="warm">Warm</MenuItem>
              <MenuItem value="hot">Hot</MenuItem>
              <MenuItem value="converted">Converted</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditStatusOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Demo Status Dialog */}
      <Dialog 
        open={editDemoStatusOpen} 
        onClose={() => setEditDemoStatusOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '420px',
            maxWidth: '500px',
            minHeight: '200px',
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3, pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Update Demo Status</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <FormControl fullWidth>
            <InputLabel shrink sx={{mt:1}}> Demo Status</InputLabel>
            <Select
              value={lead.demoStatus || 'none'}
              onChange={(e) => handleUpdateDemoStatus(e.target.value)}
              label="Demo Status"
              sx={{ mt: 1 }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="requested">Requested</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="no_show">No Show</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDemoStatusOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Quote Status Dialog */}
      <Dialog 
        open={editQuoteStatusOpen} 
        onClose={() => setEditQuoteStatusOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '420px',
            maxWidth: '500px',
            minHeight: '200px',
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3, pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Update Quote Status</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <FormControl fullWidth>
            <InputLabel shrink sx={{mt:1}}>Quote Status</InputLabel>
            <Select
              value={lead.quoteStatus || 'none'}
              onChange={(e) => handleUpdateQuoteStatus(e.target.value)}
              label="Quote Status"
              sx={{ mt: 1 }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="requested">Requested</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditQuoteStatusOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={() => setEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '550px',
            maxWidth: '700px',
            minHeight: '450px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.1rem' }}>Engagement Evidence</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Evidence Notes"
            value={evidenceData.engagementEvidence}
            onChange={(e) =>
              setEvidenceData({ ...evidenceData, engagementEvidence: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            placeholder="Document workshop/session notes for audit purposes..."
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Evidence Date"
            value={evidenceData.evidenceDate}
            onChange={(e) =>
              setEvidenceData({ ...evidenceData, evidenceDate: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Facilitator"
            value={evidenceData.facilitator}
            onChange={(e) =>
              setEvidenceData({ ...evidenceData, facilitator: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
            placeholder="Name of facilitator"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEvidenceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateEvidence} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Organization Dialog */}
      <Dialog 
        open={convertOpen} 
        onClose={() => setConvertOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '450px',
            maxWidth: '600px',
            minHeight: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3, pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>
          Convert Lead to Organization
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, px: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                required
                value={convertForm.name}
                onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Organization Type</InputLabel>
                <Select
                  value={convertForm.type}
                  onChange={(e) => setConvertForm({ ...convertForm, type: e.target.value })}
                  label="Organization Type"
                  sx={{ mt: 0.5 }}
                >
                  <MenuItem value="company">Company</MenuItem>
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="school">School</MenuItem>
                  <MenuItem value="govt">Government</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {convertForm.type === 'other' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custom Type"
                  value={convertForm.customType}
                  onChange={(e) => setConvertForm({ ...convertForm, customType: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Segment</InputLabel>
                <Select
                  value={convertForm.segment}
                  onChange={(e) => setConvertForm({ ...convertForm, segment: e.target.value })}
                  label="Segment"
                  sx={{ mt: .5 }}
                >
                  <MenuItem value="B2B">B2B</MenuItem>
                  <MenuItem value="B2E">B2E</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ ml:1, mb: 1, fontWeight: 600 }}>
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
                InputLabelProps={{ shrink: true }}
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
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setConvertOpen(false)} disabled={convertLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConvertToOrganization}
            disabled={convertLoading || !convertForm.name || !convertForm.type || !convertForm.segment || !convertForm.primaryContact.name || !convertForm.primaryContact.email}
            startIcon={convertLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {convertLoading ? 'Converting...' : 'Convert'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.25rem', fontWeight: 600 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Lead Contact Details</Typography>
            <IconButton size="small" onClick={() => setViewDetailsOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          {lead && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{lead.name || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {lead.email || 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Organization
                </Typography>
                <Typography variant="body1">
                  {lead.organizationName || 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Topic
                </Typography>
                <Typography variant="body1">
                  {lead.topic || 'N/A'}
                </Typography>
              </Grid>

              {/* Show fields based on source */}
              {lead.source === 'contact_form' && (
                <>
                  {/* Address Information - Only for contact_form (demo options) */}
                  {(lead.address || lead.city || lead.state || lead.country || lead.phone || lead.department || lead.position || lead.website) && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                          Address Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                      </Grid>
                      
                      {lead.address && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Address
                          </Typography>
                          <Typography variant="body1">
                            {lead.address}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.city && (
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            City
                          </Typography>
                          <Typography variant="body1">
                            {lead.city}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.state && (
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            State
                          </Typography>
                          <Typography variant="body1">
                            {lead.state}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.country && (
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Country
                          </Typography>
                          <Typography variant="body1">
                            {lead.country}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.phone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Phone Number
                          </Typography>
                          <Typography variant="body1">
                            {lead.phone}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.website && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Website
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                            {lead.website}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.department && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Department
                          </Typography>
                          <Typography variant="body1">
                            {lead.department}
                          </Typography>
                        </Grid>
                      )}
                      
                      {lead.position && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Position
                          </Typography>
                          <Typography variant="body1">
                            {lead.position}
                          </Typography>
                        </Grid>
                      )}
                    </>
                  )}
                </>
              )}

              {/* B2B Form Fields (CoMaSi) */}
              {lead.source === 'b2b_form' && (
                <>
                  {/* Address Information for B2B Form - HIDDEN FIELDS */}
                  {/* Address, Country, State, City, Phone, Website fields are hidden */}
                  {lead.department && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                          Department Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1">
                          {lead.department}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {/* Company Information */}
                  {lead.teamSize && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                          Company Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Team Size
                        </Typography>
                        <Typography variant="body1">
                          {lead.teamSize}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </>
              )}

              {/* B2E Form Fields (Education) */}
              {lead.source === 'b2e_form' && lead.studentStaffSize && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                      Institution Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Student/Staff Size
                    </Typography>
                    <Typography variant="body1">
                      {lead.studentStaffSize}
                    </Typography>
                  </Grid>
                </>
              )}

              {/* Additional Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {(lead.message || (lead.messages && lead.messages.length > 0)) && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    {lead.messages && lead.messages.length > 1 ? `Messages (${lead.messages.length})` : 'Message'}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: 1 }}>
                    {lead.message}
                  </Typography>
                  {lead.messages && lead.messages.length > 1 && (
                    <Button
                      size="small"
                      onClick={() => setShowAllMessages((p) => !p)}
                      sx={{ mt: 1 }}
                    >
                      {showAllMessages ? 'Hide all messages' : `View all ${lead.messages.length} messages`}
                    </Button>
                  )}
                  {showAllMessages && lead.messages && lead.messages.length > 0 && (
                    <Stack spacing={1.5} sx={{ mt: 2, pl: 1, borderLeft: 2, borderColor: 'divider' }}>
                      {lead.messages.map((m, i) => (
                        <Box key={i}>
                          <Typography variant="caption" color="text.secondary">
                            {m.topic || 'Message'} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {m.text}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Segment
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={lead.source === 'contact_form' ? (lead.topic || 'N/A') : (lead.segment || 'N/A')} 
                    size="small" 
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Source
                </Typography>
                <Typography variant="body1">
                  {lead.source ? lead.source.replace('_', ' ').toUpperCase() : 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewDetailsOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

