// frontend/src/pages/Categories.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/categories')
      .then(res => {
        setCategories(res.data.categories || res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load categories", err);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (categoryName) => {
    // Navigates to Home page with category query param
    navigate(`/?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Explore Topics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Browse articles organized by specialized technology fields.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse font-medium">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="text-2xl mb-2 block">📁</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {cat.post_count || 0} {parseInt(cat.post_count, 10) === 1 ? 'article' : 'articles'}
                </p>
              </div>
              <div className="mt-6 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                Browse Articles →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}