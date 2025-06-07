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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meme = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MemeSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: function () { return !this.isDraft; },
        trim: true,
        maxlength: 100
    },
    imageUrl: {
        type: String,
        required: function () { return !this.isDraft; }
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return !this.isDraft; }
    },
    votes: {
        upvotes: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }],
        downvotes: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }]
    },
    comments: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
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
MemeSchema.virtual('netVotes').get(function () {
    return this.votes.upvotes.length - this.votes.downvotes.length;
});
// Method to get vote count
MemeSchema.methods.getVoteCount = function () {
    var _a, _b, _c, _d;
    return (((_b = (_a = this.votes) === null || _a === void 0 ? void 0 : _a.upvotes) === null || _b === void 0 ? void 0 : _b.length) || 0) - (((_d = (_c = this.votes) === null || _c === void 0 ? void 0 : _c.downvotes) === null || _d === void 0 ? void 0 : _d.length) || 0);
};
// Method to check if a user has voted
MemeSchema.methods.hasVoted = function (userId) {
    var _a, _b, _c, _d;
    if ((_b = (_a = this.votes) === null || _a === void 0 ? void 0 : _a.upvotes) === null || _b === void 0 ? void 0 : _b.some((id) => id.equals(userId))) {
        return 'up';
    }
    if ((_d = (_c = this.votes) === null || _c === void 0 ? void 0 : _c.downvotes) === null || _d === void 0 ? void 0 : _d.some((id) => id.equals(userId))) {
        return 'down';
    }
    return null;
};
// Method to remove a vote
MemeSchema.methods.removeVote = function (userId) {
    var _a, _b;
    if ((_a = this.votes) === null || _a === void 0 ? void 0 : _a.upvotes) {
        this.votes.upvotes = this.votes.upvotes.filter((id) => !id.equals(userId));
    }
    if ((_b = this.votes) === null || _b === void 0 ? void 0 : _b.downvotes) {
        this.votes.downvotes = this.votes.downvotes.filter((id) => !id.equals(userId));
    }
};
// Method to add a vote
MemeSchema.methods.addVote = function (userId, voteType) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Adding vote:', { userId, voteType });
        // Remove previous vote if exists
        this.votes.upvotes = this.votes.upvotes.filter((id) => id.toString() !== userId.toString());
        this.votes.downvotes = this.votes.downvotes.filter((id) => id.toString() !== userId.toString());
        // Add new vote
        if (voteType === 'up') {
            this.votes.upvotes.push(userId);
        }
        else {
            this.votes.downvotes.push(userId);
        }
        console.log('Updated votes:', {
            upvotes: this.votes.upvotes.length,
            downvotes: this.votes.downvotes.length
        });
        yield this.save();
    });
};
// Method to add a comment
MemeSchema.methods.addComment = function (userId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Adding comment:', { userId, text });
        this.comments.push({
            _id: new mongoose_1.Types.ObjectId(),
            user: userId,
            text,
            createdAt: new Date()
        });
        console.log('Updated comments count:', this.comments.length);
        yield this.save();
    });
};
// Method to report a meme
MemeSchema.methods.report = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        this.isReported = true;
        yield this.save();
    });
};
// Static method to get meme of the day
MemeSchema.statics.getMemeOfTheDay = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return this.findOne({
            createdAt: { $gte: startOfDay },
            isReported: false,
        })
            .sort({ 'votes.upvotes': -1, 'votes.downvotes': 1 })
            .limit(1);
    });
};
// Static method to get weekly champion
MemeSchema.statics.getWeeklyChampion = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        return this.findOne({
            createdAt: { $gte: startOfWeek },
            isReported: false,
        })
            .sort({ 'votes.upvotes': -1, 'votes.downvotes': 1 })
            .limit(1);
    });
};
exports.Meme = mongoose_1.default.model('Meme', MemeSchema);
