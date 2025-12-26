// 'use client';

// import AdminLayout from '@/components/AdminLayout';
// import { useState, useEffect } from 'react';
// import {
//   Box,
//   Typography,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   MenuItem,
//   Switch,
//   FormControlLabel,
//   Snackbar,
//   Alert,
// } from '@mui/material';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
// import AddIcon from '@mui/icons-material/Add';
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// if (!API_BASE_URL) {
//   throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
// }
// const API_URL = `${API_BASE_URL}/api`;
// console.log('🔗 Admin Partners API URL:', API_URL);

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

// function PartnersContent() {
//   const [partners, setPartners] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [partnerToDelete, setPartnerToDelete] = useState(null);
//   const [editing, setEditing] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     logoUrl: '',
//     linkUrl: '',
//     type: 'partner',
//     isActive: true,
//   });
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

//   useEffect(() => {
//     fetchPartners();
//   }, []);

//   const fetchPartners = async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/partners');
//       setPartners(res.data);
//     } catch (error) {
//       console.error('Error fetching partners:', error);
//     }
//   };

//   const handleOpen = (partner) => {
//     if (partner) {
//       setEditing(partner);
//       setFormData({
//         name: partner.name,
//         logoUrl: partner.logoUrl,
//         linkUrl: partner.linkUrl || '',
//         type: partner.type,
//         isActive: partner.isActive,
//       });
//     } else {
//       setEditing(null);
//       setFormData({
//         name: '',
//         logoUrl: '',
//         linkUrl: '',
//         type: 'partner',
//         isActive: true,
//       });
//     }
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setEditing(null);
//   };

//   const handleSubmit = async () => {
//     try {
//       // Client-side validation
//       if (!formData.name.trim()) {
//         setSnackbar({ open: true, message: 'Partner name is required', severity: 'error' });
//         return;
//       }
//       if (!formData.logoUrl.trim()) {
//         setSnackbar({ open: true, message: 'Logo URL is required', severity: 'error' });
//         return;
//       }
//       if (!formData.type) {
//         setSnackbar({ open: true, message: 'Partner type is required', severity: 'error' });
//         return;
//       }

//       if (editing) {
//         const api = getApiInstance();
//         await api.put(`/partners/${editing._id}`, formData);
//         setSnackbar({ open: true, message: 'Partner logo updated successfully', severity: 'success' });
//       } else {
//         const api = getApiInstance();
//         await api.post('/partners', formData);
//         setSnackbar({ open: true, message: 'Partner logo created successfully', severity: 'success' });
//       }
//       handleClose();
//       fetchPartners();
//     } catch (error) {
//       let errorMessage = 'Error saving partner logo';
      
//       if (error.response?.data) {
//         const errorData = error.response.data;
//         if (errorData.errors && Array.isArray(errorData.errors)) {
//           errorMessage = errorData.errors.map((err) => err.msg || err.message || err).join(', ');
//         } else if (errorData.error) {
//           errorMessage = errorData.error;
//         } else if (typeof errorData === 'string') {
//           errorMessage = errorData;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       setSnackbar({ open: true, message: errorMessage, severity: 'error' });
//     }
//   };

//   const handleDeleteClick = (partner) => {
//     setPartnerToDelete(partner);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!partnerToDelete) return;
    
//     try {
//       const api = getApiInstance();
//       await api.delete(`/partners/${partnerToDelete._id}`);
//       setSnackbar({ open: true, message: 'Partner logo deleted successfully', severity: 'success' });
//       setDeleteDialogOpen(false);
//       setPartnerToDelete(null);
//       fetchPartners();
//     } catch (error) {
//       let errorMessage = 'Error deleting partner logo';
      
//       if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       setSnackbar({ open: true, message: errorMessage, severity: 'error' });
//     }
//   };

//   const handleDeleteCancel = () => {
//     setDeleteDialogOpen(false);
//     setPartnerToDelete(null);
//   };

//   return (
//     <Box>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Typography variant="h4">Partner Logos</Typography>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={() => handleOpen()}
//           sx={{
//             bgcolor: 'primary.main',
//             '&:hover': {
//               bgcolor: 'primary.dark',
//               transform: 'translateY(-2px)',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//             },
//             transition: 'all 0.3s ease',
//           }}
//         >
//           Add Partner Logo
//         </Button>
//       </Box>

