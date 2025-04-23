import { Router } from 'express';
import { publishPromotion } from './publish-promotion';
import { subscribeUserToItinerary } from './subscribe-user-to-destination';


const router = Router();

router.post('/api/subscriptions', async (req, res) => {
  try {
    const { destination, email } = req.body;
    await subscribeUserToItinerary(email, destination)
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

router.post('/api/promotions', async (req, res) => {
  try {
    const { destination } = req.body;
    
    await publishPromotion(destination);
    
    res.status(201).json({success: true});
  } catch (error) {
    console.error('Failed to create promotion:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

export default router