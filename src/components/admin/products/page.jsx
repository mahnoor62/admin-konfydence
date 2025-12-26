// 'use client';

// import AdminLayout from '@/components/AdminLayout';
// import { useState, useEffect, useRef, useCallback } from 'react';
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
// import { Select, FormControl, InputLabel, OutlinedInput, Chip } from '@mui/material';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// if (!API_BASE_URL) {
//   throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
// }
// const API_URL = `${API_BASE_URL}/api`;
// console.log('🔗 Admin Products API URL:', API_URL);

// // Helper to get axios instance with auth token
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
//     // Prevent caching for GET requests
//     if (config.method === 'get') {
//       config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
//       config.headers['Pragma'] = 'no-cache';
//       config.headers['Expires'] = '0';
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

// function ProductsContent() {
//   const [products, setProducts] = useState([]);
//   const [productTypes, setProductTypes] = useState([]);
//   const [badges, setBadges] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [typeDialogOpen, setTypeDialogOpen] = useState(false);
//   const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [productToDelete, setProductToDelete] = useState(null);
//   const [editing, setEditing] = useState(null);
//   const fileInputRef = useRef(null);
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '',
//     slug: '',
//     description: '',
//     price: '',
//     type: '',
//     imageUrl: '',
//     badges: [],
//     isActive: true,
//     sortOrder: 0,
//   });
//   const [typeFormData, setTypeFormData] = useState({
//     name: '',
//   });
//   const [badgeFormData, setBadgeFormData] = useState({
//     name: '',
//   });
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

//   const fetchProducts = useCallback(async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/products', {
//         params: { includeInactive: true, all: true },
//       });
//       // Handle both array and object response formats
//       const productsData = Array.isArray(res.data) ? res.data : (res.data.products || []);
//       console.log('📦 Products fetched in product page :', productsData);
//       setProducts(productsData);
//     } catch (error) {
//       console.error('❌ Error fetching products:', error.response?.data || error.message);
//       setProducts([]);
//     }
//   }, []);

//   const fetchProductTypes = useCallback(async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/product-types', {
//         params: { active: 'true', _t: Date.now() },
//       });
//       const typesData = Array.isArray(res.data) ? res.data : [];
//       setProductTypes(typesData);
//       if (typesData.length > 0) {
//         setFormData((prev) => {
//           if (prev.type) {
//             return prev;
//           }
//           return { ...prev, type: typesData[0].slug };
//         });
//       }
//     } catch (error) {
//       console.error('❌ Error fetching product types:', error.response?.data || error.message);
//       setProductTypes([]);
//     }
//   }, []);

//   const fetchBadges = useCallback(async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/badges', {
//         params: { active: 'true', _t: Date.now() },
//       });
//       const badgesData = Array.isArray(res.data) ? res.data : [];
//       setBadges(badgesData);
//     } catch (error) {
//       console.error('Error fetching badges:', error);
//       setBadges([]);
//     }
//   }, []);

//   useEffect(() => {
//     fetchProducts();
//     fetchProductTypes();
//     fetchBadges();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleOpen = (product) => {
//     if (product) {
//       setEditing(product);
//       setFormData({
//         name: product.name,
//         slug: product.slug,
//         description: product.description,
//         price: product.price.toString(),
//         type: product.type,
//         imageUrl: product.imageUrl,
//         badges: product.badges || [],
//         isActive: product.isActive,
//         sortOrder: product.sortOrder,
//       });
//     } else {
//       setEditing(null);
//       setFormData({
//         name: '',
//         slug: '',
//         description: '',
//         price: '',
//         type: productTypes.length > 0 ? productTypes[0].slug : '',
//         imageUrl: '',
//         badges: [],
//         isActive: true,
//         sortOrder: 0,
//       });
//     }
//     setOpen(true);
//   };

//   const handleTypeDialogOpen = () => {
//     setTypeFormData({
//       name: '',
//     });
//     setTypeDialogOpen(true);
//   };

//   const handleTypeDialogClose = () => {
//     setTypeDialogOpen(false);
//   };

//   const handleTypeSubmit = async () => {
//     try {
//       if (!typeFormData.name.trim()) {
//         setSnackbar({ open: true, message: 'Please enter a type name', severity: 'error' });
//         return;
//       }
//       const api = getApiInstance();
//       await api.post('/product-types', {
//         name: typeFormData.name.trim(),
//       });
//       setSnackbar({ open: true, message: 'Product type created successfully', severity: 'success' });
//       handleTypeDialogClose();
//       fetchProductTypes();
//     } catch (error) {
//       setSnackbar({ open: true, message: error.response?.data?.error || 'Error creating product type', severity: 'error' });
//     }
//   };

//   const handleBadgeDialogOpen = () => {
//     setBadgeFormData({
//       name: '',
//     });
//     setBadgeDialogOpen(true);
//   };

//   const handleBadgeDialogClose = () => {
//     setBadgeDialogOpen(false);
//   };

//   const handleBadgeSubmit = async () => {
//     try {
//       if (!badgeFormData.name.trim()) {
//         setSnackbar({ open: true, message: 'Please enter a badge name', severity: 'error' });
//         return;
//       }
//       const api = getApiInstance();
//       await api.post('/badges', {
//         name: badgeFormData.name.trim(),
//       });
//       setSnackbar({ open: true, message: 'Badge created successfully', severity: 'success' });
//       handleBadgeDialogClose();
//       fetchBadges();
//     } catch (error) {
//       setSnackbar({ open: true, message: error.response?.data?.error || 'Error creating badge', severity: 'error' });
//     }
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setEditing(null);
//   };

//   const handleSubmit = async () => {
//     try {
//       // Client-side validation
//       if (!formData.name.trim()) {
//         setSnackbar({ open: true, message: 'Product name is required', severity: 'error' });
//         return;
//       }
//       if (!formData.slug.trim()) {
//         setSnackbar({ open: true, message: 'Product slug is required', severity: 'error' });
//         return;
//       }
//       if (!formData.description.trim()) {
//         setSnackbar({ open: true, message: 'Product description is required', severity: 'error' });
//         return;
//       }
//       if (!formData.price || isNaN(parseFloat(formData.price))) {
//         setSnackbar({ open: true, message: 'Valid product price is required', severity: 'error' });
//         return;
//       }
//       if (!formData.type) {
//         setSnackbar({ open: true, message: 'Product type is required', severity: 'error' });
//         return;
//       }
//       if (!formData.imageUrl) {
//         setSnackbar({ open: true, message: 'Please upload a product image before saving', severity: 'error' });
//         return;
//       }

//       const payload = {
//         ...formData,
//         price: parseFloat(formData.price),
//         badges: formData.badges,
//         sortOrder: parseInt(formData.sortOrder.toString()),
//       };

//       const api = getApiInstance();
//       if (editing) {
//         await api.put(`/products/${editing._id}`, payload);
//         setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
//       } else {
//         await api.post('/products', payload);
//         setSnackbar({ open: true, message: 'Product created successfully', severity: 'success' });
//       }
//       handleClose();
//       fetchProducts();
//     } catch (error) {
//       // Handle different error response formats
//       let errorMessage = 'Error saving product';
      
