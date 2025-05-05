// app.js
document.addEventListener('DOMContentLoaded', () => {
  const grid        = document.getElementById('grid'),
        tilesel     = document.getElementById('tileSelectorGrid'),
        colsIn      = document.getElementById('columns'),
        rowsIn      = document.getElementById('rows'),
        btnBuild    = document.getElementById('buildGrid'),
        btnRot      = document.getElementById('rotateTile'),
        btnSplit    = document.getElementById('splitTile'),
        btnSave     = document.getElementById('exportImage'),
        btnClear    = document.getElementById('clearGrid'),
        modal       = document.getElementById('imageModal'),
        imgPrev     = document.getElementById('imagePreview'),
        btnDownload = document.getElementById('downloadImage'),
        btnClose    = document.getElementById('closeModal'),
        controlsEl  = document.getElementById('controls');

  let selectedTile = null,
      activeCell   = null,
      usage        = Array(11).fill(0),
      totalUsed    = 0,
      isDragging   = false;

  // --- 1) define your preset layout here: row, col, tileIndex, rotation (deg), split?
  const presetPattern = [
    { row: 0, col: 0, tileIndex: 0, rotation:   0 },
    { row: 0, col: 1, tileIndex: 1, rotation:  90 },
    { row: 0, col: 2, tileIndex: 2, rotation: 180 },
    // … add as many as you like
  ];

  function buildTileSelector() {
    // … your existing code unchanged …
  }

  function buildGrid() {
    const cols = parseInt(colsIn.value,10),
          rows = parseInt(rowsIn.value,10);

    // … existing setup & cell creation …

    // after building all cells, apply the preset:
    applyPresetPattern(cols);

    update3D();
  }

  // --- 2) apply your preset pattern to the freshly built grid
  function applyPresetPattern(cols) {
    totalUsed = 0;
    usage.fill(0);
    // clear all cells first
    grid.querySelectorAll('.cell').forEach(c => {
      c.style.backgroundImage = '';
      c.classList.remove('filled','half-left','half-right','active');
      c.dataset.tileIndex = '-1';
      c.dataset.rotation  = '0';
      delete c.dataset.split;
    });
    // now apply each entry
    presetPattern.forEach(({row, col, tileIndex, rotation, split}) => {
      const idx  = row * cols + col;
      const cell = grid.children[idx];
      if (!cell) return;  // in case out of bounds

      // mark active (optional)
      cell.classList.add('active');
      activeCell = cell;

      // set background
      const tileEl = tilesel.querySelector(`.tile[data-tile-index="${tileIndex}"]`);
      const bg = tileEl && tileEl.style.backgroundImage;
      if (bg) {
        cell.style.backgroundImage = bg;
        cell.style.backgroundSize  = 'cover';
        cell.style.backgroundPosition = 'center';
        cell.classList.add('filled');
      }

      // record data
      cell.dataset.tileIndex = tileIndex;
      cell.dataset.rotation  = rotation || 0;
      cell.style.transform   = `rotate(${rotation||0}deg)`;
      if (split === 'left' || split === 'right') {
        cell.classList.add(`half-${split}`);
        cell.dataset.split = split;
      }

      // update usage counters
      if (tileIndex >= 0 && tileIndex < 10) {
        usage[tileIndex]++;
        totalUsed++;
      }
    });
    // reflect counters in UI
    usage.forEach((count,i) => {
      const c = tilesel.querySelector(`.tile[data-tile-index="${i}"] .counter`);
      if (c) c.textContent = count;
    });
    document.getElementById('totalCount').textContent = totalUsed;
  }

  // … rest of your event listeners (click, drag, rotate, split, save, clear) …

  // initialize everything
  buildTileSelector();
  buildGrid();             // this will call applyPresetPattern
  if (typeof init3DViewer==='function') init3DViewer();
});







  
  
  
  

  












  




