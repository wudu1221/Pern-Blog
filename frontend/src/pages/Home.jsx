// frontend/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryFromUrl = searchParams.get('category');
  
  // Search States
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  
  // Category Filtering State
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Core Categories List for the Pill Filter
  const categories = ['All', 'Web Development', 'Mobile Apps', 'Artificial Intelligence', 'UI/UX Design', 'Database Management', 'Cloud Computing', 'Cybersecurity'];

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    setLoading(true);
    
    // Build query string dynamically based on filters
    let url = `/posts?page=${page}&search=${activeSearch}`;
    if (selectedCategory !== 'All') {
      url += `&category=${selectedCategory}`;
    }

    API.get(url)
      .then(res => {
        const fetchedPosts = res.data.posts || res.data.data || [];
        setPosts(fetchedPosts);
        setTotalPages(res.data.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching public feed", err);
        setLoading(false);
      });
  }, [page, activeSearch, selectedCategory, categoryFromUrl]);

  // Handle Form Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 for fresh search
    setActiveSearch(searchInput);
  };

  // Change Category Handler
  const handleCategoryClick = (category) => {
    setPage(1); // Reset to page 1 so we don't get stuck on an empty page
    setSelectedCategory(category);
  };

  // Feature Extraction: Highlight the single latest post when on page 1 without filters
  const showFeatured = page === 1 && !activeSearch && selectedCategory === 'All' && posts.length > 0;
  const featuredPost = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;

  // Helper to estimate visual reading time
  const getReadingTime = (post) => {
    if (post.content) {
      return `${Math.ceil(post.content.split(' ').length / 200)} min read`;
    }
    return `${Math.ceil((post.title.length * 3) / 60) || 2} min read`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* 🔍 Search & Filtering Banner */}
      <div className="mb-10 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search matching articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-grow px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition text-sm shadow-sm cursor-pointer"
          >
            Find Articles
          </button>
        </form>

        {/* 🏷️ Category Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase mr-2 tracking-wider">Topics:</span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 Main Feed Content */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse font-medium">Loading platform feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            No published articles match your current criteria.
          </p>
        </div>
      ) : (
        <>
          {/* ⭐ Featured Hero Post Block */}
          {featuredPost && (
            <div 
              onClick={() => navigate(`/posts/${featuredPost.slug}`)}
              className="mb-10 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition duration-200"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                    🌟 Featured Article
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">• {getReadingTime(featuredPost)}</span>
                </div>

                {/* 🖼️ Featured Cover Image Banner */}
                <div className="w-full h-64 md:h-80 overflow-hidden rounded-xl mb-6 bg-slate-100 dark:bg-slate-700">
                  <img 
                    src={featuredPost.featured_image_url ? `http://localhost:5000${featuredPost.featured_image_url}` : 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&auto=format&fit=crop'} 
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition duration-300"
                  />
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition duration-150 tracking-tight mt-4">
                  {featuredPost.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm line-clamp-2 max-w-3xl">
                  {featuredPost.summary || "Click inside to read the full context, code architectures, and deep technical details written on this publication framework."}
                </p>
              </div>

              {/* Author & Date section - Click event stopped here */}
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800"
              >
                By {featuredPost.author_id ? (
                  <Link to={`/publisher/${featuredPost.author_id}`} className="text-blue-500 hover:underline font-bold">
                    {featuredPost.author_name}
                  </Link>
                ) : (
                  <span className="font-bold text-gray-600 dark:text-gray-400">{featuredPost.author_name || 'Anonymous Creator'}</span>
                )} • {new Date(featuredPost.created_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* 📰 Normal Feed Secondary Grid */}
          {gridPosts.length > 0 && (
            <>
              {featuredPost && <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">More Stories</h4>}
              <div className="grid md:grid-cols-2 gap-6">
                {gridPosts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => navigate(`/posts/${post.slug}`)}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
                  >
                    
                    {/* 🖼️ Card Cover Image Window */}
                    <div className="w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img 
                        src={post.featured_image_url ? `http://localhost:5000${post.featured_image_url}` : 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop'} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Content padding container wrapper */}
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                            {post.category_name || 'General'}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">{getReadingTime(post)}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold mt-2 text-gray-900 dark:text-white group-hover:text-blue-600 transition duration-150 line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
              
                      {/* Author & Date section - Click event stopped here */}
                      <p 
                        onClick={(e) => e.stopPropagation()} 
                        className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-50 dark:border-slate-700/50"
                      >
                        By {post.author_id ? (
                          <Link to={`/publisher/${post.author_id}`} className="text-blue-500 hover:underline font-semibold">
                            {post.author_name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-gray-600 dark:text-gray-400">{post.author_name || 'Anonymous Creator'}</span>
                        )} • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            </>
          )}

          {/* 📑 Styled Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 pt-6 border-t border-gray-200 dark:border-slate-800">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-1.5 text-xs font-semibold border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Previous
              </button>
              
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-1.5 text-xs font-semibold border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;