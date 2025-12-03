// 'use client';

// import AdminLayout from '@/components/AdminLayout';
// import { useState, useEffect } from 'react';
// import {
//   Box,
//   Typography,
//   Tabs,
//   Tab,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Chip,
//   MenuItem,
//   Select,
//   Snackbar,
//   Alert,
// } from '@mui/material';
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// if (!API_BASE_URL) {
//   throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
// }
// const API_URL = `${API_BASE_URL}/api`;
// console.log('🔗 Admin Leads API URL:', API_URL);

// function getApiInstance() {
//   const instance = axios.create({
//     baseURL: API_URL,
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   });
  
//   instance.interceptors.request.use((config) => {
//     const token = localStorage.getItem('admin_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
//     return config;
//   });
  
//   instance.interceptors.response.use(
//     (response) => response,
//     (error) => {
//       console.error('❌ API Error:', {
//         url: error.config?.url,
//         method: error.config?.method,
//         status: error.response?.status,
//         message: error.response?.data?.error || error.message,
//         fullUrl: `${error.config?.baseURL}${error.config?.url}`,
//       });
//       return Promise.reject(error);
//     }
//   );
  
//   return instance;
// }

// function TabPanel(props) {
//   const { children, value, index, ...other } = props;
//   return (
//     <div role="tabpanel" hidden={value !== index} {...other}>
//       {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
//     </div>
//   );
// }

// function LeadsContent() {
//   const [tab, setTab] = useState(0);
//   const [b2bLeads, setB2bLeads] = useState([]);
//   const [eduLeads, setEduLeads] = useState([]);
//   const [contactMessages, setContactMessages] = useState([]);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

//   useEffect(() => {
//     fetchLeads();
//   }, []);

//   const fetchLeads = async () => {
//     try {
//       const api = getApiInstance();
//       const [b2b, edu, contact] = await Promise.all([
//         api.get('/leads/b2b').then((res) => res.data),
//         api.get('/leads/education').then((res) => res.data),
//         api.get('/contact').then((res) => res.data),
//       ]);
//       setB2bLeads(b2b);
//       setEduLeads(edu);
//       setContactMessages(contact);
//     } catch (error) {
//       console.error('Error fetching leads:', error);
//     }
//   };

//   const handleStatusChange = async (type, id, status) => {
//     try {
//       if (type === 'b2b') {
//         const api = getApiInstance();
//         await api.put(`/leads/b2b/${id}`, { status });
//       } else if (type === 'education') {
//         const api = getApiInstance();
//         await api.put(`/leads/education/${id}`, { status });
//       } else {
//         const api = getApiInstance();
//         await api.put(`/contact/${id}`, { status });
//       }
//       setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
//       fetchLeads();
//     } catch (error) {
//       setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
//     }
//   };

//   return (
//     <Box>
//       <Typography variant="h4" gutterBottom>
//         Leads & Messages
//       </Typography>

//       <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
//         <Tabs value={tab} onChange={(e, v) => setTab(v)}>
//           <Tab label={`B2B Leads (${b2bLeads.length})`} />
//           <Tab label={`Education Leads (${eduLeads.length})`} />
//           <Tab label={`Contact Messages (${contactMessages.length})`} />
//         </Tabs>
//       </Box>

