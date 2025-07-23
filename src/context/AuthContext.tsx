// frontend/src/context/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
  } from 'react';
  import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
  } from 'firebase/auth';
  import { auth } from '../firebase';
  
  interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    signup: (email: string, password: string) => Promise<FirebaseUser>;
    login: (email: string, password: string) => Promise<FirebaseUser>;
    logout: () => Promise<void>;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return unsubscribe;
    }, []);
  
    const signup = async (email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    };
  
    const login = async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    };
  
    const logout = async () => {
      await signOut(auth);
      setUser(null);
    };
  
    return (
      <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
  };
  