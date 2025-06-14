import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/eventRoutes';
import speakerRoutes from './routes/speakerRoutes';
import sponsorRoutes from './routes/sponsorRoutes';
import attendeeRoutes from './routes/attendeeRoutes';
import agendaItemRoutes from './routes/agendaItemRoutes';
import './config/firebase'; // Import Firebase configuration

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