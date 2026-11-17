import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  loginUser,
  registerUser,
  logoutUser,
  getFriendlyAuthErrorMessage,
} from '../services/authService';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  isLoading: true,
  isConfigured: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUserProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured());

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);

    if (!configured) {
      console.warn('[PackWise Auth] Firebase is not configured. Please set your credentials in .env');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          // Fetch additional profile data from Firestore
          try {
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (profileErr) {
            console.warn('[PackWise Auth] Could not fetch Firestore user profile:', profileErr.message);
            // Fallback to basic auth info
            setUserProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Traveler',
              email: firebaseUser.email,
            });
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[PackWise Auth] State change handler error:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const loggedInUser = await loginUser(email, password);
      // Fetch Firestore profile
      try {
        const profile = await getUserProfile(loggedInUser.uid);
        setUserProfile(profile);
      } catch (e) {
        // Fallback
        setUserProfile({
          uid: loggedInUser.uid,
          name: loggedInUser.displayName || 'Traveler',
          email: loggedInUser.email,
        });
      }
      return { success: true, user: loggedInUser };
    } catch (error) {
      return {
        success: false,
        error: getFriendlyAuthErrorMessage(error),
        rawError: error,
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const newUser = await registerUser(name, email, password);
      // Profile was created during registerUser
      setUserProfile({
        uid: newUser.uid,
        name,
        email,
      });
      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        error: getFriendlyAuthErrorMessage(error),
        rawError: error,
      };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error('[PackWise Auth] Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUserProfile = async () => {
    if (user && user.uid) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) setUserProfile(profile);
      } catch (err) {
        console.warn('Failed to refresh user profile:', err.message);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        isConfigured,
        login,
        register,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

