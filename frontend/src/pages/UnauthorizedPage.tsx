import { Container, Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const UnauthorizedPage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold', color: 'error.main' }}>
          🔒 Access Denied
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
          You don't have permission to access this page.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default UnauthorizedPage
