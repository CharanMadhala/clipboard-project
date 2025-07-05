import React, { useState, useEffect } from 'react';
import { Plus, Copy, Edit, Trash2, Sun, Moon, Clipboard } from 'lucide-react';
import { apiService, Clip, ClipFormData } from './services/api';

function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClip, setEditingClip] = useState<Clip | null>(null);
  const [formData, setFormData] = useState<ClipFormData>({ title: '', content: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clips and theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('clipboardManager_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
    
    loadClips();
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('clipboardManager_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const loadClips = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedClips = await apiService.getClips();
      setClips(fetchedClips);
    } catch (err) {
      setError('Failed to load clips. Please try again.');
      console.error('Error loading clips:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const openModal = (clip?: Clip) => {
    if (clip) {
      setEditingClip(clip);
      setFormData({ title: clip.title, content: clip.content });
    } else {
      setEditingClip(null);
      setFormData({ title: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClip(null);
    setFormData({ title: '', content: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      if (editingClip) {
        const updatedClip = await apiService.updateClip(editingClip._id, formData);
        setClips(clips.map(clip =>
          clip._id === editingClip._id ? updatedClip : clip
        ));
      } else {
        const newClip = await apiService.createClip(formData);
        setClips([...clips, newClip]);
      }
      closeModal();
    } catch (err) {
      setError('Failed to save clip. Please try again.');
      console.error('Error saving clip:', err);
    }
  };

  const deleteClip = async (id: string) => {
    try {
      await apiService.deleteClip(id);
      setClips(clips.filter(clip => clip._id !== id));
    } catch (err) {
      setError('Failed to delete clip. Please try again.');
      console.error('Error deleting clip:', err);
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const themeClasses = isDarkMode
    ? 'bg-gray-900 text-gray-100'
    : 'bg-stone-100 text-stone-900';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-roboto ${themeClasses}`}>
        <div className="text-center">
          <div className={`inline-flex p-4 rounded-full mb-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white border border-stone-300'
          }`}>
            <Clipboard className={`h-12 w-12 animate-pulse ${
              isDarkMode ? 'text-gray-600' : 'text-stone-400'
            }`} />
          </div>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-400' : 'text-stone-600'
          }`}>
            Loading clips...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-roboto ${themeClasses}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${
        isDarkMode 
          ? 'bg-gray-900/90 border-gray-700' 
          : 'bg-stone-100/90 border-stone-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-amber-600' : 'bg-emerald-700'
              }`}>
                <Clipboard className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Clipboard Manager</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openModal()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Clip</span>
              </button>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-white hover:bg-stone-200 text-stone-600 border border-stone-300'
                }`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800 text-red-400' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {clips.length === 0 ? (
          <div className="text-center py-16">
            <div className={`inline-flex p-4 rounded-full mb-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white border border-stone-300'
            }`}>
              <Clipboard className={`h-12 w-12 ${
                isDarkMode ? 'text-gray-600' : 'text-stone-400'
              }`} />
            </div>
            <h2 className={`text-2xl font-semibold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-stone-700'
            }`}>
              No clips yet
            </h2>
            <p className={`text-lg mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-stone-600'
            }`}>
              Start by adding your first clip to the collection
            </p>
            <button
              onClick={() => openModal()}
              className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span>Add Your First Clip</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {clips.map((clip) => (
              <div
                key={clip._id}
                className={`group relative rounded-lg border p-4 h-24 transition-all duration-200 hover:shadow-lg cursor-pointer flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                    : 'bg-white border-stone-300 hover:shadow-stone-200 hover:border-emerald-300'
                } ${copiedId === clip._id ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => copyToClipboard(clip.content, clip._id)}
              >
                <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(clip);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                        : 'hover:bg-stone-200 text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteClip(clip._id);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isDarkMode
                        ? 'hover:bg-red-900 text-gray-400 hover:text-red-400'
                        : 'hover:bg-red-100 text-stone-500 hover:text-red-600'
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <h3 className={`font-medium text-sm text-center leading-tight ${
                  isDarkMode ? 'text-gray-200' : 'text-stone-800'
                }`}>
                  {clip.title}
                </h3>

                {copiedId === clip._id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-white">
                      <Copy className="h-4 w-4" />
                      <span className="font-medium text-xs">Copied!</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white border border-stone-300'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-stone-200'
            }`}>
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-stone-900'
              }`}>
                {editingClip ? 'Edit Clip' : 'Add New Clip'}
              </h2>
              <button
                onClick={closeModal}
                className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200`}
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-stone-700'
                }`}>
                  Cover Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-roboto ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-amber-500'
                      : 'bg-white border-stone-300 text-stone-900 focus:ring-emerald-500'
                  }`}
                  placeholder="Enter a title for this clip"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-stone-700'
                }`}>
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none font-roboto ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-amber-500'
                      : 'bg-white border-stone-300 text-stone-900 focus:ring-emerald-500'
                  }`}
                  placeholder="Paste or type your content here"
                  rows={6}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {editingClip ? 'Update Clip' : 'Add Clip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;