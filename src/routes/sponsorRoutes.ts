import { Router } from 'express';
import admin from 'firebase-admin';
import { Sponsor } from '../models/sponsor';

const router = Router();
const db = admin.firestore();
const sponsorsCollection = db.collection('sponsors');

// Create Sponsor
router.post('/', async (req, res) => {
  try {
    const sponsorData = req.body as Sponsor;
    // Add validation for sponsorData here
    const docRef = await sponsorsCollection.add(sponsorData);
    res.status(201).send({ id: docRef.id, ...sponsorData });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    res.status(500).send({ error: 'Failed to create sponsor' });
  }
});

// Read All Sponsors
router.get('/', async (req, res) => {
  try {
    const snapshot = await sponsorsCollection.get();
    const sponsors: Sponsor[] = [];
    snapshot.forEach(doc => {
      sponsors.push({ id: doc.id, ...doc.data() } as Sponsor);
    });
    res.status(200).send(sponsors);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).send({ error: 'Failed to fetch sponsors' });
  }
});

// Read Single Sponsor
router.get('/:id', async (req, res) => {
  try {
    const sponsorId = req.params.id;
    const doc = await sponsorsCollection.doc(sponsorId).get();
    if (!doc.exists) {
      res.status(404).send({ error: 'Sponsor not found' });
      return;
    }
    res.status(200).send({ id: doc.id, ...doc.data() } as Sponsor);
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    res.status(500).send({ error: 'Failed to fetch sponsor' });
  }
});

// Update Sponsor
router.put('/:id', async (req, res) => {
  try {
    const sponsorId = req.params.id;
    const sponsorData = req.body as Partial<Sponsor>;
    // Add validation for sponsorData here
    await sponsorsCollection.doc(sponsorId).update(sponsorData);
    res.status(200).send({ id: sponsorId, ...sponsorData });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    res.status(500).send({ error: 'Failed to update sponsor' });
  }
});

// Delete Sponsor
router.delete('/:id', async (req, res) => {
  try {
    const sponsorId = req.params.id;
    await sponsorsCollection.doc(sponsorId).delete();
    res.status(200).send({ message: 'Sponsor deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    res.status(500).send({ error: 'Failed to delete sponsor' });
  }
});

export default router; 