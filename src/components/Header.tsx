
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutGrid, 
  Award, 
  LineChart, 
  Menu, 
  X,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

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
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('/');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link
            to="/"
            className="mr-1 flex items-center space-x-2 transition-all duration-200 ease-in-out"
            onClick={() => setActiveTab('/')}
          >
            <div className="flex rounded-md bg-primary/10 p-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden font-semibold sm:inline-block">
              Defect Bingo
            </span>
          </Link>
        </div>

        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                  activeTab === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setActiveTab(item.href)}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <UserCircle className="h-4 w-4" />
              <span>Sign in</span>
            </Button>
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                  activeTab === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  setActiveTab(item.href);
                  setIsOpen(false);
                }}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-1">
                <UserCircle className="h-4 w-4" />
                <span>Sign in</span>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
