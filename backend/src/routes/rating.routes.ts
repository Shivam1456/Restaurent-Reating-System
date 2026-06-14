import { Router, Response } from 'express';
import prisma from '../db';
import { Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authorization (only NORMAL_USER can rate or update rating)
router.use(authenticateJWT);
router.use(requireRole([Role.NORMAL_USER]));

// 1. POST /ratings → Submit rating
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const parsedStoreId = parseInt(storeId, 10);
    const parsedRating = parseInt(rating, 10);

    if (isNaN(parsedStoreId)) {
      return res.status(400).json({ error: 'Provide a valid store ID.' });
    }

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: parsedStoreId }
    });

    if (!store) {
      return res.status(444).json({ error: 'Store not found.' });
    }

    // Verify if user already rated this store
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId: parsedStoreId
        }
      }
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this store. Please update your existing rating instead.' });
    }

    // Create rating
    const newRating = await prisma.rating.create({
      data: {
        userId,
        storeId: parsedStoreId,
        rating: parsedRating
      }
    });

    return res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    return res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

// GET /ratings/me → Fetch all ratings by current user
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const ratings = await prisma.rating.findMany({
      where: { userId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json(ratings);
  } catch (error) {
    console.error('Fetch my ratings error:', error);
    return res.status(500).json({ error: 'Failed to fetch your ratings.' });
  }
});

// 2. PUT /ratings/:id → Rating edit
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ratingId = parseInt(req.params.id, 10);
    const { rating } = req.body;
    const userId = req.user?.id;

    if (isNaN(ratingId)) {
      return res.status(400).json({ error: 'Invalid rating ID.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Find the rating and verify ownership
    const existingRating = await prisma.rating.findUnique({
      where: { id: ratingId }
    });

    if (!existingRating) {
      return res.status(404).json({ error: 'Rating record not found.' });
    }

    if (existingRating.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own ratings.' });
    }

    // Update rating
    const updatedRating = await prisma.rating.update({
      where: { id: ratingId },
      data: { rating: parsedRating }
    });

    return res.status(200).json({
      message: 'Rating updated successfully',
      rating: updatedRating
    });
  } catch (error) {
    console.error('Update rating error:', error);
    return res.status(500).json({ error: 'Failed to update rating.' });
  }
});

export default router;
