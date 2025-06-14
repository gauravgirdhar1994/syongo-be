import { Router } from 'express';
import admin from 'firebase-admin';
import { Speaker } from '../models/speaker';

const router = Router();
const db = admin.firestore();
const speakersCollection = db.collection('speakers');

// Create Speaker
router.post('/', async (req, res) => {
  try {
    const speakerData = req.body as Speaker;
    // Add validation for speakerData here
    const docRef = await speakersCollection.add(speakerData);
    res.status(201).send({ id: docRef.id, ...speakerData });
  } catch (error) {
    console.error('Error creating speaker:', error);
    res.status(500).send({ error: 'Failed to create speaker' });
  }
});

// Read All Speakers
router.get('/', async (req, res) => {
  try {
    const snapshot = await speakersCollection.get();
    const speakers: Speaker[] = [];
    snapshot.forEach(doc => {
      speakers.push({ id: doc.id, ...doc.data() } as Speaker);
    });
    res.status(200).send(speakers);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    res.status(500).send({ error: 'Failed to fetch speakers' });
  }
});

// Read Single Speaker
router.get('/:id', async (req, res) => {
  try {
    const speakerId = req.params.id;
    const doc = await speakersCollection.doc(speakerId).get();
    if (!doc.exists) {
      res.status(404).send({ error: 'Speaker not found' });
      return;
    }
    res.status(200).send({ id: doc.id, ...doc.data() } as Speaker);
  } catch (error) {
    console.error('Error fetching speaker:', error);
    res.status(500).send({ error: 'Failed to fetch speaker' });
  }
});

// Update Speaker
router.put('/:id', async (req, res) => {
  try {
    const speakerId = req.params.id;
    const speakerData = req.body as Partial<Speaker>;
    // Add validation for speakerData here
    await speakersCollection.doc(speakerId).update(speakerData);
    res.status(200).send({ id: speakerId, ...speakerData });
  } catch (error) {
    console.error('Error updating speaker:', error);
    res.status(500).send({ error: 'Failed to update speaker' });
  }
});

// Delete Speaker
router.delete('/:id', async (req, res) => {
  try {
    const speakerId = req.params.id;
    await speakersCollection.doc(speakerId).delete();
    res.status(200).send({ message: 'Speaker deleted successfully' });
  } catch (error) {
    console.error('Error deleting speaker:', error);
    res.status(500).send({ error: 'Failed to delete speaker' });
  }
});

export default router; 