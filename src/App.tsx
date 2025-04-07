import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ensureDatabaseSchema } from "@/lib/supabase/db-setup";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Leaderboard from "./components/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import BingoDashboard from "./pages/BingoDashboard";

// Create the query client outside of the component for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const App = () => {
  const [lastVisited, setLastVisited] = useLocalStorage<string>('last-visited-page', '/');
  
  // Update last visited page for better navigation experience
  const handleRouteChange = (path: string) => {
    setLastVisited(path);
    return null;
  };
  
  // Check database schema on app load
  useEffect(() => {
    // Fix for process.env not being defined in the browser
    const isProduction = window.location.hostname !== 'localhost';
    const checkDbSchema = localStorage.getItem('CHECK_DB_SCHEMA') === 'true';
    
    // Only run in production or when specifically enabled
    if (isProduction || checkDbSchema) {
      ensureDatabaseSchema().catch(error => {
        console.error('Failed to check database schema:', error);
      });
    }
  }, []);
  
  return (
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
              duration: 5000,
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
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } 
                  action={() => handleRouteChange('/admin')}
                />
                <Route 
                  path="/bingo-dashboard" 
                  element={
                    <ProtectedRoute>
                      <BingoDashboard />
                    </ProtectedRoute>
                  } 
                  action={() => handleRouteChange('/bingo-dashboard')}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
