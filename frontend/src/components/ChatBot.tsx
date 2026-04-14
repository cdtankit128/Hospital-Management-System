import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Fab,
  Zoom,
  Chip,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import MinimizeIcon from '@mui/icons-material/Remove'
import axios from 'axios'
import { apiUrl } from '../api/config'

interface Message {
  id: number
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
  quickReplies?: string[]
}

const QUICK_TOPICS = [
  { label: '📅 Appointments', key: 'appointment' },
  { label: '🕐 Hospital Timings', key: 'timings' },
  { label: '👨‍⚕️ Doctor Availability', key: 'doctor' },
  { label: '💳 Billing & Payments', key: 'billing' },
]

// Smart response engine
function getBotResponse(input: string, doctors: { name: string; specialization: string }[]): { text: string; quickReplies?: string[] } {
  const lower = input.toLowerCase().trim()

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|namaste)/i.test(lower)) {
    return {
      text: `Hello! 👋 Welcome to Chandigarh University Hospital.\n\nI'm your virtual health assistant. How can I help you today?`,
      quickReplies: ['Book Appointment', 'Hospital Timings', 'Find a Doctor', 'Billing Help'],
    }
  }

  // Thanks
  if (/thank|thanks|thx|ty/i.test(lower)) {
    return {
      text: `You're welcome! 😊 Is there anything else I can help you with?`,
      quickReplies: ['Book Appointment', 'Hospital Timings', 'Find a Doctor', 'Billing Help'],
    }
  }

  // Bye
  if (/^(bye|goodbye|see you|take care)/i.test(lower)) {
    return {
      text: `Thank you for visiting Chandigarh University Hospital! 🏥\nTake care and stay healthy. Feel free to come back anytime you need help.`,
    }
  }

  // Appointments
  if (/appointment|book|schedule|visit|check.?up|consult/i.test(lower)) {
    return {
      text: `📅 **Appointment Information**\n\nTo book an appointment at CU Hospital:\n\n1️⃣ **Online:** Log in to your Patient Dashboard → Appointments section\n2️⃣ **Phone:** Call us at +91 9939339811\n3️⃣ **Walk-in:** Visit the reception desk (Ground Floor)\n\n⏱️ **Booking Hours:** Mon–Sat, 8:00 AM – 5:00 PM\n📋 **Required:** Patient ID, previous records (if any)\n\n💡 *Tip: Online booking is fastest and available 24/7!*`,
      quickReplies: ['Doctor Availability', 'Hospital Timings', 'Cancel Appointment'],
    }
  }

  // Cancel / Reschedule appointment
  if (/cancel|reschedule|postpone|change.*appointment/i.test(lower)) {
    return {
      text: `🔄 **Cancel / Reschedule Appointment**\n\nTo modify your appointment:\n\n1️⃣ Log in to your **Patient Dashboard**\n2️⃣ Go to **Appointments** section\n3️⃣ Select the appointment and choose Cancel/Reschedule\n\n📞 Or call: **+91 9939339811**\n\n⚠️ *Please cancel at least 4 hours before your scheduled time.*`,
      quickReplies: ['Book Appointment', 'Hospital Timings'],
    }
  }

  // Hospital Timings
  if (/timing|hours|open|close|when|schedule.*hospital|working.*hour/i.test(lower)) {
    return {
      text: `🕐 **Hospital Timings**\n\n🏥 **OPD (Outpatient):**\n   Mon – Sat: 9:00 AM – 5:00 PM\n   Sunday: 10:00 AM – 2:00 PM\n\n🚑 **Emergency Ward:**\n   24/7 — Always Open\n\n🧪 **Laboratory:**\n   Mon – Sat: 7:30 AM – 6:00 PM\n   Sunday: 8:00 AM – 1:00 PM\n\n💊 **Pharmacy:**\n   Mon – Sat: 8:00 AM – 9:00 PM\n   Sunday: 9:00 AM – 3:00 PM\n\n📋 **Registration Counter:**\n   Mon – Sat: 8:00 AM – 4:30 PM`,
      quickReplies: ['Book Appointment', 'Find a Doctor', 'Emergency Info'],
    }
  }

  // Emergency
  if (/emergency|urgent|ambulance|critical|accident/i.test(lower)) {
    return {
      text: `🚨 **Emergency Services**\n\n🚑 **Emergency Ward:** Open 24/7\n📞 **Emergency Hotline:** +91 9939339811\n📍 **Location:** Ground Floor, East Wing\n\n🚗 **Ambulance Service:** Available round the clock\n\n⚠️ *If this is a life-threatening emergency, please call 108 (National Ambulance) immediately.*`,
      quickReplies: ['Hospital Timings', 'Find a Doctor'],
    }
  }

  // Doctor availability
  if (/doctor|specialist|available|department|which.*doctor|find.*doctor|consult.*doctor/i.test(lower)) {
    if (doctors.length === 0) {
      return {
        text: `👨‍⚕️ **Doctor Availability**\n\nNo doctors are currently registered in the system.\n\n📞 *Please call +91 9939339811 for doctor availability information.*`,
        quickReplies: ['Book Appointment', 'Hospital Timings', 'Billing Help'],
      }
    }

    // Group doctors by specialization
    const grouped: Record<string, string[]> = {}
    doctors.forEach((doc) => {
      const spec = doc.specialization || 'General Medicine'
      if (!grouped[spec]) grouped[spec] = []
      grouped[spec].push(doc.name)
    })

    const specIcons: Record<string, string> = {
      'Cardiology': '🫀', 'Orthopedics': '🦴', 'Neurology': '🧠',
      'Pediatrics': '👶', 'Dental': '🦷', 'Ophthalmology': '👁️',
      'General Medicine': '🩺', 'Dermatology': '🧴', 'ENT': '👂',
      'Gynecology': '🤰', 'Psychiatry': '🧠', 'Urology': '💧',
      'Oncology': '🎗️', 'Radiology': '📡', 'Pathology': '🧪',
    }

    let doctorList = Object.entries(grouped)
      .map(([spec, names]) => {
        const icon = specIcons[spec] || '🩺'
        const doctorNames = names.map(n => `Dr. ${(n || 'Unknown').split(' ').pop()}`).join(', ')
        return `${icon} **${spec}** — ${doctorNames}`
      })
      .join('\n\n')

    return {
      text: `👨‍⚕️ **Doctor Availability**\n\n🏥 **Our Registered Specialists:**\n\n${doctorList}\n\n📞 *Call +91 9939339811 for appointment scheduling*`,
      quickReplies: ['Book Appointment', 'Hospital Timings', 'Billing Help'],
    }
  }

  // Billing
  if (/bill|billing|payment|pay|fee|charge|cost|price|insurance|cashless|receipt/i.test(lower)) {
    return {
      text: `💳 **Billing & Payments**\n\n💰 **Payment Methods Accepted:**\n   • Cash\n   • Credit / Debit Cards\n   • UPI (Google Pay, PhonePe, Paytm)\n   • Net Banking\n   • Insurance (Cashless & Reimbursement)\n\n🏢 **Billing Counter:**\n   Ground Floor, Main Lobby\n   Mon–Sat: 8:00 AM – 7:00 PM\n\n📝 **Consultation Fees:**\n   • General: ₹300 – ₹500\n   • Specialist: ₹500 – ₹1,000\n   • Emergency: ₹800+\n\n🏥 **Insurance Partners:**\n   Star Health, ICICI Lombard, Max Bupa, HDFC Ergo, Govt. schemes (Ayushman Bharat)\n\n📞 *Billing queries: +91 9939339811*`,
      quickReplies: ['Insurance Details', 'Book Appointment', 'Hospital Timings'],
    }
  }

  // Insurance
  if (/insurance|cashless|claim|policy|ayushman|star health|icici|max bupa/i.test(lower)) {
    return {
      text: `🏥 **Insurance & Cashless Treatment**\n\n✅ **Cashless Partners:**\n   • Star Health Insurance\n   • ICICI Lombard\n   • Max Bupa\n   • HDFC Ergo\n   • United India Insurance\n   • Ayushman Bharat (PMJAY)\n\n📋 **For Cashless Admission:**\n   1. Present your insurance card at Reception\n   2. Fill the pre-authorization form\n   3. Approval typically within 2–4 hours\n\n📞 *Insurance desk: +91 9939339811*`,
      quickReplies: ['Billing Help', 'Book Appointment'],
    }
  }

  // Registration
  if (/register|sign.?up|new.*patient|create.*account/i.test(lower)) {
    return {
      text: `📝 **Patient Registration**\n\nTo register as a new patient:\n\n1️⃣ **Online:** Click "Register as Patient" on the login page\n2️⃣ Fill in: Full Name, Age, Mobile Number, Gender\n3️⃣ You'll receive a **Login ID** and **Password**\n\n🆔 Use your mobile number as your Login ID\n\n💡 *Already registered? Use the Patient login on the main page.*`,
      quickReplies: ['Book Appointment', 'Hospital Timings'],
    }
  }

  // Reports / Records
  if (/report|record|test.*result|lab|prescription|diagnos/i.test(lower)) {
    return {
      text: `📋 **Medical Records & Reports**\n\nTo access your records:\n\n1️⃣ Log in to your **Patient Dashboard**\n2️⃣ Go to the **Prescriptions** section\n3️⃣ View all your diagnosis and prescription history\n\n🧪 **Lab Reports:**\n   Available within 24–48 hours of testing\n   Accessible via your Patient Dashboard\n\n📞 *For urgent reports: +91 9939339811*`,
      quickReplies: ['Book Appointment', 'Find a Doctor'],
    }
  }

  // Location / Address
  if (/location|address|where|direction|map|reach|route/i.test(lower)) {
    return {
      text: `📍 **Hospital Location**\n\n🏥 **Chandigarh University Hospital**\nNH-05, Ludhiana – Chandigarh State Highway\nGharuān, Punjab 140413, India\n\n🚗 **By Car:** 30 min from Chandigarh city center\n🚌 **By Bus:** CU shuttle from Chandigarh ISBT\n🚆 **Nearest Railway:** Chandigarh Junction (30 km)\n✈️ **Nearest Airport:** Chandigarh Airport (35 km)\n\n📞 *Helpline: +91 9939339811*`,
      quickReplies: ['Hospital Timings', 'Emergency Info'],
    }
  }

  // Contact
  if (/contact|phone|call|email|reach.*us|helpline/i.test(lower)) {
    return {
      text: `📞 **Contact Information**\n\n☎️ **Phone:** +91 9939339811\n📧 **Email:** chdhms@gmail.com\n\n🏥 **Chandigarh University Hospital**\nNH-05, Ludhiana – Chandigarh State Hwy\nPunjab, India\n\n⏰ **Helpline Hours:** Mon–Sat, 8 AM – 8 PM\n🚑 **Emergency:** 24/7`,
      quickReplies: ['Hospital Timings', 'Book Appointment'],
    }
  }

  // Facilities / Services
  if (/facilit|service|amenity|offer|what.*do.*you/i.test(lower)) {
    return {
      text: `🏥 **Our Facilities & Services**\n\n🩺 General Medicine & Family Care\n🫀 Cardiology & Heart Care\n🦴 Orthopedics & Joint Replacement\n🧠 Neurology & Neurosurgery\n👶 Pediatrics & Neonatal Care\n🦷 Dental & Oral Surgery\n👁️ Ophthalmology & Eye Care\n🧪 Pathology & Diagnostics Lab\n📡 Radiology (X-Ray, CT, MRI, Ultrasound)\n💊 24/7 Pharmacy\n🚑 Ambulance Service\n🛏️ ICU & Critical Care\n\n📞 *More info: +91 9939339811*`,
      quickReplies: ['Find a Doctor', 'Book Appointment', 'Hospital Timings'],
    }
  }

  // Default fallback
  return {
    text: `I'm sorry, I didn't quite understand that. 🤔\n\nI can help you with:\n• 📅 Booking appointments\n• 🕐 Hospital timings\n• 👨‍⚕️ Doctor availability\n• 💳 Billing & payments\n• 📍 Location & directions\n• 📋 Medical records\n\nPlease try asking about one of these topics, or choose from the options below!`,
    quickReplies: ['Book Appointment', 'Hospital Timings', 'Find a Doctor', 'Billing Help'],
  }
}

