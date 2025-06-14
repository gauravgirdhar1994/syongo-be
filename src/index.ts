import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/eventRoutes';
import speakerRoutes from './routes/speakerRoutes';
import sponsorRoutes from './routes/sponsorRoutes';
import attendeeRoutes from './routes/attendeeRoutes';
import agendaItemRoutes from './routes/agendaItemRoutes';

// Log environment variables (excluding private key for security)
console.log('Firebase Config:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
});

try {
  // Initialize Firebase Admin with environment variables
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  process.exit(1); // Exit if Firebase initialization fails
}

const app = express();
const port = process.env.PORT || 3002;

// Add error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.use(cors());
app.use(express.json());

// Use routes
app.use('/api/events', eventRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/agendaItems', agendaItemRoutes);
app.use('/api/attendees', attendeeRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}); 