//       <TabPanel value={tab} index={0}>
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Name</TableCell>
//                 <TableCell>Company</TableCell>
//                 <TableCell>Email</TableCell>
//                 <TableCell>Employee Count</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Date</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {b2bLeads.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
//                     <Typography variant="body2" color="text.secondary">
//                       No B2B leads found.
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 b2bLeads.map((lead) => (
//                   <TableRow key={lead._id}>
//                   <TableCell>{lead.name}</TableCell>
//                   <TableCell>{lead.company}</TableCell>
//                   <TableCell>{lead.email}</TableCell>
//                   <TableCell>{lead.employeeCount || '-'}</TableCell>
//                   <TableCell>
//                     <Select
//                       value={lead.status}
//                       size="small"
//                       onChange={(e) => handleStatusChange('b2b', lead._id, e.target.value)}
//                     >
//                       <MenuItem value="new">New</MenuItem>
//                       <MenuItem value="contacted">Contacted</MenuItem>
//                       <MenuItem value="qualified">Qualified</MenuItem>
//                       <MenuItem value="closed">Closed</MenuItem>
//                     </Select>
//                   </TableCell>
//                   <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
//                 </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </TabPanel>

//       <TabPanel value={tab} index={1}>
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>School</TableCell>
//                 <TableCell>Contact</TableCell>
//                 <TableCell>Role</TableCell>
//                 <TableCell>Email</TableCell>
//                 <TableCell>Location</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Date</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {eduLeads.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
//                     <Typography variant="body2" color="text.secondary">
//                       No education leads found.
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 eduLeads.map((lead) => (
//                   <TableRow key={lead._id}>
//                   <TableCell>{lead.schoolName}</TableCell>
//                   <TableCell>{lead.contactName}</TableCell>
//                   <TableCell>{lead.role}</TableCell>
//                   <TableCell>{lead.email}</TableCell>
//                   <TableCell>{lead.cityCountry}</TableCell>
//                   <TableCell>
//                     <Select
//                       value={lead.status}
//                       size="small"
//                       onChange={(e) => handleStatusChange('education', lead._id, e.target.value)}
//                     >
//                       <MenuItem value="new">New</MenuItem>
//                       <MenuItem value="contacted">Contacted</MenuItem>
//                       <MenuItem value="qualified">Qualified</MenuItem>
//                       <MenuItem value="closed">Closed</MenuItem>
//                     </Select>
//                   </TableCell>
//                   <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
//                 </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </TabPanel>

//       <TabPanel value={tab} index={2}>
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Name</TableCell>
//                 <TableCell>Email</TableCell>
//                 <TableCell>Company</TableCell>
//                 <TableCell>Topic</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Date</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {contactMessages.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
//                     <Typography variant="body2" color="text.secondary">
//                       No contact messages found.
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 contactMessages.map((message) => (
//                   <TableRow key={message._id}>
//                   <TableCell>{message.name}</TableCell>
//                   <TableCell>{message.email}</TableCell>
//                   <TableCell>{message.company || '-'}</TableCell>
//                   <TableCell>
//                     <Chip label={message.topic.replace('_', ' ')} size="small" />
//                   </TableCell>
//                   <TableCell>
//                     <Select
//                       value={message.status}
//                       size="small"
//                       onChange={(e) => handleStatusChange('contact', message._id, e.target.value)}
//                     >
//                       <MenuItem value="new">New</MenuItem>
//                       <MenuItem value="read">Read</MenuItem>
//                       <MenuItem value="replied">Replied</MenuItem>
//                       <MenuItem value="closed">Closed</MenuItem>
//                     </Select>
//                   </TableCell>
//                   <TableCell>{new Date(message.createdAt).toLocaleDateString()}</TableCell>
//                 </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </TabPanel>

//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={5000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//       >
//         <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
//       </Snackbar>
//     </Box>
//   );
// }

// export default function Leads() {
//   return (
//     <AdminLayout>
//       <LeadsContent />
//     </AdminLayout>
//   );
// }

'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is missing!');
}

const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Leads API URL:', API_URL);

// 🔥 Simple auth header helper
// function getAuthHeaders() {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
//   const headers = { 'Content-Type': 'application/json' };
//   if (token) headers.Authorization = `Bearer ${token}`;
//   return headers;
// }
function getAuthHeaders() {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('admin_token')
    : null;

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}


function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function LeadsContent() {
  const [tab, setTab] = useState(0);
  const [b2bLeads, setB2bLeads] = useState([]);
  const [eduLeads, setEduLeads] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [eduContactMessages, setEduContactMessages] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    message: null,
    type: null, // 'b2b', 'education', 'contact'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    item: null,
    type: null, // 'b2b', 'education', 'contact'
  });

  useEffect(() => {
    fetchAllLeads();
  }, []);

  const fetchAllLeads = async () => {
    try {
      const headers = getAuthHeaders();

      console.log('📡 API: GET', `${API_URL}/leads/b2b`);
      console.log('📡 API: GET', `${API_URL}/leads/education`);
      console.log('📡 API: GET', `${API_URL}/contact`);

      const timestamp = Date.now(); // 🔥 unique per request

      const [b2b, edu, contact] = await Promise.all([
        axios.get(`${API_URL}/leads/b2b`, {
          headers,
          params: { _t: timestamp },
        }),
        axios.get(`${API_URL}/leads/education`, {
          headers,
          params: { _t: timestamp },
        }),
        axios.get(`${API_URL}/contact`, {
          headers,
          params: { _t: timestamp },
        }),
      ]);
      


      // const [b2b, edu, contact] = await Promise.all([
      //   axios.get(`${API_URL}/leads/b2b`, { headers }),
      //   axios.get(`${API_URL}/leads/education`, { headers }),
      //   axios.get(`${API_URL}/contact`, { headers }),
      // ]);

      setB2bLeads(Array.isArray(b2b.data) ? b2b.data : []);
      setEduLeads(Array.isArray(edu.data) ? edu.data : []);
      const allContactMessages = Array.isArray(contact.data) ? contact.data : [];
      setContactMessages(allContactMessages);
      // Filter education contact messages
      const eduContacts = allContactMessages.filter(msg => msg.topic === 'education');
      setEduContactMessages(eduContacts);
    } catch (error) {
      console.error('❌ Failed to fetch leads:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
    }
  };

  const handleStatusChange = async (type, id, status) => {
    try {
      const headers = getAuthHeaders();
      let url;
      const payload = { status };

      if (type === 'b2b') {
        url = `${API_URL}/leads/b2b/${id}`;
      } else if (type === 'education') {
        url = `${API_URL}/leads/education/${id}`;
      } else {
        url = `${API_URL}/contact/${id}`;
      }

      console.log('📡 API: PUT', url, payload);
      // await axios.put(url, payload, { headers });

      await axios.put(url, payload, {
        headers,
        params: { _t: Date.now() },
      });
      

      setSnackbar({
        open: true,
        message: 'Status updated successfully',
        severity: 'success',
      });

      fetchAllLeads();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating status',
        severity: 'error',
      });
    }
  };

  const handleViewDetails = (item, type) => {
    setMessageDialog({ open: true, message: item, type });
  };

  const handleDeleteClick = (item, type) => {
    setDeleteDialog({ open: true, item, type });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item || !deleteDialog.type) return;

    try {
      const headers = getAuthHeaders();
      let url;

      if (deleteDialog.type === 'b2b') {
        url = `${API_URL}/leads/b2b/${deleteDialog.item._id}`;
      } else if (deleteDialog.type === 'education') {
        url = `${API_URL}/leads/education/${deleteDialog.item._id}`;
      } else {
        url = `${API_URL}/contact/${deleteDialog.item._id}`;
      }

      console.log('📡 API: DELETE', url);
      await axios.delete(url, {
        headers,
        params: { _t: Date.now() },
      });

      setSnackbar({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success',
      });

      setDeleteDialog({ open: false, item: null, type: null });
      fetchAllLeads();
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting item. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, item: null, type: null });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leads & Messages
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`B2B Leads (${b2bLeads.length})`} />
          <Tab label={`B2E Leads (${eduLeads.length + eduContactMessages.length})`} />
          <Tab label={`Contact Messages (${contactMessages.length})`} />
        </Tabs>
      </Box>

      {/* -------- B2B LEADS -------- */}
      <TabPanel value={tab} index={0}>
        <TableContainer 
          component={Paper}
          sx={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginTop: 2,
            marginBottom: 2,
            '& .MuiTable-root': {
              minWidth: 650,
              width: '100%',
            },
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              '@media (max-width: 600px)': {
                padding: '8px 4px',
                fontSize: '0.875rem',
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {b2bLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No B2B leads found.
                  </TableCell>
                </TableRow>
              ) : (
                b2bLeads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        size="small"
                        onChange={(e) =>
                          handleStatusChange('b2b', lead._id, e.target.value)
                        }
                      >
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="contacted">Contacted</MenuItem>
                        <MenuItem value="qualified">Qualified</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(lead, 'b2b')}
                          color="primary"
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(lead, 'b2b')}
                          color="error"
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* -------- B2E LEADS (Education Leads + Education Contact Messages) -------- */}
      <TabPanel value={tab} index={1}>
        <TableContainer 
          component={Paper}
          sx={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginTop: 2,
            marginBottom: 2,
            '& .MuiTable-root': {
              minWidth: 650,
              width: '100%',
            },
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              '@media (max-width: 600px)': {
                padding: '8px 4px',
                fontSize: '0.875rem',
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role/Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(() => {
                // Combine and sort education leads and contact messages by date
                const combinedItems = [
                  ...eduLeads.map(lead => ({ ...lead, type: 'lead' })),
                  ...eduContactMessages.map(msg => ({ ...msg, type: 'message' }))
                ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                if (combinedItems.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        No B2E leads found.
                      </TableCell>
                    </TableRow>
                  );
                }

                return combinedItems.map((item) => {
                  if (item.type === 'lead') {
                    // Support both new format (name, school) and legacy format (contactName, schoolName)
                    const schoolName = item.school || item.schoolName || '-';
                    const contactName = item.name || item.contactName || '-';
                    const role = item.role || '-';
                    const email = item.email || '-';
                    
                    return (
                      <TableRow key={`lead-${item._id}`}>
                        <TableCell>
                          <Chip label="Lead" size="small" color="primary" />
                        </TableCell>
                        <TableCell>{schoolName}</TableCell>
                        <TableCell>{contactName}</TableCell>
                        <TableCell>{role}</TableCell>
                        <TableCell>{email}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            size="small"
                            onChange={(e) =>
                              handleStatusChange('education', item._id, e.target.value)
                            }
                          >
                            <MenuItem value="new">New</MenuItem>
                            <MenuItem value="contacted">Contacted</MenuItem>
                            <MenuItem value="qualified">Qualified</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(item, 'education')}
                              color="primary"
                              title="View Details"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(item, 'education')}
                              color="error"
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    return (
                      <TableRow key={`msg-${item._id}`}>
                        <TableCell>
                          <Chip label="Message" size="small" color="secondary" />
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{item.company || '-'}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            size="small"
                            onChange={(e) =>
                              handleStatusChange('contact', item._id, e.target.value)
                            }
                          >
                            <MenuItem value="new">New</MenuItem>
                            <MenuItem value="read">Read</MenuItem>
                            <MenuItem value="replied">Replied</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(item, 'contact')}
                              color="primary"
                              title="View Details"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(item, 'contact')}
                              color="error"
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  }
                });
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* -------- CONTACT MESSAGES -------- */}
      <TabPanel value={tab} index={2}>
        <TableContainer 
          component={Paper}
          sx={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginTop: 2,
            marginBottom: 2,
            '& .MuiTable-root': {
              minWidth: 650,
              width: '100%',
            },
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              '@media (max-width: 600px)': {
                padding: '8px 4px',
                fontSize: '0.875rem',
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Topic</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {contactMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No contact messages found.
                  </TableCell>
                </TableRow>
              ) : (
                contactMessages.map((msg) => (
                  <TableRow key={msg._id}>
                    <TableCell>{msg.name}</TableCell>
                    <TableCell>{msg.email}</TableCell>
                    <TableCell>{msg.company || '-'}</TableCell>
                    <TableCell>
                      <Chip label={msg.topic.replace('_', ' ')} size="small" />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={msg.status}
                        size="small"
                        onChange={(e) =>
                          handleStatusChange('contact', msg._id, e.target.value)
                        }
                      >
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="read">Read</MenuItem>
                        <MenuItem value="replied">Replied</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(msg, 'contact')}
                          color="primary"
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(msg, 'contact')}
                          color="error"
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Details Dialog - Shows all lead/message details */}
      <Dialog
        open={messageDialog.open}
        onClose={() => setMessageDialog({ open: false, message: null, type: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {messageDialog.type === 'b2b' ? 'B2B Lead Details' :
           messageDialog.type === 'education' ? 'B2E Lead Details' :
           'Message Details'}
        </DialogTitle>
        <DialogContent>
          {messageDialog.message && (
            <Box sx={{ pt: 1 }}>
              {/* B2B Lead Details */}
              {messageDialog.type === 'b2b' && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.name}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Company
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.company}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.email}</Typography>
                  </Box>
                  {messageDialog.message.message && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Message
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            bgcolor: 'grey.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          {messageDialog.message.message}
                        </Typography>
                      </Box>
                    </>
                  )}
                </>
              )}

              {/* Education Lead Details */}
              {messageDialog.type === 'education' && messageDialog.message.type === 'lead' && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      School / Institution
                    </Typography>
                    <Typography variant="body1">
                      {messageDialog.message.school || messageDialog.message.schoolName || '-'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {messageDialog.message.name || messageDialog.message.contactName || '-'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.email || '-'}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Role
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.role || '-'}</Typography>
                  </Box>
                  {messageDialog.message.message && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Message
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            bgcolor: 'grey.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          {messageDialog.message.message}
                        </Typography>
                      </Box>
                    </>
                  )}
                </>
              )}

              {/* Contact Message Details */}
              {(messageDialog.type === 'contact' || (messageDialog.type === 'education' && messageDialog.message.type === 'message')) && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.name}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{messageDialog.message.email}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  {messageDialog.message.company && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Company
                        </Typography>
                        <Typography variant="body1">{messageDialog.message.company}</Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                    </>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Topic
                    </Typography>
                    <Chip 
                      label={messageDialog.message.topic?.replace('_', ' ').replace('education', 'Education') || 'N/A'} 
                      size="small" 
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  {messageDialog.message.message && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Message
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            bgcolor: 'grey.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          {messageDialog.message.message}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                    </>
                  )}
                </>
              )}

              {/* Common fields for all types */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Date
                </Typography>
                <Typography variant="body1">
                  {new Date(messageDialog.message.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip 
                  label={messageDialog.message.status?.charAt(0).toUpperCase() + messageDialog.message.status?.slice(1) || 'N/A'} 
                  size="small"
                  color={
                    messageDialog.message.status === 'new' ? 'error' :
                    messageDialog.message.status === 'read' || messageDialog.message.status === 'contacted' ? 'warning' :
                    messageDialog.message.status === 'replied' || messageDialog.message.status === 'qualified' ? 'success' :
                    'default'
                  }
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog({ open: false, message: null, type: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete {deleteDialog.type === 'b2b' ? 'B2B Lead' :
                  deleteDialog.type === 'education' ? 'B2E Lead' :
                  'Message'}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this item? This action cannot be undone and will permanently remove it from the database.
          </Typography>
          {deleteDialog.item && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Name:</strong> {deleteDialog.item.name || deleteDialog.item.contactName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Email:</strong> {deleteDialog.item.email || 'N/A'}
              </Typography>
              {deleteDialog.item.company && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Company:</strong> {deleteDialog.item.company}
                </Typography>
              )}
              {(deleteDialog.item.school || deleteDialog.item.schoolName) && (
                <Typography variant="body2" color="text.secondary">
                  <strong>School:</strong> {deleteDialog.item.school || deleteDialog.item.schoolName}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
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
