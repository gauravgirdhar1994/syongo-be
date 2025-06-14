import { Router } from 'express';
import { Event } from '../models/event';
import { db } from '../config/firebase';

const router = Router();
const eventsCollection = db.collection('events');

// Create Event
router.post('/', async (req, res) => {
  try {
    const eventData = req.body as Event;
    // Add validation for eventData here
    const docRef = await eventsCollection.add(eventData);
    res.status(201).send({ id: docRef.id, ...eventData });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send({ error: 'Failed to create event' });
  }
});

// Read All Events
router.get('/', async (req, res) => {
  try {
    console.log('Attempting to fetch events...');
    const snapshot = await eventsCollection.get();
    console.log('Successfully fetched events snapshot');
    
    const events: Event[] = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() } as Event);
    });
    console.log(`Found ${events.length} events`);
    
    res.status(200).send(events);
  } catch (error: any) {
    console.error('Detailed error fetching events:', {
      error: error,
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    res.status(500).send({ 
      error: 'Failed to fetch events',
      details: error?.message,
      code: error?.code
    });
  }
});

// Read Single Event
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const doc = await eventsCollection.doc(eventId).get();
    if (!doc.exists) {
      res.status(404).send({ error: 'Event not found' });
      return;
    }
    res.status(200).send({ id: doc.id, ...doc.data() } as Event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).send({ error: 'Failed to fetch event' });
  }
});

// Update Event
router.put('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body as Partial<Event>;
    // Add validation for eventData here
    await eventsCollection.doc(eventId).update(eventData);
    res.status(200).send({ id: eventId, ...eventData });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).send({ error: 'Failed to update event' });
  }
});

// Delete Event
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    await eventsCollection.doc(eventId).delete();
    res.status(200).send({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).send({ error: 'Failed to delete event' });
  }
});

export default router; 