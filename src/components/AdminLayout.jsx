'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArticleIcon from '@mui/icons-material/Article';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BusinessIcon from '@mui/icons-material/Business';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import InventoryIcon from '@mui/icons-material/Inventory';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

const drawerWidth = 240;

const menuItems = [
  { label: 'Dashboard', href: '/', icon: DashboardIcon, permission: '*' },
  { label: 'Cards', href: '/cards', icon: DescriptionIcon, permission: 'cards' },
  { label: 'Packages', href: '/packages', icon: InventoryIcon, permission: 'packages' },
  { label: 'Custom Packages', href: '/custom-package-requests', icon: RequestQuoteIcon, permission: 'packages' },
  { label: 'Users', href: '/users', icon: PeopleIcon, permission: 'users' },
  { label: 'Organizations', href: '/organizations', icon: AccountBalanceIcon, permission: 'organizations' },
  { label: 'Schools', href: '/schools', icon: SchoolIcon, permission: 'organizations' },
  { label: 'Sales & Memberships', href: '/sales', icon: ShoppingCartIcon, permission: 'transactions' },
  { label: 'Trials', href: '/demos', icon: PlayArrowIcon, permission: 'demos' },
  { label: 'Leads', href: '/leads', icon: ContactMailIcon, permission: 'leads' },
  { label: 'Settings', href: '/settings', icon: SettingsIcon, permission: '*' },
  { label: 'Products', href: '/products', icon: ShoppingBagIcon, permission: '*' },
  { label: 'Blog Posts', href: '/blog', icon: ArticleIcon, permission: '*' },
  { label: 'Partner Logos', href: '/partners', icon: BusinessIcon, permission: '*' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = router.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    } else if (token) {
      fetchAdminProfile();
    }
  }, [pathname, router]);

  const fetchAdminProfile = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      const API_URL = `${API_BASE_URL}/api`;
      
      const response = await fetch(`${API_URL}/auth/admin/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const adminData = await response.json();
        setUser(adminData);
        // Also store in localStorage for quick access
        localStorage.setItem('admin_user', JSON.stringify(adminData));
      } else {
        // Fallback to localStorage if API fails
        try {
          const userData = JSON.parse(localStorage.getItem('admin_user') || '{}');
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      // Fallback to localStorage if API fails
      try {
        const userData = JSON.parse(localStorage.getItem('admin_user') || '{}');
        setUser(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  const drawer = (
    <Box sx={{ height: '100%', background: 'linear-gradient(185deg, #041519 0%, #042B32 70%)', color: 'white' }}>
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>
          Konfydence
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => {
          const active = pathname === item.href;
          // Basic permission check - can be enhanced with actual RBAC
          // For now, show all items if user has admin token
          return (
            <ListItem key={item.href} disablePadding sx={{ px: 2 }}>
              <ListItemButton
                selected={active}
                onClick={() => router.push(item.href)}
                sx={{
                  my: 0.5,
                  borderRadius: 2,
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                  backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #F6F8FA 0%, #FFFFFF 100%)' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(15,31,43,0.08)',
        }}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.name || user?.email || 'Admin'}
            </Typography>
            <IconButton onClick={handleMenuClick} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'linear-gradient(185deg, #041519 0%, #042B32 70%)',
              color: 'white',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'linear-gradient(185deg, #041519 0%, #042B32 70%)',
              color: 'white',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