interface ChatBotProps {
  mode?: 'basic' | 'ai'
  role?: 'doctor' | 'patient'
  doctorName?: string | null
}

const ChatBot = ({ mode = 'basic', role = 'doctor', doctorName }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [doctors, setDoctors] = useState<{ name: string; specialization: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  let msgIdCounter = useRef(0)

  // Fetch registered doctors on mount (only for basic mode)
  useEffect(() => {
    if (mode === 'basic') {
      axios.get(apiUrl('/api/auth/doctors-list'))
        .then(res => {
          const data = res.data.map((d: any) => ({
            name: d.fullName || d.name || d.username || 'Unknown',
            specialization: d.specialization || 'General Medicine',
          }))
          setDoctors(data)
        })
        .catch(() => setDoctors([]))
    }
  }, [mode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Reset messages when doctor changes (new login)
  useEffect(() => {
    setMessages([])
    setIsOpen(false)
  }, [doctorName])

  // send welcome on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true)
      const drGreeting = doctorName ? `Hello, Dr. ${doctorName}! 👋` : `Hello, Doctor! 👋`
      const welcomeText = mode === 'ai' && role === 'doctor'
        ? `${drGreeting} I'm your **AI Medical Assistant** powered by Gemini.\n\nI can help with clinical guidelines, drug interactions, treatment protocols, and more.\n\nHow can I assist you today?`
        : mode === 'ai' && role === 'patient'
        ? `Hello! 👋 I'm your **AI Health Assistant** powered by Gemini.\n\nI can help you understand symptoms, medications, lab reports, and general health tips.\n\n💡 *I'm not a substitute for professional medical advice — always consult your doctor for specific concerns.*\n\nHow can I help you today?`
        : `Hello! 👋 I'm **CU Health Assistant**, your smart hospital chatbot.\n\nI can help you with appointments, timings, doctor info, billing, and more.\n\nWhat would you like to know?`
      const quickReplies = mode === 'ai' && role === 'doctor'
        ? ['Hypertension guidelines', 'Drug interaction check', 'Treatment protocols', 'Post-surgery care']
        : mode === 'ai' && role === 'patient'
        ? ['Understand my symptoms', 'Medication side effects', 'Health & diet tips', 'Book Appointment']
        : ['Book Appointment', 'Hospital Timings', 'Find a Doctor', 'Billing Help']
      setTimeout(() => {
        setMessages([
          {
            id: ++msgIdCounter.current,
            text: welcomeText,
            sender: 'bot',
            timestamp: new Date(),
            quickReplies,
          },
        ])
        setIsTyping(false)
      }, 800)
    }
    if (isOpen) {
      setHasNewMessage(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: ++msgIdCounter.current,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      if (mode === 'ai') {
        // Call Gemini API via backend
        const res = await axios.post(apiUrl('/api/chat'), { message: text.trim(), role: role })
        const reply = res.data.reply || 'Sorry, I could not get a response.'
        const botMsg: Message = {
          id: ++msgIdCounter.current,
          text: reply,
          sender: 'bot',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      } else {
        // Basic mode - local responses
        const delay = 500 + Math.random() * 600
        await new Promise((resolve) => setTimeout(resolve, delay))
        const response = getBotResponse(text, doctors)
        const botMsg: Message = {
          id: ++msgIdCounter.current,
          text: response.text,
          sender: 'bot',
          timestamp: new Date(),
          quickReplies: response.quickReplies,
        }
        setMessages((prev) => [...prev, botMsg])
      }
    } catch (err) {
      console.error('ChatBot error:', err)
      const errorMsg: Message = {
        id: ++msgIdCounter.current,
        text: mode === 'ai'
          ? `Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.`
          : `Sorry, something went wrong. Please try again or choose a topic below.`,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: mode === 'ai' ? undefined : ['Book Appointment', 'Hospital Timings', 'Find a Doctor', 'Billing Help'],
      }
      setMessages((prev) => [...prev, errorMsg])
    }
    setIsTyping(false)
    if (!isOpen) setHasNewMessage(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const formatText = (text: string) => {
    // Simple markdown-like formatting
    return text.split('\n').map((line, i) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
      return (
        <span
          key={i}
          dangerouslySetInnerHTML={{ __html: formatted }}
          style={{ display: 'block', minHeight: line === '' ? '8px' : 'auto' }}
        />
      )
    })
  }

  const primaryColor = '#0d2b52'
  const accentColor = '#1a6fc4'

  return (
    <>
      {/* Chat Window */}
      <Zoom in={isOpen}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 0, sm: 100 },
            right: { xs: 0, sm: 24 },
            width: { xs: '100%', sm: 400 },
            height: { xs: '100vh', sm: 560 },
            maxHeight: { xs: '100vh', sm: '80vh' },
            borderRadius: { xs: 0, sm: '20px' },
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            background: '#fff',
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #1a3c6e 50%, ${accentColor} 100%)`,
              color: '#fff',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <SmartToyIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                {mode === 'ai' && role === 'doctor' ? 'AI Medical Assistant' : mode === 'ai' && role === 'patient' ? 'AI Health Assistant' : 'CU Health Assistant'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#4ADE80',
                    boxShadow: '0 0 6px #4ADE80',
                  }}
                />
                <Typography sx={{ fontSize: '0.75rem', opacity: 0.9 }}>Online • Ready to help</Typography>
              </Box>
            </Box>
            <Tooltip title="Minimize">
              <IconButton onClick={() => setIsOpen(false)} sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}>
                <MinimizeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={() => { setIsOpen(false); setMessages([]); }} sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Quick Topic Chips (basic mode only) */}
          {mode !== 'ai' && (
            <Box
              sx={{
                display: 'flex',
                gap: 0.8,
                p: 1.5,
                flexWrap: 'wrap',
                background: 'linear-gradient(180deg, #f0f5ff 0%, #fff 100%)',
                borderBottom: '1px solid #e8edf5',
                flexShrink: 0,
              }}
            >
              {QUICK_TOPICS.map((topic) => (
                <Chip
                  key={topic.key}
                  label={topic.label}
                  size="small"
                  onClick={() => sendMessage(topic.key)}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    border: `1px solid ${accentColor}30`,
                    color: primaryColor,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: `${accentColor}15`,
                      borderColor: accentColor,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 2px 6px ${accentColor}20`,
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              background: '#fafbfd',
              '&::-webkit-scrollbar': { width: 5 },
              '&::-webkit-scrollbar-thumb': {
                background: '#c8d0dc',
                borderRadius: 10,
              },
            }}
          >
            {messages.map((msg) => (
              <Box key={msg.id}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    gap: 1,
                    alignItems: 'flex-end',
                  }}
                >
                  {msg.sender === 'bot' && (
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                        flexShrink: 0,
                      }}
                    >
                      <SmartToyIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '80%',
                      px: 2,
                      py: 1.5,
                      borderRadius:
                        msg.sender === 'user'
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                      background:
                        msg.sender === 'user'
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : '#fff',
                      color: msg.sender === 'user' ? '#fff' : '#1e293b',
                      boxShadow:
                        msg.sender === 'user'
                          ? '0 2px 8px rgba(13,43,82,0.25)'
                          : '0 1px 4px rgba(0,0,0,0.07)',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      border: msg.sender === 'bot' ? '1px solid #eef1f6' : 'none',
                    }}
                  >
                    {formatText(msg.text)}
                  </Box>
                </Box>

                {/* Quick Reply Buttons */}
                {msg.sender === 'bot' && msg.quickReplies && (
                  <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mt: 1, ml: 4.5 }}>
                    {msg.quickReplies.map((reply) => (
                      <Chip
                        key={reply}
                        label={reply}
                        size="small"
                        onClick={() => sendMessage(reply)}
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: `${accentColor}10`,
                          border: `1px solid ${accentColor}40`,
                          color: accentColor,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: accentColor,
                            color: '#fff',
                            transform: 'scale(1.03)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: '16px 16px 16px 4px',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    border: '1px solid #eef1f6',
                    display: 'flex',
                    gap: 0.5,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#94a3b8',
                        animation: 'botTyping 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`,
                        '@keyframes botTyping': {
                          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                          '30%': { transform: 'translateY(-6px)', opacity: 1 },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid #e8edf5',
              background: '#fff',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                  },
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: accentColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                    borderWidth: '1.5px',
                  },
                },
              }}
            />
            <IconButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              sx={{
                background: input.trim()
                  ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                  : '#e2e8f0',
                color: '#fff',
                width: 40,
                height: 40,
                transition: 'all 0.2s',
                '&:hover': {
                  background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                  transform: 'scale(1.05)',
                },
                '&.Mui-disabled': {
                  color: '#94a3b8',
                  background: '#e2e8f0',
                },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Footer branding */}
          <Box
            sx={{
              textAlign: 'center',
              py: 0.8,
              background: '#f8fafc',
              borderTop: '1px solid #eef1f6',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              Powered by <strong>CU Hospital HMS</strong> • {mode === 'ai' ? 'AI Assistant' : 'Health Assistant'}
            </Typography>
          </Box>
        </Box>
      </Zoom>

      {/* Floating Action Button */}
      <Zoom in={!isOpen}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9998,
          }}
        >
          {/* Pulse ring animation */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: `2px solid ${accentColor}`,
              animation: 'chatPulse 2s ease-in-out infinite',
              '@keyframes chatPulse': {
                '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.6 },
                '50%': { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 0 },
                '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
              },
            }}
          />
          <Tooltip title="Chat with us!" placement="left">
            <Badge
              badgeContent={hasNewMessage ? '1' : 0}
              color="error"
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  animation: hasNewMessage ? 'badgeBounce 0.5s ease' : 'none',
                  '@keyframes badgeBounce': {
                    '0%, 100%': { transform: 'scale(1) translate(50%, -50%)' },
                    '50%': { transform: 'scale(1.3) translate(50%, -50%)' },
                  },
                },
              }}
            >
              <Fab
                onClick={() => setIsOpen(true)}
                sx={{
                  width: 60,
                  height: 60,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                  color: '#fff',
                  boxShadow: `0 6px 20px rgba(13,43,82,0.4)`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${primaryColor} 100%)`,
                    transform: 'scale(1.08)',
                    boxShadow: `0 8px 28px rgba(13,43,82,0.5)`,
                  },
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 30 }} />
              </Fab>
            </Badge>
          </Tooltip>
        </Box>
      </Zoom>
    </>
  )
}

export default ChatBot
