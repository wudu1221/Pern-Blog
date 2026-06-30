import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    API.get('/posts')
      .then(res => setPosts(res.data.data))
      .catch(err => console.error("Error fetching public feed", err));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* <header className="flex justify-between items-center mb-12 border-b pb-4">
        <h1 className="text-3xl font-black text-blue-600 tracking-tight">PERN Blog Platform</h1>
        <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Dashboard Login
        </Link>
      </header> */}
      
      <h2 className="text-xl font-bold mb-6 text-gray-700">Latest Articles</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg border text-center">No published articles available yet.</p>
      ) : (
      
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map(post => (
           
            <div key={post.id} className="bg-white dark:bg-slate-800 p-6  rounded-xl border shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                  {post.category_name || 'General'}
                </span>
                {/* Wrap Title with the new PostDetail slug link */}
                <Link to={`/posts/${post.slug}`} className="block group">
                  <h3 className="text-xl font-bold mt-2 text-gray-900 group-hover:text-blue-600 transition duration-150">
                    {post.title}
                  </h3>
                </Link>
              </div>
      
              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-50">
                By {post.author_id ? (
                  <Link to={`/publisher/${post.author_id}`} className="text-blue-500 hover:underline font-semibold">
                    {post.author_name}
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-600">{post.author_name || 'Anonymous Creator'}</span>
                )} • {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
          }
        </div>
      )
    }
    </div>
  );
};

export default Home;