import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Fab, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FeedTabs, { TabType } from '../components/FeedTabs';
import MemeCard from '../components/MemeCard';
import { Meme } from '../api/memes';
import { getMemes, voteMeme, addComment } from '../api/memes';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [currentFeed, setCurrentFeed] = useState<TabType>('new');
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMemes = async () => {
    try {
      setLoading(true);
      const response = await getMemes(page);
      if (page === 1) {
        setMemes(response.memes);
      } else {
        setMemes((prev) => [...prev, ...response.memes]);
      }
      setHasMore(response.memes.length === 10);
    } catch (error) {
      console.error('Error fetching memes:', error);
      toast.error('Failed to load memes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchMemes();
  }, [currentFeed]);

  const handleFeedChange = (feed: TabType) => {
    setCurrentFeed(feed);
  };

  const handleMemeUpdate = (updatedMeme: Meme) => {
    setMemes((prev) =>
      prev.map((meme) => (meme._id === updatedMeme._id ? updatedMeme : meme))
    );
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchMemes();
    }
  };

  // 3D/Glassmorphism background
  const backgroundStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f9fafb 100%)',
    position: 'relative',
    overflow: 'hidden',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
      <div className="pt-20">
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ py: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 900,
                textAlign: 'center',
                mb: 4,
                background: 'linear-gradient(90deg, #6366f1, #ec4899 80%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                letterSpacing: 2,
                textShadow: '0 2px 16px rgba(99,102,241,0.15)',
              }}
            >
  
            </Typography>

            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                mb: 4,
              }}
            >
              <FeedTabs activeTab={currentFeed} onTabChange={handleFeedChange} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mt: 1 }}>
              {memes.map((meme) => (
                <Box
                  key={meme._id}
                  sx={{
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-6px) scale(1.03)',
                      boxShadow: '0 16px 40px 0 rgba(99,102,241,0.18)',
                    },
                  }}
                >
                  <MemeCard
                    meme={meme}
                    onMemeUpdate={handleMemeUpdate}
                  />
                </Box>
              ))}
            </Box>

            {loading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                my: 4,
                '& .MuiCircularProgress-root': {
                  color: '#6366f1'
                }
              }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <button
                  onClick={handleLoadMore}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #6366f1, #ec4899)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)',
                    fontSize: '1rem',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.2)';
                  }}
                >
                  Load More
                </button>
              </Box>
            )}
          </Box>

          {/* Floating action button for creating a meme */}
          <Fab
            color="secondary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 10,
              background: 'linear-gradient(45deg, #6366f1, #ec4899)',
              color: 'white',
              boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6366f1, #d946ef)',
              },
            }}
            onClick={() => navigate('/create')}
          >
            <AddIcon />
          </Fab>
        </Container>
      </div>
    </div>
  );
};

export default Home; 