import React, { useState, useEffect } from 'react';
import { Plus, Copy, Edit, Trash2, Sun, Moon, Clipboard } from 'lucide-react';
import { apiService, Clip, ClipFormData } from './services/api';
import { CountTracker } from './components/CountTracker';

// Default clips data
const defaultClips = [
  {
    title: "Welcome Message",
    content: "Welcome to your Clipboard Manager! This is your first clip. You can edit, delete, or copy this content by clicking on it."
  },
  {
    title: "JavaScript Array Methods",
    content: `// Common JavaScript array methods
const numbers = [1, 2, 3, 4, 5];

// Map - transform each element
const doubled = numbers.map(n => n * 2);

// Filter - select elements that match condition
const evens = numbers.filter(n => n % 2 === 0);

// Reduce - combine all elements into single value
const sum = numbers.reduce((acc, n) => acc + n, 0);`
  },
  {
    title: "CSS Flexbox Cheat Sheet",
    content: `/* Flexbox Container Properties */
.container {
  display: flex;
  flex-direction: row | column;
  justify-content: flex-start | center | flex-end | space-between | space-around;
  align-items: stretch | flex-start | center | flex-end;
  flex-wrap: nowrap | wrap | wrap-reverse;
}

/* Flexbox Item Properties */
.item {
  flex: 1; /* grow, shrink, basis */
  align-self: auto | flex-start | center | flex-end;
}`
  },
  {
    title: "Git Commands",
    content: `# Essential Git commands
git init                    # Initialize repository
git add .                   # Stage all changes
git commit -m "message"     # Commit with message
git push origin main        # Push to remote
git pull origin main        # Pull from remote
git status                  # Check status
git log --oneline          # View commit history
git branch -b feature      # Create new branch
git checkout main          # Switch branch
git merge feature          # Merge branch`
  },
  {
    title: "React Hooks Examples",
    content: `import React, { useState, useEffect, useContext } from 'react';

// useState Hook
const [count, setCount] = useState(0);

// useEffect Hook
useEffect(() => {
  document.title = \`Count: \${count}\`;
  
  // Cleanup function
  return () => {
    console.log('Cleanup');
  };
}, [count]); // Dependency array

// Custom Hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return localStorage.getItem(key) || initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);
  
  return [value, setValue];
}`
  },
  {
    title: "SQL Query Examples",
    content: `-- Basic SQL queries
SELECT * FROM users WHERE age > 18;

-- Join tables
SELECT u.name, p.title 
FROM users u 
JOIN posts p ON u.id = p.user_id;

-- Aggregate functions
SELECT COUNT(*), AVG(age), MAX(created_at)
FROM users 
GROUP BY department;

-- Subquery
SELECT name FROM users 
WHERE id IN (
  SELECT user_id FROM orders 
  WHERE total > 100
);

-- Update and Delete
UPDATE users SET email = 'new@email.com' WHERE id = 1;
DELETE FROM posts WHERE created_at < '2023-01-01';`
  },
  {
    title: "Python List Comprehensions",
    content: `# Basic list comprehension
squares = [x**2 for x in range(10)]

# With condition
evens = [x for x in range(20) if x % 2 == 0]

# Nested comprehension
matrix = [[i*j for j in range(3)] for i in range(3)]

# Dictionary comprehension
word_lengths = {word: len(word) for word in ['hello', 'world', 'python']}

# Set comprehension
unique_lengths = {len(word) for word in ['hello', 'world', 'hello']}

# Generator expression
sum_of_squares = sum(x**2 for x in range(100))`
  },
  {
    title: "Docker Commands",
    content: `# Docker essential commands
docker build -t myapp .              # Build image
docker run -p 3000:3000 myapp        # Run container
docker ps                            # List running containers
docker ps -a                         # List all containers
docker images                        # List images
docker stop container_id             # Stop container
docker rm container_id               # Remove container
docker rmi image_id                  # Remove image
docker exec -it container_id bash    # Execute command in container
docker logs container_id             # View logs

# Docker Compose
docker-compose up -d                 # Start services
docker-compose down                  # Stop services
docker-compose logs                  # View logs`
  },
  {
    title: "Regex Patterns",
    content: `// Common regex patterns
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phone = /^\+?[\d\s\-\(\)]+$/;
const url = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Usage examples
const isValidEmail = email.test('user@example.com');
const extractNumbers = '123-456-7890'.match(/\d+/g);
const replaceSpaces = 'hello world'.replace(/\s+/g, '-');`
  },
  {
    title: "API Response Template",
    content: `{
  "status": "success",
  "data": {
    "id": "12345",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Software developer",
      "location": "San Francisco, CA"
    },
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0",
    "total_count": 1
  }
}`
  }
];

