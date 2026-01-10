import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'

export default function Layout() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />

      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Toolbar sx={{ minHeight: 72, px: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
              Coupon Manager Dashboard
            </Typography>

            <IconButton aria-label="notifications">
              {/* placeholder for notification icon */}
            </IconButton>

            <Avatar sx={{ ml: 2 }}>C</Avatar>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}