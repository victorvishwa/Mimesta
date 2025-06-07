import mongoose, { Schema, Document, Types, Model, Query } from 'mongoose';
import { IUser } from './User';

export interface IMeme extends Document {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  topTextSize: number;
  bottomTextSize: number;
  topTextColor: string;
  bottomTextColor: string;
  topTextStroke: string;
  bottomTextStroke: string;
  topTextPosition: number;
  bottomTextPosition: number;
  topTextEffect: string;
  bottomTextEffect: string;
  imageFilter: string;
  isDraft: boolean;
  creator: Types.ObjectId;
  votes: {
    upvotes: Types.ObjectId[];
    downvotes: Types.ObjectId[];
  };
  comments: Array<{
    _id: Types.ObjectId;
    user: Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  views: number;
  isReported: boolean;
  reportDetails?: {
    reason: string;
    reportedBy: Types.ObjectId;
    reportedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  toObject(): any;
  getVoteCount(): number;
  hasVoted(userId: Types.ObjectId): 'up' | 'down' | null;
  removeVote(userId: Types.ObjectId): void;
  addVote(userId: Types.ObjectId, voteType: 'up' | 'down'): Promise<void>;
  addComment(userId: Types.ObjectId, text: string): Promise<void>;
  report(userId: Types.ObjectId): Promise<void>;
}

export interface IMemeModel extends Model<IMeme> {
  getMemeOfTheDay(): Promise<IMeme | null>;
  getWeeklyChampion(): Promise<IMeme | null>;
}

const MemeSchema = new Schema<IMeme>({
  title: {
    type: String,
    required: function(this: any) { return !this.isDraft; },
    trim: true,
    maxlength: 100
  },
  imageUrl: {
    type: String,
    required: function(this: any) { return !this.isDraft; }
  },
  topText: {
    type: String,
    trim: true,
    maxlength: 100
  },
  bottomText: {
    type: String,
    trim: true,
    maxlength: 100
  },
  topTextSize: {
    type: Number,
    default: 48,
    min: 12,
    max: 120
  },
  bottomTextSize: {
    type: Number,
    default: 48,
    min: 12,
    max: 120
  },
  topTextColor: {
    type: String,
    default: '#FFFFFF'
  },
  bottomTextColor: {
    type: String,
    default: '#FFFFFF'
  },
  topTextStroke: {
    type: String,
    default: '#000000'
  },
  bottomTextStroke: {
    type: String,
    default: '#000000'
  },
  topTextPosition: {
    type: Number,
    default: 0.1,
    min: 0,
    max: 1
  },
  bottomTextPosition: {
    type: Number,
    default: 0.9,
    min: 0,
    max: 1
  },
  topTextEffect: {
    type: String,
    default: 'none'
  },
  bottomTextEffect: {
    type: String,
    default: 'none'
  },
  imageFilter: {
    type: String,
    default: 'none'
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function(this: any) { return !this.isDraft; }
  },
  votes: {
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportDetails: {
    reason: String,
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MemeSchema.index({ creator: 1, createdAt: -1 });
MemeSchema.index({ 'votes.upvotes': 1 });
MemeSchema.index({ 'votes.downvotes': 1 });
MemeSchema.index({ createdAt: -1 });
MemeSchema.index({ isDraft: 1 });

// Virtual for net votes
MemeSchema.virtual('netVotes').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Method to get vote count
MemeSchema.methods.getVoteCount = function(): number {
  return (this.votes?.upvotes?.length || 0) - (this.votes?.downvotes?.length || 0);
};

// Method to check if a user has voted
MemeSchema.methods.hasVoted = function(userId: Types.ObjectId): 'up' | 'down' | null {
  if (this.votes?.upvotes?.some((id: Types.ObjectId) => id.equals(userId))) {
    return 'up';
  }
  if (this.votes?.downvotes?.some((id: Types.ObjectId) => id.equals(userId))) {
    return 'down';
  }
  return null;
};

// Method to remove a vote
MemeSchema.methods.removeVote = function(userId: Types.ObjectId): void {
  if (this.votes?.upvotes) {
    this.votes.upvotes = this.votes.upvotes.filter((id: Types.ObjectId) => !id.equals(userId));
  }
  if (this.votes?.downvotes) {
    this.votes.downvotes = this.votes.downvotes.filter((id: Types.ObjectId) => !id.equals(userId));
  }
};

// Method to add a vote
MemeSchema.methods.addVote = async function(userId: Types.ObjectId, voteType: 'up' | 'down'): Promise<void> {
  console.log('Adding vote:', { userId, voteType });
  
  // Remove previous vote if exists
  this.votes.upvotes = this.votes.upvotes.filter((id: Types.ObjectId) => id.toString() !== userId.toString());
  this.votes.downvotes = this.votes.downvotes.filter((id: Types.ObjectId) => id.toString() !== userId.toString());

  // Add new vote
  if (voteType === 'up') {
    this.votes.upvotes.push(userId);
  } else {
    this.votes.downvotes.push(userId);
  }

  console.log('Updated votes:', {
    upvotes: this.votes.upvotes.length,
    downvotes: this.votes.downvotes.length
  });

  await this.save();
};

// Method to add a comment
MemeSchema.methods.addComment = async function(userId: Types.ObjectId, text: string): Promise<void> {
  console.log('Adding comment:', { userId, text });
  
  this.comments.push({
    _id: new Types.ObjectId(),
    user: userId,
    text,
    createdAt: new Date()
  });

  console.log('Updated comments count:', this.comments.length);
  await this.save();
};

// Method to report a meme
MemeSchema.methods.report = async function(userId: Types.ObjectId): Promise<void> {
  this.isReported = true;
  await this.save();
};

// Static method to get meme of the day
MemeSchema.statics.getMemeOfTheDay = async function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  return this.findOne({
    createdAt: { $gte: startOfDay },
    isReported: false,
  })
  .sort({ 'votes.upvotes': -1, 'votes.downvotes': 1 })
  .limit(1);
};

// Static method to get weekly champion
MemeSchema.statics.getWeeklyChampion = async function() {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  
  return this.findOne({
    createdAt: { $gte: startOfWeek },
    isReported: false,
  })
  .sort({ 'votes.upvotes': -1, 'votes.downvotes': 1 })
  .limit(1);
};

export const Meme = mongoose.model<IMeme, IMemeModel>('Meme', MemeSchema); 