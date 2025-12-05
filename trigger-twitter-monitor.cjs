#!/usr/bin/env node

/**
 * Script to manually trigger KPLC Twitter monitoring
 * This will fetch the latest tweets from Kenya Power and check for power outage announcements
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfAGRoTZkQMesQP-fGN1qnIFnt52GbB3s",
  authDomain: "nyumbanii.firebaseapp.com",
  projectId: "nyumbanii",
  storageBucket: "nyumbanii.firebasestorage.app",
  messagingSenderId: "848107354709",
  appId: "1:848107354709:web:f618d2b1bf9e5f19f3f2dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

async function triggerMonitoring() {
  try {
    console.log('🔍 Triggering KPLC Twitter monitoring...\n');

    // You need to be authenticated to call the function
    // Option 1: Sign in with your credentials
    const email = process.env.FIREBASE_USER_EMAIL;
    const password = process.env.FIREBASE_USER_PASSWORD;

    if (!email || !password) {
      console.log('⚠️  No credentials provided.');
      console.log('Set FIREBASE_USER_EMAIL and FIREBASE_USER_PASSWORD environment variables, or call the function directly.\n');
      console.log('Attempting to call function without authentication (may fail if security rules require auth)...\n');
    } else {
      console.log('🔐 Signing in...');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Authenticated\n');
    }

    // Call the function
    console.log('📡 Calling manualMonitorKPLCTwitter function...');
    const manualMonitorKPLCTwitter = httpsCallable(functions, 'manualMonitorKPLCTwitter');

    const result = await manualMonitorKPLCTwitter();

    console.log('\n✅ Success!');
    console.log('Response:', result.data);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'functions/unauthenticated') {
      console.error('\n⚠️  Authentication required. Please set environment variables:');
      console.error('   FIREBASE_USER_EMAIL=your-email@example.com');
      console.error('   FIREBASE_USER_PASSWORD=your-password');
      console.error('\nOr run: FIREBASE_USER_EMAIL=email FIREBASE_USER_PASSWORD=pass node trigger-twitter-monitor.js');
    }

    process.exit(1);
  }
}

// Run the script
triggerMonitoring();
