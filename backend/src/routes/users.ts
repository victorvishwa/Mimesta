import express, { Request, Response } from 'express';
import { User } from '../models/User';
import { Meme } from '../models/Meme';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { cloudinary } from '../config/cloudinary';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

const router = express.Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

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
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
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
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get current user
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle avatar upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'meme-creator/avatars',
        width: 200,
        crop: 'scale'
      });
      updates.avatar = result.secure_url;
    }

    // Update user
    Object.assign(user, updates);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change password
router.put('/change-password', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password' });
  }
});

// Delete account
router.delete('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Get user's memes
router.get('/:userId/memes', auth, async (req: Request, res: Response) => {
  try {
    console.log('Backend: Getting user memes', {
      userId: req.params.userId,
      page: req.query.page,
      limit: req.query.limit
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const query = { creator: req.params.userId };
    console.log('Backend: Meme query:', query);

    const [memes, total] = await Promise.all([
      Meme.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creator', 'username avatar'),
      Meme.countDocuments(query)
    ]);

    console.log('Backend: Found memes:', {
      count: memes.length,
      total,
      page,
      limit
    });

    const transformedMemes = memes.map(meme => ({
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      creator: undefined,
      votes: undefined
    }));

    const response = {
      memes: transformedMemes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMemes: total
    };

    console.log('Backend: Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Backend: Error fetching user memes:', error);
    res.status(500).json({ 
      message: 'Error fetching user memes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user stats
router.get('/:userId/stats', auth, async (req: Request, res: Response) => {
  try {
    const stats = await Meme.aggregate([
      { $match: { creator: new mongoose.Types.ObjectId(req.params.userId) } },
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
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

export default router; 