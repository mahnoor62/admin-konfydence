// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// const API_URL = useMemo(() => `${API_BASE_URL}/api`, []);

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

// export default function AdminDashboard() {
//   const [stats, setStats] = useState({
//     products: 0,
//     blogPosts: 0,
//     testimonials: 0,
//     b2bLeads: 0,
//     educationLeads: 0,
//     contactMessages: 0,
//   });

//   useEffect(() => {
//     async function fetchStats() {
//       try {
//         const api = getApiInstance();
//         // Fetch all items with proper parameters to get complete counts
//         // Use includeInactive=true for products to get all products (active + inactive) for accurate dashboard counts
//         const [productsRes, blogRes, testimonialsRes, b2bLeadsRes, eduLeadsRes, contactRes] = await Promise.all([
//           api.get('/products', { params: { all: true, includeInactive: true } }),
//           api.get('/blog', { params: { all: true } }),
//           api.get('/testimonials'),
//           api.get('/leads/b2b'),
//           api.get('/leads/education'),
//           api.get('/contact'),
//         ]);

//         // Handle different response formats
//         const products = Array.isArray(productsRes.data) 
//           ? productsRes.data.length 
//           : (productsRes.data.products?.length || productsRes.data.length || 0);
        
//         const blogPosts = Array.isArray(blogRes.data) 
//           ? blogRes.data.length 
//           : (blogRes.data.posts?.length || 0);
        
//         const testimonials = Array.isArray(testimonialsRes.data) 
//           ? testimonialsRes.data.length 
//           : 0;
        
//         const b2bLeads = Array.isArray(b2bLeadsRes.data) 
//           ? b2bLeadsRes.data.length 
//           : 0;
        
//         const eduLeads = Array.isArray(eduLeadsRes.data) 
//           ? eduLeadsRes.data.length 
//           : 0;
        
//         const contactMessages = Array.isArray(contactRes.data) 
//           ? contactRes.data.length 
//           : 0;

//         setStats({
//           products,
//           blogPosts,
//           testimonials,
//           b2bLeads,
//           educationLeads: eduLeads,
//           contactMessages,
//         });
//       } catch (error) {
//         console.error('❌ Error fetching dashboard stats:', {
//           url: API_URL,
//           error: error.response?.data || error.message,
//           status: error.response?.status,
//         });
//         // Set error state or show notification
//       }
//     }
//     fetchStats();
//   }, []);

//   const statCards = [
//     { title: 'Products', value: stats.products, accent: 'primary.main' },
//     { title: 'Blog Posts', value: stats.blogPosts, accent: 'secondary.main' },
//     // { title: 'Testimonials', value: stats.testimonials, accent: 'warning.main' },
//     { title: 'B2B Leads', value: stats.b2bLeads, accent: 'success.main' },
//     { title: 'Education Leads', value: stats.educationLeads, accent: 'info.main' },
//     { title: 'Contact Messages', value: stats.contactMessages, accent: 'secondary.main' },
//   ];

//   return (
//     <Box>
//       <Typography variant="h4" gutterBottom>
//         Dashboard
//       </Typography>
//       <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
//         Welcome to the Konfydence Admin Panel
//       </Typography>

//       <Grid container spacing={3}>
//         {statCards.map((card) => (
//           <Grid item xs={12} sm={6} md={4} key={card.title}>
//             <Card
//               sx={{
//                 height: '100%',
//                 background: 'linear-gradient(135deg, rgba(0,139,139,0.08), rgba(255,114,94,0.08))',
//               }}
//             >
//               <CardContent>
//                 <Typography variant="body2" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
//                   {card.title}
//                 </Typography>
//                 <Typography variant="h3" sx={{ color: card.accent, fontWeight: 700 }}>
//                   {card.value}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE_URL}/api`;
console.log('🔗 Admin Dashboard API URL:', API_URL);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    blogPosts: 0,
    testimonials: 0,
    b2bLeads: 0,
    educationLeads: 0,
    contactMessages: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('admin_token')
          : null;

        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [productsRes, blogRes, testimonialsRes, b2bLeadsRes, eduLeadsRes, contactRes] =
          await Promise.all([
            axios.get(`${API_URL}/products`, {
              headers,
              params: { all: true, includeInactive: true },
            }),
            axios.get(`${API_URL}/blog`, {
              headers,
              params: { all: true },
            }),
            axios.get(`${API_URL}/testimonials`, { headers }),
            axios.get(`${API_URL}/leads/b2b`, { headers }),
            axios.get(`${API_URL}/leads/education`, { headers }),
            axios.get(`${API_URL}/contact`, { headers }),
          ]);

        if (!isMounted) return;

        const products = Array.isArray(productsRes.data)
          ? productsRes.data.length
          : productsRes.data?.products?.length || productsRes.data?.length || 0;

        const blogPosts = Array.isArray(blogRes.data)
          ? blogRes.data.length
          : blogRes.data?.posts?.length || 0;

        const testimonials = Array.isArray(testimonialsRes.data)
          ? testimonialsRes.data.length
          : 0;

        const b2bLeads = Array.isArray(b2bLeadsRes.data)
          ? b2bLeadsRes.data.length
          : 0;

        const eduLeads = Array.isArray(eduLeadsRes.data)
          ? eduLeadsRes.data.length
          : 0;

        const contactMessages = Array.isArray(contactRes.data)
          ? contactRes.data.length
          : 0;

        setStats({
          products,
          blogPosts,
          testimonials,
          b2bLeads,
          educationLeads: eduLeads,
          contactMessages,
        });
      } catch (error) {
        console.error('❌ Error fetching dashboard stats:', {
          url: API_URL,
          error: error?.response?.data || error?.message,
          status: error?.response?.status,
        });
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = [
    { title: 'Products', value: stats.products, accent: 'primary.main' },
    { title: 'Blog Posts', value: stats.blogPosts, accent: 'secondary.main' },
    // { title: 'Testimonials', value: stats.testimonials, accent: 'warning.main' },
    { title: 'B2B Leads', value: stats.b2bLeads, accent: 'success.main' },
    { title: 'Education Leads', value: stats.educationLeads, accent: 'info.main' },
    { title: 'Contact Messages', value: stats.contactMessages, accent: 'secondary.main' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the Konfydence Admin Panel
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, rgba(0,139,139,0.08), rgba(255,114,94,0.08))',
              }}
            >
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}
                >
                  {card.title}
                </Typography>
                <Typography variant="h3" sx={{ color: card.accent, fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