function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClip, setEditingClip] = useState<Clip | null>(null);
  const [formData, setFormData] = useState<ClipFormData>({ title: '', content: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [defaultClipsCreated, setDefaultClipsCreated] = useState(false);

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

  // Create default clips if none exist
  useEffect(() => {
    const createDefaultClips = async () => {
      if (clips.length === 0 && !loading && !defaultClipsCreated) {
        try {
          console.log('Creating default clips...');
          const createdClips: Clip[] = [];
          
          for (const clipData of defaultClips) {
            const newClip = await apiService.createClip(clipData);
            createdClips.push(newClip);
          }
          
          setClips(createdClips);
          setDefaultClipsCreated(true);
          console.log('Default clips created successfully!');
        } catch (err) {
          console.error('Error creating default clips:', err);
          setError('Failed to create default clips. You can add them manually.');
        }
      }
    };

    createDefaultClips();
  }, [clips.length, loading, defaultClipsCreated]);

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

  const openModal = (clip?: Clip, position?: number) => {
    if (clip) {
      setEditingClip(clip);
      setFormData({ title: clip.title, content: clip.content });
      setInsertPosition(null);
    } else {
      setEditingClip(null);
      setFormData({ title: '', content: '' });
      setInsertPosition(position ?? null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClip(null);
    setFormData({ title: '', content: '' });
    setInsertPosition(null);
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
        
        if (insertPosition !== null) {
          // Insert at specific position
          const newClips = [...clips];
          newClips.splice(insertPosition, 0, newClip);
          setClips(newClips);
        } else {
          // Add to end
          setClips([...clips, newClip]);
        }
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
    ? 'bg-slate-900 text-slate-100'
    : 'bg-stone-100 text-stone-900';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-roboto ${themeClasses}`}>
        <div className="text-center">
          <div className={`inline-flex p-4 rounded-full mb-4 ${
            isDarkMode ? 'bg-slate-800' : 'bg-white border border-stone-300'
          }`}>
            <Clipboard className={`h-12 w-12 animate-pulse ${
              isDarkMode ? 'text-slate-600' : 'text-stone-400'
            }`} />
          </div>
          <p className={`text-lg ${
            isDarkMode ? 'text-slate-400' : 'text-stone-600'
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
          ? 'bg-slate-900/90 border-slate-700' 
          : 'bg-stone-100/90 border-stone-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-blue-600' : 'bg-emerald-700'
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
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
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
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {clips.length === 0 ? (
          <div className="text-center py-16">
            <div className={`inline-flex p-4 rounded-full mb-4 ${
              isDarkMode ? 'bg-slate-800' : 'bg-white border border-stone-300'
            }`}>
              <Clipboard className={`h-12 w-12 ${
                isDarkMode ? 'text-slate-600' : 'text-stone-400'
              }`} />
            </div>
            <h2 className={`text-2xl font-semibold mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-stone-700'
            }`}>
              Setting up your clips...
            </h2>
            <p className={`text-lg mb-6 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-600'
            }`}>
              Creating default clips for you to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clips.map((clip, index) => (
              <div key={clip._id} className="flex items-center space-x-3">
                {/* Clip Card */}
                <div
                  className={`group relative flex-1 h-16 rounded-lg border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer flex items-center ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                      : 'bg-white border-stone-300 hover:shadow-stone-200 hover:border-emerald-300'
                  } ${copiedId === clip._id ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => copyToClipboard(clip.content, clip._id)}
                >
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(clip);
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        isDarkMode
                          ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                          : 'hover:bg-stone-200 text-stone-500 hover:text-stone-700'
                      }`}
                      title="Edit clip"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteClip(clip._id);
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        isDarkMode
                          ? 'hover:bg-red-900 text-slate-400 hover:text-red-400'
                          : 'hover:bg-red-100 text-stone-500 hover:text-red-600'
                      }`}
                      title="Delete clip"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Clip title */}
                  <div className="pr-16 flex-1">
                    <h3 className={`font-semibold text-base truncate ${
                      isDarkMode ? 'text-slate-200' : 'text-stone-800'
                    }`}>
                      {clip.title}
                    </h3>
                  </div>

                  {/* Copy feedback overlay */}
                  {copiedId === clip._id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-white">
                        <Copy className="h-4 w-4" />
                        <span className="font-medium text-sm">Copied!</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Small circular add button next to clip */}
                <button
                  onClick={() => openModal(undefined, index + 1)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 border-dashed transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                    isDarkMode
                      ? 'border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400'
                      : 'border-stone-400 hover:border-emerald-600 hover:bg-emerald-50 text-stone-500 hover:text-emerald-600'
                  }`}
                  title="Insert clip here"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Final add button - spans full width */}
            <div className="col-span-full flex justify-center pt-4">
              <button
                onClick={() => openModal()}
                className={`h-16 w-full max-w-md rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                  isDarkMode
                    ? 'border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400'
                    : 'border-stone-400 hover:border-emerald-600 hover:bg-emerald-50 text-stone-500 hover:text-emerald-600'
                }`}
                title="Add new clip"
              >
                <Plus className="h-6 w-6 mr-2" />
                <span className="font-medium">Add New Clip</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Count Tracker */}
      <CountTracker isDarkMode={isDarkMode} />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800' : 'bg-white border border-stone-300'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-stone-200'
            }`}>
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-stone-900'
              }`}>
                {editingClip ? 'Edit Clip' : insertPosition !== null ? `Insert Clip at Position ${insertPosition + 1}` : 'Add New Clip'}
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
                  isDarkMode ? 'text-slate-300' : 'text-stone-700'
                }`}>
                  Cover Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-roboto ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500'
                      : 'bg-white border-stone-300 text-stone-900 focus:ring-emerald-500'
                  }`}
                  placeholder="Enter a title for this clip"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-stone-700'
                }`}>
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none font-roboto ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500'
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
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
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