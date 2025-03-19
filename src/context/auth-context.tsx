
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  plantId: string;
  lineNumber: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<UserProfile, 'id' | 'role' | 'createdAt'> & { password: string }) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useLocalStorage<UserProfile[]>('users', []);
  const [currentUser, setCurrentUser] = useLocalStorage<UserProfile | null>('currentUser', null);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get passwords from localStorage
      const credentials = localStorage.getItem('userCredentials');
      const parsedCredentials = credentials ? JSON.parse(credentials) : {};
      
      const userExists = users.find(user => user.email === email);
      
      if (!userExists) {
        throw new Error('User not found. Please check your email or register.');
      }
      
      const userPassword = parsedCredentials[email];
      
      if (userPassword !== password) {
        throw new Error('Incorrect password. Please try again.');
      }
      
      setCurrentUser(userExists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<UserProfile, 'id' | 'role' | 'createdAt'> & { password: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if user already exists
      const userExists = users.some(user => user.email === userData.email);
      
      if (userExists) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email,
        employeeId: userData.employeeId,
        plantId: userData.plantId,
        lineNumber: userData.lineNumber,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      // Add user to storage
      setUsers([...users, newUser]);
      
      // Store password separately
      const credentials = localStorage.getItem('userCredentials');
      const parsedCredentials = credentials ? JSON.parse(credentials) : {};
      parsedCredentials[userData.email] = userData.password;
      localStorage.setItem('userCredentials', JSON.stringify(parsedCredentials));
      
      // Log user in
      setCurrentUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
