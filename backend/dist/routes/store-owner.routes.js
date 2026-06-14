"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth and role authorization middlewares
router.use(auth_1.authenticateJWT);
router.use((0, auth_1.requireRole)([client_1.Role.STORE_OWNER]));
// GET /store-owner/dashboard → average rating, list of users who rated
router.get('/dashboard', async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }
        // Find the store owned by this user
        const store = await db_1.default.store.findUnique({
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
    }
    catch (error) {
        console.error('Store owner dashboard error:', error);
        return res.status(500).json({ error: 'Failed to retrieve dashboard details.' });
    }
});
exports.default = router;