//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Name</TableCell>
//               <TableCell>Type</TableCell>
//               <TableCell>Logo</TableCell>
//               <TableCell>Active</TableCell>
//               <TableCell>Actions</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {partners.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
//                   <Typography variant="body2" color="text.secondary">
//                     No partner logos found. Click &ldquo;Add Partner Logo&rdquo; to create your first partner logo.
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               partners.map((partner) => (
//                 <TableRow key={partner._id}>
//                 <TableCell>{partner.name}</TableCell>
//                 <TableCell>{partner.type}</TableCell>
//                 <TableCell>
//                   <Box
//                     component="img"
//                     src={partner.logoUrl}
//                     alt={partner.name}
//                     sx={{ maxWidth: 100, maxHeight: 50, objectFit: 'contain' }}
//                   />
//                 </TableCell>
//                 <TableCell>{partner.isActive ? 'Yes' : 'No'}</TableCell>
//                 <TableCell>
//                   <IconButton size="small" onClick={() => handleOpen(partner)}>
//                     <EditIcon />
//                   </IconButton>
//                   <IconButton size="small" onClick={() => handleDeleteClick(partner)}>
//                     <DeleteIcon />
//                   </IconButton>
//                 </TableCell>
//               </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
//         <DialogTitle>{editing ? 'Edit Partner Logo' : 'Add Partner Logo'}</DialogTitle>
//         <DialogContent>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//             <TextField
//               label="Name"
//               fullWidth
//               required
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             />
//             <TextField
//               label="Logo URL"
//               fullWidth
//               required
//               value={formData.logoUrl}
//               onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
//             />
//             <TextField
//               label="Link URL (optional)"
//               fullWidth
//               value={formData.linkUrl}
//               onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
//             />
//             <TextField
//               select
//               label="Type"
//               fullWidth
//               required
//               value={formData.type}
//               onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//             >
//               <MenuItem value="press">Press</MenuItem>
//               <MenuItem value="partner">Partner</MenuItem>
//               <MenuItem value="event">Event</MenuItem>
//             </TextField>
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={formData.isActive}
//                   onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
//                 />
//               }
//               label="Active"
//             />
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleClose}>Cancel</Button>
//           <Button onClick={handleSubmit} variant="contained">
//             {editing ? 'Update' : 'Create'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
//         <DialogTitle>Delete Partner Logo</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete &ldquo;{partnerToDelete?.name}&rdquo;? This action cannot be undone.
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleDeleteCancel}>Cancel</Button>
//           <Button onClick={handleDeleteConfirm} variant="contained" color="error">
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>

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

// export default function Partners() {
//   return (
//     <AdminLayout>
//       <PartnersContent />
//     </AdminLayout>
//   );
// }

'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect, useRef } from 'react';
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
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
}
const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Partners API URL:', API_URL);

// simple auth headers helper (no axios instance)
// function getAuthHeaders(extraHeaders = {}) {
//   if (typeof window === 'undefined') {
//     return { ...extraHeaders };
//   }
//   const token = localStorage.getItem('admin_token');
//   const headers = {
//     'Content-Type': 'application/json',
//     ...extraHeaders,
//   };
//   if (token) {
//     headers.Authorization = `Bearer ${token}`;
//   }
//   return headers;
// }
function getAuthHeaders(extraHeaders = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...extraHeaders,
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}


