import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#6c5ce7', // purple accent similar to screenshot
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff'
    },
    mode: 'light'
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#ffffff'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    }
  }
})

export default theme