//       if (error.response?.data) {
//         const errorData = error.response.data;
        
//         // Handle validation errors array
//         if (errorData.errors && Array.isArray(errorData.errors)) {
//           errorMessage = errorData.errors.map((err) => err.msg || err.message || err).join(', ');
//         }
//         // Handle single error message
//         else if (errorData.error) {
//           errorMessage = errorData.error;
//         }
//         // Handle error message directly
//         else if (typeof errorData === 'string') {
//           errorMessage = errorData;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       setSnackbar({ open: true, message: errorMessage, severity: 'error' });
//     }
//   };

//   const handleDeleteClick = (product) => {
//     setProductToDelete(product);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!productToDelete) return;
    
//     try {
//       const api = getApiInstance();
//       await api.delete(`/products/${productToDelete._id}`);
//       setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
//       setDeleteDialogOpen(false);
//       setProductToDelete(null);
//       fetchProducts();
//     } catch (error) {
//       let errorMessage = 'Error deleting product';
      
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

//   const handleDeleteCancel = () => {
//     setDeleteDialogOpen(false);
//     setProductToDelete(null);
//   };

//   const triggerImagePicker = () => {
//     fileInputRef.current?.click();
//   };

//   const handleImageUpload = async (event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
//     const form = new FormData();
//     form.append('file', file);
//     try {
//       setUploadingImage(true);
//       const api = getApiInstance();
//       const res = await api.post('/uploads', form, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
//       setSnackbar({ open: true, message: 'Image uploaded', severity: 'success' });
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
//     } finally {
//       setUploadingImage(false);
//       if (event.target) {
//         event.target.value = '';
//       }
//     }
//   };

//   return (
//     <>
//       <Box>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//           <Typography variant="h4">Products</Typography>
//           <Button
//             variant="contained"
//             startIcon={<AddIcon />}
//             onClick={() => handleOpen()}
//             sx={{
//               bgcolor: 'primary.main',
//               '&:hover': {
//                 bgcolor: 'primary.dark',
//                 transform: 'translateY(-2px)',
//                 boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//               },
//               transition: 'all 0.3s ease',
//             }}
//           >
//             Add Product
//           </Button>
//         </Box>

