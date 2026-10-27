import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  error: string | null;
  activeRole: UserRole; // current simulated or actual active role
  setActiveRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  demoSignIn: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'kit25csecshivane@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      try {
        if (user) {
          setCurrentUser(user);
          // Check if admin doc exists or email matches bootstrap admin
          const isAdminUser = user.email === BOOTSTRAP_ADMIN_EMAIL;

          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          let role: UserRole = isAdminUser ? 'admin' : 'staff';

          if (userSnap.exists()) {
            const data = userSnap.data();
            role = data.role === 'admin' || isAdminUser ? 'admin' : 'staff';
            setUserProfile({
              uid: user.uid,
              displayName: data.displayName || user.displayName || 'Staff Member',
              email: data.email || user.email || '',
              role,
              active: data.active !== false,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          } else {
            // First time registration
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Bookstore User',
              email: user.email || '',
              role,
              active: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);

            // If bootstrap admin, also create document in admins collection
            if (isAdminUser) {
              await setDoc(doc(db, 'admins', user.uid), {
                uid: user.uid,
                email: user.email,
                createdAt: new Date().toISOString(),
              });
            }
          }
          setActiveRole(role);
        } else {
          // If not authenticated via Google, check for persistent demo mode session
          const savedDemo = sessionStorage.getItem('bookstore_demo_user');
          if (savedDemo) {
            const parsed = JSON.parse(savedDemo);
            setUserProfile(parsed);
            setActiveRole(parsed.role);
          } else {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      } catch (err: any) {
        console.error('Error syncing user profile:', err);
        setError(err.message || 'Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      sessionStorage.removeItem('bookstore_demo_user');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const demoSignIn = (role: UserRole) => {
    const demoUser: UserProfile = {
      uid: role === 'admin' ? 'demo-admin-uid-001' : 'demo-staff-uid-002',
      displayName: role === 'admin' ? 'Prof. Admin (CSE)' : 'Suresh Kumar (Cashier)',
      email: role === 'admin' ? 'admin@bookstore.edu' : 'suresh.staff@bookstore.edu',
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setUserProfile(demoUser);
    setActiveRole(role);
    sessionStorage.setItem('bookstore_demo_user', JSON.stringify(demoUser));
    setLoading(false);
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem('bookstore_demo_user');
      setUserProfile(null);
      setCurrentUser(null);
      await fbSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const isAdmin = activeRole === 'admin';
  const isStaff = activeRole === 'staff' || activeRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isStaff,
        loading,
        error,
        activeRole,
        setActiveRole,
        signInWithGoogle,
        signOut,
        demoSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
