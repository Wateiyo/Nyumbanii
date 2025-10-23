import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

// ============= PROPERTIES =============

export const useProperties = (landlordId) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!landlordId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'properties'),
      where('landlordId', '==', landlordId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const propertiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProperties(propertiesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching properties:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [landlordId]);

  return { properties, loading, error };
};

// ============= PROPERTY UNITS =============

export const usePropertyUnits = (propertyId) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    const unitsRef = collection(db, 'properties', propertyId, 'units');

    const unsubscribe = onSnapshot(
      unitsRef,
      (snapshot) => {
        const unitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUnits(unitsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching units:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [propertyId]);

  return { units, loading, error };
};

// ============= TENANTS =============

export const useTenants = (landlordId) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!landlordId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tenants'),
      where('landlordId', '==', landlordId),
      
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tenantsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTenants(tenantsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tenants:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [landlordId]);

  return { tenants, loading, error };
};

// ============= MAINTENANCE REQUESTS =============

export const useMaintenanceRequests = (userId, userRole) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    const field = userRole === 'landlord' ? 'landlordId' : 'tenantId';
    const q = query(
      collection(db, 'maintenanceRequests'),
      where(field, '==', userId),
      
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequests(requestsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching maintenance requests:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, userRole]);

  return { requests, loading, error };
};

// ============= PAYMENTS =============

export const usePayments = (userId, userRole) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    const field = userRole === 'landlord' ? 'landlordId' : 'tenantId';
    const q = query(
      collection(db, 'payments'),
      where(field, '==', userId),
      
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPayments(paymentsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching payments:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, userRole]);

  return { payments, loading, error };
};

// ============= NOTIFICATIONS =============

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { notifications, unreadCount, loading, error };
};

// ============= CONVERSATIONS =============

export const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setConversations(conversationsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching conversations:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { conversations, loading, error };
};

// ============= MESSAGES =============

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading, error };
};

// ============= VIEWINGS =============

export const useViewings = (userId, userRole) => {
  const [viewings, setViewings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    const field = userRole === 'landlord' ? 'landlordId' : 'tenantId';
    const q = query(
      collection(db, 'viewings'),
      where(field, '==', userId),
      
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const viewingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setViewings(viewingsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching viewings:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, userRole]);

  return { viewings, loading, error };
};

// ============= SINGLE DOCUMENT =============

export const useDocument = (collectionName, documentId) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument({ id: snapshot.id, ...snapshot.data() });
        } else {
          setDocument(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching document from ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { document, loading, error };
};

// ============= LISTINGS =============

export const useListings = (landlordId) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!landlordId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'listings'),
      where('landlordId', '==', landlordId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const listingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(listingsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching listings:', err);
        setError(err);
        setListings([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [landlordId]);

  return { listings, loading, error };
};

