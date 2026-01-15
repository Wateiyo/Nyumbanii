import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Check if user has completed onboarding
 * @param {string} userId - User's unique ID
 * @param {string} role - User's role (landlord, tenant, property_manager, maintenance)
 * @returns {Promise<boolean>} - True if onboarding completed, false otherwise
 */
export const hasCompletedOnboarding = async (userId, role) => {
  try {
    // Check localStorage first for quick access
    const localStorageKey = `onboarding_${userId}_${role}`;
    const localCompleted = localStorage.getItem(localStorageKey);

    if (localCompleted === 'true') {
      return true;
    }

    // If not in localStorage, check Firestore
    const collectionName = getRoleCollection(role);
    const userDocRef = doc(db, collectionName, userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const completed = data.onboardingCompleted === true;

      // Cache in localStorage for future quick checks
      if (completed) {
        localStorage.setItem(localStorageKey, 'true');
      }

      return completed;
    }

    return false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // On error, show onboarding to be safe
    return false;
  }
};

/**
 * Mark onboarding as completed for a user
 * @param {string} userId - User's unique ID
 * @param {string} role - User's role
 * @returns {Promise<void>}
 */
export const markOnboardingComplete = async (userId, role) => {
  try {
    const collectionName = getRoleCollection(role);
    const userDocRef = doc(db, collectionName, userId);

    // Check if document exists first
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Document exists, update it
      await updateDoc(userDocRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      });
    } else {
      // Document doesn't exist, create it with setDoc
      await setDoc(userDocRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    }

    // Also save to localStorage for quick access
    const localStorageKey = `onboarding_${userId}_${role}`;
    localStorage.setItem(localStorageKey, 'true');

    console.log('Onboarding marked as complete for user:', userId);
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    throw error;
  }
};

/**
 * Reset onboarding status (for testing or if user wants to see it again)
 * @param {string} userId - User's unique ID
 * @param {string} role - User's role
 * @returns {Promise<void>}
 */
export const resetOnboarding = async (userId, role) => {
  try {
    const collectionName = getRoleCollection(role);
    const userDocRef = doc(db, collectionName, userId);

    await updateDoc(userDocRef, {
      onboardingCompleted: false,
      onboardingCompletedAt: null
    });

    // Clear localStorage
    const localStorageKey = `onboarding_${userId}_${role}`;
    localStorage.removeItem(localStorageKey);

    console.log('Onboarding reset for user:', userId);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
};

/**
 * Get the correct Firestore collection name based on user role
 * @param {string} role - User's role
 * @returns {string} - Collection name
 */
const getRoleCollection = (role) => {
  switch (role) {
    case 'landlord':
      return 'landlords';
    case 'tenant':
      return 'tenants';
    case 'property_manager':
      return 'propertyManagers';
    case 'maintenance':
      return 'maintenanceStaff';
    default:
      throw new Error(`Invalid role: ${role}`);
  }
};
