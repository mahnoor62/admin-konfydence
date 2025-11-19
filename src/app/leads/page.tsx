'use client';

import AdminLayout from '../layout-admin';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  MenuItem,
  Select,
  Snackbar,
  Alert,
} from '@mui/material';
import api from '@/lib/api';
import { B2BLead, EducationLead, ContactMessage } from '@/lib/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function LeadsContent() {
  const [tab, setTab] = useState(0);
  const [b2bLeads, setB2bLeads] = useState<B2BLead[]>([]);
  const [eduLeads, setEduLeads] = useState<EducationLead[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const [b2b, edu, contact] = await Promise.all([
        api.get<B2BLead[]>('/leads/b2b').then((res) => res.data),
        api.get<EducationLead[]>('/leads/education').then((res) => res.data),
        api.get<ContactMessage[]>('/contact').then((res) => res.data),
      ]);
      setB2bLeads(b2b);
      setEduLeads(edu);
      setContactMessages(contact);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleStatusChange = async (type: 'b2b' | 'education' | 'contact', id: string, status: string) => {
    try {
      if (type === 'b2b') {
        await api.put(`/leads/b2b/${id}`, { status });
      } else if (type === 'education') {
        await api.put(`/leads/education/${id}`, { status });
      } else {
        await api.put(`/contact/${id}`, { status });
      }
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
      fetchLeads();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leads & Messages
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`B2B Leads (${b2bLeads.length})`} />
          <Tab label={`Education Leads (${eduLeads.length})`} />
          <Tab label={`Contact Messages (${contactMessages.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Employee Count</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {b2bLeads.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.employeeCount || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      size="small"
                      onChange={(e) => handleStatusChange('b2b', lead._id, e.target.value)}
                    >
                      <MenuItem value="new">New</MenuItem>
                      <MenuItem value="contacted">Contacted</MenuItem>
                      <MenuItem value="qualified">Qualified</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>School</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eduLeads.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell>{lead.schoolName}</TableCell>
                  <TableCell>{lead.contactName}</TableCell>
                  <TableCell>{lead.role}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.cityCountry}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      size="small"
                      onChange={(e) => handleStatusChange('education', lead._id, e.target.value)}
                    >
                      <MenuItem value="new">New</MenuItem>
                      <MenuItem value="contacted">Contacted</MenuItem>
                      <MenuItem value="qualified">Qualified</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Topic</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contactMessages.map((message) => (
                <TableRow key={message._id}>
                  <TableCell>{message.name}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell>{message.company || '-'}</TableCell>
                  <TableCell>
                    <Chip label={message.topic.replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={message.status}
                      size="small"
                      onChange={(e) => handleStatusChange('contact', message._id, e.target.value)}
                    >
                      <MenuItem value="new">New</MenuItem>
                      <MenuItem value="read">Read</MenuItem>
                      <MenuItem value="replied">Replied</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(message.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default function Leads() {
  return (
    <AdminLayout>
      <LeadsContent />
    </AdminLayout>
  );
}

