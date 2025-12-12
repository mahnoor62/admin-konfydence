'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE_URL}/api`;

function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const api = getApiInstance();
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box>
        <Alert severity="info">No metrics available</Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'B2C Active Members',
      value: metrics.b2c?.activeMembers || 0,
      subtitle: formatCurrency(metrics.b2c?.revenueTotal || 0) + ' total revenue',
      icon: PeopleIcon,
      color: 'primary',
      href: '/users',
      emptyMessage: 'No active B2C members yet',
      emptyAction: { label: 'View Users', href: '/users' }
    },
    {
      title: 'B2B Active Contracts',
      value: metrics.b2b?.activeContracts || 0,
      subtitle: formatCurrency(metrics.b2b?.revenue || 0) + ' revenue',
      icon: AccountBalanceIcon,
      color: 'success',
      href: '/organizations?segment=B2B',
      emptyMessage: 'No active B2B contracts',
      emptyAction: { label: 'View Organizations', href: '/organizations' }
    },
    {
      title: 'B2E Active Contracts',
      value: metrics.b2e?.activeContracts || 0,
      subtitle: formatCurrency(metrics.b2e?.revenue || 0) + ' revenue',
      icon: SchoolIcon,
      color: 'info',
      href: '/organizations?segment=B2E',
      emptyMessage: 'No active B2E contracts',
      emptyAction: { label: 'View Organizations', href: '/organizations' }
    },
    {
      title: 'New Leads',
      value: metrics.leads?.newLast7Days || 0,
      subtitle: `Count: ${metrics.leads?.newLast7Days || 0} in last 7 days • ${metrics.leads?.newLast30Days || 0} in last 30 days`,
      icon: ContactMailIcon,
      color: 'warning',
      href: '/leads',
      emptyMessage: 'No new leads',
      emptyAction: { label: 'View Leads', href: '/leads' }
    },
    {
      title: 'Trials Started',
      value: metrics.demos?.startedLast30Days || 0,
      subtitle: `Count: ${metrics.demos?.startedLast30Days || 0} started in last 30 days • ${metrics.demos?.completedLast30Days || 0} completed`,
      icon: PlayArrowIcon,
      color: 'secondary',
      href: '/demos',
      emptyMessage: 'No trials started',
      emptyAction: { label: 'View Trials', href: '/demos' }
    },
    {
      title: 'Active Custom Packages',
      value: metrics.customPackages?.active || 0,
      subtitle: formatCurrency(metrics.customPackages?.revenue || 0) + ' total revenue',
      icon: InventoryIcon,
      color: 'primary',
      href: '/organizations',
      emptyMessage: 'No custom packages',
      emptyAction: { label: 'View Organizations', href: '/organizations' }
    },
    {
      title: 'Pending Custom Package Requests',
      value: metrics.customPackageRequests?.pending || 0,
      subtitle: 'Requests awaiting review',
      icon: AssignmentIcon,
      color: 'warning',
      href: '/custom-package-requests?status=pending',
      emptyMessage: 'No pending requests',
      emptyAction: { label: 'View All Requests', href: '/custom-package-requests' }
    },
    {
      title: 'Active Free Trials',
      value: metrics.trials?.active || 0,
      subtitle: `Count: ${metrics.trials?.active || 0} active trials • ${metrics.trials?.total || 0} total trials`,
      icon: FreeBreakfastIcon,
      color: 'success',
      href: '/demos',
      emptyMessage: 'No active trials',
      emptyAction: { label: 'View Demos & Trials', href: '/demos' }
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Overview of your business metrics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          const isEmpty = card.value === 0;
          return (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <Card
                sx={{
                  height: '100%',
                  background: isEmpty
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.05))'
                    : 'linear-gradient(135deg, rgba(0,139,139,0.08), rgba(255,114,94,0.08))',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
                onClick={() => card.href && router.push(card.href)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Icon sx={{ color: `${card.color}.main`, fontSize: 32 }} />
                    {isEmpty && (
                      <Chip label="Empty" size="small" color="default" variant="outlined" />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1, color: 'text.secondary' }}
                  >
                    {card.title}
                  </Typography>
                  {isEmpty ? (
                    <Box>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {card.emptyMessage}
                      </Typography>
                      {card.emptyAction && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(card.emptyAction.href);
                          }}
                          sx={{ mt: 1 }}
                        >
                          {card.emptyAction.label}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h3" sx={{ color: `${card.color}.main`, fontWeight: 700 }}>
                        {card.value}
                      </Typography>
                      {card.subtitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {card.subtitle}
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recent Signups
                </Typography>
                <List dense>
                  {metrics.recentActivity?.signups?.length > 0 ? (
                    metrics.recentActivity.signups.map((signup, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={signup.name || signup.email}
                          secondary={formatDate(signup.createdAt)}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No recent signups" />
                    </ListItem>
                  )}
                </List>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recent Leads
                </Typography>
                <List dense>
                  {metrics.recentActivity?.leads?.length > 0 ? (
                    metrics.recentActivity.leads.map((lead, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={lead.name}
                          secondary={`${lead.organizationName || 'Individual'} • ${lead.segment} • ${formatDate(lead.createdAt)}`}
                        />
                        <Chip label={lead.status} size="small" color="primary" variant="outlined" />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No recent leads" />
                    </ListItem>
                  )}
                </List>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pending Custom Package Requests
                </Typography>
                <List dense>
                  {metrics.customPackageRequests?.recent?.length > 0 ? (
                    metrics.customPackageRequests.recent.map((request, idx) => (
                      <ListItem 
                        key={idx}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push('/custom-package-requests')}
                      >
                        <ListItemText
                          primary={request.organizationName}
                          secondary={`${request.contactName} • ${request.basePackageId?.name || 'N/A'} • ${formatDate(request.createdAt)}`}
                        />
                        <Chip label="Pending" size="small" color="warning" variant="outlined" />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No pending requests" />
                    </ListItem>
                  )}
                </List>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recent Free Trials
                </Typography>
                <List dense>
                  {metrics.trials?.recent?.length > 0 ? (
                    metrics.trials.recent.map((trial, idx) => (
                      <ListItem 
                        key={idx}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push('/demos')}
                      >
                        <ListItemText
                          primary={`${trial.userId?.name || trial.userId?.email || 'Unknown User'} • ${trial.uniqueCode}`}
                          secondary={`${trial.packageId?.name || 'N/A'} • ${trial.usedSeats || 0}/${trial.maxSeats || 0} seats • ${trial.codeApplications || 0} applications • ${formatDate(trial.createdAt)}`}
                        />
                        <Chip 
                          label={trial.status} 
                          size="small" 
                          color={trial.status === 'active' ? 'success' : trial.status === 'completed' ? 'primary' : 'default'} 
                          variant="outlined" 
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No recent trials" />
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Contract Expiries
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {metrics.recentActivity?.upcomingExpiries?.length > 0 ? (
                  metrics.recentActivity.upcomingExpiries.map((expiry, idx) => (
                    <ListItem key={idx}>
                      <EventIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <ListItemText
                        primary={expiry.organizationId?.name || 'Unknown Organization'}
                        secondary={`Expires: ${formatDate(expiry.contract?.endDate)}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No upcoming expiries" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
