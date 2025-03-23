
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  plantId: string;
  lineNumber: string;
  role: 'user' | 'admin' | 'manager' | 'qc';
  createdAt: string;
  plant?: {
    id: string;
    name: string;
    lines: string[];
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<UserProfile, 'id' | 'role' | 'createdAt' | 'plant'> & { password: string }) => Promise<void>;
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
  const [plants, setPlants] = useLocalStorage<{id: string, name: string, lines: string[]}[]>('plants', [
    { id: 'f1', name: 'Factory Alpha', lines: ['L1', 'L2', 'L3'] },
    { id: 'f2', name: 'Factory Beta', lines: ['L1', 'L2', 'L3', 'L4'] }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      
      // Find user's plant information
      const userPlant = plants.find(plant => plant.id === userExists.plantId);
      const userWithPlant = {
        ...userExists,
        plant: userPlant
      };
      
      setCurrentUser(userWithPlant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<UserProfile, 'id' | 'role' | 'createdAt' | 'plant'> & { password: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const userExists = users.some(user => user.email === userData.email);
      
      if (userExists) {
        throw new Error('User with this email already exists');
      }
      
      // Verify plant exists
      const plantExists = plants.some(plant => plant.id === userData.plantId);
      if (!plantExists) {
        throw new Error('Selected plant does not exist');
      }
      
      const userPlant = plants.find(plant => plant.id === userData.plantId);
      
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email,
        employeeId: userData.employeeId,
        plantId: userData.plantId,
        lineNumber: userData.lineNumber,
        role: 'user',
        createdAt: new Date().toISOString(),
        plant: userPlant
      };
      
      setUsers([...users, newUser]);
      
      const credentials = localStorage.getItem('userCredentials');
      const parsedCredentials = credentials ? JSON.parse(credentials) : {};
      parsedCredentials[userData.email] = userData.password;
      localStorage.setItem('userCredentials', JSON.stringify(parsedCredentials));
      
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
