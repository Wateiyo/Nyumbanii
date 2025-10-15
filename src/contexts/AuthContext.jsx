import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, requestNotificationPermission } from '../firebase';  // ← Add requestNotificationPermission here

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register with email/password
  const register = async (email, password, fullName, phone, role, additionalData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Request notification permission and get FCM token
      const fcmToken = await requestNotificationPermission();

      // Store user data in Firestore
      const userData = {
        uid: user.uid,
        email: email,
        displayName: fullName,
        phone: phone,
        role: role,
        fcmToken: fcmToken || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData // companyName, address, etc.
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      setUserRole(role);
      setUserProfile(userData);
      return { user, role };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user role and profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        setUserProfile(userData);

        // Update FCM token on login
        const fcmToken = await requestNotificationPermission();
        if (fcmToken && fcmToken !== userData.fcmToken) {
          await setDoc(
            doc(db, 'users', user.uid),
            { fcmToken, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }

        return { user, role: userData.role };
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Google Sign In
  const signInWithGoogle = async (role) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user - create document with provided role
        const fcmToken = await requestNotificationPermission();
        
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phone: user.phoneNumber || '',
          role: role,
          fcmToken: fcmToken || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        setUserRole(role);
        setUserProfile(userData);
        return { user, role, isNewUser: true };
      } else {
        // Existing user
        const userData = userDoc.data();
        setUserRole(userData.role);
        setUserProfile(userData);

        // Update FCM token
        const fcmToken = await requestNotificationPermission();
        if (fcmToken && fcmToken !== userData.fcmToken) {
          await setDoc(
            doc(db, 'users', user.uid),
            { fcmToken, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }

        return { user, role: userData.role, isNewUser: false };
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      // Update Firestore
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { ...updates, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));

      // Update auth profile if display name changed
      if (updates.displayName) {
        await updateProfile(currentUser, {
          displayName: updates.displayName
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Get user role and profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setUserProfile(userData);
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userProfile,
    register,
    login,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};