
import React from "react"; // Explicitly import React
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocalStorage } from "@/hooks/use-local-storage";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Leaderboard from "./components/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Create the query client outside of the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Add viewport meta tag for better tablet support
if (typeof document !== 'undefined') {
  // Check if viewport meta exists
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  
  // If it doesn't exist, create it
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.setAttribute('name', 'viewport');
    document.head.appendChild(viewportMeta);
  }
  
  // Set viewport content for better mobile and tablet experience
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  
  // Add theme-color meta for browser UI consistency
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    document.head.appendChild(themeColorMeta);
  }
  
  // Set theme color to match our primary gradient
  themeColorMeta.setAttribute('content', '#1e3a8a');
}

const App = () => {
  const [lastVisited, setLastVisited] = useLocalStorage<string>('last-visited-page', '/');
  
  // Update last visited page for better navigation experience
  const handleRouteChange = (path: string) => {
    setLastVisited(path);
  };
  
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner 
              position="top-right" 
              expand 
              closeButton 
              theme="light" 
              richColors 
              toastOptions={{
                classNames: {
                  toast: "bg-white border-blue-200 shadow-lg",
                  title: "text-blue-900 font-medium",
                  description: "text-blue-800",
                  success: "!bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-600",
                  error: "!bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-600",
                  info: "!bg-gradient-to-r from-blue-500 to-sky-500 text-white border-blue-600",
                }
              }}
            />
            <BrowserRouter>
              <div className="tablet-container">
                <Routes>
                  <Route 
                    path="/" 
                    element={<Index />} 
                    action={() => handleRouteChange('/')} 
                  />
                  <Route 
                    path="/login" 
                    element={<Login />} 
                    action={() => handleRouteChange('/login')}
                  />
                  <Route 
                    path="/register" 
                    element={<Register />} 
                    action={() => handleRouteChange('/register')}
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                    action={() => handleRouteChange('/dashboard')}
                  />
                  <Route 
                    path="/leaderboard" 
                    element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    } 
                    action={() => handleRouteChange('/leaderboard')}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
