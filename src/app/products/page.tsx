'use client';

import AdminLayout from '../layout-admin';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
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
import api from '@/lib/api';
import { Product } from '@/lib/types';

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    type: 'starter' as 'starter' | 'bundle' | 'membership',
    imageUrl: '',
    badges: '',
    isActive: true,
    sortOrder: 0,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get<Product[]>('/products', {
        params: { includeInactive: true, all: true },
      });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditing(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price.toString(),
        type: product.type,
        imageUrl: product.imageUrl,
        badges: product.badges?.join(', ') || '',
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
        type: 'starter',
        imageUrl: '',
        badges: '',
        isActive: true,
        sortOrder: 0,
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
      if (!formData.imageUrl) {
        setSnackbar({ open: true, message: 'Please upload an image before saving.', severity: 'error' });
        return;
      }
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        badges: formData.badges.split(',').map((b) => b.trim()).filter(Boolean),
        sortOrder: parseInt(formData.sortOrder.toString()),
      };

      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
      } else {
        await api.post('/products', payload);
        setSnackbar({ open: true, message: 'Product created successfully', severity: 'success' });
      }
      handleClose();
      fetchProducts();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error saving product', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
        fetchProducts();
      } catch (error) {
        setSnackbar({ open: true, message: 'Error deleting product', severity: 'error' });
      }
    }
  };

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      setUploadingImage(true);
      const res = await api.post<{ url: string }>('/uploads', form, {
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add Product
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>€{product.price}</TableCell>
                  <TableCell>{product.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(product._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
              <TextField
                select
                label="Type"
                fullWidth
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="starter">Starter</MenuItem>
                <MenuItem value="bundle">Bundle</MenuItem>
                <MenuItem value="membership">Membership</MenuItem>
              </TextField>
              <TextField
                label="Image URL"
                fullWidth
                value={formData.imageUrl}
                InputProps={{ readOnly: true }}
                helperText="Image URL is auto-filled after uploading."
              />
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
              <TextField
                label="Badges (comma-separated)"
                fullWidth
                value={formData.badges}
                onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
              />
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
