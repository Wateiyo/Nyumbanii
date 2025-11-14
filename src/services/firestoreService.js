import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

// ============= PROPERTIES =============

export const createProperty = async (landlordId, propertyData) => {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      landlordId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

export const getProperty = async (propertyId) => {
  try {
    const docRef = doc(db, 'properties', propertyId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting property:', error);
    throw error;
  }
};

export const getLandlordProperties = async (landlordId) => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('landlordId', '==', landlordId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting landlord properties:', error);
    throw error;
  }
};

export const updateProperty = async (propertyId, updates) => {
  try {
    const docRef = doc(db, 'properties', propertyId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
};

export const deleteProperty = async (propertyId) => {
  try {
    await deleteDoc(doc(db, 'properties', propertyId));
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
};

// ============= UNITS =============

export const createUnit = async (propertyId, unitData) => {
  try {
    const docRef = await addDoc(collection(db, 'properties', propertyId, 'units'), {
      ...unitData,
      propertyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating unit:', error);
    throw error;
  }
};

export const getPropertyUnits = async (propertyId) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'properties', propertyId, 'units'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting units:', error);
    throw error;
  }
};

export const updateUnit = async (propertyId, unitId, updates) => {
  try {
    const docRef = doc(db, 'properties', propertyId, 'units', unitId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    throw error;
  }
};

// ============= TENANTS =============

export const createTenant = async (tenantData) => {
  try {
    const docRef = await addDoc(collection(db, 'tenants'), {
      ...tenantData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
};

export const getLandlordTenants = async (landlordId) => {
  try {
    const q = query(
      collection(db, 'tenants'),
      where('landlordId', '==', landlordId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tenants:', error);
    throw error;
  }
};

export const updateTenant = async (tenantId, updates) => {
  try {
    const docRef = doc(db, 'tenants', tenantId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    throw error;
  }
};

// ============= MAINTENANCE REQUESTS =============

export const createMaintenanceRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'maintenanceRequests'), {
      ...requestData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    throw error;
  }
};

export const getMaintenanceRequests = async (userId, userRole) => {
  try {
    const field = userRole === 'landlord' ? 'landlordId' : 'tenantId';
    const q = query(
      collection(db, 'maintenanceRequests'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting maintenance requests:', error);
    throw error;
  }
};

export const updateMaintenanceRequest = async (requestId, updates) => {
  try {
    const docRef = doc(db, 'maintenanceRequests', requestId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    throw error;
  }
};

// ============= PAYMENTS =============

export const createPayment = async (paymentData) => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const getPayments = async (userId, userRole) => {
  try {
    const field = userRole === 'landlord' ? 'landlordId' : 'tenantId';
    const q = query(
      collection(db, 'payments'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting payments:', error);
    throw error;
  }
};

// ============= NOTIFICATIONS =============

export const createNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((document) => {
      batch.update(document.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// ============= MESSAGES/CONVERSATIONS =============

export const createConversation = async (participants, propertyId = null) => {
  try {
    const docRef = await addDoc(collection(db, 'conversations'), {
      participants,
      propertyId,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const sendMessage = async (conversationId, senderId, message) => {
  try {
    // Add message to subcollection
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId,
      message,
      createdAt: serverTimestamp()
    });
    
    // Update conversation with last message
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: message,
      lastMessageTime: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// ============= VIEWINGS/BOOKINGS =============

export const createViewing = async (viewingData) => {
  try {
    const docRef = await addDoc(collection(db, 'viewings'), {
      ...viewingData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating viewing:', error);
    throw error;
  }
};

export const getViewings = async (userId, userRole) => {
  try {
    const field = userRole === 'landlord' ? 'landlordId' : 'tenantId';
    const q = query(
      collection(db, 'viewings'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting viewings:', error);
    throw error;
  }
};

export const updateViewing = async (viewingId, updates) => {
  try {
    const docRef = doc(db, 'viewings', viewingId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating viewing:', error);
    throw error;
  }
};

// ============= FILE UPLOADS =============

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (fileURL) => {
  try {
    const fileRef = ref(storage, fileURL);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// ============= SUBSCRIPTIONS =============

export const getLandlordSubscription = async (landlordId) => {
  try {
    const settingsRef = doc(db, 'landlordSettings', landlordId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return { id: settingsDoc.id, ...settingsDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (landlordId, subscriptionData) => {
  try {
    const settingsRef = doc(db, 'landlordSettings', landlordId);
    await updateDoc(settingsRef, {
      ...subscriptionData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const getPaymentHistory = async (landlordId) => {
  try {
    const q = query(
      collection(db, 'paymentHistory'),
      where('landlordId', '==', landlordId),
      orderBy('transactionDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw error;
  }
};

export const createPaymentRecord = async (paymentData) => {
  try {
    const docRef = await addDoc(collection(db, 'paymentHistory'), {
      ...paymentData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
};