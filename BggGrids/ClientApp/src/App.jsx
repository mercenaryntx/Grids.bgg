import { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import html2canvas from 'html2canvas';
import defaults from './defaults.json';
import SearchModal from './components/SearchModal';
import Grid from './components/Grid';

const defaultCells = () => defaults.cells.map((c) => ({ ...c, game: null }));

export default function App() {
  const [title, setTitle, removeTitle] = useLocalStorage('bgg-grid-title', defaults.title);
  const [cells, setCells, removeCells] = useLocalStorage('bgg-grid-cells', defaultCells());
  const [modalCellId, setModalCellId] = useState(null); // null = closed
  const [downloading, setDownloading] = useState(false);
  const gridRef = useRef(null);

  /** Click on a cell thumbnail area → open the search modal for that cell */
  const handleCellClick = useCallback((cellId) => {
    setModalCellId(cellId);
  }, []);

  /** User picked a game inside the modal */
  const handleGameSelect = useCallback((game) => {
    if (modalCellId === null) return;
    setCells((prev) =>
      prev.map((c) => (c.id === modalCellId ? { ...c, game } : c))
    );
  }, [modalCellId]);

  const handleLabelChange = useCallback((cellId, label) => {
    setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, label } : c)));
  }, []);

  const handleRemoveGame = useCallback((cellId) => {
    setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, game: null } : c)));
  }, []);

  const handleReset = () => {
    if (window.confirm('Reset grid to defaults? All placed games will be removed.')) {
      removeTitle();
      removeCells();
    }
  };

  const handleDownload = async () => {
    if (!gridRef.current || downloading) return;
    setDownloading(true);
    try {
      // Give React a tick to re-render without the modal
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: '#1a1b1e',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const link = document.createElement('a');
      const safeName = title.replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'bgg-grid';
      link.download = `${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed', e);
      alert('PNG export failed. Check the browser console for details.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="logo-icon">🎲</span>
            <span className="logo-text">grids.bgg</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={handleReset} title="Reset grid">
              ↺ Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Exporting…' : '⬇ Download PNG'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="grid-area">
          <Grid
            ref={gridRef}
            title={title}
            onTitleChange={setTitle}
            cells={cells}
            onCellClick={handleCellClick}
            onLabelChange={handleLabelChange}
            onRemoveGame={handleRemoveGame}
          />
        </div>
      </main>

      {modalCellId !== null && (
        <SearchModal
          cellId={modalCellId}
          onSelect={handleGameSelect}
          onClose={() => setModalCellId(null)}
        />
      )}
    </div>
  );
}
