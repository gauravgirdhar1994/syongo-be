import admin from 'firebase-admin';

// Log environment variables (excluding private key for security)
console.log('Firebase Config:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
});

// Function to properly format the private key
const formatPrivateKey = (key: string | undefined) => {
  if (!key) return undefined;
  
  // Remove any existing quotes
  key = key.replace(/"/g, '');
  
  // If the key doesn't start with -----BEGIN, add it
  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    key = '-----BEGIN PRIVATE KEY-----\n' + key;
  }
  
  // If the key doesn't end with -----END, add it
  if (!key.includes('-----END PRIVATE KEY-----')) {
    key = key + '\n-----END PRIVATE KEY-----';
  }
  
  // Replace literal \n with actual newlines
  key = key.replace(/\\n/g, '\n');
  
  return key;
};

// Initialize Firebase Admin with environment variables
const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
};

// Initialize Firebase if it hasn't been initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error; // Rethrow to handle in the main application
  }
}

export const db = admin.firestore();
export default admin; 