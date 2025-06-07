import express, { Request, Response, RequestHandler } from 'express';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { Meme, IMeme, IMemeModel } from '../models/Meme';
import { cloudinary } from '../config/cloudinary';
import mongoose, { FilterQuery } from 'mongoose';
import { startOfDay, subDays } from 'date-fns';
import { Types, Query } from 'mongoose';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user: {
    _id: string;
  };
}

interface IComment {
  _id: Types.ObjectId;
  text: string;
  user: Types.ObjectId;
  createdAt: Date;
}

interface IPopulatedComment {
  _id: Types.ObjectId;
  text: string;
  user: {
    _id: Types.ObjectId;
    username: string;
    avatar?: string;
  };
  createdAt: Date;
}

interface IMemeWithComments extends Omit<IMeme, 'comments'> {
  comments: IPopulatedComment[];
}

interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  avatar?: string;
}

interface PopulatedComment {
  _id: Types.ObjectId;
  text: string;
  user: PopulatedUser;
  createdAt: Date;
}

interface PopulatedMeme {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  topTextSize: number;
  bottomTextSize: number;
  topTextColor: string;
  bottomTextColor: string;
  topTextPosition: number;
  bottomTextPosition: number;
  creator: PopulatedUser;
  votes: {
    upvotes: Types.ObjectId[];
    downvotes: Types.ObjectId[];
  };
  comments: PopulatedComment[];
  views: number;
  isReported: boolean;
  reportDetails?: {
    reason: string;
    reportedBy: Types.ObjectId;
    reportedAt: Date;
  };
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const router = express.Router();

type MemeQuery = {
  isReported: boolean;
  createdAt?: { $gte: Date };
  creator?: mongoose.Types.ObjectId;
} & mongoose.FilterQuery<IMeme>;

// Get all memes with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const memesQuery = Meme.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username avatar');

    const [memes, total] = await Promise.all([
      memesQuery.exec(),
      Meme.countDocuments().exec()
    ]);

    const transformedMemes = memes.map(meme => ({
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      creator: undefined,
      votes: undefined
    }));

    res.json({
      memes: transformedMemes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMemes: total
    });
  } catch (error) {
    console.error('Error fetching memes:', error);
    res.status(500).json({ message: 'Error fetching memes' });
  }
});

// Get trending memes
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const memesQuery = Meme.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ 'votes.upvotes': -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username avatar');

    const [memes, total] = await Promise.all([
      memesQuery.exec(),
      Meme.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).exec()
    ]);

    const transformedMemes = memes.map(meme => ({
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      creator: undefined,
      votes: undefined
    }));

    res.json({
      memes: transformedMemes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMemes: total
    });
  } catch (error) {
    console.error('Error fetching trending memes:', error);
    res.status(500).json({ message: 'Error fetching trending memes' });
  }
});

// Get user's memes
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const memesQuery = Meme.find({ creator: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username avatar');

    const [memes, total] = await Promise.all([
      memesQuery.exec(),
      Meme.countDocuments({ creator: req.params.userId }).exec()
    ]);

    const transformedMemes = memes.map(meme => ({
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      creator: undefined,
      votes: undefined
    }));

    res.json({
      memes: transformedMemes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMemes: total
    });
  } catch (error) {
    console.error('Error fetching user memes:', error);
    res.status(500).json({ message: 'Error fetching user memes' });
  }
});

// Get single meme
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const memeQuery = Meme.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('comments.user', 'username avatar');

    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    const transformedMeme = {
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: (req as any).user ? meme.hasVoted(new Types.ObjectId((req as any).user._id)) : null,
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error fetching meme:', error);
    res.status(500).json({ message: 'Error fetching meme' });
  }
});

