// 'use client';

// import AdminLayout from '../layout-admin';
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
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is missing!');
}

const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Leads API URL:', API_URL);

// 🔥 Simple auth header helper
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers = { 'Content-Type': 'application/json' };
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
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

      const [b2b, edu, contact] = await Promise.all([
        axios.get(`${API_URL}/leads/b2b`, { headers }),
        axios.get(`${API_URL}/leads/education`, { headers }),
        axios.get(`${API_URL}/contact`, { headers }),
      ]);

      setB2bLeads(Array.isArray(b2b.data) ? b2b.data : []);
      setEduLeads(Array.isArray(edu.data) ? edu.data : []);
      setContactMessages(Array.isArray(contact.data) ? contact.data : []);
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
      await axios.put(url, payload, { headers });

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

      {/* -------- B2B LEADS -------- */}
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
                    <TableCell>{lead.employeeCount || '-'}</TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* -------- EDUCATION LEADS -------- */}
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
              {eduLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No education leads found.
                  </TableCell>
                </TableRow>
              ) : (
                eduLeads.map((lead) => (
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
                        onChange={(e) =>
                          handleStatusChange('education', lead._id, e.target.value)
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* -------- CONTACT MESSAGES -------- */}
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
              {contactMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
