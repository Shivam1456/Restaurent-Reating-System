"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2026-store-rating';
// Validation helper
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const validatePassword = (password) => {
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
// 1. Signup (supports Admin, Normal User, Store Owner options)
router.post('/signup', async (req, res) => {
    try {
        const { name, email, address, password, role } = req.body;
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
        let userRole = client_1.Role.NORMAL_USER;
        if (role) {
            if (!Object.values(client_1.Role).includes(role)) {
                return res.status(400).json({ error: 'Invalid user role specified.' });
            }
            userRole = role;
        }
        // Check unique email
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = await db_1.default.user.create({
            data: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                address: address ? address.trim() : null,
                role: userRole
            }
        });
        return res.status(201).json({
            message: 'Signup successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'An error occurred during signup.' });
    }
});
// 2. Login (sabke liye)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const user = await db_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'An error occurred during login.' });
    }
});
// 3. Update Password (purana password verify karke)
router.put('/change-password', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.id;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old password and new password are required.' });
        }
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect old password.' });
        }
        // Validate new password rules
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        // Update DB
        await db_1.default.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
        return res.status(200).json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ error: 'An error occurred while changing password.' });
    }
});
exports.default = router;
