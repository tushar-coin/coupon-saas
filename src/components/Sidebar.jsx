import { Drawer, List, ListItemButton, ListItemText, Box, Avatar, Typography, Divider, IconButton } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonIcon from '@mui/icons-material/Person'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import NightsStayIcon from '@mui/icons-material/NightsStay'
import { NavLink } from "react-router-dom";

const drawerWidth = 240;

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: 'none'
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>C</Avatar>
        <Box>
          <Typography variant="subtitle1">CouponMgr</Typography>
          <Typography variant="caption" color="text.secondary">Coupon Manager</Typography>
        </Box>
      </Box>

      <Divider />

      <List>
        <ListItemButton component={NavLink} to="/dashboard">
          <DashboardIcon sx={{ mr: 1 }} />
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile">
          <PersonIcon sx={{ mr: 1 }} />
          <ListItemText primary="Profile" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/users">
          <GroupAddIcon sx={{ mr: 1 }} />
          <ListItemText primary="Add Users" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/keys">
          <VpnKeyIcon sx={{ mr: 1 }} />
          <ListItemText primary="Key Management" />
        </ListItemButton>
      </List>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <IconButton>
          <NightsStayIcon />
        </IconButton>
      </Box>
    </Drawer>
  );
}
