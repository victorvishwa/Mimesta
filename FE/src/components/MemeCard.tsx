import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { voteMeme, addComment } from '../api/memes';
import type { Meme } from '../api/memes';
import CommentSection from './CommentSection';
import { toast } from 'react-toastify';
import MemeEditor from './MemeEditor';

interface MemeCardProps {
  meme: Meme;
  onMemeUpdate: (updatedMeme: Meme) => void;
}

const MemeCard: React.FC<MemeCardProps> = ({ meme, onMemeUpdate }) => {
  const { user, token } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const handleVote = async (voteType: 'up' | 'down') => {
    console.log('handleVote called', { voteType, user, token });
    if (!token) {
      toast.error('Please log in to vote');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      console.log('Voting on meme:', meme._id, 'with type:', voteType);
      const updatedMeme = await voteMeme(meme._id, voteType);
      console.log('Vote successful, updated meme:', updatedMeme);
      onMemeUpdate(updatedMeme);
      toast.success('Vote recorded successfully');
    } catch (error) {
      console.error('Error voting:', error);
      if (error && typeof error === 'object') {
        console.error('Vote error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      toast.error('Failed to record vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleComment called', { user, token, commentText });
    if (!token) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    if (isCommenting) return;
    setIsCommenting(true);

    try {
      console.log('Adding comment to meme:', meme._id, 'with text:', commentText);
      const updatedMeme = await addComment(meme._id, commentText);
      console.log('Comment successful, updated meme:', updatedMeme);
      onMemeUpdate(updatedMeme);
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error && typeof error === 'object') {
        console.error('Comment error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{meme.title}</h2>
        <MemeEditor
          imageUrl={meme.imageUrl}
          topText={meme.topText}
          bottomText={meme.bottomText}
          topTextSize={meme.topTextSize}
          bottomTextSize={meme.bottomTextSize}
          topTextColor={meme.topTextColor}
          bottomTextColor={meme.bottomTextColor}
          topTextStroke={meme.topTextStroke}
          bottomTextStroke={meme.bottomTextStroke}
          topTextPosition={meme.topTextPosition}
          bottomTextPosition={meme.bottomTextPosition}
          topTextEffect={meme.topTextEffect}
          bottomTextEffect={meme.bottomTextEffect}
          imageFilter={meme.imageFilter}
        />
        <div className="flex items-center justify-between mt-4 px-4 pb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('up')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all duration-300 ${
                meme.userVote === 'up'
                  ? 'bg-green-50 text-green-600 shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span className="font-medium">{meme.upvotes}</span>
            </button>

            <button
              onClick={() => handleVote('down')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all duration-300 ${
                meme.userVote === 'down'
                  ? 'bg-red-50 text-red-600 shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="font-medium">{meme.downvotes}</span>
            </button>
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">{meme.comments.length}</span>
          </button>
        </div>
        
        {showComments && (
          <div className="mt-4">
            <form onSubmit={handleComment} className="mb-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 border rounded-lg mb-2"
                rows={2}
                disabled={!token || isCommenting}
              />
              <button
                type="submit"
                onClick={() => { console.log('Comment button clicked'); }}
                className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 ${
                  isCommenting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!token || !commentText.trim() || isCommenting}
              >
                {isCommenting ? 'Adding...' : 'Comment'}
              </button>
            </form>
            <CommentSection comments={meme.comments || []} />
          </div>
        )}
        <div className="mt-4 text-sm text-gray-500">
          <span>By {meme.user?.username || 'Anonymous'}</span>
        </div>
      </div>
    </div>
  );
};

export default MemeCard;
