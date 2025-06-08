import React from 'react';
import { Link } from 'react-router-dom';
import type { Meme } from '../api/memes';

interface TrendingHighlightProps {
  memes: Meme[];
}

const TrendingHighlight: React.FC<TrendingHighlightProps> = ({ memes }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Trending Now</h2>
      <div className="space-y-4">
        {memes.map((meme) => (
          <Link
            key={meme._id}
            to={`/meme/${meme._id}`}
            className="block hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <img
                src={meme.imageUrl}
                alt={meme.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {meme.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {meme.user?.username || 'Anonymous'}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>↑ {meme.upvotes || 0}</span>
                  <span>↓ {meme.downvotes || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingHighlight;