function PartnersContent() {
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeDeleteDialogOpen, setTypeDeleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    linkUrl: '',
    type: '',
    isActive: true,
  });
  const [typeFormData, setTypeFormData] = useState({ name: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchPartners();
    fetchPartnerTypes();
  }, []);

  // const fetchPartners = async () => {
  //   try {
    

  //     const headers = getAuthHeaders();
  //     const url = `${API_URL}/partners`;
  //     console.log('📡 API: GET', url);
  //     const res = await axios.get(url, { headers });
  
  //     const data = Array.isArray(res.data) ? res.data : [];
  //     setPartners(data);
  //   } catch (error) {
  //     console.error('❌ Error fetching partners:', {
  //       url: `${API_URL}/partners`,
  //       error: error.response?.data || error.message,
  //       status: error.response?.status,
  //     });
  //     setSnackbar({
  //       open: true,
  //       message: 'Failed to load partner logos',
  //       severity: 'error',
  //     });
  //   }
  // };

  const fetchPartners = async () => {
    try {
      setLoadingPartners(true);
      const headers = getAuthHeaders();
      const url = `${API_URL}/partners`;
  
      console.log('📡 API: GET', url);
  
      const res = await axios.get(url, {
        headers,
        params: { _t: Date.now() }, // 🔥 prevent any caching
      });
  
      const data = Array.isArray(res.data) ? res.data : [];
      setPartners(data);
    } catch (error) {
      console.error('❌ Error fetching partners:', {
        url: `${API_URL}/partners`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
  
      setSnackbar({
        open: true,
        message: 'Failed to load partner logos',
        severity: 'error',
      });
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchPartnerTypes = async () => {
    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/partner-types`;
      const params = { active: 'true', _t: Date.now() };
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
      const data = Array.isArray(res.data) ? res.data : [];
      setPartnerTypes(data);
      setFormData((prev) => {
        if (prev.type) return prev;
        return { ...prev, type: data[0]?.slug || '' };
      });
    } catch (error) {
      console.error('❌ Error fetching partner types:', {
        url: `${API_URL}/partner-types`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setPartnerTypes([]);
    }
  };

  const handleTypeDialogOpen = (type = null) => {
    setEditingType(type);
    setTypeFormData({ name: type?.name || '' });
    setTypeDialogOpen(true);
  };

  const handleTypeDialogClose = () => {
    setTypeDialogOpen(false);
    setEditingType(null);
    setTypeFormData({ name: '' });
  };

  const handleTypeSubmit = async () => {
    try {
      if (!typeFormData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a type name',
          severity: 'error',
        });
        return;
      }

      const headers = getAuthHeaders();
      const payload = { name: typeFormData.name.trim() };

      if (editingType) {
        const url = `${API_URL}/partner-types/${editingType._id}`;
        console.log('📡 API: PUT', url, payload);
        await axios.put(url, payload, { headers });
        setSnackbar({
          open: true,
          message: 'Partner type updated successfully',
          severity: 'success',
        });
      } else {
        const url = `${API_URL}/partner-types`;
        console.log('📡 API: POST', url, payload);
        await axios.post(url, payload, { headers });
        setSnackbar({
          open: true,
          message: 'Partner type created successfully',
          severity: 'success',
        });
      }

      handleTypeDialogClose();
      fetchPartnerTypes();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || 'Error saving partner type',
        severity: 'error',
      });
    }
  };

  const handleTypeDeleteClick = (type) => {
    setTypeToDelete(type);
    setTypeDeleteDialogOpen(true);
  };

  const handleTypeDeleteCancel = () => {
    setTypeDeleteDialogOpen(false);
    setTypeToDelete(null);
  };

  const handleTypeDeleteConfirm = async () => {
    if (!typeToDelete) return;
    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/partner-types/${typeToDelete._id}`;
      console.log('📡 API: DELETE', url);
      await axios.delete(url, { headers });
      setSnackbar({
        open: true,
        message: 'Partner type deleted successfully',
        severity: 'success',
      });
      handleTypeDeleteCancel();
      setFormData((prev) =>
        prev.type === typeToDelete.slug ? { ...prev, type: '' } : prev
      );
      fetchPartnerTypes();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || 'Error deleting partner type',
        severity: 'error',
      });
    }
  };
  

  const handleOpen = (partner) => {
    if (partner) {
      setEditing(partner);
      setFormData({
        name: partner.name,
        logoUrl: partner.logoUrl,
        linkUrl: partner.linkUrl || '',
        type: partner.type || partnerTypes[0]?.slug || '',
        isActive: partner.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        logoUrl: '',
        linkUrl: '',
        type: partnerTypes[0]?.slug || '',
        isActive: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      // basic validation
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Partner name is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.logoUrl.trim()) {
        setSnackbar({
          open: true,
          message: 'Partner logo image is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.type) {
        setSnackbar({
          open: true,
          message: 'Partner type is required',
          severity: 'error',
        });
        return;
      }

      const headers = getAuthHeaders();

      if (editing) {
        const url = `${API_URL}/partners/${editing._id}`;
        console.log('📡 API: PUT', url, formData);
        await axios.put(url, formData, { headers });
        setSnackbar({
          open: true,
          message: 'Partner logo updated successfully',
          severity: 'success',
        });
      } else {
        const url = `${API_URL}/partners`;
        console.log('📡 API: POST', url, formData);
        await axios.post(url, formData, { headers });
        setSnackbar({
          open: true,
          message: 'Partner logo created successfully',
          severity: 'success',
        });
      }

      handleClose();
      fetchPartners();
    } catch (error) {
      let errorMessage = 'Error saving partner logo';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors
            .map((err) => err.msg || err.message || err)
            .join(', ');
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteClick = (partner) => {
    setPartnerToDelete(partner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return;

    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/partners/${partnerToDelete._id}`;
      console.log('📡 API: DELETE', url);
      await axios.delete(url, { headers });
      setSnackbar({
        open: true,
        message: 'Partner logo deleted successfully',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
      fetchPartners();
    } catch (error) {
      let errorMessage = 'Error deleting partner logo';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPartnerToDelete(null);
  };

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event) => {
    const file =
      event.target.files && event.target.files.length > 0
        ? event.target.files[0]
        : null;
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    try {
      setUploadingImage(true);
      const headers = getAuthHeaders({
        'Content-Type': 'multipart/form-data',
      });
      const url = `${API_URL}/uploads`;
      console.log('📡 API: POST', url, '[FormData]');
      const res = await axios.post(url, form, { headers });
      setFormData((prev) => ({
        ...prev,
        logoUrl: res.data.url,
      }));
      setSnackbar({
        open: true,
        message: 'Logo uploaded',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload logo',
        severity: 'error',
      });
    } finally {
      setUploadingImage(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const getTypeLabel = (slug) => {
    if (!slug) return '—';
    const found = partnerTypes.find((type) => type.slug === slug);
    return found?.name || slug;
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: { xs: 2, md: 0 },
          mb: 3,
        }}
      >
        <Typography variant="h4">Partner Logos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.3s ease',
            width: { xs: '100%', md: 'auto' }
          }}
        >
          Add Partner Logo
        </Button>
      </Box>

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
              <TableCell>Type</TableCell>
              <TableCell>Logo</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingPartners ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No partner logos found. Click &ldquo;Add Partner
                    Logo&rdquo; to create your first partner logo.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow key={partner._id}>
                  <TableCell>{partner.name}</TableCell>
                  <TableCell>{getTypeLabel(partner.type)}</TableCell>
                  <TableCell>
                    {partner.logoUrl ? (
                      <Box
                        component="img"
                        src={partner.logoUrl}
                        alt={partner.name}
                        sx={{
                          maxWidth: 100,
                          maxHeight: 50,
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          maxWidth: 100,
                          maxHeight: 50,
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                        }}
                      >
                        No Logo
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{partner.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(partner)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(partner)}
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

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? 'Edit Partner Logo' : 'Add Partner Logo'}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: 2,
            }}
          >
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outlined"
                onClick={triggerImagePicker}
                disabled={uploadingImage}
              >
                {uploadingImage
                  ? 'Uploading...'
                  : formData.logoUrl
                  ? 'Replace Logo'
                  : 'Upload Logo'}
              </Button>
              {formData.logoUrl && (
                <Box
                  component="img"
                  src={formData.logoUrl}
                  alt="Logo preview"
                  sx={{
                    width: 140,
                    height: 80,
                    objectFit: 'contain',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                select
                label="Type"
                fullWidth
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                disabled={partnerTypes.length === 0}
                helperText={
                  partnerTypes.length === 0
                    ? 'Create a partner type before adding logos'
                    : undefined
                }
              >
                {partnerTypes.length === 0 ? (
                  <MenuItem value="" disabled>
                    No partner types available
                  </MenuItem>
                ) : (
                  partnerTypes.map((type) => (
                    <MenuItem key={type._id} value={type.slug}>
                      {type.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleTypeDialogOpen()}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                Manage Types
              </Button>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Partner Type Dialog */}
      <Dialog
        open={typeDialogOpen}
        onClose={handleTypeDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingType ? 'Edit Partner Type' : 'Add Partner Type'}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: 2,
            }}
          >
            <TextField
              label="Type Name"
              fullWidth
              required
              value={typeFormData.name}
              onChange={(e) =>
                setTypeFormData({ name: e.target.value })
              }
              placeholder="e.g., Partner, Event, Press"
              autoFocus
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Existing Types
              </Typography>
              {partnerTypes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No partner types yet.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    maxHeight: 240,
                    overflowY: 'auto',
                  }}
                >
                  {partnerTypes.map((type) => (
                    <Box
                      key={type._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        px: 1.5,
                        py: 1,
                      }}
                    >
                      <Typography>{type.name}</Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleTypeDialogOpen(type)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleTypeDeleteClick(type)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTypeDialogClose}>Cancel</Button>
          <Button onClick={handleTypeSubmit} variant="contained">
            {editingType ? 'Update Type' : 'Create Type'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Type Dialog */}
      <Dialog
        open={typeDeleteDialogOpen}
        onClose={handleTypeDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Partner Type</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &ldquo;{typeToDelete?.name}&rdquo;? This will remove the
            type from the database. Existing logos using it will display the
            raw slug until reassigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTypeDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleTypeDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Partner Logo</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &ldquo;
            {partnerToDelete?.name}&rdquo;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default function Partners() {
  return (
    <AdminLayout>
      <PartnersContent />
    </AdminLayout>
  );
}
