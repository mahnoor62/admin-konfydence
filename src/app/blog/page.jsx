// 'use client';

// import AdminLayout from '../layout-admin';
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
//   Chip,
//   Snackbar,
//   Alert,
//   Select,
//   FormControl,
//   InputLabel,
//   OutlinedInput,
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
// console.log('🔗 Admin Blog API URL:', API_URL);

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

// function BlogContent() {
//   const [posts, setPosts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [tags, setTags] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
//   const [tagDialogOpen, setTagDialogOpen] = useState(false);
//   const [postToDelete, setPostToDelete] = useState(null);
//   const [editing, setEditing] = useState(null);
//   const fileInputRef = useRef(null);
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [formData, setFormData] = useState({
//     title: '',
//     slug: '',
//     excerpt: '',
//     content: '',
//     featuredImage: '',
//     tags: [],
//     category: '',
//     isPublished: false,
//   });
//   const [categoryFormData, setCategoryFormData] = useState({ name: '' });
//   const [tagFormData, setTagFormData] = useState({ name: '' });
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

//   const fetchPosts = useCallback(async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/blog', {
//         params: { all: true },
//       });
//       // Handle both response formats: { posts: [...] } or [...]
//       const posts = Array.isArray(res.data) ? res.data : res.data.posts || [];
//       setPosts(posts);
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       let errorMessage = 'Failed to load blog posts';
//       if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       }
//       setSnackbar({ open: true, message: errorMessage, severity: 'error' });
//     }
//   }, []);

//   const fetchCategories = useCallback(async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/blog-categories', {
//         params: { active: 'true', _t: Date.now() },
//       });
//       setCategories(res.data);
//       if (res.data.length > 0) {
//         setFormData((prev) => {
//           if (prev.category) {
//             return prev;
//           }
//           return { ...prev, category: res.data[0].slug };
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching categories:', error);
//     }
//   }, []);

//   const fetchTags = useCallback(async () => {
//     try {
//       const api = getApiInstance();
//       const res = await api.get('/blog-tags', {
//         params: { active: 'true', _t: Date.now() },
//       });
//       setTags(res.data);
//     } catch (error) {
//       console.error('Error fetching tags:', error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPosts();
//     fetchCategories();
//     fetchTags();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleOpen = (post) => {
//     if (post) {
//       setEditing(post);
//       // Map tags to slugs if they exist in tags list
//       const tagSlugs = (post.tags || []).map((tag) => {
//         // Try to find tag by slug first, then by name
//         const foundTag = tags.find((t) => t.slug === tag || t.name === tag);
//         return foundTag ? foundTag.slug : tag;
//       }).filter(Boolean);
      
//       setFormData({
//         title: post.title,
//         slug: post.slug,
//         excerpt: post.excerpt,
//         content: post.content,
//         featuredImage: post.featuredImage || '',
//         tags: tagSlugs,
//         category: post.category,
//         isPublished: post.isPublished,
//       });
//     } else {
//       setEditing(null);
//       setFormData({
//         title: '',
//         slug: '',
//         excerpt: '',
//         content: '',
//         featuredImage: '',
//         tags: [],
//         category: categories.length > 0 ? categories[0].slug : '',
//         isPublished: false,
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
//       if (!formData.title.trim()) {
//         setSnackbar({ open: true, message: 'Post title is required', severity: 'error' });
//         return;
//       }
//       if (!formData.slug.trim()) {
//         setSnackbar({ open: true, message: 'Post slug is required', severity: 'error' });
//         return;
//       }
//       if (!formData.excerpt.trim()) {
//         setSnackbar({ open: true, message: 'Post excerpt is required', severity: 'error' });
//         return;
//       }
//       if (!formData.content.trim()) {
//         setSnackbar({ open: true, message: 'Post content is required', severity: 'error' });
//         return;
//       }
//       if (!formData.category) {
//         setSnackbar({ open: true, message: 'Post category is required', severity: 'error' });
//         return;
//       }

//       const payload = {
//         ...formData,
//         publishedAt: formData.isPublished ? new Date().toISOString() : undefined,
//       };

//       if (editing) {
//         const api = getApiInstance();
//         await api.put(`/blog/${editing._id}`, payload);
//         setSnackbar({ open: true, message: 'Post updated successfully', severity: 'success' });
//       } else {
//         const api = getApiInstance();
//         await api.post('/blog', payload);
//         setSnackbar({ open: true, message: 'Post created successfully', severity: 'success' });
//       }
//       handleClose();
//       fetchPosts();
//     } catch (error) {
//       let errorMessage = 'Error saving post';
      
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

//   const handleDeleteClick = (post) => {
//     setPostToDelete(post);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!postToDelete) return;
    
//     try {
//       const api = getApiInstance();
//       const response = await api.delete(`/blog/${postToDelete._id}`);
//       setSnackbar({ open: true, message: 'Post deleted successfully', severity: 'success' });
//       setDeleteDialogOpen(false);
//       setPostToDelete(null);
//       // Refresh the posts list after deletion
//       await fetchPosts();
//     } catch (error) {
//       console.error('Delete error:', error);
//       let errorMessage = 'Error deleting post';
      
//       if (error.response?.data) {
//         const errorData = error.response.data;
//         if (errorData.error) {
//           errorMessage = errorData.error;
//         } else if (typeof errorData === 'string') {
//           errorMessage = errorData;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       setSnackbar({ open: true, message: errorMessage, severity: 'error' });
//       setDeleteDialogOpen(false);
//       setPostToDelete(null);
//     }
//   };

//   const handleDeleteCancel = () => {
//     setDeleteDialogOpen(false);
//     setPostToDelete(null);
//   };

//   const handleCategoryDialogOpen = () => {
//     setCategoryFormData({ name: '' });
//     setCategoryDialogOpen(true);
//   };

//   const handleCategoryDialogClose = () => {
//     setCategoryDialogOpen(false);
//   };

//   const handleCategorySubmit = async () => {
//     try {
//       if (!categoryFormData.name.trim()) {
//         setSnackbar({ open: true, message: 'Please enter a category name', severity: 'error' });
//         return;
//       }
//       const api = getApiInstance();
//       await api.post('/blog-categories', {
//         name: categoryFormData.name.trim(),
//       });
//       setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' });
//       handleCategoryDialogClose();
//       fetchCategories();
//     } catch (error) {
//       setSnackbar({ open: true, message: error.response?.data?.error || 'Error creating category', severity: 'error' });
//     }
//   };

//   const handleTagDialogOpen = () => {
//     setTagFormData({ name: '' });
//     setTagDialogOpen(true);
//   };

//   const handleTagDialogClose = () => {
//     setTagDialogOpen(false);
//   };

//   const handleTagSubmit = async () => {
//     try {
//       if (!tagFormData.name.trim()) {
//         setSnackbar({ open: true, message: 'Please enter a tag name', severity: 'error' });
//         return;
//       }
//       const api = getApiInstance();
//       await api.post('/blog-tags', {
//         name: tagFormData.name.trim(),
//       });
//       setSnackbar({ open: true, message: 'Tag created successfully', severity: 'success' });
//       handleTagDialogClose();
//       fetchTags();
//     } catch (error) {
//       setSnackbar({ open: true, message: error.response?.data?.error || 'Error creating tag', severity: 'error' });
//     }
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
//       setFormData((prev) => ({ ...prev, featuredImage: res.data.url }));
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
//     <Box>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//         <Typography variant="h4">Blog Posts</Typography>
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
//           Add Post
//         </Button>
//       </Box>

//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Image</TableCell>
//               <TableCell>Title</TableCell>
//               <TableCell>Category</TableCell>
//               <TableCell>Status</TableCell>
//               <TableCell>Published</TableCell>
//               <TableCell>Actions</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {posts.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
//                   <Typography variant="body2" color="text.secondary">
//                     No blog posts found. Click &ldquo;Add Post&rdquo; to create your first blog post.
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               posts.map((post) => (
//                 <TableRow key={post._id}>
//                 <TableCell>
//                   {post.featuredImage ? (
//                     <Box
//                       component="img"
//                       src={post.featuredImage}
//                       alt={post.title}
//                       sx={{
//                         width: 60,
//                         height: 60,
//                         objectFit: 'cover',
//                         borderRadius: 1,
//                         border: '1px solid rgba(0,0,0,0.1)',
//                       }}
//                     />
//                   ) : (
//                     <Box
//                       sx={{
//                         width: 60,
//                         height: 60,
//                         backgroundColor: 'rgba(0,0,0,0.05)',
//                         borderRadius: 1,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         color: 'text.secondary',
//                         fontSize: '0.75rem',
//                       }}
//                     >
//                       No Image
//                     </Box>
//                   )}
//                 </TableCell>
//                 <TableCell>{post.title}</TableCell>
//                 <TableCell>
//                   <Chip label={post.category} size="small" />
//                 </TableCell>
//                 <TableCell>
//                   <Chip
//                     label={post.isPublished ? 'Published' : 'Draft'}
//                     color={post.isPublished ? 'success' : 'default'}
//                     size="small"
//                   />
//                 </TableCell>
//                 <TableCell>
//                   {post.publishedAt
//                     ? new Date(post.publishedAt).toLocaleDateString()
//                     : '-'}
//                 </TableCell>
//                 <TableCell>
//                   <IconButton size="small" onClick={() => handleOpen(post)}>
//                     <EditIcon />
//                   </IconButton>
//                   <IconButton size="small" onClick={() => handleDeleteClick(post)}>
//                     <DeleteIcon />
//                   </IconButton>
//                 </TableCell>
//               </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
//         <DialogTitle>{editing ? 'Edit Post' : 'Add Post'}</DialogTitle>
//         <DialogContent>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//             <TextField
//               label="Title"
//               fullWidth
//               required
//               value={formData.title}
//               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//             />
//             <TextField
//               label="Slug"
//               fullWidth
//               required
//               value={formData.slug}
//               onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
//             />
//             <TextField
//               label="Excerpt"
//               fullWidth
//               multiline
//               rows={2}
//               required
//               value={formData.excerpt}
//               onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
//             />
//             <TextField
//               label="Content (HTML/Markdown)"
//               fullWidth
//               multiline
//               rows={10}
//               required
//               value={formData.content}
//               onChange={(e) => setFormData({ ...formData, content: e.target.value })}
//             />
            
//             {/* Image Upload Section */}
//             <Box
//               sx={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 2,
//                 flexWrap: 'wrap',
//               }}
//             >
//               <Button variant="outlined" onClick={triggerImagePicker} disabled={uploadingImage}>
//                 {uploadingImage ? 'Uploading...' : formData.featuredImage ? 'Replace Image' : 'Upload Image'}
//               </Button>
//               {formData.featuredImage && (
//                 <Box
//                   component="img"
//                   src={formData.featuredImage}
//                   alt="Featured preview"
//                   sx={{
//                     width: 120,
//                     height: 80,
//                     objectFit: 'cover',
//                     borderRadius: 2,
//                     border: '1px solid rgba(0,0,0,0.1)',
//                   }}
//                 />
//               )}
//               <input
//                 type="file"
//                 accept="image/*"
//                 ref={fileInputRef}
//                 style={{ display: 'none' }}
//                 onChange={handleImageUpload}
//               />
//             </Box>

//             {/* Category Dropdown with Add Button */}
//             <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
//               <TextField
//                 select
//                 label="Category"
//                 fullWidth
//                 required
//                 value={formData.category}
//                 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//               >
//                 {categories.map((category) => (
//                   <MenuItem key={category._id} value={category.slug}>
//                     {category.name}
//                   </MenuItem>
//                 ))}
//               </TextField>
//               <Button
//                 variant="outlined"
//                 startIcon={<AddIcon />}
//                 onClick={handleCategoryDialogOpen}
//                 sx={{ mt: 1, whiteSpace: 'nowrap' }}
//               >
//                 Add Category
//               </Button>
//             </Box>

//             {/* Tags Multi-Select with Add Button */}
//             <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
//               <FormControl fullWidth>
//                 <InputLabel>Tags</InputLabel>
//                 <Select
//                   multiple
//                   value={formData.tags}
//                   onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
//                   input={<OutlinedInput label="Tags" />}
//                   renderValue={(selected) => (
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                       {selected.map((value) => {
//                         const tag = tags.find((t) => t.slug === value);
//                         return (
//                           <Chip key={value} label={tag?.name || value} size="small" />
//                         );
//                       })}
//                     </Box>
//                   )}
//                 >
//                   {tags.map((tag) => (
//                     <MenuItem key={tag._id} value={tag.slug}>
//                       {tag.name}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//               <Button
//                 variant="outlined"
//                 startIcon={<AddIcon />}
//                 onClick={handleTagDialogOpen}
//                 sx={{ mt: 1, whiteSpace: 'nowrap' }}
//               >
//                 Add Tag
//               </Button>
//             </Box>

//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={formData.isPublished}
//                   onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
//                 />
//               }
//               label="Published"
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

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
//         <DialogTitle>Delete Blog Post</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete &ldquo;{postToDelete?.title}&rdquo;? This action cannot be undone.
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleDeleteCancel}>Cancel</Button>
//           <Button onClick={handleDeleteConfirm} variant="contained" color="error">
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Add Category Dialog */}
//       <Dialog open={categoryDialogOpen} onClose={handleCategoryDialogClose} maxWidth="sm" fullWidth>
//         <DialogTitle>Add Category</DialogTitle>
//         <DialogContent>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//             <TextField
//               label="Category"
//               fullWidth
//               required
//               value={categoryFormData.name}
//               onChange={(e) => setCategoryFormData({ name: e.target.value })}
//               placeholder="e.g., Insight, Technique, Guide"
//               autoFocus
//             />
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCategoryDialogClose}>Cancel</Button>
//           <Button onClick={handleCategorySubmit} variant="contained">
//             Create Category
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Add Tag Dialog */}
//       <Dialog open={tagDialogOpen} onClose={handleTagDialogClose} maxWidth="sm" fullWidth>
//         <DialogTitle>Add Tag</DialogTitle>
//         <DialogContent>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//             <TextField
//               label="Tag"
//               fullWidth
//               required
//               value={tagFormData.name}
//               onChange={(e) => setTagFormData({ name: e.target.value })}
//               placeholder="e.g., Security, Awareness, Training"
//               autoFocus
//             />
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleTagDialogClose}>Cancel</Button>
//           <Button onClick={handleTagSubmit} variant="contained">
//             Create Tag
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

// export default function Blog() {
//   return (
//     <AdminLayout>
//       <BlogContent />
//     </AdminLayout>
//   );
// }
'use client';

import AdminLayout from '../layout-admin';
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
  Chip,
  Snackbar,
  Alert,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
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
console.log('🔗 Admin Blog API URL:', API_URL);

// simple headers helper (no axios instance)
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

function BlogContent() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    tags: [],
    category: '',
    isPublished: false,
  });
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [tagFormData, setTagFormData] = useState({ name: '' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // ---------- FETCH HELPERS (simple axios) ----------

  const fetchPosts = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/blog`, {
        headers,
        params: { all: true },
      });
      const postsData = Array.isArray(res.data) ? res.data : res.data.posts || [];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      let errorMessage = 'Failed to load blog posts';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const fetchCategories = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/blog-categories`, {
        headers,
        params: { active: 'true', _t: Date.now() },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(data);
      if (data.length > 0) {
        setFormData((prev) => {
          if (prev.category) return prev;
          return { ...prev, category: data[0].slug };
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/blog-tags`, {
        headers,
        params: { active: 'true', _t: Date.now() },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    // sirf mount pe run hoga
    fetchPosts();
    fetchCategories();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- DIALOG HANDLERS ----------

  const handleOpen = (post) => {
    if (post) {
      setEditing(post);
      // Map tags to slugs
      const tagSlugs = (post.tags || [])
        .map((tag) => {
          const foundTag = tags.find((t) => t.slug === tag || t.name === tag);
          return foundTag ? foundTag.slug : tag;
        })
        .filter(Boolean);

      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage || '',
        tags: tagSlugs,
        category: post.category,
        isPublished: post.isPublished,
      });
    } else {
      setEditing(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        tags: [],
        category: categories.length > 0 ? categories[0].slug : '',
        isPublished: false,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  // ---------- CRUD OPERATIONS ----------

  const handleSubmit = async () => {
    try {
      if (!formData.title.trim()) {
        setSnackbar({
          open: true,
          message: 'Post title is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.slug.trim()) {
        setSnackbar({
          open: true,
          message: 'Post slug is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.excerpt.trim()) {
        setSnackbar({
          open: true,
          message: 'Post excerpt is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.content.trim()) {
        setSnackbar({
          open: true,
          message: 'Post content is required',
          severity: 'error',
        });
        return;
      }
      if (!formData.category) {
        setSnackbar({
          open: true,
          message: 'Post category is required',
          severity: 'error',
        });
        return;
      }

      const payload = {
        ...formData,
        publishedAt: formData.isPublished ? new Date().toISOString() : undefined,
      };

      const headers = getAuthHeaders();

      if (editing) {
        await axios.put(`${API_URL}/blog/${editing._id}`, payload, { headers });
        setSnackbar({
          open: true,
          message: 'Post updated successfully',
          severity: 'success',
        });
      } else {
        await axios.post(`${API_URL}/blog`, payload, { headers });
        setSnackbar({
          open: true,
          message: 'Post created successfully',
          severity: 'success',
        });
      }

      handleClose();
      fetchPosts();
    } catch (error) {
      let errorMessage = 'Error saving post';

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

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/blog/${postToDelete._id}`, { headers });
      setSnackbar({
        open: true,
        message: 'Post deleted successfully',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      await fetchPosts();
    } catch (error) {
      console.error('Delete error:', error);
      let errorMessage = 'Error deleting post';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  const handleCategoryDialogOpen = () => {
    setCategoryFormData({ name: '' });
    setCategoryDialogOpen(true);
  };

  const handleCategoryDialogClose = () => {
    setCategoryDialogOpen(false);
  };

  const handleCategorySubmit = async () => {
    try {
      if (!categoryFormData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a category name',
          severity: 'error',
        });
        return;
      }
      const headers = getAuthHeaders();
      await axios.post(
        `${API_URL}/blog-categories`,
        { name: categoryFormData.name.trim() },
        { headers }
      );
      setSnackbar({
        open: true,
        message: 'Category created successfully',
        severity: 'success',
      });
      handleCategoryDialogClose();
      fetchCategories();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || 'Error creating category',
        severity: 'error',
      });
    }
  };

  const handleTagDialogOpen = () => {
    setTagFormData({ name: '' });
    setTagDialogOpen(true);
  };

  const handleTagDialogClose = () => {
    setTagDialogOpen(false);
  };

  const handleTagSubmit = async () => {
    try {
      if (!tagFormData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a tag name',
          severity: 'error',
        });
        return;
      }
      const headers = getAuthHeaders();
      await axios.post(
        `${API_URL}/blog-tags`,
        { name: tagFormData.name.trim() },
        { headers }
      );
      setSnackbar({
        open: true,
        message: 'Tag created successfully',
        severity: 'success',
      });
      handleTagDialogClose();
      fetchTags();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error creating tag',
        severity: 'error',
      });
    }
  };

  const triggerImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      const res = await axios.post(`${API_URL}/uploads`, form, { headers });
      setFormData((prev) => ({
        ...prev,
        featuredImage: res.data.url,
      }));
      setSnackbar({
        open: true,
        message: 'Image uploaded',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload image',
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
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Blog Posts</Typography>
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
          Add Post
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No blog posts found. Click &ldquo;Add Post&rdquo; to
                    create your first blog post.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>
                    {post.featuredImage ? (
                      <Box
                        component="img"
                        src={post.featuredImage}
                        alt={post.title}
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
                  <TableCell>{post.title}</TableCell>
                  <TableCell>
                    <Chip label={post.category} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.isPublished ? 'Published' : 'Draft'}
                      color={post.isPublished ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(post)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(post)}
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

      {/* Add / Edit Post Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Post' : 'Add Post'}</DialogTitle>
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
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <TextField
              label="Slug"
              fullWidth
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
            />
            <TextField
              label="Excerpt"
              fullWidth
              multiline
              rows={2}
              required
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
            />
            <TextField
              label="Content (HTML/Markdown)"
              fullWidth
              multiline
              rows={10}
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />

            {/* Image Upload */}
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
                  : formData.featuredImage
                  ? 'Replace Image'
                  : 'Upload Image'}
              </Button>
              {formData.featuredImage && (
                <Box
                  component="img"
                  src={formData.featuredImage}
                  alt="Featured preview"
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

            {/* Category + Add Category */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                select
                label="Category"
                fullWidth
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category.slug}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCategoryDialogOpen}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                Add Category
              </Button>
            </Box>

            {/* Tags + Add Tag */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                      }}
                    >
                      {selected.map((value) => {
                        const tag = tags.find((t) => t.slug === value);
                        return (
                          <Chip
                            key={value}
                            label={tag?.name || value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag._id} value={tag.slug}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleTagDialogOpen}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                Add Tag
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPublished: e.target.checked,
                    })
                  }
                />
              }
              label="Published"
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

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Blog Post</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &ldquo;
            {postToDelete?.title}&rdquo;? This action cannot be undone.
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

      {/* Add Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={handleCategoryDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Category</DialogTitle>
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
              label="Category"
              fullWidth
              required
              value={categoryFormData.name}
              onChange={(e) =>
                setCategoryFormData({ name: e.target.value })
              }
              placeholder="e.g., Insight, Technique, Guide"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCategoryDialogClose}>Cancel</Button>
          <Button onClick={handleCategorySubmit} variant="contained">
            Create Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog
        open={tagDialogOpen}
        onClose={handleTagDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Tag</DialogTitle>
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
              label="Tag"
              fullWidth
              required
              value={tagFormData.name}
              onChange={(e) =>
                setTagFormData({ name: e.target.value })
              }
              placeholder="e.g., Security, Awareness, Training"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTagDialogClose}>Cancel</Button>
          <Button onClick={handleTagSubmit} variant="contained">
            Create Tag
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

export default function Blog() {
  return (
    <AdminLayout>
      <BlogContent />
    </AdminLayout>
  );
}
