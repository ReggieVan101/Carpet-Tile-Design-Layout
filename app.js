// app.js

// UI element references
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
      btnClose    = document.getElementById('closeModal');

let selectedTile = null,
    activeCell   = null,
    usage        = Array(11).fill(0),
    totalUsed    = 0,
    isDragging   = false;

/** Build the top tile selector + “Tiles Used” counter */
function buildTileSelector() {
  const files = [
    'Tile01_CottonCandy.jpg','Tile02_AvacadoToastMesh.jpg','Tile03_EWalk.jpg',
    'Tile04_FirstBlush.jpg','Tile05_ForestFloor.jpg','Tile06_Hampton.jpg',
    'Tile07_ShiftingSands.jpg','Tile08_PlumbPudding.jpg','Tile09_Luxury02.jpg',
    'Tile10_Luxury.jpg','ClearTile_X.png'
  ];
  const names = [
    'Cotton Candy','Avacado Toast Mesh','E Walk','First Blush','Forest Floor',
    'Hampton','Shifting Sands','Plumb Pudding','Luxury 02','Luxury','Clear'
  ];

  tilesel.innerHTML = '';
  files.forEach((fn, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'tileWrapper';

    const d = document.createElement('div');
    d.className = 'tile';
    d.style.backgroundImage = `url(images/${fn})`;
    d.dataset.tileIndex = i;

    if (i < 10) {
      const c = document.createElement('div');
      c.className = 'counter';
      c.textContent = '0';
      d.appendChild(c);
    }

    wrap.appendChild(d);

    const lbl = document.createElement('div');
    lbl.className = 'tile-label';
    lbl.textContent = names[i];
    wrap.appendChild(lbl);

    d.addEventListener('click', () => {
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
      d.classList.add('selected');
      selectedTile = d;
    });

    tilesel.appendChild(wrap);
  });

  // Add “Tiles Used” box
  const wrapTotal = document.createElement('div');
  wrapTotal.className = 'tileWrapper';
  const totalD = document.createElement('div');
  totalD.className = 'tile total-display';
  totalD.innerHTML = `
    <div class="label">Tiles Used</div>
    <div class="value" id="totalCount">0</div>
  `;
  wrapTotal.appendChild(totalD);
  tilesel.appendChild(wrapTotal);
}

/** Build the 2D grid and attach paint/drag events */
function buildGrid() {
  const cols = +colsIn.value, rows = +rowsIn.value;
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  grid.style.gridTemplateRows    = `repeat(${rows},1fr)`;

  const ctrlH  = document.getElementById('controls').offsetHeight,
        cellSz = Math.floor(ctrlH / rows);
  grid.style.width  = `${cellSz * cols}px`;
  grid.style.height = `${ctrlH}px`;

  for (let i = 0; i < cols * rows; i++) {
    const cell = document.createElement('div');
    cell.className        = 'cell';
    cell.dataset.tileIndex = '-1';
    cell.dataset.rotation  = '0';

    cell.addEventListener('click', () => applyTile(cell));
    cell.addEventListener('mousedown', e => {
      e.preventDefault();
      isDragging = true;
      applyTile(cell);
    });
    cell.addEventListener('mouseover', () => {
      if (isDragging) applyTile(cell);
    });

    grid.appendChild(cell);
  }
  document.addEventListener('mouseup', () => isDragging = false);

  // Always rebuild the 3D scene (and its canvas)
  update3D();
}

