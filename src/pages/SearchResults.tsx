import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

interface Coach {
  id: string;
  name: string;
  profilePicUrl: string;
}
interface Content {
  id: string;
  title: string;
  coachId: string;
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('query') || '';
  const [loading, setLoading] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`/api/search?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then((data: { coaches: Coach[]; contents: Content[] }) => {
        setCoaches(data.coaches);
        setContents(data.contents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  if (!query) return <p className="p-6">Please enter a search term above.</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Search results for “{query}”</h1>
      {loading && <p>Loading…</p>}

      {/* Coaches */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Coaches</h2>
        {coaches.length === 0 ? (
          <p>No coaches found.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4">
            {coaches.map(c => (
              <li key={c.id} className="border rounded p-4 flex items-center space-x-4">
                <img
                  src={c.profilePicUrl || '/placeholder-avatar.png'}
                  alt={c.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <Link to={`/coach/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Content */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Content</h2>
        {contents.length === 0 ? (
          <p>No content matched.</p>
        ) : (
          <ul className="space-y-4">
            {contents.map(ct => (
              <li key={ct.id} className="border rounded p-4">
                <Link
                  to={`/content/${ct.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {ct.title}
                </Link>
                <p className="text-sm text-gray-600">
                  by <Link to={`/coach/${ct.coachId}`} className="hover:underline">Coach {ct.coachId}</Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
