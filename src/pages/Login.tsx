
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, AlertCircle, ShieldCheck, UserCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      await login(email, password);
      
      // Check if admin and redirect accordingly
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (user && user.role === 'admin') {
        toast.success("Admin login successful!", {
          description: "Welcome to Jay Jay Quality Admin Portal",
          duration: 4000,
        });
        navigate("/admin");
      } else {
        toast.success("Login successful!", {
          description: "Welcome back to Jay Jay Quality",
          duration: 4000,
        });
        navigate("/dashboard");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      toast.error("Login failed", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };
  
  // Helper function for demo login
  const handleDemoLogin = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail("admin@jayjay.com");
      setPassword("admin123");
    } else {
      setEmail("user@jayjay.com");
      setPassword("user123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-600 to-blue-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Jay Jay Quality</h1>
          <p className="text-blue-100">Log in to access the quality management platform</p>
        </div>
        
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDemoLogin('admin')}
                    className="flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Admin Demo</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDemoLogin('user')}
                    className="flex items-center justify-center gap-2"
                  >
                    <UserCircle className="h-4 w-4 text-blue-600" />
                    <span>User Demo</span>
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Create account
              </Link>
            </div>
            
            <div className="text-xs text-center text-gray-400">
              By logging in, you agree to our terms of service and privacy policy.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
