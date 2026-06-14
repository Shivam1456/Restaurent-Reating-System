import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to store routes
router.use(authenticateJWT);

// GET /stores → Har store ke saath overallRating + myRating
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { searchName, searchAddress, sortBy, sortOrder } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const whereClause: any = {};

    if (searchName) {
      whereClause.name = { contains: (searchName as string).trim(), mode: 'insensitive' };
    }

    if (searchAddress) {
      whereClause.address = { contains: (searchAddress as string).trim(), mode: 'insensitive' };
    }

    // Fetch stores and their ratings
    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        ratings: true
      }
    });

    // Format and calculate overallRating and myRating
    let formattedStores = stores.map(store => {
      const totalRatings = store.ratings.length;
      const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
      const overallRating = totalRatings > 0 
        ? parseFloat((sum / totalRatings).toFixed(2))
        : 0;

      // Find if current user has rated this store
      const userRatingObj = store.ratings.find(r => r.userId === userId);
      const myRating = userRatingObj ? userRatingObj.rating : null;
      const ratingId = userRatingObj ? userRatingObj.id : null;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        overallRating,
        totalRatings,
        myRating,
        ratingId
      };
    });

    // Support sorting
    if (sortBy) {
      const field = sortBy as string;
      const order = sortOrder === 'desc' ? -1 : 1;

      formattedStores.sort((a: any, b: any) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    } else {
      // Default sort by overall rating descending
      formattedStores.sort((a, b) => b.overallRating - a.overallRating);
    }

    return res.status(200).json(formattedStores);
  } catch (error) {
    console.error('Fetch stores error:', error);
    return res.status(500).json({ error: 'Failed to fetch stores list.' });
  }
});

// GET /stores/:id → Fetch store details + ratings/reviews
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = parseInt(req.params.id, 10);
    if (isNaN(storeId)) {
      return res.status(400).json({ error: 'Invalid store ID.' });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        ratings: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const totalRatings = store.ratings.length;
    const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const overallRating = totalRatings > 0 
      ? parseFloat((sum / totalRatings).toFixed(2))
      : 0;

    return res.status(200).json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address
      },
      overallRating,
      totalRatings,
      reviews: store.ratings.map(r => ({
        id: r.id,
        rating: r.rating,
        createdAt: r.createdAt,
        user: r.user
      }))
    });
  } catch (error) {
    console.error('Fetch store details error:', error);
    return res.status(500).json({ error: 'Failed to fetch store details.' });
  }
});

export default router;
