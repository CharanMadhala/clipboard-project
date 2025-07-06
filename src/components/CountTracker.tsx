import React, { useState, useEffect } from 'react';
import { RotateCcw, Minus, Plus } from 'lucide-react';

interface CountTrackerProps {
  isDarkMode: boolean;
}

export const CountTracker: React.FC<CountTrackerProps> = ({ isDarkMode }) => {
  const [count, setCount] = useState<number>(0);

  // Load count from localStorage on component mount
  useEffect(() => {
    const savedCount = localStorage.getItem('clipboardManager_count');
    if (savedCount) {
      setCount(parseInt(savedCount, 10));
    }
  }, []);

  // Save count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('clipboardManager_count', count.toString());
  }, [count]);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  const decrement = () => {
    setCount(prev => Math.max(0, prev - 1));
  };

  const restart = () => {
    setCount(0);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${
      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-300'
    } border rounded-lg shadow-lg p-3 transition-all duration-300 hover:shadow-xl`}>
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className={`text-xs font-medium ${
          isDarkMode ? 'text-slate-300' : 'text-stone-600'
        }`}>
          Count Tracker
        </h3>
      </div>

      {/* Count Display - Now clickable */}
      <div 
        onClick={increment}
        className={`text-center mb-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
          isDarkMode 
            ? 'bg-slate-700 hover:bg-slate-600' 
            : 'bg-stone-100 hover:bg-stone-200'
        }`}
        title="Click to increase count"
      >
        <span className={`text-2xl font-bold ${
          isDarkMode ? 'text-slate-100' : 'text-stone-800'
        }`}>
          {count}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-2">
        {/* Restart Button */}
        <button
          onClick={restart}
          className={`p-2 rounded-md transition-colors ${
            isDarkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100'
              : 'bg-stone-200 hover:bg-stone-300 text-stone-600 hover:text-stone-800'
          }`}
          title="Restart count"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Minus Button */}
        <button
          onClick={decrement}
          className={`p-2 rounded-md transition-colors ${
            isDarkMode
              ? 'bg-red-900 hover:bg-red-800 text-red-300 hover:text-red-100'
              : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800'
          }`}
          title="Decrease count"
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Plus Button */}
        <button
          onClick={increment}
          className={`p-2 rounded-md transition-colors ${
            isDarkMode
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-300 hover:text-blue-100'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-800'
          }`}
          title="Increase count"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile-friendly tap targets */}
      <style jsx>{`
        @media (max-width: 640px) {
          button {
            min-width: 44px;
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};