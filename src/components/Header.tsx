
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Award, 
  LineChart, 
  Menu, 
  X,
  UserCircle,
  ClipboardCheck,
  LogOut,
  Settings,
  User,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: ('user' | 'admin' | 'manager' | 'qc')[];
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  
  const activeTab = location.pathname;

  const navItems: NavItem[] = [
    {
      name: 'Game',
      href: '/',
      icon: <LayoutGrid className="h-4 w-4" />,
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: <Award className="h-4 w-4" />,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: <Settings className="h-4 w-4" />,
      roles: ['admin']
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role as any))
  );

  const handleLogout = () => {
    logout();
    toast.info("You've been logged out", {
      description: "See you again soon!"
    });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link
            to="/"
            className="mr-1 flex items-center space-x-2 transition-all duration-200 ease-in-out"
          >
            <div className="flex rounded-md bg-primary/10 p-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden font-semibold sm:inline-block">
              Jay Jay Quality
            </span>
          </Link>
        </div>

        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <nav className="flex items-center space-x-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                  activeTab === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <UserCircle className="h-4 w-4" />
                  <span>Sign in</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="container md:hidden">
          <nav className="flex flex-col space-y-1 pb-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                  activeTab === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <div className="pt-2 px-4 py-2 text-sm font-medium text-muted-foreground">
                  Signed in as: {user?.name || 'User'}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mx-4 justify-start gap-1 text-red-500 border-red-200"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="mx-4 mt-2 w-[calc(100%-2rem)] justify-start gap-1">
                  <UserCircle className="h-4 w-4" />
                  <span>Sign in</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
