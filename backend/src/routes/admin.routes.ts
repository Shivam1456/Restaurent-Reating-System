import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../db';
import { Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middlewares to all admin routes
router.use(authenticateJWT);
router.use(requireRole([Role.SYSTEM_ADMIN]));

// Email validation regex helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation check helper
const validatePassword = (password: string): string | null => {
  if (password.length < 8 || password.length > 16) {
    return 'Password must be between 8 and 16 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  const specialCharRegex = /[^A-Za-z0-9]/;
  if (!specialCharRegex.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

// 1. GET /admin/dashboard → Total Users, Total Stores, Total Ratings
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStores = await prisma.store.count();
    const totalRatings = await prisma.rating.count();

    // Calculate role distributions
    const adminCount = await prisma.user.count({ where: { role: Role.SYSTEM_ADMIN } });
    const userCount = await prisma.user.count({ where: { role: Role.NORMAL_USER } });
    const ownerCount = await prisma.user.count({ where: { role: Role.STORE_OWNER } });

    // Calculate top 5 highest rated stores
    const stores = await prisma.store.findMany({
      include: { ratings: true }
    });
    
    const storeRatings = stores.map(s => {
      const count = s.ratings.length;
      const sum = s.ratings.reduce((acc, curr) => acc + curr.rating, 0);
      const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
      return {
        name: s.name,
        averageRating: avg,
        totalRatings: count
      };
    });

    // Sort descending by average rating, limit to 5
    const topStores = storeRatings
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    return res.status(200).json({
      totalUsers,
      totalStores,
      totalRatings,
      roleCounts: {
        SYSTEM_ADMIN: adminCount,
        NORMAL_USER: userCount,
        STORE_OWNER: ownerCount
      },
      topStores
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

// 2. POST /admin/users → Naya user add (name, email, password, address, role)
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validation
    if (!name || name.trim().length < 3 || name.trim().length > 60) {
      return res.status(400).json({ error: 'Name must be between 3 and 60 characters.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Provide a valid email address.' });
    }
    if (address && address.length > 400) {
      return res.status(400).json({ error: 'Address must not exceed 400 characters.' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    if (!role || !Object.values(Role).includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    // Check unique email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        address: address ? address.trim() : null,
        role: role as Role
      }
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

// 3. GET /admin/users → Filter + Sort + Search (name, email, address, role)
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, sortBy, sortOrder, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Filters and Search
    const whereClause: any = {};

    if (role && Object.values(Role).includes(role as Role)) {
      whereClause.role = role as Role;
    }

    if (search) {
      const searchStr = (search as string).trim();
      whereClause.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { address: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    // Sorting
    let orderByClause: any = { createdAt: 'desc' };
    if (sortBy) {
      const field = sortBy as string;
      const order = sortOrder === 'asc' ? 'asc' : 'desc';
      if (['name', 'email', 'address', 'role', 'createdAt'].includes(field)) {
        orderByClause = { [field]: order };
      }
    }

    // Query DB
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        store: {
          include: {
            ratings: true
          }
        }
      }
    });

    const totalCount = await prisma.user.count({ where: whereClause });

    // Format output and calculate store ratings for STORE_OWNER
    const formattedUsers = users.map(user => {
      let storeRating: number | null = null;
      let storeName: string | null = null;
      if (user.role === Role.STORE_OWNER && user.store) {
        storeName = user.store.name;
        if (user.store.ratings.length > 0) {
          const sum = user.store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
          storeRating = parseFloat((sum / user.store.ratings.length).toFixed(2));
        } else {
          storeRating = 0; // No ratings yet
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        storeName,
        storeRating
      };
    });

    return res.status(200).json({
      users: formattedUsers,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// 4. GET /admin/users/:id → Full details (agar store owner hai to uska store rating bhi)
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        store: {
          include: {
            ratings: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Format output
    let storeDetails: any = null;
    if (user.role === Role.STORE_OWNER && user.store) {
      const ratings = user.store.ratings;
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0 
        ? parseFloat((ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(2))
        : 0;

      storeDetails = {
        id: user.store.id,
        name: user.store.name,
        email: user.store.email,
        address: user.store.address,
        createdAt: user.store.createdAt,
        averageRating: avgRating,
        totalRatings,
        ratings: ratings.map(r => ({
          id: r.id,
          rating: r.rating,
          createdAt: r.createdAt,
          user: r.user
        }))
      };
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt
      },
      store: storeDetails
    });
  } catch (error) {
    console.error('Admin get user detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch user details.' });
  }
});

// 5. POST /admin/stores → Naya store add (name, email, address, owner_id)
router.post('/stores', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, address, ownerId } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Store name is required.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Provide a valid store email address.' });
    }
    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'Store address is required.' });
    }
    if (address.length > 400) {
      return res.status(400).json({ error: 'Store address must not exceed 400 characters.' });
    }

    let parsedOwnerId: number | null = null;
    if (ownerId && ownerId !== '') {
      parsedOwnerId = parseInt(ownerId, 10);
      if (isNaN(parsedOwnerId)) {
        return res.status(400).json({ error: 'Provide a valid owner ID.' });
      }

      // Verify owner exists and is STORE_OWNER
      const owner = await prisma.user.findUnique({
        where: { id: parsedOwnerId },
        include: { store: true }
      });

      if (!owner) {
        return res.status(404).json({ error: 'Owner user not found.' });
      }

      if (owner.role !== Role.STORE_OWNER) {
        return res.status(400).json({ error: 'Assigned owner must have the STORE_OWNER role.' });
      }

      if (owner.store) {
        return res.status(400).json({ error: 'This Store Owner is already assigned to a store.' });
      }
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        ownerId: parsedOwnerId
      }
    });

    return res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Admin create store error:', error);
    return res.status(500).json({ error: 'Failed to create store.' });
  }
});

// 6. GET /admin/stores → Filter + Sort (name, email, address)
router.get('/stores', async (req: AuthRequest, res: Response) => {
  try {
    const { search, sortBy, sortOrder, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Filters and Search
    const whereClause: any = {};

    if (search) {
      const searchStr = (search as string).trim();
      whereClause.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { address: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    // Sorting
    let orderByClause: any = { createdAt: 'desc' };
    if (sortBy) {
      const field = sortBy as string;
      const order = sortOrder === 'asc' ? 'asc' : 'desc';
      if (['name', 'email', 'address', 'createdAt'].includes(field)) {
        orderByClause = { [field]: order };
      }
    }

    // Query DB
    const stores = await prisma.store.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        ratings: true
      }
    });

    const totalCount = await prisma.store.count({ where: whereClause });

    // Format output and calculate ratings
    const formattedStores = stores.map(store => {
      const totalRatings = store.ratings.length;
      const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
      const overallRating = totalRatings > 0 
        ? parseFloat((sum / totalRatings).toFixed(2))
        : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        createdAt: store.createdAt,
        owner: store.owner,
        overallRating,
        totalRatings
      };
    });

    return res.status(200).json({
      stores: formattedStores,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin get stores error:', error);
    return res.status(500).json({ error: 'Failed to fetch stores list.' });
  }
});

// 7. DELETE /admin/users/:id → Delete user (except self)
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userIdToDelete = parseInt(req.params.id, 10);
    const currentAdminId = req.user?.id;

    if (isNaN(userIdToDelete)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (userIdToDelete === currentAdminId) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdToDelete }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userIdToDelete }
    });

    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;

