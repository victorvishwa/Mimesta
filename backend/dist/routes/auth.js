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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Register
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create new user (password will be hashed by the pre-save hook)
        const user = new User_1.User({
            username,
            email,
            password,
        });
        yield user.save();
        // Create token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            token,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        // Check if user exists
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('User found:', { id: user._id, username: user.username });
        // Check password using the model's comparePassword method
        const isMatch = yield user.comparePassword(password);
        console.log('Password match result:', isMatch);
        if (!isMatch) {
            console.log('Password mismatch for user:', user._id);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Create token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        console.log('Login successful for user:', user._id);
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
}));
// Get current user
router.get('/me', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Error getting current user' });
    }
}));
exports.default = router;
