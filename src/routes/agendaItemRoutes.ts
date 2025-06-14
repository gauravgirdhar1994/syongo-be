import { Router } from 'express';
import admin from 'firebase-admin';
import { AgendaItem } from '../models/agendaItem';

const router = Router();
const db = admin.firestore();
const agendaItemsCollection = db.collection('agendaItems');
const speakersCollection = db.collection('speakers');

// Extended interface for response that includes speaker details
interface AgendaItemWithSpeakers extends AgendaItem {
  speakers?: Array<{
    id: string;
    [key: string]: any;
  }>;
}

// Validation middleware
const validateAgendaItem = (data: Partial<AgendaItem>) => {
  const errors: string[] = [];

  if (!data.title) {
    errors.push('Title is required');
  }

  if (!data.startTime) {
    errors.push('Start time is required');
  }

  if (!data.endTime) {
    errors.push('End time is required');
  }

  if (data.startTime && data.endTime && new Date(data.startTime) >= new Date(data.endTime)) {
    errors.push('End time must be after start time');
  }

  if (!data.type) {
    errors.push('Type is required');
  } else if (!['keynote', 'session', 'workshop', 'break', 'networking'].includes(data.type)) {
    errors.push('Invalid type');
  }

  if (!data.eventId) {
    errors.push('Event ID is required');
  }

  return errors;
};

// Create AgendaItem
router.post('/', async (req, res) => {
  try {
    const agendaItemData = req.body as AgendaItem;
    
    // Validate the data
    const errors = validateAgendaItem(agendaItemData);
    if (errors.length > 0) {
      return res.status(400).send({ errors });
    }

    // Check if event exists
    const eventDoc = await db.collection('events').doc(agendaItemData.eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).send({ error: 'Event not found' });
    }

    // Check if speakers exist if provided
    if (agendaItemData.speakerIds && agendaItemData.speakerIds.length > 0) {
      const speakerPromises = agendaItemData.speakerIds.map(id => 
        speakersCollection.doc(id).get()
      );
      const speakerDocs = await Promise.all(speakerPromises);
      const invalidSpeakers = speakerDocs.filter(doc => !doc.exists);
      if (invalidSpeakers.length > 0) {
        return res.status(400).send({ error: 'One or more speakers not found' });
      }
    }

    const docRef = await agendaItemsCollection.add(agendaItemData);
    res.status(201).send({ id: docRef.id, ...agendaItemData });
  } catch (error) {
    console.error('Error creating agenda item:', error);
    res.status(500).send({ error: 'Failed to create agenda item' });
  }
});

// Read All AgendaItems with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      eventId,
      page = '1',
      limit = '10',
      sortBy = 'startTime',
      sortOrder = 'asc'
    } = req.query;

    let query: admin.firestore.Query = agendaItemsCollection;

    // Apply event filter if provided
    if (eventId) {
      query = query.where('eventId', '==', eventId);
    }

    // Apply sorting
    query = query.orderBy(sortBy as string, sortOrder as 'asc' | 'desc');

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startAfter = (pageNum - 1) * limitNum;

    const snapshot = await query.limit(limitNum).offset(startAfter).get();
    
    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    const agendaItems: AgendaItemWithSpeakers[] = [];
    
    // Get speaker details for each agenda item
    const speakerPromises: Promise<admin.firestore.DocumentSnapshot>[] = [];
    const speakerMap = new Map();

    snapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() } as AgendaItemWithSpeakers;
      agendaItems.push(item);

      // Collect speaker IDs for batch fetch
      if (item.speakerIds) {
        item.speakerIds.forEach(speakerId => {
          if (!speakerMap.has(speakerId)) {
            speakerPromises.push(speakersCollection.doc(speakerId).get());
            speakerMap.set(speakerId, null);
          }
        });
      }
    });

    // Fetch all speakers in parallel
    const speakerDocs = await Promise.all(speakerPromises);
    speakerDocs.forEach(doc => {
      if (doc.exists) {
        speakerMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });

    // Add speaker details to agenda items
    const agendaItemsWithSpeakers = agendaItems.map(item => ({
      ...item,
      speakers: item.speakerIds?.map(id => speakerMap.get(id)).filter(Boolean) || []
    }));

    res.status(200).send({
      agenda_items: agendaItemsWithSpeakers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching agenda items:', error);
    res.status(500).send({ error: 'Failed to fetch agenda items' });
  }
});

// Read Single AgendaItem with speaker details
router.get('/:id', async (req, res) => {
  try {
    const agendaItemId = req.params.id;
    const doc = await agendaItemsCollection.doc(agendaItemId).get();
    
    if (!doc.exists) {
      return res.status(404).send({ error: 'Agenda item not found' });
    }

    const agendaItem = { id: doc.id, ...doc.data() } as AgendaItemWithSpeakers;

    // Fetch speaker details if speakers are assigned
    if (agendaItem.speakerIds && agendaItem.speakerIds.length > 0) {
      const speakerPromises = agendaItem.speakerIds.map(id => 
        speakersCollection.doc(id).get()
      );
      const speakerDocs = await Promise.all(speakerPromises);
      const speakers = speakerDocs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      agendaItem.speakers = speakers;
    }

    res.status(200).send(agendaItem);
  } catch (error) {
    console.error('Error fetching agenda item:', error);
    res.status(500).send({ error: 'Failed to fetch agenda item' });
  }
});

// Update AgendaItem
router.put('/:id', async (req, res) => {
  try {
    const agendaItemId = req.params.id;
    const agendaItemData = req.body as Partial<AgendaItem>;

    // Validate the data
    const errors = validateAgendaItem(agendaItemData);
    if (errors.length > 0) {
      return res.status(400).send({ errors });
    }

    // Check if agenda item exists
    const doc = await agendaItemsCollection.doc(agendaItemId).get();
    if (!doc.exists) {
      return res.status(404).send({ error: 'Agenda item not found' });
    }

    // Check if event exists if eventId is being updated
    if (agendaItemData.eventId) {
      const eventDoc = await db.collection('events').doc(agendaItemData.eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).send({ error: 'Event not found' });
      }
    }

    // Check if speakers exist if being updated
    if (agendaItemData.speakerIds) {
      const speakerPromises = agendaItemData.speakerIds.map(id => 
        speakersCollection.doc(id).get()
      );
      const speakerDocs = await Promise.all(speakerPromises);
      const invalidSpeakers = speakerDocs.filter(doc => !doc.exists);
      if (invalidSpeakers.length > 0) {
        return res.status(400).send({ error: 'One or more speakers not found' });
      }
    }

    await agendaItemsCollection.doc(agendaItemId).update(agendaItemData);
    res.status(200).send({ id: agendaItemId, ...agendaItemData });
  } catch (error) {
    console.error('Error updating agenda item:', error);
    res.status(500).send({ error: 'Failed to update agenda item' });
  }
});

// Delete AgendaItem
router.delete('/:id', async (req, res) => {
  try {
    const agendaItemId = req.params.id;
    
    // Check if agenda item exists
    const doc = await agendaItemsCollection.doc(agendaItemId).get();
    if (!doc.exists) {
      return res.status(404).send({ error: 'Agenda item not found' });
    }

    await agendaItemsCollection.doc(agendaItemId).delete();
    res.status(200).send({ message: 'Agenda item deleted successfully' });
  } catch (error) {
    console.error('Error deleting agenda item:', error);
    res.status(500).send({ error: 'Failed to delete agenda item' });
  }
});

export default router; 