import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/eventRoutes';
import speakerRoutes from './routes/speakerRoutes';
import sponsorRoutes from './routes/sponsorRoutes';
import attendeeRoutes from './routes/attendeeRoutes';
import agendaItemRoutes from './routes/agendaItemRoutes';

// Initialize Firebase Admin with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

const app = express();
const port = process.env.PORT || 3002;

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