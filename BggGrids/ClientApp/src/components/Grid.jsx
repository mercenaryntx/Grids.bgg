import { forwardRef, useRef, useEffect } from 'react';
import GridCell from './GridCell';

const Grid = forwardRef(function Grid(
  { title, onTitleChange, cells, onCellClick, onLabelChange, onRemoveGame },
  ref
) {
  const titleRef = useRef(null);

  useEffect(() => {
    if (!titleRef.current) return;
    if (titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  }, [title]);

  return (
    <div className="grid-container" ref={ref}>
      <div className="grid-title-wrap">
        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          className="grid-title"
          onInput={(e) => onTitleChange(e.currentTarget.textContent)}
        />
      </div>

      <div className="grid-cells">
        {cells.map((cell) => (
          <GridCell
            key={cell.id}
            cell={cell}
            onClick={() => onCellClick(cell.id)}
            onLabelChange={(label) => onLabelChange(cell.id, label)}
            onRemove={() => onRemoveGame(cell.id)}
          />
        ))}
      </div>

      <p className="grid-footer">
        grids.bgg · data from{' '}
        <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer">
          BoardGameGeek
        </a>
      </p>
    </div>
  );
});

export default Grid;
