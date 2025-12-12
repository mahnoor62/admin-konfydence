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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
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
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const response = await api.get('/leads/unified');
      setLeads(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.response?.data?.error || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

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
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
      setError(err.response?.data?.error || 'Failed to update lead status');
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

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (segmentFilter !== 'all' && lead.segment !== segmentFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leads
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <TextField
          select
          label="Status Filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="new">New</MenuItem>
          <MenuItem value="warm">Warm</MenuItem>
          <MenuItem value="hot">Hot</MenuItem>
          <MenuItem value="converted">Converted</MenuItem>
          <MenuItem value="lost">Lost</MenuItem>
        </TextField>
        <TextField
          select
          label="Segment Filter"
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Segments</MenuItem>
          <MenuItem value="B2B">B2B</MenuItem>
          <MenuItem value="B2E">B2E</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">No leads found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.organizationName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={lead.segment}
                      color={lead.segment === 'B2B' ? 'primary' : lead.segment === 'B2E' ? 'info' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <Chip
                      label={lead.status}
                      color={
                        lead.status === 'hot' ? 'error' :
                        lead.status === 'warm' ? 'warning' :
                        lead.status === 'converted' ? 'success' :
                        lead.status === 'lost' ? 'default' : 'info'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewDetail(lead._id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lead Details</DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedLead.name || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedLead.email || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedLead.phone || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Organization"
                  value={selectedLead.organizationName || ''}
                  InputProps={{ readOnly: true }}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Segment"
                  value={selectedLead.segment || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
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
                    <Typography color="text.secondary">No notes</Typography>
                  )}
                </List>
                <Box display="flex" gap={1} mt={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <Button variant="contained" onClick={handleAddNote}>
                    Add Note
                  </Button>
                </Box>
              </Grid>
              {selectedLead.convertedOrganizationId && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    This lead has been converted to an organization
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
