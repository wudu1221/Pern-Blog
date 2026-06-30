// frontend/src/pages/PublisherProfile.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';

export default function PublisherProfile() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/users/publisher/${id}`)
      .then(res => setProfileData(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Error pulling profile space.'));
  }, [id]);

  if (error) return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
  if (!profileData) return <div className="p-8 text-center text-gray-500">Loading profile portfolio...</div>;

  const { profile, articles, totalPublished } = profileData;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-sm font-semibold text-blue-600 hover:underline">← Return to Main Feed</Link>
      
      {/* Structural Card Layout Header */}
      <div className="bg-white dark:bg-slate-700 border rounded-2xl p-8 mt-4 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="h-24 w-24 bg-blue-100 text-blue-700 font-black text-3xl flex items-center justify-center rounded-full border shadow-inner shrink-0">
          {profile.full_name.charAt(0)}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900">{profile.full_name}</h1>
          <p className="text-blue-600 font-bold tracking-tight text-sm uppercase">{profile.profession || 'Independent Creator'}</p>
          <p className="text-gray-600 leading-relaxed text-base">{profile.bio || 'This creator hasn’t written a bio overview yet.'}</p>
          
          <div className="pt-4 flex gap-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div>Total Articles: <span className="text-gray-800 font-extrabold">{totalPublished}</span></div>
            <div>Member Since: <span className="text-gray-800 font-extrabold">{new Date(profile.created_at).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      {/* Published Content Loop List */}
     {/* Find your Published Content Loop List and update it like this: */}
<h2 className="text-xl font-bold mt-12 mb-6 text-gray-800">Published Articles</h2>
{articles.length === 0 ? (
  <p className="text-gray-500 bg-white dark:bg-slate-700 border p-6 rounded-xl text-center">No articles published yet by this user.</p>
) : (
  <div className="space-y-4">
    {articles.map(article => (
      <div key={article.id} className="bg-white dark:bg-slate-700 border p-6 rounded-xl shadow-sm hover:shadow-md transition flex justify-between items-center">
        {/* Wrap the title header with a functional Link component */}
        <Link to={`/posts/${article.slug}`} className="block flex-1">
          <h3 className="font-extrabold text-gray-900 text-lg hover:text-blue-600 transition cursor-pointer">
            {article.title}
          </h3>
        </Link>
        <span className="text-xs text-gray-400 font-medium shrink-0 ml-4">
          {new Date(article.created_at).toLocaleDateString()}
        </span>
      </div>
    ))}
  </div>
)}
    </div>
  );
}