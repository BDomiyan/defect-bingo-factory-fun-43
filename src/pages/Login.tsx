
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl glass-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-gradient">Login to Defect Bingo</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || formError) && (
                <Alert variant="destructive" className="animate-shake">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{formError || error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
