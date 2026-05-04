import { useState, useEffect, useRef } from 'react';
import { searchGames, loadCollection } from '../utils/bggApi';

const TABS = ['Search', 'Collection'];

export default function SearchModal({ cellId, onSelect, onClose }) {
  const [tab, setTab] = useState('Search');
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Focus search input when modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, [tab]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced name search
  useEffect(() => {
    if (tab !== 'Search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setError(null); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const games = await searchGames(query);
        setResults(games);
        if (games.length === 0) setError('No games found.');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 450);
  }, [query, tab]);

  const handleLoadCollection = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const games = await loadCollection(username.trim());
      setResults(games);
      if (games.length === 0) setError('No games found in this collection.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Close when clicking the dark overlay (not the modal card itself)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Select a board game">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Select a Board Game</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`modal-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setResults([]); setError(null); }}
            >
              {t === 'Search' ? '🔍 Search' : '📚 Collection'}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="modal-input-row">
          {tab === 'Search' ? (
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              placeholder="Type a game name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          ) : (
            <form className="modal-collection-form" onSubmit={handleLoadCollection}>
              <input
                ref={inputRef}
                type="text"
                className="modal-input"
                placeholder="BGG username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button type="submit" className="btn btn-load" disabled={loading}>
                Load
              </button>
            </form>
          )}
        </div>

        {/* Status */}
        {loading && <p className="modal-status">Searching…</p>}
        {!loading && error && <p className="modal-status modal-error">{error}</p>}
        {!loading && !error && results.length === 0 && tab === 'Search' && query.trim() === '' && (
          <p className="modal-status modal-hint">Start typing to search BoardGameGeek</p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="modal-results">
            {results.map((game) => (
              <button
                key={game.id}
                className="modal-result"
                onClick={() => { onSelect(game); onClose(); }}
                title={`${game.name}${game.year ? ` (${game.year})` : ''}`}
              >
                {game.thumbnail ? (
                  <img src={game.thumbnail} alt="" className="modal-result-thumb" />
                ) : (
                  <div className="modal-result-thumb modal-result-thumb-empty">🎲</div>
                )}
                <p className="modal-result-name">{game.name}</p>
                {game.year && <p className="modal-result-year">{game.year}</p>}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="modal-attribution">
          Data provided by{' '}
          <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer">
            BoardGameGeek
          </a>
        </p>
      </div>
    </div>
  );
}
