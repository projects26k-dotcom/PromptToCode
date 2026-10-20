import { Router } from 'express';
import { Webhook } from 'svix';
import { User } from '../models/User.js';

const router = Router();

// Clerk Webhook Endpoint
// Accessible at POST /api/webhooks/clerk
router.post('/clerk', async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.warn('⚠️ CLERK_WEBHOOK_SECRET is not set in .env. Skipping signature verification (not recommended for production).');
    return res.status(500).json({
      error: 'CLERK_WEBHOOK_SECRET is not configured on the server',
    });
  }

  // Svix signature verification headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({
      error: 'Missing required Svix headers (svix-id, svix-timestamp, svix-signature)',
    });
  }

  // Svix requires the raw request payload (Buffer or string)
  const payload = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
    ? req.body
    : JSON.stringify(req.body);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('❌ Clerk webhook verification failed:', err.message);
    return res.status(400).json({
      error: 'Webhook verification failed',
      details: err.message,
    });
  }

  const eventType = evt.type;
  console.log(`🔔 Clerk Webhook event received: ${eventType}`);

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        username,
        image_url,
        primary_email_address_id,
        public_metadata,
      } = evt.data;

      // Extract primary email
      const primaryEmailObj = (email_addresses || []).find(
        (e) => e.id === primary_email_address_id
      );
      const email = primaryEmailObj?.email_address || email_addresses?.[0]?.email_address || '';

      if (!email) {
        console.warn(`⚠️ Webhook user (${id}) has no email address`);
      }

      const user = await User.upsertFromClerk({
        clerkId: id,
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        username: username || '',
        imageUrl: image_url || '',
        metadata: public_metadata || {},
      });

      console.log(`✅ MongoDB: User ${eventType === 'user.created' ? 'created' : 'updated'} for ${user.email} (${id})`);
    } else if (eventType === 'user.deleted') {
      const { id } = evt.data;
      if (id) {
        await User.findOneAndDelete({ clerkId: id });
        console.log(`🗑️ MongoDB: User deleted (${id})`);
      }
    }

    return res.status(200).json({ success: true, event: eventType });
  } catch (dbErr) {
    console.error('❌ Error handling Clerk webhook in MongoDB:', dbErr);
    return res.status(500).json({ error: 'Database operation failed', message: dbErr.message });
  }
});

export default router;
