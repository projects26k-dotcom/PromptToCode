import { Router } from 'express';
import { User } from '../models/User.js';

const router = Router();

/**
 * POST /api/users/sync
 * Syncs user profile data from the frontend immediately upon sign-up or sign-in.
 * This works in local development without needing an ngrok tunnel.
 */
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, username, imageUrl, metadata } = req.body;

    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const user = await User.upsertFromClerk({
      clerkId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      username: username || '',
      imageUrl: imageUrl || '',
      metadata: metadata || {},
      lastSignInAt: new Date(),
    });

    console.log(`✅ MongoDB: User synchronized via direct sync: ${user.email} (${user.clerkId})`);

    res.json({
      success: true,
      message: 'User synchronized successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Failed to sync user to MongoDB:', error.message);
    res.status(500).json({
      error: 'Failed to synchronize user in MongoDB',
      details: error.message,
    });
  }
});

/**
 * GET /api/users/profile/:clerkId
 * Retrieve the user's MongoDB record by Clerk ID
 */
router.get('/profile/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ error: 'User not found in MongoDB' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