/** Paint or clear a cell, update counters, then rebuild 3D */
function applyTile(cell) {
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('active'));
  cell.classList.add('active');
  activeCell = cell;
  if (!selectedTile) return;

  const si = +selectedTile.dataset.tileIndex,
        pi = +cell.dataset.tileIndex;
  if (pi >= 0 && pi < 10) { usage[pi]--; totalUsed--; }

  cell.classList.remove('filled','half-left','half-right');
  delete cell.dataset.split;

  if (si !== 10) {
    cell.style.backgroundImage = selectedTile.style.backgroundImage;
    cell.classList.add('filled');
    cell.dataset.tileIndex = si;
    usage[si]++; totalUsed++;
  } else {
    cell.style.backgroundImage = '';
    cell.dataset.tileIndex = '-1';
  }

  // Update 2D counters
  document.querySelectorAll('.counter').forEach((c,i) => {
    c.textContent = usage[i] || '';
  });
  document.getElementById('totalCount').textContent = totalUsed;

  // Rebuild the 3D layout
  update3D();
}

/** Gather the grid state and invoke the 3D updater */
function update3D() {
  if (typeof update3DLayout !== 'function') return;
  const cols   = +colsIn.value,
        rows   = +rowsIn.value,
        layout = Array.from(grid.children).map(c => ({
          tileIndex: +c.dataset.tileIndex,
          rotation:  +c.dataset.rotation,
          split:      c.dataset.split
        }));
  update3DLayout(layout, cols, rows);
}

// Hook up control buttons
btnBuild.addEventListener('click', buildGrid);

btnRot.addEventListener('click', () => {
  // Only rotate if there’s an active, filled cell
  if (!activeCell || !activeCell.classList.contains('filled')) return;

  // 1) Update rotation value & CSS transform
  let r = +activeCell.dataset.rotation;
  r = (r + 90) % 360;
  activeCell.dataset.rotation = r;
  activeCell.style.transform   = `rotate(${r}deg)`;

  // 2) Rebuild the 3D layout (preserves split flag)
  update3D();

  // 3) Pivot camera to this cell
  if (window.set3DPivot) {
    const cols = +colsIn.value, rows = +rowsIn.value;
    const idx  = Array.from(grid.children).indexOf(activeCell),
          col = idx % cols, row = Math.floor(idx / cols),
          x   = col - (cols / 2 - 0.5),
          z   = -(row - (rows / 2 - 0.5));
    set3DPivot(x, z);
  }
});

btnSplit.addEventListener('click', () => {
  // 1) Must have an active, filled cell
  if (!activeCell || !activeCell.classList.contains('filled')) return;

  // 2) Remove any old split, then apply left-half
  activeCell.classList.remove('half-left','half-right');
  activeCell.classList.add('half-left');
  activeCell.dataset.split = 'left';

  // 3) Rebuild 3D (2D CSS already updated)
  update3D();

  // 4) Pivot camera to this cell
  if (window.set3DPivot) {
    const cols = +colsIn.value, rows = +rowsIn.value;
    const idx  = Array.from(grid.children).indexOf(activeCell),
          col = idx % cols, row = Math.floor(idx / cols),
          x   = col - (cols / 2 - 0.5),
          z   = -(row - (rows / 2 - 0.5));
    set3DPivot(x, z);
  }
});

btnSave.addEventListener('click', () => {
  html2canvas(document.getElementById('mainArea'), { useCORS: true })
    .then(canvas => {
      imgPrev.src         = canvas.toDataURL('image/jpeg');
      modal.style.display = 'flex';
    });
});

btnDownload.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href     = imgPrev.src;
  link.download = 'tile_layout.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  modal.style.display = 'none';
});

btnClose.addEventListener('click', () => {
  modal.style.display = 'none';
});

btnClear.addEventListener('click', () => {
  document.querySelectorAll('.cell').forEach(c => {
    c.style.backgroundImage = '';
    c.classList.remove('filled','half-left','half-right','active');
    c.dataset.tileIndex = '-1';
    c.dataset.rotation  = '0';
    delete c.dataset.split;
  });
  usage.fill(0);
  totalUsed = 0;
  document.getElementById('totalCount').textContent = '0';
  document.querySelectorAll('.counter').forEach(c => c.textContent = '0');
  buildGrid();
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof init3DViewer === 'function') init3DViewer();
  buildTileSelector();
  buildGrid();
});










  
  
  
  

  












  




