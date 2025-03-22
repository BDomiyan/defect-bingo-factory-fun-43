
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Loader2, ClipboardCheck } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employeeId: z.string().min(3, 'Employee ID is required'),
  plantId: z.string().min(2, 'Plant ID is required'),
  lineNumber: z.string().min(1, 'Line number is required'),
});

type FormData = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    plantId: '',
    lineNumber: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      // Validate form data
      registerSchema.parse(formData);
      
      // Register the user with explicitly passing all required fields
      await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        employeeId: formData.employeeId,
        plantId: formData.plantId,
        lineNumber: formData.lineNumber
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFormError(err.errors[0].message);
      }
      // Other errors are handled by the auth context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-background to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-primary/10">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">Jay Jay Quality</CardTitle>
            <CardDescription className="text-base">Create an account to access quality tools</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || formError) && (
                <Alert variant="destructive" className="animate-shake">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{formError || error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    name="employeeId"
                    placeholder="EMP123"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plantId">Plant ID</Label>
                  <Input
                    id="plantId"
                    name="plantId"
                    placeholder="P01"
                    value={formData.plantId}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lineNumber">Line Number</Label>
                  <Input
                    id="lineNumber"
                    name="lineNumber"
                    placeholder="L12"
                    value={formData.lineNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
