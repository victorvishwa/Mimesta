"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const Meme_1 = require("../models/Meme");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const cloudinary_1 = require("../config/cloudinary");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// Register new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email or username already exists'
            });
        }
        // Create new user
        const user = new User_1.User({
            username,
            email,
            password
        });
        yield user.save();
        // Generate token
        const token = user.generateAuthToken();
        res.status(201).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
}));
// Login user
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate token
        const token = user.generateAuthToken();
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
}));
// Get current user
router.get('/me', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get user profile
router.get('/profile', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
}));
// Update user profile
router.put('/profile', auth_1.auth, upload_1.upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const updates = req.body;
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Handle avatar upload
        if (req.file) {
            const result = yield cloudinary_1.cloudinary.uploader.upload(req.file.path, {
                folder: 'meme-creator/avatars',
                width: 200,
                crop: 'scale'
            });
            updates.avatar = result.secure_url;
        }
        // Update user
        Object.assign(user, updates);
        yield user.save();
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
}));
// Change password
router.put('/change-password', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { currentPassword, newPassword } = req.body;
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check current password
        const isMatch = yield user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        // Update password
        user.password = newPassword;
        yield user.save();
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error changing password' });
    }
}));
// Delete account
router.delete('/profile', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        yield user.deleteOne();
        res.json({ message: 'Account deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting account' });
    }
}));
// Get user's memes
router.get('/:userId/memes', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Backend: Getting user memes', {
            userId: req.params.userId,
            page: req.query.page,
            limit: req.query.limit
        });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const query = { creator: req.params.userId };
        console.log('Backend: Meme query:', query);
        const [memes, total] = yield Promise.all([
            Meme_1.Meme.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('creator', 'username avatar'),
            Meme_1.Meme.countDocuments(query)
        ]);
        console.log('Backend: Found memes:', {
            count: memes.length,
            total,
            page,
            limit
        });
        const transformedMemes = memes.map(meme => (Object.assign(Object.assign({}, meme.toObject()), { user: meme.creator, upvotes: meme.votes.upvotes.length, downvotes: meme.votes.downvotes.length, creator: undefined, votes: undefined })));
        const response = {
            memes: transformedMemes,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalMemes: total
        };
        console.log('Backend: Sending response:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Backend: Error fetching user memes:', error);
        res.status(500).json({
            message: 'Error fetching user memes',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get user stats
router.get('/:userId/stats', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield Meme_1.Meme.aggregate([
            { $match: { creator: new mongoose_1.default.Types.ObjectId(req.params.userId) } },
            {
                $group: {
                    _id: null,
                    totalMemes: { $sum: 1 },
                    totalViews: { $sum: '$views' },
                    totalUpvotes: { $sum: { $size: '$votes.upvotes' } },
                    totalDownvotes: { $sum: { $size: '$votes.downvotes' } },
                    totalComments: { $sum: { $size: '$comments' } }
                }
            }
        ]);
        res.json(stats[0] || {
            totalMemes: 0,
            totalViews: 0,
            totalUpvotes: 0,
            totalDownvotes: 0,
            totalComments: 0
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Error fetching user stats' });
    }
}));
exports.default = router;
