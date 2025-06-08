export interface Meme {
  _id: string;
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
  isDraft: boolean;
  user: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      username: string;
    };
    text: string;
    createdAt: string;
  }>;
  reportDetails?: {
    reportedBy: string[];
    reportCount: number;
    lastReportedAt: string;
  };
}

export interface Comment {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
} 