// Create meme
router.post('/', auth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    let imageUrl = req.body.imageUrl;

    console.log('--- Meme Creation Debug ---');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    if (req.file) {
      try {
        console.log('Uploading file to Cloudinary:', req.file.path);
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'memes',
          resource_type: 'auto'
        });
        imageUrl = result.secure_url;
        console.log('Cloudinary upload result:', result);
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
        // Print all properties, including non-enumerable ones
        try {
          console.error('Cloudinary error (stringified):', JSON.stringify(cloudErr, Object.getOwnPropertyNames(cloudErr), 2));
        } catch (jsonErr) {
          console.error('Cloudinary error (toString):', String(cloudErr));
        }
        return res.status(500).json({
          message: 'Cloudinary upload failed',
          error: (typeof cloudErr === 'object' && cloudErr !== null && 'message' in cloudErr)
            ? (cloudErr as any).message
            : String(cloudErr)
        });
      }
    } else if (!imageUrl && req.body.isDraft !== 'true') {
      return res.status(400).json({ message: 'Either an image file or imageUrl must be provided' });
    }

    console.log('Creating meme with data:', {
      title: req.body.title,
      topText: req.body.topText,
      bottomText: req.body.bottomText,
      topTextSize: req.body.topTextSize,
      bottomTextSize: req.body.bottomTextSize,
      topTextColor: req.body.topTextColor,
      bottomTextColor: req.body.bottomTextColor,
      topTextPosition: req.body.topTextPosition,
      bottomTextPosition: req.body.bottomTextPosition,
      imageUrl,
      isDraft: req.body.isDraft === 'true'
    });

    const memeData = {
      title: req.body.title,
      topText: req.body.topText || '',
      bottomText: req.body.bottomText || '',
      topTextSize: parseInt(req.body.topTextSize) || 48,
      bottomTextSize: parseInt(req.body.bottomTextSize) || 48,
      topTextColor: req.body.topTextColor || '#ffffff',
      bottomTextColor: req.body.bottomTextColor || '#ffffff',
      topTextPosition: Math.max(0, Math.min(1, parseFloat(req.body.topTextPosition) || 0.5)),
      bottomTextPosition: Math.max(0, Math.min(1, parseFloat(req.body.bottomTextPosition) || 0.5)),
      imageUrl,
      isDraft: req.body.isDraft === 'true',
      creator: new Types.ObjectId(authReq.user._id)
    };

    console.log('Processed meme data:', memeData);

    const meme = new Meme(memeData);
    await meme.save();

    const populatedMeme = await Meme.findById(meme._id)
      .populate('creator', 'username avatar');

    if (!populatedMeme) {
      throw new Error('Failed to create meme');
    }

    const transformedMeme = {
      ...populatedMeme.toObject(),
      user: populatedMeme.creator,
      upvotes: 0,
      downvotes: 0,
      userVote: populatedMeme.hasVoted(new Types.ObjectId(authReq.user._id)),
      creator: undefined,
      votes: undefined
    };

    res.status(201).json(transformedMeme);
  } catch (error) {
    console.error('Error creating meme:', error);
    res.status(500).json({ 
      message: 'Error creating meme',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update meme
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const memeQuery = Meme.findById(req.params.id);
    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    if (meme.creator.toString() !== authReq.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedMemeQuery = Meme.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        topTextPosition: Math.max(0, Math.min(1, parseFloat(req.body.topTextPosition) || meme.topTextPosition)),
        bottomTextPosition: Math.max(0, Math.min(1, parseFloat(req.body.bottomTextPosition) || meme.bottomTextPosition))
      },
      { new: true }
    )
      .populate('creator', 'username avatar');

    const updatedMeme = await updatedMemeQuery.exec();

    const transformedMeme = {
      ...updatedMeme!.toObject(),
      user: updatedMeme!.creator,
      upvotes: updatedMeme!.votes.upvotes.length,
      downvotes: updatedMeme!.votes.downvotes.length,
      userVote: updatedMeme!.hasVoted(new Types.ObjectId(authReq.user._id)),
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error updating meme:', error);
    res.status(500).json({ message: 'Error updating meme' });
  }
});

// Delete meme
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const memeQuery = Meme.findById(req.params.id);
    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    if (meme.creator.toString() !== authReq.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Meme.deleteOne({ _id: req.params.id }).exec();
    res.json({ message: 'Meme deleted' });
  } catch (error) {
    console.error('Error deleting meme:', error);
    res.status(500).json({ message: 'Error deleting meme' });
  }
});

// Vote on meme
router.post('/:id/vote', auth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    console.log('Received vote request:', {
      memeId: req.params.id,
      voteType: req.body.voteType,
      userId: authReq.user._id
    });

    if (!authReq.user) {
      console.log('Unauthorized vote attempt');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!['up', 'down'].includes(req.body.voteType)) {
      console.log('Invalid vote type:', req.body.voteType);
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const memeQuery = Meme.findById(req.params.id);
    const meme = await memeQuery.exec();

    if (!meme) {
      console.log('Meme not found:', req.params.id);
      return res.status(404).json({ message: 'Meme not found' });
    }

    console.log('Adding vote to meme');
    await meme.addVote(new Types.ObjectId(authReq.user._id), req.body.voteType);

    const transformedMeme = {
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: meme.hasVoted(new Types.ObjectId(authReq.user._id)),
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error voting on meme:', error);
    res.status(500).json({ message: 'Error voting on meme' });
  }
});

