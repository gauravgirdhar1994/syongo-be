import { Router } from 'express';
import admin from 'firebase-admin';
import { Attendee } from '../models/attendee';

const router = Router();
const db = admin.firestore();
const attendeesCollection = db.collection('attendees');

// Create Attendee
router.post('/', async (req, res) => {
  try {
    const attendeeData = req.body as Attendee;
    // Add validation for attendeeData here
    const docRef = await attendeesCollection.add({
      ...attendeeData,
      registrationDate: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send({ id: docRef.id, ...attendeeData });
  } catch (error) {
    console.error('Error creating attendee:', error);
    res.status(500).send({ error: 'Failed to create attendee' });
  }
});

// Read All Attendees
router.get('/', async (req, res) => {
  try {
    const snapshot = await attendeesCollection.get();
    const attendees: Attendee[] = [];
    snapshot.forEach(doc => {
      attendees.push({ id: doc.id, ...doc.data() } as Attendee);
    });
    res.status(200).send(attendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).send({ error: 'Failed to fetch attendees' });
  }
});

// Read Single Attendee
router.get('/:id', async (req, res) => {
  try {
    const attendeeId = req.params.id;
    const doc = await attendeesCollection.doc(attendeeId).get();
    if (!doc.exists) {
      res.status(404).send({ error: 'Attendee not found' });
      return;
    }
    res.status(200).send({ id: doc.id, ...doc.data() } as Attendee);
  } catch (error) {
    console.error('Error fetching attendee:', error);
    res.status(500).send({ error: 'Failed to fetch attendee' });
  }
});

// Update Attendee
router.put('/:id', async (req, res) => {
  try {
    const attendeeId = req.params.id;
    const attendeeData = req.body as Partial<Attendee>;
    // Add validation for attendeeData here
    await attendeesCollection.doc(attendeeId).update({
      ...attendeeData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).send({ id: attendeeId, ...attendeeData });
  } catch (error) {
    console.error('Error updating attendee:', error);
    res.status(500).send({ error: 'Failed to update attendee' });
  }
});

// Delete Attendee
router.delete('/:id', async (req, res) => {
  try {
    const attendeeId = req.params.id;
    await attendeesCollection.doc(attendeeId).delete();
    res.status(200).send({ message: 'Attendee deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendee:', error);
    res.status(500).send({ error: 'Failed to delete attendee' });
  }
});

// Get Attendees by Event ID
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const snapshot = await attendeesCollection.where('eventId', '==', eventId).get();
    const attendees: Attendee[] = [];
    snapshot.forEach(doc => {
      attendees.push({ id: doc.id, ...doc.data() } as Attendee);
    });
    res.status(200).send(attendees);
  } catch (error) {
    console.error('Error fetching attendees for event:', error);
    res.status(500).send({ error: 'Failed to fetch attendees for event' });
  }
});

export default router; 