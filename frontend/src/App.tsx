import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import CallAI from '@/pages/CallAI'
import CallExplorer from '@/pages/CallExplorer'
import CallDetails from '@/pages/CallDetails'
import Upload from '@/pages/Upload'
import Agents from '@/pages/Agents'
import Triggers from '@/pages/Triggers'
import BatchMode from '@/pages/BatchMode'
import Search from '@/pages/Search'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="callai-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/callai" element={<CallAI />} />
              <Route path="/calls" element={<CallExplorer />} />
              <Route path="/calls/:callId" element={<CallDetails />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/triggers" element={<Triggers />} />
              <Route path="/batch" element={<BatchMode />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </Layout>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