// Add comment to meme
router.post('/:id/comments', auth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    console.log('Received comment request:', {
      memeId: req.params.id,
      text: req.body.text,
      userId: authReq.user._id
    });

    if (!authReq.user) {
      console.log('Unauthorized comment attempt');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!req.body.text) {
      console.log('Missing comment text');
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const memeQuery = Meme.findById(req.params.id);
    const meme = await memeQuery.exec();

    if (!meme) {
      console.log('Meme not found:', req.params.id);
      return res.status(404).json({ message: 'Meme not found' });
    }

    console.log('Adding comment to meme');
    await meme.addComment(new Types.ObjectId(authReq.user._id), req.body.text);

    const transformedMeme = {
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: meme.hasVoted(new Types.ObjectId(authReq.user._id)),
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Delete comment
router.delete('/:memeId/comments/:commentId', auth, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const memeQuery = Meme.findById(authReq.params.memeId);
    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    const comment = meme.comments.find(c => c._id.toString() === authReq.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== authReq.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    meme.comments = meme.comments.filter(c => c._id.toString() !== authReq.params.commentId);
    await meme.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

// Get meme by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const memeQuery = Meme.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('comments.user', 'username avatar');

    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    const transformedMeme = {
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: (req as any).user ? meme.hasVoted(new Types.ObjectId((req as any).user._id)) : null,
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error fetching meme:', error);
    res.status(500).json({ message: 'Error fetching meme' });
  }
});

// Get meme by slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const memeQuery = Meme.findOne({
      slug: req.params.slug
    })
      .populate('creator', 'username avatar')
      .populate('comments.user', 'username avatar');

    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    const transformedMeme = {
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: (req as any).user ? meme.hasVoted(new Types.ObjectId((req as any).user._id)) : null,
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error fetching meme by slug:', error);
    res.status(500).json({ message: 'Error fetching meme' });
  }
});

// Get meme by title
router.get('/title/:title', async (req: Request, res: Response) => {
  try {
    const memeQuery = Meme.findOne({
      title: req.params.title
    })
      .populate('creator', 'username avatar')
      .populate('comments.user', 'username avatar');

    const meme = await memeQuery.exec();

    if (!meme) {
      return res.status(404).json({ message: 'Meme not found' });
    }

    const transformedMeme = {
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: (req as any).user ? meme.hasVoted(new Types.ObjectId((req as any).user._id)) : null,
      creator: undefined,
      votes: undefined
    };

    res.json(transformedMeme);
  } catch (error) {
    console.error('Error fetching meme by title:', error);
    res.status(500).json({ message: 'Error fetching meme' });
  }
});

// Get highlights
router.get('/highlights', async (req: Request, res: Response) => {
  try {
    console.log('Fetching highlights');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    console.log('Querying memes from:', oneWeekAgo);

    const memesQuery = Meme.find({
      createdAt: { $gte: oneWeekAgo }
    })
      .sort({ 'votes.upvotes.length': -1 })
      .limit(5)
      .populate('creator', 'username avatar');

    const memes = await memesQuery.exec();

    console.log('Found memes:', memes.length);

    const transformedMemes = memes.map(meme => ({
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: (req as any).user ? meme.hasVoted(new Types.ObjectId((req as any).user._id)) : null,
      creator: undefined,
      votes: undefined
    }));

    res.json(transformedMemes);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ 
      message: 'Error fetching highlights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's top memes
router.get('/user/:userId/top', async (req: Request, res: Response) => {
  try {
    console.log('Backend: Getting user top memes', {
      userId: req.params.userId,
      limit: req.query.limit
    });

    const limit = parseInt(req.query.limit as string) || 5;

    const memes = await Meme.find({ creator: req.params.userId })
      .sort({ 'votes.upvotes.length': -1 })
      .limit(limit)
      .populate('creator', 'username avatar');

    console.log('Backend: Found top memes:', {
      count: memes.length,
      limit
    });

    const transformedMemes = memes.map(meme => ({
      ...meme.toObject(),
      user: meme.creator,
      upvotes: meme.votes.upvotes.length,
      downvotes: meme.votes.downvotes.length,
      userVote: (req as any).user ? meme.hasVoted(new Types.ObjectId((req as any).user._id)) : null,
      creator: undefined,
      votes: undefined
    }));

    console.log('Backend: Sending top memes response');
    res.json(transformedMemes);
  } catch (error) {
    console.error('Backend: Error fetching user top memes:', error);
    res.status(500).json({ 
      message: 'Error fetching user top memes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 