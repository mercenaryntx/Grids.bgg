import { useRef, useEffect } from 'react';

export default function GridCell({ cell, onClick, onLabelChange, onRemove }) {
  const labelRef = useRef(null);

  useEffect(() => {
    if (!labelRef.current) return;
    if (labelRef.current.textContent !== cell.label) {
      labelRef.current.textContent = cell.label;
    }
  }, [cell.label]);

  const handleBodyClick = () => onClick();

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove();
  };

  const handleLabelClick = (e) => {
    e.stopPropagation();
    labelRef.current?.focus();
  };

  const handleLabelBlur = (e) =>
    onLabelChange(e.currentTarget.textContent.trim());

  return (
    <div className="grid-cell">
      {/* thumbnail / empty area */}
      <div className="grid-cell-body" onClick={handleBodyClick}>
        {cell.game ? (
          <div className="grid-cell-game">
            <img
              src={cell.game.thumbnail}
              alt={cell.game.name}
              className="grid-cell-thumb"
              crossOrigin="anonymous"
            />
            <button
              className="grid-cell-remove"
              onClick={handleRemove}
              title="Remove game"
              aria-label="Remove game"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="grid-cell-empty">
            <span>Click to Add</span>
          </div>
        )}
      </div>

      {/* editable label */}
      <div className="grid-cell-label" onClick={handleLabelClick}>
        <div
          ref={labelRef}
          contentEditable
          suppressContentEditableWarning
          className="grid-cell-label-input"
          onInput={(e) => onLabelChange(e.currentTarget.textContent)}
          onBlur={handleLabelBlur}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
