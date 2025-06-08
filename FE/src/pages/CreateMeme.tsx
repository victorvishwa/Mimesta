import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createMeme } from '../api/memes';
import MemeEditor from '../components/MemeEditor';
import { toast } from 'react-toastify';

interface Template {
  id: string;
  name: string;
  url: string;
}

interface TextStyle {
  name: string;
  color: string;
  stroke: string;
  size: number;
}

interface TextEffect {
  name: string;
  transform: string;
}

interface ImageFilter {
  name: string;
  filter: string;
}

interface MemeState {
  title: string;
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
}

const templates: Template[] = [
  { id: '1', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg' },
  { id: '2', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
  { id: '3', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
  { id: '4', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg' },
  { id: '5', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
];

const textStyles: TextStyle[] = [
  { name: 'Classic', color: '#ffffff', stroke: '#000000', size: 48 },
  { name: 'Dark', color: '#000000', stroke: '#ffffff', size: 48 },
  { name: 'Neon', color: '#00ff00', stroke: '#000000', size: 48 },
  { name: 'Vintage', color: '#ffd700', stroke: '#8b4513', size: 48 },
  { name: 'Minimal', color: '#ffffff', stroke: '#666666', size: 36 },
];

const textEffects: TextEffect[] = [
  { name: 'None', transform: 'none' },
  { name: 'Upside Down', transform: 'rotate(180deg)' },
  { name: 'Tilt Left', transform: 'rotate(-15deg)' },
  { name: 'Tilt Right', transform: 'rotate(15deg)' },
  { name: 'Wave', transform: 'skew(10deg)' },
];

const imageFilters: ImageFilter[] = [
  { name: 'None', filter: 'none' },
  { name: 'Grayscale', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Invert', filter: 'invert(100%)' },
  { name: 'Blur', filter: 'blur(2px)' },
  { name: 'Brightness', filter: 'brightness(150%)' },
  { name: 'Contrast', filter: 'contrast(200%)' },
];

const CreateMeme: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('Classic');
  const [history, setHistory] = useState<MemeState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [memeState, setMemeState] = useState<MemeState>({
    title: '',
    topText: '',
    bottomText: '',
    topTextSize: 48,
    bottomTextSize: 48,
    topTextColor: '#ffffff',
    bottomTextColor: '#ffffff',
    topTextStroke: '#000000',
    bottomTextStroke: '#000000',
    topTextPosition: 0.1,
    bottomTextPosition: 0.1,
    topTextEffect: 'none',
    bottomTextEffect: 'none',
    imageFilter: 'none',
  });

  const updateMemeState = (updates: Partial<MemeState>) => {
    const newState = { ...memeState, ...updates };
    setMemeState(newState);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setMemeState(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setMemeState(history[historyIndex + 1]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setImageUrl(template.url);
    setImage(null);
  };

  const handleStyleSelect = (style: TextStyle) => {
    setSelectedStyle(style.name);
    updateMemeState({
      topTextColor: style.color,
      bottomTextColor: style.color,
      topTextStroke: style.stroke,
      bottomTextStroke: style.stroke,
      topTextSize: style.size,
      bottomTextSize: style.size,
    });
  };

  const handleTextPositionChange = (position: 'top' | 'bottom', value: number) => {
    // Convert percentage (0-100) to decimal (0-1)
    const decimalValue = value / 100;
    setMemeState(prev => ({
      ...prev,
      [`${position}TextPosition`]: decimalValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to create memes');
      return;
    }

    // For published memes, require an image or template URL
    if (!isDraft && !image && !imageUrl) {
      toast.error('Please select an image or template');
      return;
    }

    if (!isDraft && !memeState.title) {
      toast.error('Please enter a title for your meme');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // Add all meme state properties
    Object.entries(memeState).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add isDraft status
    formData.append('isDraft', String(isDraft));
    
    // Handle image
    if (image) {
      formData.append('image', image);
    } else if (imageUrl && imageUrl.startsWith('http')) {
      // If it's a template URL, send it as imageUrl
      formData.append('imageUrl', imageUrl);
    }
    // For drafts, it's okay if neither image nor imageUrl is present

    try {
      console.log('Submitting meme with data:', {
        title: memeState.title,
        topText: memeState.topText,
        bottomText: memeState.bottomText,
        topTextSize: memeState.topTextSize,
        bottomTextSize: memeState.bottomTextSize,
        topTextColor: memeState.topTextColor,
        bottomTextColor: memeState.bottomTextColor,
        topTextPosition: memeState.topTextPosition,
        bottomTextPosition: memeState.bottomTextPosition,
        hasImage: !!image,
        imageUrl: imageUrl,
        isDraft
      });

      const response = await createMeme(formData);
      if (response) {
        toast.success(isDraft ? 'Draft saved successfully!' : 'Meme published successfully!');
        // Add a small delay to ensure the backend has processed the creation
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to create meme:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create meme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Meme Creation Studio</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          {imageUrl ? (
            <MemeEditor
              imageUrl={imageUrl}
              {...memeState}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Upload an image or select a template to start</p>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* History Controls */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Redo
              </button>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Choose File
              </button>
            </div>

            {/* Template Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or Choose a Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500"
                  >
                    <img
                      src={template.url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                      {template.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image Filter</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {imageFilters.map((filter) => (
                  <button
                    key={filter.name}
                    type="button"
                    onClick={() => updateMemeState({ imageFilter: filter.filter })}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      memeState.imageFilter === filter.filter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={memeState.title}
                onChange={(e) => updateMemeState({ title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Text Style Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {textStyles.map((style) => (
                  <button
                    key={style.name}
                    type="button"
                    onClick={() => handleStyleSelect(style)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      selectedStyle === style.name
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Top Text</label>
              <input
                type="text"
                value={memeState.topText}
                onChange={(e) => updateMemeState({ topText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Size</label>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    value={memeState.topTextSize}
                    onChange={(e) => updateMemeState({ topTextSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Position</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={memeState.topTextPosition * 100}
                    onChange={(e) => handleTextPositionChange('top', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Color</label>
                  <input
                    type="color"
                    value={memeState.topTextColor}
                    onChange={(e) => updateMemeState({ topTextColor: e.target.value })}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Stroke Color</label>
                  <input
                    type="color"
                    value={memeState.topTextStroke}
                    onChange={(e) => updateMemeState({ topTextStroke: e.target.value })}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Effect</label>
                  <select
                    value={memeState.topTextEffect}
                    onChange={(e) => updateMemeState({ topTextEffect: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    {textEffects.map((effect) => (
                      <option key={effect.name} value={effect.transform}>
                        {effect.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Text</label>
              <input
                type="text"
                value={memeState.bottomText}
                onChange={(e) => updateMemeState({ bottomText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Size</label>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    value={memeState.bottomTextSize}
                    onChange={(e) => updateMemeState({ bottomTextSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Position</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={memeState.bottomTextPosition * 100}
                    onChange={(e) => handleTextPositionChange('bottom', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Color</label>
                  <input
                    type="color"
                    value={memeState.bottomTextColor}
                    onChange={(e) => updateMemeState({ bottomTextColor: e.target.value })}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Stroke Color</label>
                  <input
                    type="color"
                    value={memeState.bottomTextStroke}
                    onChange={(e) => updateMemeState({ bottomTextStroke: e.target.value })}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Effect</label>
                  <select
                    value={memeState.bottomTextEffect}
                    onChange={(e) => updateMemeState({ bottomTextEffect: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    {textEffects.map((effect) => (
                      <option key={effect.name} value={effect.transform}>
                        {effect.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Draft Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="draft"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="draft" className="ml-2 block text-sm text-gray-700">
                Save as draft
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !imageUrl}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Creating...' : isDraft ? 'Save Draft' : 'Create Meme'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMeme; 