//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Image</TableCell>
//                 <TableCell>Name</TableCell>
//                 <TableCell>Type</TableCell>
//                 <TableCell>Price</TableCell>
//                 <TableCell>Active</TableCell>
//                 <TableCell>Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {products.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
//                     <Typography variant="body2" color="text.secondary">
//                       No products found. Click &ldquo;Add Product&rdquo; to create your first product.
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 products.map((product) => (
//                   <TableRow key={product._id}>
//                   <TableCell>
//                     {product.imageUrl ? (
//                       <Box
//                         component="img"
//                         src={product.imageUrl}
//                         alt={product.name}
//                         sx={{
//                           width: 60,
//                           height: 60,
//                           objectFit: 'cover',
//                           borderRadius: 1,
//                           border: '1px solid rgba(0,0,0,0.1)',
//                         }}
//                       />
//                     ) : (
//                       <Box
//                         sx={{
//                           width: 60,
//                           height: 60,
//                           backgroundColor: 'rgba(0,0,0,0.05)',
//                           borderRadius: 1,
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           color: 'text.secondary',
//                           fontSize: '0.75rem',
//                         }}
//                       >
//                         No Image
//                       </Box>
//                     )}
//                   </TableCell>
//                   <TableCell>{product.name}</TableCell>
//                   <TableCell>{product.type}</TableCell>
//                   <TableCell>€{product.price}</TableCell>
//                   <TableCell>{product.isActive ? 'Yes' : 'No'}</TableCell>
//                   <TableCell>
//                     <IconButton size="small" onClick={() => handleOpen(product)}>
//                       <EditIcon />
//                     </IconButton>
//                     <IconButton size="small" onClick={() => handleDeleteClick(product)}>
//                       <DeleteIcon />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>

//         <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
//           <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
//           <DialogContent>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//               <TextField
//                 label="Name"
//                 fullWidth
//                 required
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               />
//               <TextField
//                 label="Slug"
//                 fullWidth
//                 required
//                 value={formData.slug}
//                 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
//               />
//               <TextField
//                 label="Description"
//                 fullWidth
//                 multiline
//                 rows={3}
//                 required
//                 value={formData.description}
//                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               />
//               <TextField
//                 label="Price"
//                 type="number"
//                 fullWidth
//                 required
//                 value={formData.price}
//                 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//               />
//               <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
//                 <TextField
//                   select
//                   label="Type"
//                   fullWidth
//                   required
//                   value={formData.type}
//                   onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//                 >
//                   {productTypes.map((type) => (
//                     <MenuItem key={type._id} value={type.slug}>
//                       {type.name}
//                     </MenuItem>
//                   ))}
//                 </TextField>
//                 <Button
//                   variant="outlined"
//                   startIcon={<AddIcon />}
//                   onClick={handleTypeDialogOpen}
//                   sx={{ mt: 1, whiteSpace: 'nowrap' }}
//                 >
//                   Add Type
//                 </Button>
//               </Box>
//               <Box
//                 sx={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: 2,
//                   flexWrap: 'wrap',
//                 }}
//               >
//                 <Button variant="outlined" onClick={triggerImagePicker} disabled={uploadingImage}>
//                   {uploadingImage ? 'Uploading...' : formData.imageUrl ? 'Replace Image' : 'Upload Image'}
//                 </Button>
//                 {formData.imageUrl && (
//                   <Box
//                     component="img"
//                     src={formData.imageUrl}
//                     alt="Product preview"
//                     sx={{
//                       width: 120,
//                       height: 80,
//                       objectFit: 'cover',
//                       borderRadius: 2,
//                       border: '1px solid rgba(0,0,0,0.1)',
//                     }}
//                   />
//                 )}
//                 <input
//                   type="file"
//                   accept="image/*"
//                   ref={fileInputRef}
//                   style={{ display: 'none' }}
//                   onChange={handleImageUpload}
//                 />
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
//                 <FormControl fullWidth>
//                   <InputLabel>Badges</InputLabel>
//                   <Select
//                     multiple
//                     value={formData.badges}
//                     onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
//                     input={<OutlinedInput label="Badges" />}
//                     renderValue={(selected) => (
//                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                         {selected.map((value) => {
//                           const badge = badges.find((b) => b.slug === value);
//                           return (
//                             <Chip key={value} label={badge?.name || value} size="small" />
//                           );
//                         })}
//                       </Box>
//                     )}
//                   >
//                     {badges.map((badge) => (
//                       <MenuItem key={badge._id} value={badge.slug}>
//                         {badge.name}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//                 <Button
//                   variant="outlined"
//                   startIcon={<AddIcon />}
//                   onClick={handleBadgeDialogOpen}
//                   sx={{ mt: 1, whiteSpace: 'nowrap' }}
//                 >
//                   Add Badge
//                 </Button>
//               </Box>
//               <TextField
//                 label="Sort Order"
//                 type="number"
//                 fullWidth
//                 value={formData.sortOrder}
//                 onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
//               />
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={formData.isActive}
//                     onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
//                   />
//                 }
//                 label="Active"
//               />
//             </Box>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleClose}>Cancel</Button>
//             <Button onClick={handleSubmit} variant="contained">
//               {editing ? 'Update' : 'Create'}
//             </Button>
//           </DialogActions>
//         </Dialog>

//         <Dialog open={typeDialogOpen} onClose={handleTypeDialogClose} maxWidth="sm" fullWidth>
//           <DialogTitle>Add Product Type</DialogTitle>
//           <DialogContent>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//               <TextField
//                 label="Type"
//                 fullWidth
//                 required
//                 value={typeFormData.name}
//                 onChange={(e) => setTypeFormData({ name: e.target.value })}
//                 placeholder="e.g., Starter, Bundle, Membership"
//                 autoFocus
//               />
//             </Box>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleTypeDialogClose}>Cancel</Button>
//             <Button onClick={handleTypeSubmit} variant="contained">
//               Create Type
//             </Button>
//           </DialogActions>
//         </Dialog>

//         <Dialog open={badgeDialogOpen} onClose={handleBadgeDialogClose} maxWidth="sm" fullWidth>
//           <DialogTitle>Add Badge</DialogTitle>
//           <DialogContent>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//               <TextField
//                 label="Badge"
//                 fullWidth
//                 required
//                 value={badgeFormData.name}
//                 onChange={(e) => setBadgeFormData({ name: e.target.value })}
//                 placeholder="e.g., New, Best Seller, Featured"
//                 autoFocus
//               />
//             </Box>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleBadgeDialogClose}>Cancel</Button>
//             <Button onClick={handleBadgeSubmit} variant="contained">
//               Create Badge
//             </Button>
//           </DialogActions>
//         </Dialog>

//         <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
//           <DialogTitle>Delete Product</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete &ldquo;{productToDelete?.name}&rdquo;? This action cannot be undone.
//           </Typography>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleDeleteCancel}>Cancel</Button>
//             <Button onClick={handleDeleteConfirm} variant="contained" color="error">
//               Delete
//             </Button>
//           </DialogActions>
//         </Dialog>

//         <Snackbar
//           open={snackbar.open}
//           autoHideDuration={5000}
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//         >
//           <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
//         </Snackbar>
//       </Box>
//     </>
//   );
// }

// export default function Products() {
//   return (
//     <AdminLayout>
//       <ProductsContent />
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
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import RichTextEditor from '@/components/admin/RichTextEditor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
}
const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Products API URL:', API_URL);

// Fixed Product Categories (matches shop page filters)
const PRODUCT_CATEGORIES = [
  { value: 'membership', label: 'Membership' },
  { value: 'template', label: 'Template' },
  { value: 'course', label: 'Course' },
  { value: 'guide', label: 'Guide' },
  { value: 'toolkit', label: 'Toolkit' },
  { value: 'digital-guide', label: 'Digital Guide' },
];

// Fixed Use Case / Types (matches shop page filters)
const USE_CASE_TYPES = [
  { value: 'leadership', label: 'Leadership' },
  { value: 'oncall', label: 'OnCall' },
  { value: 'community', label: 'Community' },
  { value: 'starter', label: 'Starter' },
  { value: 'bundle', label: 'Bundle' },
];

// Trust Badges (fixed list for B2C products)
const TRUST_BADGES = [
  { value: 'gdpr-compliant', label: 'GDPR-compliant' },
  { value: 'safe-checkout', label: 'Safe checkout' },
  { value: 'money-back-guarantee', label: 'Money-back guarantee' },
];

// sirf headers helper, koi axios instance nahi
function getAuthHeaders(extraHeaders = {}) {
  if (typeof window === 'undefined') {
    return { ...extraHeaders };
  }

  const token = localStorage.getItem('admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function ProductsContent() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productTypes, setProductTypes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [accessTab, setAccessTab] = useState(0); // 0 = Organizations, 1 = Institutes
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [badgeDeleteDialogOpen, setBadgeDeleteDialogOpen] = useState(false);
  const [typeDeleteDialogOpen, setTypeDeleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [badgeToDelete, setBadgeToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    type: '',
    category: '',
    targetAudience: '',
    imageUrl: '',
    badges: [],
    isActive: true,
    visibility: 'public',
    allowedOrganizations: [],
    allowedInstitutes: [],
    level1: [],
    level2: [],
    level3: [],
  });
  const [typeFormData, setTypeFormData] = useState({
    name: '',
  });
  const [badgeFormData, setBadgeFormData] = useState({
    name: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private'

  // --------- FETCH HELPERS (simple axios) ----------

  // const fetchProducts = async () => {
  //   try {
  //     const headers = getAuthHeaders();
  //     const url = `${API_URL}/products`;
  //     const params = { includeInactive: true, all: true };
  //     console.log('📡 API: GET', url, params);
  //     const res = await axios.get(url, { headers, params });
  //     const productsData = Array.isArray(res.data)
  //       ? res.data
  //       : res.data.products || [];
  //     console.log('📦 Products fetched:', productsData.length, 'items');
  //     setProducts(productsData);
  //   } catch (error) {
  //     console.error('❌ Error fetching products:', {
  //       url: `${API_URL}/products`,
  //       error: error.response?.data || error.message,
  //       status: error.response?.status,
  //     });
  //     setProducts([]);
  //   }
  // };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const headers = getAuthHeaders({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
  
      const url = `${API_URL}/products`;
      const params = { includeInactive: true, all: true, _t: Date.now() };
  
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
  
      const productsData = Array.isArray(res.data)
        ? res.data
        : res.data.products || [];
  
      console.log('📦 Products fetched:', productsData.length, 'items');
      setProducts(productsData);
    } catch (error) {
      console.error('❌ Error fetching products:', {
        url: `${API_URL}/products`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };
  const fetchProductTypes = async () => {
    try {
      const headers = getAuthHeaders({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
  
      const url = `${API_URL}/product-types`;
      const params = { active: 'true', _t: Date.now() };
  
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
  
      const typesData = Array.isArray(res.data) ? res.data : [];
      setProductTypes(typesData);
  
      // default type set karo sirf jab pehle se koi type na ho
      if (typesData.length > 0) {
        setFormData((prev) => {
          if (prev.type) return prev;
          return { ...prev, type: typesData[0].slug };
        });
      }
    } catch (error) {
      console.error('❌ Error fetching product types:', {
        url: `${API_URL}/product-types`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setProductTypes([]);
    }
  };
  const fetchBadges = async () => {
    try {
      const headers = getAuthHeaders({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
  
      const url = `${API_URL}/badges`;
      const params = { active: 'true', _t: Date.now() };
  
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
  
      const badgesData = Array.isArray(res.data) ? res.data : [];
      setBadges(badgesData);
    } catch (error) {
      console.error('❌ Error fetching badges:', {
        url: `${API_URL}/badges`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setBadges([]);
    }
  };

  const fetchCards = async () => {
    try {
      setLoadingCards(true);
      const headers = getAuthHeaders({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
  
      const url = `${API_URL}/cards`;
      const params = { _t: Date.now() };
  
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
  
      const cardsData = Array.isArray(res.data) ? res.data : [];
      setAllCards(cardsData);
    } catch (error) {
      console.error('❌ Error fetching cards:', {
        url: `${API_URL}/cards`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setAllCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const headers = getAuthHeaders({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
  
      const url = `${API_URL}/organizations/admin`;
      const params = { _t: Date.now() };
  
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
  
      const orgsData = Array.isArray(res.data) ? res.data : [];
      console.log('📦 Organizations fetched:', orgsData.length, 'items');
      setAllOrganizations(orgsData);
    } catch (error) {
      console.error('❌ Error fetching organizations:', {
        url: `${API_URL}/organizations/admin`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setAllOrganizations([]);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const fetchInstitutes = async () => {
    try {
      setLoadingInstitutes(true);
      const headers = getAuthHeaders({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
  
      const url = `${API_URL}/schools/admin`;
      const params = { _t: Date.now() };
  
      console.log('📡 API: GET', url, params);
      const res = await axios.get(url, { headers, params });
  
      const institutesData = Array.isArray(res.data) ? res.data : [];
      console.log('📦 Institutes fetched:', institutesData.length, 'items');
      setAllInstitutes(institutesData);
    } catch (error) {
      console.error('❌ Error fetching institutes:', {
        url: `${API_URL}/schools/admin`,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      setAllInstitutes([]);
    } finally {
      setLoadingInstitutes(false);
    }
  };
    


  // const fetchProductTypes = async () => {
  //   try {
  //     const headers = getAuthHeaders();
  //     const url = `${API_URL}/product-types`;
  //     const params = { active: 'true', _t: Date.now() };
  //     console.log('📡 API: GET', url, params);
  //     const res = await axios.get(url, { headers, params });
  //     const typesData = Array.isArray(res.data) ? res.data : [];
  //     setProductTypes(typesData);

  //     if (typesData.length > 0) {
  //       setFormData((prev) => {
  //         if (prev.type) return prev;
  //         return { ...prev, type: typesData[0].slug };
  //       });
  //     }
  //   } catch (error) {
  //     console.error('❌ Error fetching product types:', {
  //       url: `${API_URL}/product-types`,
  //       error: error.response?.data || error.message,
  //       status: error.response?.status,
  //     });
  //     setProductTypes([]);
  //   }
  // };

  // const fetchBadges = async () => {
  //   try {
  //     const headers = getAuthHeaders();
  //     const url = `${API_URL}/badges`;
  //     const params = { active: 'true', _t: Date.now() };
  //     console.log('📡 API: GET', url, params);
  //     const res = await axios.get(url, { headers, params });
  //     const badgesData = Array.isArray(res.data) ? res.data : [];
  //     setBadges(badgesData);
  //   } catch (error) {
  //     console.error('❌ Error fetching badges:', {
  //       url: `${API_URL}/badges`,
  //       error: error.response?.data || error.message,
  //       status: error.response?.status,
  //     });
  //     setBadges([]);
  //   }
  // };

  useEffect(() => {
    // sirf mount pe run hoga
    fetchProducts();
    fetchProductTypes();
    fetchBadges();
    fetchCards();
    fetchOrganizations();
    fetchInstitutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- DIALOG / FORM HANDLERS ----------

  const handleOpen = (product) => {
    if (product) {
      setEditing(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        type: product.type || '',
        category: product.category || '',
        targetAudience: product.targetAudience || '',
        imageUrl: product.imageUrl,
        badges: product.badges || [],
        isActive: product.isActive,
        visibility: product.visibility || 'public',
        allowedOrganizations: product.allowedOrganizations?.map(org => {
          const id = typeof org === 'object' ? org._id : org;
          return id?.toString ? id.toString() : String(id);
        }) || [],
        allowedInstitutes: product.allowedInstitutes?.map(inst => {
          const id = typeof inst === 'object' ? inst._id : inst;
          return id?.toString ? id.toString() : String(id);
        }) || [],
        level1: product.level1?.map(card => typeof card === 'object' ? card._id : card) || [],
        level2: product.level2?.map(card => typeof card === 'object' ? card._id : card) || [],
        level3: product.level3?.map(card => typeof card === 'object' ? card._id : card) || [],
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        type: '',
        category: '',
        targetAudience: '',
        imageUrl: '',
        badges: [],
        isActive: true,
        visibility: 'public',
        allowedOrganizations: [],
        allowedInstitutes: [],
        level1: [],
        level2: [],
        level3: [],
      });
    }
    setAccessTab(0); // Reset to Organizations tab
    setOpen(true);
  };

  const handleTypeDialogOpen = () => {
    setTypeFormData({ name: '' });
    setTypeDialogOpen(true);
  };

  const handleTypeDialogClose = () => {
    setTypeDialogOpen(false);
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
    if (!typeToDelete?._id) {
      return;
    }
    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/product-types/${typeToDelete._id}`;
      console.log('📡 API: DELETE', url);
      await axios.delete(url, { headers });
      setSnackbar({
        open: true,
        message: 'Product type deleted successfully',
        severity: 'success',
      });
      const deletedSlug = typeToDelete.slug;
      handleTypeDeleteCancel();
      setFormData((prev) => (prev.type === deletedSlug ? { ...prev, type: '' } : prev));
      // Re-fetch to sync select list + default selection
      await fetchProductTypes();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error deleting product type',
        severity: 'error',
      });
    }
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
      const url = `${API_URL}/product-types`;
      const payload = { name: typeFormData.name.trim() };
      console.log('📡 API: POST', url, payload);
      await axios.post(url, payload, { headers });
      setSnackbar({
        open: true,
        message: 'Product type created successfully',
        severity: 'success',
      });
      handleTypeDialogClose();
      fetchProductTypes();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || 'Error creating product type',
        severity: 'error',
      });
    }
  };

  const handleBadgeDialogOpen = () => {
    setBadgeFormData({ name: '' });
    setBadgeDialogOpen(true);
  };

  const handleBadgeDialogClose = () => {
    setBadgeDialogOpen(false);
  };

  const handleBadgeDeleteClick = (badge) => {
    setBadgeToDelete(badge);
    setBadgeDeleteDialogOpen(true);
  };

  const handleBadgeDeleteCancel = () => {
    setBadgeDeleteDialogOpen(false);
    setBadgeToDelete(null);
  };

  const handleBadgeDeleteConfirm = async () => {
    if (!badgeToDelete?._id) return;
    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/badges/${badgeToDelete._id}`;
      console.log('📡 API: DELETE', url);
      await axios.delete(url, { headers });
      const deletedSlug = badgeToDelete.slug;
      handleBadgeDeleteCancel();
      setFormData((prev) => ({
        ...prev,
        badges: prev.badges.filter((slug) => slug !== deletedSlug),
      }));
      await fetchBadges();
      setSnackbar({
        open: true,
        message: 'Badge deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error deleting badge',
        severity: 'error',
      });
    }
  };

  const handleBadgeSubmit = async () => {
    try {
      if (!badgeFormData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a badge name',
          severity: 'error',
        });
        return;
      }
      const headers = getAuthHeaders();
      const url = `${API_URL}/badges`;
      const payload = { name: badgeFormData.name.trim() };
      console.log('📡 API: POST', url, payload);
      await axios.post(url, payload, { headers });
      setSnackbar({
        open: true,
        message: 'Badge created successfully',
        severity: 'success',
      });
      handleBadgeDialogClose();
      fetchBadges();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || 'Error creating badge',
        severity: 'error',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleView = (product) => {
    setViewingProduct(product);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setViewingProduct(null);
  };

  const handleSubmit = async () => {
    try {
      // validation
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Product name is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.description.trim()) {
        setSnackbar({
          open: true,
          message: 'Product description is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        setSnackbar({
          open: true,
          message: 'Valid product price is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.type) {
        setSnackbar({
          open: true,
          message: 'Product type is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.imageUrl) {
        setSnackbar({
          open: true,
          message: 'Please upload a product image before saving',
          severity: 'error',
        });
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        type: formData.type,
        category: formData.category || null,
        targetAudience: formData.targetAudience || null,
        imageUrl: formData.imageUrl,
        badges: formData.badges || [],
        isActive: formData.isActive,
        visibility: formData.visibility || 'public',
        allowedOrganizations: formData.visibility === 'private' ? (formData.allowedOrganizations || []) : [],
        allowedInstitutes: formData.visibility === 'private' ? (formData.allowedInstitutes || []) : [],
        level1: formData.level1 || [],
        level2: formData.level2 || [],
        level3: formData.level3 || [],
      };

      const headers = getAuthHeaders();
      if (editing) {
        const url = `${API_URL}/products/${editing._id}`;
        console.log('📡 API: PUT', url, payload);
        await axios.put(url, payload, { headers });
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success',
        });
      } else {
        const url = `${API_URL}/products`;
        console.log('📡 API: POST', url, payload);
        await axios.post(url, payload, { headers });
        setSnackbar({
          open: true,
          message: 'Product created successfully',
          severity: 'success',
        });
      }
      handleClose();
      fetchProducts();
    } catch (error) {
      let errorMessage = 'Error saving product';

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

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const headers = getAuthHeaders();
      const url = `${API_URL}/products/${productToDelete._id}`;
      console.log('📡 API: DELETE', url);
      await axios.delete(url, { headers });
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      let errorMessage = 'Error deleting product';

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

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const triggerImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: 'Invalid file type. Please select an image file (JPG, PNG, GIF, etc.)',
        severity: 'error',
      });
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setSnackbar({
        open: true,
        message: 'File size too large. Please select an image smaller than 10MB',
        severity: 'error',
      });
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

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
      setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
      setSnackbar({
        open: true,
        message: 'Image uploaded successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Failed to upload image';
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again and try uploading the image';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to upload images. Please contact your administrator';
        } else if (status === 413) {
          errorMessage = 'File size too large. Please select an image smaller than 10MB';
        } else if (status === 415) {
          errorMessage = 'Unsupported file type. Please select a valid image file (JPG, PNG, GIF, etc.)';
        } else if (status === 500) {
          errorMessage = 'Server error occurred while uploading image. Please try again later';
        } else if (errorData?.error) {
          errorMessage = `Upload failed: ${errorData.error}`;
        } else if (errorData?.message) {
          errorMessage = `Upload failed: ${errorData.message}`;
        } else {
          errorMessage = `Upload failed with status ${status}. Please try again`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your internet connection and try again';
      } else if (error.message) {
        // Error occurred in setting up the request
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection and try again';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Upload timeout. The file may be too large or your connection is slow. Please try again';
        } else {
          errorMessage = `Upload error: ${error.message}`;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setUploadingImage(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <>
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
          <Typography variant="h4">Products</Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', md: 'auto' }
            }}
          >
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 150 }, 
                mt: { xs: 0, sm: 1 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <InputLabel 
                sx={{ 
                  zIndex: 1,
                  backgroundColor: 'white',
                  px: 0.5,
                  '&.MuiInputLabel-shrink': {
                    zIndex: 1,
                    backgroundColor: 'white',
                    px: 0.5,
                  },
                }}
              >
                Filter by Visibility
              </InputLabel>
              <Select
                value={visibilityFilter}
                label="Filter by Visibility"
                onChange={(e) => setVisibilityFilter(e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'clip',
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
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
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Add Product
            </Button>
          </Box>
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
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Cards</TableCell>
                <TableCell>Target Audience</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingProducts ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : (() => {
                const filteredProducts = products.filter((product) => {
                  if (visibilityFilter === 'all') return true;
                  return product.visibility === visibilityFilter;
                });
                
                if (filteredProducts.length === 0) {
                  return (
                    <TableRow key="no-products">
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No products found{visibilityFilter !== 'all' ? ` with ${visibilityFilter} visibility` : ''}. Click &ldquo;Add Product&rdquo; to
                          create your first product.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                
                return filteredProducts.map((product) => {
                  // Format target audience for display
                  const getTargetAudienceLabel = (targetAudience) => {
                    if (!targetAudience) return '-';
                    if (targetAudience === 'private-users') return 'B2C';
                    if (targetAudience === 'schools') return 'B2E';
                    if (targetAudience === 'businesses') return 'B2B';
                    return targetAudience;
                  };

                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        {product.imageUrl ? (
                          <Box
                            component="img"
                            src={product.imageUrl}
                            alt={product.name}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid rgba(0,0,0,0.1)',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            No Image
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>
                        {(() => {
                          const totalCards = (product.level1?.length || 0) + (product.level2?.length || 0) + (product.level3?.length || 0);
                          const legacyCards = product.cardIds?.length || 0;
                          const total = totalCards || legacyCards;
                          
                          if (total > 0) {
                            return (
                              <Chip
                                label={`${total} card${total !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(11, 120, 151, 0.1)',
                                  color: '#0B7897',
                                  fontWeight: 500,
                                }}
                              />
                            );
                          }
                          return (
                            <Typography variant="caption" color="text.secondary">
                              No cards
                            </Typography>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTargetAudienceLabel(product.targetAudience)}
                          size="small"
                          sx={{
                            backgroundColor:
                              product.targetAudience === 'private-users'
                                ? 'rgba(11, 120, 151, 0.1)'
                                : product.targetAudience === 'schools'
                                ? 'rgba(255, 152, 0, 0.1)'
                                : product.targetAudience === 'businesses'
                                ? 'rgba(76, 175, 80, 0.1)'
                                : 'rgba(0, 0, 0, 0.05)',
                            color:
                              product.targetAudience === 'private-users'
                                ? '#0B7897'
                                : product.targetAudience === 'schools'
                                ? '#FF9800'
                                : product.targetAudience === 'businesses'
                                ? '#4CAF50'
                                : 'text.secondary',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>€{product.price}</TableCell>
                      <TableCell>
                        <Chip
                          label={product.visibility === 'private' ? 'Private' : 'Public'}
                          size="small"
                          sx={{
                            backgroundColor:
                              product.visibility === 'private'
                                ? 'rgba(255, 152, 0, 0.1)'
                                : 'rgba(76, 175, 80, 0.1)',
                            color:
                              product.visibility === 'private'
                                ? '#FF9800'
                                : '#4CAF50',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>{product.isActive ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleView(product)}
                          title="View"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(product)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(product)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add / Edit Product Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Description *
                </Typography>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                  placeholder="Enter product description..."
                />
              </Box>
              <TextField
                label="Price"
                type="number"
                fullWidth
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
              {/* Use Case / Type Dropdown */}
              <TextField
                select
                label="Type (Use Case / Type)"
                fullWidth
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                helperText="Select: Leadership, OnCall, Community, Starter, or Bundle"
              >
                {USE_CASE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
              
              {/* Product Category Dropdown */}
              <TextField
                select
                label="Category (Product Category)"
                fullWidth
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                helperText="Select: Membership, Template, Course, Guide, Toolkit, or Digital Guide"
              >
                <MenuItem value="">None</MenuItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </TextField>
              
              {/* Target Audience Dropdown */}
              <TextField
                select
                label="Target Audience"
                fullWidth
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                helperText="Select target audience for B2C/B2B detection"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="private-users">Private Users (B2C)</MenuItem>
                <MenuItem value="schools">Schools (B2E)</MenuItem>
                <MenuItem value="businesses">Businesses (B2B)</MenuItem>
              </TextField>
              
              {/* Visibility Toggle */}
              <FormControl fullWidth>
                <InputLabel id="visibility-label">Visibility</InputLabel>
                <Select
                  labelId="visibility-label"
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData({ ...formData, visibility: e.target.value })
                  }
                  input={<OutlinedInput label="Visibility" />}
                >
                  <MenuItem value="public">Public (Show on website)</MenuItem>
                  <MenuItem value="private">Private (Only selected organizations/institutes)</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {formData.visibility === 'public' 
                    ? 'This product will be visible on the public website.'
                    : 'This product will only be visible to selected organizations/institutes.'}
                </Typography>
              </FormControl>

              {/* Private Access Selection - Only show when visibility is private */}
              {formData.visibility === 'private' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Select Access
                  </Typography>
                  <Tabs value={accessTab} onChange={(e, newValue) => setAccessTab(newValue)} sx={{ mb: 2 }}>
                    <Tab label="Organizations" />
                    <Tab label="Institutes" />
                  </Tabs>
                  
                  {/* Organizations Tab */}
                  {accessTab === 0 && (
                    <FormControl fullWidth>
                      <InputLabel id="organizations-label">Select Organizations</InputLabel>
                      <Select
                        labelId="organizations-label"
                        multiple
                        value={formData.allowedOrganizations || []}
                        onChange={(e) =>
                          setFormData({ ...formData, allowedOrganizations: e.target.value })
                        }
                        input={<OutlinedInput label="Select Organizations" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                None selected
                              </Typography>
                            ) : (
                              selected.map((orgId) => {
                                const org = allOrganizations.find((o) => {
                                  const oId = o._id?.toString ? o._id.toString() : String(o._id);
                                  const sId = orgId?.toString ? orgId.toString() : String(orgId);
                                  return oId === sId;
                                });
                                return (
                                  <Chip
                                    key={orgId}
                                    label={org?.name || orgId}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(11, 120, 151, 0.08)',
                                      color: '#0B7897',
                                      fontWeight: 500,
                                    }}
                                  />
                                );
                              })
                            )}
                          </Box>
                        )}
                        disabled={loadingOrganizations}
                      >
                        {loadingOrganizations ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading...
                          </MenuItem>
                        ) : allOrganizations.length === 0 ? (
                          <MenuItem disabled>No organizations available</MenuItem>
                        ) : (
                          allOrganizations.map((org) => (
                            <MenuItem key={org._id} value={org._id}>
                              {org.name || 'Untitled Organization'}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Select organizations that should have access to this private product.
                      </Typography>
                    </FormControl>
                  )}
                  
                  {/* Institutes Tab */}
                  {accessTab === 1 && (
                    <FormControl fullWidth>
                      <InputLabel id="institutes-label">Select Institutes</InputLabel>
                      <Select
                        labelId="institutes-label"
                        multiple
                        value={formData.allowedInstitutes || []}
                        onChange={(e) =>
                          setFormData({ ...formData, allowedInstitutes: e.target.value })
                        }
                        input={<OutlinedInput label="Select Institutes" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                None selected
                              </Typography>
                            ) : (
                              selected.map((instId) => {
                                const inst = allInstitutes.find((i) => i._id === instId);
                                return (
                                  <Chip
                                    key={instId}
                                    label={inst?.name || instId}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(11, 120, 151, 0.08)',
                                      color: '#0B7897',
                                      fontWeight: 500,
                                    }}
                                  />
                                );
                              })
                            )}
                          </Box>
                        )}
                        disabled={loadingInstitutes}
                      >
                        {loadingInstitutes ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading...
                          </MenuItem>
                        ) : allInstitutes.length === 0 ? (
                          <MenuItem disabled>No institutes available</MenuItem>
                        ) : (
                          allInstitutes.map((inst) => {
                            const instId = inst._id?.toString ? inst._id.toString() : String(inst._id);
                            return (
                              <MenuItem key={instId} value={instId}>
                                {inst.name || 'Untitled Institute'}
                              </MenuItem>
                            );
                          })
                        )}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Select institutes that should have access to this private product.
                      </Typography>
                    </FormControl>
                  )}
                </Box>
              )}
              
              {/* Commented out Add Type button - using fixed list instead */}
              {/* <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleTypeDialogOpen}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                Add Type
              </Button> */}
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
                    : formData.imageUrl
                    ? 'Replace Image'
                    : 'Upload Image'}
                </Button>
                {formData.imageUrl && (
                  <Box
                    component="img"
                    src={formData.imageUrl}
                    alt="Product preview"
                    sx={{
                      width: 120,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.1)',
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
              <FormControl fullWidth>
                <InputLabel id="badges-label">Badges (Trust Badges)</InputLabel>
                <Select
                  labelId="badges-label"
                  multiple
                  value={formData.badges}
                  onChange={(e) =>
                    setFormData({ ...formData, badges: e.target.value })
                  }
                  input={<OutlinedInput label="Badges (Trust Badges)" />}
                  renderValue={(selected) => (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                      }}
                    >
                      {selected.map((value) => {
                        const trustBadge = TRUST_BADGES.find(
                          (tb) => tb.value === value
                        );
                        return (
                          <Chip
                            key={value}
                            label={trustBadge?.label || value}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(6, 60, 94, 0.08)',
                              color: '#063C5E',
                              fontWeight: 500,
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        width: 'auto',
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                >
                  {TRUST_BADGES.map((trustBadge) => (
                    <MenuItem key={trustBadge.value} value={trustBadge.value}>
                      {trustBadge.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Level-based Card Selection - Only show when target audience is selected */}
              {formData.targetAudience && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                    Attach Cards by Level
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Level 1 Dropdown */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="level1-label">Level 1 Cards</InputLabel>
                        <Select
                          labelId="level1-label"
                          multiple
                          value={formData.level1 || []}
                          onChange={(e) =>
                            setFormData({ ...formData, level1: e.target.value })
                          }
                          input={<OutlinedInput label="Level 1 Cards" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  None
                                </Typography>
                              ) : (
                                selected.map((cardId) => {
                                  const card = allCards.find((c) => c._id === cardId);
                                  return (
                                    <Chip
                                      key={cardId}
                                      label={card?.title || cardId}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'rgba(11, 120, 151, 0.08)',
                                        color: '#0B7897',
                                        fontWeight: 500,
                                      }}
                                    />
                                  );
                                })
                              )}
                            </Box>
                          )}
                          disabled={loadingCards}
                        >
                          {loadingCards ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              Loading...
                            </MenuItem>
                          ) : allCards.filter(card => {
                            // Filter cards by target audience
                            if (!card.targetAudiences || card.targetAudiences.length === 0) return false;
                            const targetMap = {
                              'private-users': 'B2C',
                              'schools': 'B2E',
                              'businesses': 'B2B'
                            };
                            const targetValue = targetMap[formData.targetAudience];
                            return card.targetAudiences.includes(targetValue);
                          }).length === 0 ? (
                            <MenuItem disabled>No cards available for this target audience</MenuItem>
                          ) : (
                            allCards
                              .filter(card => {
                                // Filter cards by target audience
                                if (!card.targetAudiences || card.targetAudiences.length === 0) return false;
                                const targetMap = {
                                  'private-users': 'B2C',
                                  'schools': 'B2E',
                                  'businesses': 'B2B'
                                };
                                const targetValue = targetMap[formData.targetAudience];
                                return card.targetAudiences.includes(targetValue);
                              })
                              .map((card) => (
                                <MenuItem key={card._id} value={card._id}>
                                  {card.title || 'Untitled Card'}
                                </MenuItem>
                              ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Level 2 Dropdown */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="level2-label">Level 2 Cards</InputLabel>
                        <Select
                          labelId="level2-label"
                          multiple
                          value={formData.level2 || []}
                          onChange={(e) =>
                            setFormData({ ...formData, level2: e.target.value })
                          }
                          input={<OutlinedInput label="Level 2 Cards" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  None
                                </Typography>
                              ) : (
                                selected.map((cardId) => {
                                  const card = allCards.find((c) => c._id === cardId);
                                  return (
                                    <Chip
                                      key={cardId}
                                      label={card?.title || cardId}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'rgba(11, 120, 151, 0.08)',
                                        color: '#0B7897',
                                        fontWeight: 500,
                                      }}
                                    />
                                  );
                                })
                              )}
                            </Box>
                          )}
                          disabled={loadingCards}
                        >
                          {loadingCards ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              Loading...
                            </MenuItem>
                          ) : allCards.filter(card => {
                            // Filter cards by target audience
                            if (!card.targetAudiences || card.targetAudiences.length === 0) return false;
                            const targetMap = {
                              'private-users': 'B2C',
                              'schools': 'B2E',
                              'businesses': 'B2B'
                            };
                            const targetValue = targetMap[formData.targetAudience];
                            return card.targetAudiences.includes(targetValue);
                          }).length === 0 ? (
                            <MenuItem disabled>No cards available for this target audience</MenuItem>
                          ) : (
                            allCards
                              .filter(card => {
                                // Filter cards by target audience
                                if (!card.targetAudiences || card.targetAudiences.length === 0) return false;
                                const targetMap = {
                                  'private-users': 'B2C',
                                  'schools': 'B2E',
                                  'businesses': 'B2B'
                                };
                                const targetValue = targetMap[formData.targetAudience];
                                return card.targetAudiences.includes(targetValue);
                              })
                              .map((card) => (
                                <MenuItem key={card._id} value={card._id}>
                                  {card.title || 'Untitled Card'}
                                </MenuItem>
                              ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Level 3 Dropdown */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="level3-label">Level 3 Cards</InputLabel>
                        <Select
                          labelId="level3-label"
                          multiple
                          value={formData.level3 || []}
                          onChange={(e) =>
                            setFormData({ ...formData, level3: e.target.value })
                          }
                          input={<OutlinedInput label="Level 3 Cards" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  None
                                </Typography>
                              ) : (
                                selected.map((cardId) => {
                                  const card = allCards.find((c) => c._id === cardId);
                                  return (
                                    <Chip
                                      key={cardId}
                                      label={card?.title || cardId}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'rgba(11, 120, 151, 0.08)',
                                        color: '#0B7897',
                                        fontWeight: 500,
                                      }}
                                    />
                                  );
                                })
                              )}
                            </Box>
                          )}
                          disabled={loadingCards}
                        >
                          {loadingCards ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              Loading...
                            </MenuItem>
                          ) : allCards.filter(card => {
                            // Filter cards by target audience
                            if (!card.targetAudiences || card.targetAudiences.length === 0) return false;
                            const targetMap = {
                              'private-users': 'B2C',
                              'schools': 'B2E',
                              'businesses': 'B2B'
                            };
                            const targetValue = targetMap[formData.targetAudience];
                            return card.targetAudiences.includes(targetValue);
                          }).length === 0 ? (
                            <MenuItem disabled>No cards available for this target audience</MenuItem>
                          ) : (
                            allCards
                              .filter(card => {
                                // Filter cards by target audience
                                if (!card.targetAudiences || card.targetAudiences.length === 0) return false;
                                const targetMap = {
                                  'private-users': 'B2C',
                                  'schools': 'B2E',
                                  'businesses': 'B2B'
                                };
                                const targetValue = targetMap[formData.targetAudience];
                                return card.targetAudiences.includes(targetValue);
                              })
                              .map((card) => (
                                <MenuItem key={card._id} value={card._id}>
                                  {card.title || 'Untitled Card'}
                                </MenuItem>
                              ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Select cards for each level. Cards are filtered by the selected target audience.
                  </Typography>
                </>
              )}
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

        {/* Type Dialog */}
        <Dialog
          open={typeDialogOpen}
          onClose={handleTypeDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Product Type</DialogTitle>
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
                label="Type"
                fullWidth
                required
                value={typeFormData.name}
                onChange={(e) =>
                  setTypeFormData({ name: e.target.value })
                }
                placeholder="e.g., Starter, Bundle, Membership"
                autoFocus
              />
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Existing Types
                </Typography>
                {productTypes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No product types yet.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    {productTypes.map((type) => (
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
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleTypeDeleteClick(type)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
              Create Type
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
          <DialogTitle>Delete Product Type</DialogTitle>
          <DialogContent>
            <Typography>
              Delete &ldquo;{typeToDelete?.name}&rdquo;? This will permanently
              remove the product type from the database.
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

        {/* Badge Dialog */}
        <Dialog
          open={badgeDialogOpen}
          onClose={handleBadgeDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Badge</DialogTitle>
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
                label="Badge"
                fullWidth
                required
                value={badgeFormData.name}
                onChange={(e) =>
                  setBadgeFormData({ name: e.target.value })
                }
                placeholder="e.g., New, Best Seller, Featured"
                autoFocus
              />
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Existing Badges
                </Typography>
                {badges.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No badges yet.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    {badges.map((badge) => (
                      <Box
                        key={badge._id}
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
                        <Typography>{badge.name}</Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleBadgeDeleteClick(badge)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBadgeDialogClose}>Cancel</Button>
            <Button onClick={handleBadgeSubmit} variant="contained">
              Create Badge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Badge Dialog */}
        <Dialog
          open={badgeDeleteDialogOpen}
          onClose={handleBadgeDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Badge</DialogTitle>
          <DialogContent>
            <Typography>
              Delete &ldquo;{badgeToDelete?.name}&rdquo;? This will remove the
              badge from the database and any products using it.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBadgeDeleteCancel}>Cancel</Button>
            <Button
              onClick={handleBadgeDeleteConfirm}
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
          <DialogTitle>Delete Product</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete &ldquo;
              {productToDelete?.name}&rdquo;? This action cannot be undone.
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

        {/* View Product Dialog */}
        <Dialog open={viewDialogOpen} onClose={handleViewClose} maxWidth="md" fullWidth>
          <DialogTitle>View Product</DialogTitle>
          <DialogContent>
            {viewingProduct && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {viewingProduct.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {viewingProduct.description || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      €{viewingProduct.price}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {viewingProduct.type || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {viewingProduct.category || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Target Audience
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {viewingProduct.targetAudience === 'private-users' ? 'B2C' :
                       viewingProduct.targetAudience === 'schools' ? 'B2E' :
                       viewingProduct.targetAudience === 'businesses' ? 'B2B' :
                       viewingProduct.targetAudience || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Visibility
                    </Typography>
                    <Chip
                      label={viewingProduct.visibility === 'private' ? 'Private' : 'Public'}
                      size="small"
                      sx={{
                        backgroundColor:
                          viewingProduct.visibility === 'private'
                            ? 'rgba(255, 152, 0, 0.1)'
                            : 'rgba(76, 175, 80, 0.1)',
                        color:
                          viewingProduct.visibility === 'private'
                            ? '#FF9800'
                            : '#4CAF50',
                        fontWeight: 600,
                        mt: 1,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Active
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {viewingProduct.isActive ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Cards by Level
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Level 1:</strong> {viewingProduct.level1?.length || 0} cards
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Level 2:</strong> {viewingProduct.level2?.length || 0} cards
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Level 3:</strong> {viewingProduct.level3?.length || 0} cards
                      </Typography>
                      {viewingProduct.cardIds && viewingProduct.cardIds.length > 0 && (
                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                          <strong>Legacy Cards:</strong> {viewingProduct.cardIds.length} cards
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        <strong>Total:</strong> {(() => {
                          const totalCards = (viewingProduct.level1?.length || 0) + 
                                            (viewingProduct.level2?.length || 0) + 
                                            (viewingProduct.level3?.length || 0);
                          const legacyCards = viewingProduct.cardIds?.length || 0;
                          return totalCards || legacyCards || 0;
                        })()} cards
                      </Typography>
                    </Box>
                  </Grid>
                  {viewingProduct.imageUrl && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Image
                      </Typography>
                      <Box
                        component="img"
                        src={viewingProduct.imageUrl}
                        alt={viewingProduct.name}
                        sx={{
                          width: '100%',
                          maxWidth: 400,
                          height: 'auto',
                          borderRadius: 1,
                          mt: 1,
                        }}
                      />
                    </Grid>
                  )}
                  {viewingProduct.badges && viewingProduct.badges.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Badges
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {viewingProduct.badges.map((badge, index) => (
                          <Chip
                            key={index}
                            label={badge}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(11, 120, 151, 0.1)',
                              color: '#0B7897',
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  {viewingProduct.visibility === 'private' && (
                    <>
                      {viewingProduct.allowedOrganizations && viewingProduct.allowedOrganizations.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Allowed Organizations
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {viewingProduct.allowedOrganizations.map((org, index) => {
                              const orgName = typeof org === 'object' ? org.name : 'Organization';
                              return (
                                <Chip
                                  key={index}
                                  label={orgName}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(11, 120, 151, 0.1)',
                                    color: '#0B7897',
                                    fontWeight: 500,
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Grid>
                      )}
                      {viewingProduct.allowedInstitutes && viewingProduct.allowedInstitutes.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Allowed Institutes
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {viewingProduct.allowedInstitutes.map((inst, index) => {
                              const instName = typeof inst === 'object' ? inst.name : 'Institute';
                              return (
                                <Chip
                                  key={index}
                                  label={instName}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(11, 120, 151, 0.1)',
                                    color: '#0B7897',
                                    fontWeight: 500,
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Grid>
                      )}
                    </>
                  )}
                  {((viewingProduct.level1 && viewingProduct.level1.length > 0) ||
                    (viewingProduct.level2 && viewingProduct.level2.length > 0) ||
                    (viewingProduct.level3 && viewingProduct.level3.length > 0)) && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Cards by Level
                      </Typography>
                      {viewingProduct.level1 && viewingProduct.level1.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Level 1: {viewingProduct.level1.length} card{viewingProduct.level1.length !== 1 ? 's' : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {viewingProduct.level1.map((card, index) => {
                              const cardTitle = typeof card === 'object' ? (card.title || card.name) : 'Card';
                              return (
                                <Chip
                                  key={index}
                                  label={cardTitle}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    color: '#4CAF50',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                      {viewingProduct.level2 && viewingProduct.level2.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Level 2: {viewingProduct.level2.length} card{viewingProduct.level2.length !== 1 ? 's' : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {viewingProduct.level2.map((card, index) => {
                              const cardTitle = typeof card === 'object' ? (card.title || card.name) : 'Card';
                              return (
                                <Chip
                                  key={index}
                                  label={cardTitle}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                    color: '#FF9800',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                      {viewingProduct.level3 && viewingProduct.level3.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Level 3: {viewingProduct.level3.length} card{viewingProduct.level3.length !== 1 ? 's' : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {viewingProduct.level3.map((card, index) => {
                              const cardTitle = typeof card === 'object' ? (card.title || card.name) : 'Card';
                              return (
                                <Chip
                                  key={index}
                                  label={cardTitle}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                    color: '#9C27B0',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleViewClose}>Close</Button>
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
    </>
  );
}

export default function Products() {
  return (
    <AdminLayout>
      <ProductsContent />
    </AdminLayout>
  );
}
