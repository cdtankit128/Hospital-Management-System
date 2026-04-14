import { useState, useCallback, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { Box, Typography, CircularProgress, Chip, Paper } from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import PlaceIcon from '@mui/icons-material/Place'
import PhoneIcon from '@mui/icons-material/Phone'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Hospital location — update these coordinates to your actual hospital location
const HOSPITAL_LOCATION = {
  lat: 30.772584102865665,
  lng: 76.57641748852551,
}

const HOSPITAL_INFO = {
  name: 'City Hospital & Diagnostic Centre',
  address: 'Chandigarh University, NH-95, Ludhiana - Chandigarh State Hwy, Punjab 140413',
  phone: '+91 98765 43210',
  hours: 'Open 24/7 • OPD: 9 AM – 5 PM',
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi.medical',
      stylers: [{ visibility: 'on' }],
    },
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
  ],
}

interface HospitalMapProps {
  /** Override the default map height */
  height?: string | number
  /** Override hospital coordinates */
  center?: { lat: number; lng: number }
  /** Default zoom level */
  zoom?: number
  /** Show the info card overlay */
  showInfoCard?: boolean
}

const HospitalMap = ({
  height = 400,
  center,
  zoom = 15,
  showInfoCard = true,
}: HospitalMapProps) => {
  const [selectedMarker, setSelectedMarker] = useState(false)
  const [, setMap] = useState<google.maps.Map | null>(null)

  const mapCenter = useMemo(() => center || HOSPITAL_LOCATION, [center])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (loadError) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fce4ec',
          borderRadius: 3,
          border: '1px solid #ef9a9a',
        }}
      >
        <Typography color="error" sx={{ fontWeight: 600 }}>
          Failed to load Google Maps. Please check your API key.
        </Typography>
      </Box>
    )
  }

  if (!isLoaded) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          borderRadius: 3,
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#6C63FF' }} />
        <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>Loading map...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', height, borderRadius: 3, overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Hospital Marker */}
        <Marker
          position={mapCenter}
          onClick={() => setSelectedMarker(true)}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/hospitals.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          animation={window.google.maps.Animation.DROP}
        />

        {/* Info Window on marker click */}
        {selectedMarker && (
          <InfoWindow position={mapCenter} onCloseClick={() => setSelectedMarker(false)}>
            <Box sx={{ p: 0.5, maxWidth: 250 }}>
              <Typography
                sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', mb: 0.5 }}
              >
                <LocalHospitalIcon
                  sx={{ fontSize: 16, color: '#e53935', verticalAlign: 'middle', mr: 0.5 }}
                />
                {HOSPITAL_INFO.name}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#555', mb: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.3, color: '#6C63FF' }} />
                {HOSPITAL_INFO.address}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#555', mb: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.3, color: '#4caf50' }} />
                {HOSPITAL_INFO.phone}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>
                <AccessTimeIcon
                  sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.3, color: '#ff9800' }}
                />
                {HOSPITAL_INFO.hours}
              </Typography>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Floating Info Card */}
      {showInfoCard && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            maxWidth: 360,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalHospitalIcon sx={{ color: '#e53935', fontSize: 24 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>
              {HOSPITAL_INFO.name}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
            {HOSPITAL_INFO.address}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip
              icon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
              label={HOSPITAL_INFO.phone}
              size="small"
              sx={{ fontSize: '0.75rem', bgcolor: '#e8f5e9', color: '#2e7d32' }}
            />
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
              label="24/7"
              size="small"
              sx={{ fontSize: '0.75rem', bgcolor: '#fff3e0', color: '#e65100' }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  )
}

export default HospitalMap
