
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Factory, ListOrdered } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    return null;
  }
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Factory className="h-3 w-3" /> Plant ID
            </span>
            <span className="font-medium">{user.plantId}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ListOrdered className="h-3 w-3" /> Line Number
            </span>
            <span className="font-medium">{user.lineNumber}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Employee ID</span>
            <span className="font-medium">{user.employeeId}</span>
          </div>
        </div>
        
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            Account created: {format(new Date(user.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
        
        <Button variant="outline" className="w-full mt-4" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
