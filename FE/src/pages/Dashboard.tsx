import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Meme } from '../api/memes';
import { getUserMemes, getUserStats, getUserTopMemes } from '../api/memes';
import MemeCard from '../components/MemeCard';
import { toast } from 'react-toastify';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [topMemes, setTopMemes] = useState<Meme[]>([]);
  const [stats, setStats] = useState({
    totalMemes: 0,
    totalViews: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    if (!user?._id) {
      console.log('No user ID available');
      return;
    }

    try {
      console.log('Fetching dashboard data for user:', user._id);
      setLoading(true);
      
      console.log('Fetching user memes...');
      const memesResponse = await getUserMemes(user._id, currentPage);
      console.log('User memes response:', memesResponse);
      
      console.log('Fetching user stats...');
      const statsData = await getUserStats(user._id);
      console.log('User stats response:', statsData);
      
      console.log('Fetching top memes...');
      const topMemesData = await getUserTopMemes(user._id);
      console.log('Top memes response:', topMemesData);

      setMemes(memesResponse.memes);
      setTotalPages(memesResponse.totalPages);
      setStats(statsData);
      setTopMemes(topMemesData);
      
      console.log('Dashboard state updated:', {
        memesCount: memesResponse.memes.length,
        totalPages: memesResponse.totalPages,
        stats: statsData,
        topMemesCount: topMemesData.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Dashboard useEffect triggered', { userId: user?._id, currentPage });
    fetchData();
  }, [user?._id, currentPage]);

  const handleMemeUpdate = (updatedMeme: Meme) => {
    setMemes(memes.map(meme => 
      meme._id === updatedMeme._id ? updatedMeme : meme
    ));
    setTopMemes(topMemes.map(meme => 
      meme._id === updatedMeme._id ? updatedMeme : meme
    ));
  };

  // Separate published memes and drafts
  const publishedMemes = memes.filter(meme => !meme.isDraft);
  const draftMemes = memes.filter(meme => meme.isDraft);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Memes</h3>
          <p className="text-3xl font-bold text-blue-500">{stats.totalMemes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-green-500">{stats.totalViews}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Upvotes</h3>
          <p className="text-3xl font-bold text-blue-500">{stats.totalUpvotes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Comments</h3>
          <p className="text-3xl font-bold text-purple-500">{stats.totalComments}</p>
        </div>
      </div>

      {topMemes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Top Memes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topMemes.map(meme => (
              <MemeCard
                key={meme._id}
                meme={meme}
                onMemeUpdate={handleMemeUpdate}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Memes</h2>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Published Memes */}
            <div className="space-y-8 mb-12">
              {publishedMemes.length > 0 ? publishedMemes.map(meme => (
                <MemeCard
                  key={meme._id}
                  meme={meme}
                  onMemeUpdate={handleMemeUpdate}
                />
              )) : (
                <div className="text-gray-500">No published memes yet.</div>
              )}
            </div>
            {/* Draft Memes */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold mb-2">Your Drafts</h3>
              {draftMemes.length > 0 ? draftMemes.map(meme => (
                <MemeCard
                  key={meme._id}
                  meme={meme}
                  onMemeUpdate={handleMemeUpdate}
                />
              )) : (
                <div className="text-gray-500">No drafts yet.</div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 mx-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 mx-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 