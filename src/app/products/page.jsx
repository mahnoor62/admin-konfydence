'use client';

import AdminLayout from '../layout-admin';
import { useState, useEffect, useRef, useCallback } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { Select, FormControl, InputLabel, OutlinedInput, Chip } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is missing!');
}
const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Products API URL:', API_URL);

// Helper to get axios instance with auth token
function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  });
  
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
      });
      return Promise.reject(error);
    }
  );
  
  return instance;
}

function ProductsContent() {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [open, setOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    type: '',
    imageUrl: '',
    badges: [],
    isActive: true,
    sortOrder: 0,
  });
  const [typeFormData, setTypeFormData] = useState({
    name: '',
  });
  const [badgeFormData, setBadgeFormData] = useState({
    name: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchProducts = useCallback(async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/products', {
        params: { includeInactive: true, all: true },
      });
      setProducts(res.data);
    } catch (error) {
      console.error('❌ Error fetching products:', error.response?.data || error.message);
    }
  }, []);

  const fetchProductTypes = useCallback(async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/product-types', {
        params: { active: 'true' },
      });
      setProductTypes(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => {
          if (prev.type) {
            return prev;
          }
          return { ...prev, type: res.data[0].slug };
        });
      }
    } catch (error) {
      console.error('❌ Error fetching product types:', error.response?.data || error.message);
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const api = getApiInstance();
      const res = await api.get('/badges', {
        params: { active: 'true' },
      });
      setBadges(res.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
    fetchBadges();
  }, [fetchProducts, fetchProductTypes, fetchBadges]);

  const handleOpen = (product) => {
    if (product) {
      setEditing(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price.toString(),
        type: product.type,
        imageUrl: product.imageUrl,
        badges: product.badges || [],
        isActive: product.isActive,
        sortOrder: product.sortOrder,
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        type: productTypes.length > 0 ? productTypes[0].slug : '',
        imageUrl: '',
        badges: [],
        isActive: true,
        sortOrder: 0,
      });
    }
    setOpen(true);
  };

  const handleTypeDialogOpen = () => {
    setTypeFormData({
      name: '',
    });
    setTypeDialogOpen(true);
  };

  const handleTypeDialogClose = () => {
    setTypeDialogOpen(false);
  };

  const handleTypeSubmit = async () => {
    try {
      if (!typeFormData.name.trim()) {
        setSnackbar({ open: true, message: 'Please enter a type name', severity: 'error' });
        return;
      }
      const api = getApiInstance();
      await api.post('/product-types', {
        name: typeFormData.name.trim(),
      });
      setSnackbar({ open: true, message: 'Product type created successfully', severity: 'success' });
      handleTypeDialogClose();
      fetchProductTypes();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error creating product type', severity: 'error' });
    }
  };

  const handleBadgeDialogOpen = () => {
    setBadgeFormData({
      name: '',
    });
    setBadgeDialogOpen(true);
  };

  const handleBadgeDialogClose = () => {
    setBadgeDialogOpen(false);
  };

  const handleBadgeSubmit = async () => {
    try {
      if (!badgeFormData.name.trim()) {
        setSnackbar({ open: true, message: 'Please enter a badge name', severity: 'error' });
        return;
      }
      const api = getApiInstance();
      await api.post('/badges', {
        name: badgeFormData.name.trim(),
      });
      setSnackbar({ open: true, message: 'Badge created successfully', severity: 'success' });
      handleBadgeDialogClose();
      fetchBadges();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error creating badge', severity: 'error' });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      // Client-side validation
      if (!formData.name.trim()) {
        setSnackbar({ open: true, message: 'Product name is required', severity: 'error' });
        return;
      }
      if (!formData.slug.trim()) {
        setSnackbar({ open: true, message: 'Product slug is required', severity: 'error' });
        return;
      }
      if (!formData.description.trim()) {
        setSnackbar({ open: true, message: 'Product description is required', severity: 'error' });
        return;
      }
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        setSnackbar({ open: true, message: 'Valid product price is required', severity: 'error' });
        return;
      }
      if (!formData.type) {
        setSnackbar({ open: true, message: 'Product type is required', severity: 'error' });
        return;
      }
      if (!formData.imageUrl) {
        setSnackbar({ open: true, message: 'Please upload a product image before saving', severity: 'error' });
        return;
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        badges: formData.badges,
        sortOrder: parseInt(formData.sortOrder.toString()),
      };

      const api = getApiInstance();
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
      } else {
        await api.post('/products', payload);
        setSnackbar({ open: true, message: 'Product created successfully', severity: 'success' });
      }
      handleClose();
      fetchProducts();
    } catch (error) {
      // Handle different error response formats
      let errorMessage = 'Error saving product';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((err) => err.msg || err.message || err).join(', ');
        }
        // Handle single error message
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
        // Handle error message directly
        else if (typeof errorData === 'string') {
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
      const api = getApiInstance();
      await api.delete(`/products/${productToDelete._id}`);
      setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      let errorMessage = 'Error deleting product';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((err) => err.msg || err.message || err).join(', ');
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
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      setUploadingImage(true);
      const api = getApiInstance();
      const res = await api.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
      setSnackbar({ open: true, message: 'Image uploaded', severity: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Products</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Add Product
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No products found. Click &ldquo;Add Product&rdquo; to create your first product.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
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
                  <TableCell>€{product.price}</TableCell>
                  <TableCell>{product.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(product)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                label="Slug"
                fullWidth
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <TextField
                label="Price"
                type="number"
                fullWidth
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  select
                  label="Type"
                  fullWidth
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {productTypes.map((type) => (
                    <MenuItem key={type._id} value={type.slug}>
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleTypeDialogOpen}
                  sx={{ mt: 1, whiteSpace: 'nowrap' }}
                >
                  Add Type
                </Button>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Button variant="outlined" onClick={triggerImagePicker} disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : formData.imageUrl ? 'Replace Image' : 'Upload Image'}
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
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth>
                  <InputLabel>Badges</InputLabel>
                  <Select
                    multiple
                    value={formData.badges}
                    onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
                    input={<OutlinedInput label="Badges" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const badge = badges.find((b) => b.slug === value);
                          return (
                            <Chip key={value} label={badge?.name || value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {badges.map((badge) => (
                      <MenuItem key={badge._id} value={badge.slug}>
                        {badge.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleBadgeDialogOpen}
                  sx={{ mt: 1, whiteSpace: 'nowrap' }}
                >
                  Add Badge
                </Button>
              </Box>
              <TextField
                label="Sort Order"
                type="number"
                fullWidth
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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

        <Dialog open={typeDialogOpen} onClose={handleTypeDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add Product Type</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Type"
                fullWidth
                required
                value={typeFormData.name}
                onChange={(e) => setTypeFormData({ name: e.target.value })}
                placeholder="e.g., Starter, Bundle, Membership"
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleTypeDialogClose}>Cancel</Button>
            <Button onClick={handleTypeSubmit} variant="contained">
              Create Type
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={badgeDialogOpen} onClose={handleBadgeDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add Badge</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Badge"
                fullWidth
                required
                value={badgeFormData.name}
                onChange={(e) => setBadgeFormData({ name: e.target.value })}
                placeholder="e.g., New, Best Seller, Featured"
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBadgeDialogClose}>Cancel</Button>
            <Button onClick={handleBadgeSubmit} variant="contained">
              Create Badge
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &ldquo;{productToDelete?.name}&rdquo;? This action cannot be undone.
          </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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
