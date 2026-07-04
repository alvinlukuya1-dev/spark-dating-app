import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';

const Search = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setResults(await res.json());
      } catch {} finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, token]);

  return (
    <div className="page">
      <div className="search-page">
        <div className="page-header"><h1>Search</h1></div>
        <div className="search-bar">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search users..."
            autoFocus
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>}
        </div>
        {loading && <div className="loading"><div className="spinner"></div></div>}
        <div className="search-results">
          {!loading && query && results.length === 0 && <div className="empty-state"><span>🔍</span><p>No users found</p></div>}
          {results.map(u => (
            <div key={u._id} className="search-result" onClick={() => navigate(`/profile/${u._id}`)}>
              <img src={u.photos?.[0] || 'https://via.placeholder.com/40x40?text=User'} alt="" className="search-result-avatar" />
              <div className="search-result-info">
                <strong>{u.name}</strong>
                <span>@{u.username}</span>
              </div>
              {u.bio && <p className="search-result-bio">{u.bio}</p>}
            </div>
          ))}
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Search;
