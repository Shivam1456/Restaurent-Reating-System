import { Router, Response } from 'express';
import prisma from '../db';
import { Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth and role authorization middlewares
router.use(authenticateJWT);
router.use(requireRole([Role.STORE_OWNER]));

// GET /store-owner/dashboard → average rating, list of users who rated
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Find the store owned by this user
    const store = await prisma.store.findUnique({
      where: { ownerId },
      include: {
        ratings: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'No store is assigned to this owner account.' });
    }

    // Calculate store overall average rating
    const totalRatings = store.ratings.length;
    const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRatings > 0 
      ? parseFloat((sum / totalRatings).toFixed(2))
      : 0;

    // Format ratings list
    const ratingsList = store.ratings.map(r => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      user: {
        name: r.user.name,
        email: r.user.email
      }
    }));

    return res.status(200).json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address
      },
      averageRating,
      totalRatings,
      ratings: ratingsList
    });
  } catch (error) {
    console.error('Store owner dashboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard details.' });
  }
});

export default router;
