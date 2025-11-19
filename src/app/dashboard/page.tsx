'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import api from '@/lib/api';

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
    async function fetchStats() {
      try {
        const [products, blog, testimonials, b2bLeads, eduLeads, contact] = await Promise.all([
          api.get('/products').then((res) => res.data.length),
          api.get('/blog').then((res) => res.data.posts?.length || 0),
          api.get('/testimonials').then((res) => res.data.length),
          api.get('/leads/b2b').then((res) => res.data.length),
          api.get('/leads/education').then((res) => res.data.length),
          api.get('/contact').then((res) => res.data.length),
        ]);

        setStats({
          products,
          blogPosts: blog,
          testimonials,
          b2bLeads,
          educationLeads: eduLeads,
          contactMessages: contact,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Products', value: stats.products, accent: 'primary.main' },
    { title: 'Blog Posts', value: stats.blogPosts, accent: 'secondary.main' },
    { title: 'Testimonials', value: stats.testimonials, accent: 'warning.main' },
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
                <Typography variant="body2" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
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

