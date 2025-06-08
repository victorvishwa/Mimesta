import React from 'react';

export type TabType = 'new' | 'top24h' | 'topWeek' | 'allTime';

interface FeedTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-4 mb-8">
      <button
        onClick={() => onTabChange('new')}
        className={`px-4 py-2 rounded-lg ${
          activeTab === 'new'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        New
      </button>
      <button
        onClick={() => onTabChange('top24h')}
        className={`px-4 py-2 rounded-lg ${
          activeTab === 'top24h'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Top 24h
      </button>
      <button
        onClick={() => onTabChange('topWeek')}
        className={`px-4 py-2 rounded-lg ${
          activeTab === 'topWeek'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Top Week
      </button>
      <button
        onClick={() => onTabChange('allTime')}
        className={`px-4 py-2 rounded-lg ${
          activeTab === 'allTime'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        All Time
      </button>
    </div>
  );
};

export default FeedTabs;
