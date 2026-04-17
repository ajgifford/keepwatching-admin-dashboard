import { useState } from 'react';
import { FaCopy, FaFilm, FaTv, FaUser } from 'react-icons/fa';
import { Outlet, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import {
  NotificationsActive as AlertsIcon,
  Dashboard as DashboardIcon,
  Email as EmailIcon,
  ErrorOutline as ErrorOutlineIcon,
  Description as LogsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  People as PeopleIcon,
  Star as StarIcon,
  BarChart as StatisticsIcon,
  Storage as StorageIcon,
  WorkHistory as WorkHistoryIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';

import { signOut } from '../app/auth';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectAuthUser } from '../app/slices/authSlice';

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);

  const handleLogout = async () => {
    await signOut(dispatch);
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'DB Health', icon: <StorageIcon />, path: '/dbHealth' },
    { text: 'Statistics', icon: <StatisticsIcon />, path: '/statistics' },
    { text: 'Accounts', icon: <PeopleIcon />, path: '/accounts' },
    { text: 'Email', icon: <EmailIcon />, path: '/email' },
    { text: 'Weekly Email', icon: <EmailIcon />, path: '/weeklyEmail' },
    { text: 'Notifications', icon: <AlertsIcon />, path: '/notifications' },
    { text: 'Logs', icon: <LogsIcon />, path: '/logs' },
    { text: 'Jobs', icon: <WorkHistoryIcon />, path: '/jobs' },
    { text: 'Shows', icon: <FaTv />, path: '/shows?page=1' },
    { text: 'Duplicate Episodes', icon: <FaCopy />, path: '/shows/duplicates' },
    { text: 'Movies', icon: <FaFilm />, path: '/movies?page=1' },
    { text: 'Ratings & Recommendations', icon: <StarIcon />, path: '/ratingsAndRecommendations' },
    { text: 'People', icon: <FaUser />, path: '/people?letter=A&page=1' },
    { text: 'Person Failures', icon: <ErrorOutlineIcon />, path: '/personFailures' },
  ];

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" color="primary">
            Admin Dashboard
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <>
              <Typography variant="body2" noWrap sx={{ mr: 1, opacity: 0.8 }}>
                {user.displayName ?? user.email}
              </Typography>
              <Tooltip title="Logout">
                <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
