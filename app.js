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
        workspace   = document.getElementById('workspace'),
        controlsEl  = document.getElementById('controls'),
        threeEl     = document.getElementById('threeContainer');

  let selectedTile = null,
      activeCell   = null,
      usage        = Array(11).fill(0),
      totalUsed    = 0,
      isDragging   = false;

  function buildTileSelector() {
    const files = [
      'Tile01_CottonCandy.jpg','Tile02_AvacadoToastMesh.jpg',
      'Tile03_EWalk.jpg','Tile04_FirstBlush.jpg','Tile05_ForestFloor.jpg',
      'Tile06_Hampton.jpg','Tile07_ShiftingSands.jpg','Tile08_PlumbPudding.jpg',
      'Tile09_Luxury02.jpg','Tile10_Luxury.jpg','ClearTile_X.png'
    ];
    const names = [
      'Cotton Candy','Avacado Toast Mesh','E Walk','First Blush',
      'Forest Floor','Hampton','Shifting Sands','Plumb Pudding',
      'Luxury 02','Luxury','Clear'
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
        document.querySelectorAll('.tile')
                .forEach(t => t.classList.remove('selected'));
        d.classList.add('selected');
        selectedTile = d;
      });

      tilesel.appendChild(wrap);
    });

    // Tiles Used
    const wrap = document.createElement('div');
    wrap.className = 'tileWrapper';
    const totalD = document.createElement('div');
    totalD.className = 'tile total-display';
    totalD.innerHTML = `
      <div class="label">Tiles Used</div>
      <div class="value" id="totalCount">0</div>`;
    wrap.appendChild(totalD);
    tilesel.appendChild(wrap);
  }

  function applyTile(cell, e) {
    // always make this the active cell
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('active'));
    cell.classList.add('active');
    activeCell = cell;

    if (!selectedTile) return;
    const si = +selectedTile.dataset.tileIndex,
          pi = +cell.dataset.tileIndex;

    if (pi >= 0 && pi < 10) {
      usage[pi]--; updateCounter(pi);
      totalUsed--;
    }

    cell.classList.remove('filled','half-left','half-right');
    delete cell.dataset.split;

    if (si !== 10) {
      cell.style.backgroundImage    = selectedTile.style.backgroundImage;
      cell.style.backgroundSize     = 'cover';
      cell.style.backgroundPosition = 'center';
      cell.classList.add('filled');
      cell.dataset.tileIndex = si;
      usage[si]++; updateCounter(si);
      totalUsed++;
    } else {
      cell.style.backgroundImage = '';
      cell.dataset.tileIndex = '-1';
    }

    document.getElementById('totalCount').textContent = totalUsed;
    update3D();
  }

  function buildGrid() {
    const cols = parseInt(colsIn.value,10),
          rows = parseInt(rowsIn.value,10);

    grid.innerHTML = '';
    usage.fill(0);
    totalUsed = 0;
    document.getElementById('totalCount').textContent = '0';
    document.querySelectorAll('.counter').forEach(c=>c.textContent='0');

    grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    grid.style.gridTemplateRows    = `repeat(${rows},1fr)`;

    const gridH    = controlsEl.offsetHeight;
    const cellSize = Math.floor(gridH / rows);
    grid.style.height = `${gridH}px`;
    grid.style.width  = `${cellSize * cols}px`;

    for (let i = 0; i < cols * rows; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.rotation  = '0';
      cell.dataset.tileIndex = '-1';

      // click
      cell.addEventListener('click', e => applyTile(cell, e));

      // drag
      cell.addEventListener('mousedown', e => {
        e.preventDefault();
        isDragging = true;
        applyTile(cell, e);
      });
      cell.addEventListener('mouseover', e => {
        if (isDragging) applyTile(cell, e);
      });

      grid.appendChild(cell);
    }

    // stop drag on mouseup anywhere
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    update3D();
  }

  function updateCounter(i) {
    document.querySelectorAll('.tile')[i]
            .querySelector('.counter').textContent = usage[i];
  }

  function update3D() {
    const cols = parseInt(colsIn.value,10),
          rows = parseInt(rowsIn.value,10),
          layout = Array.from(
            document.querySelectorAll('.cell'),
            c => ({
              tileIndex: +c.dataset.tileIndex,
              rotation : +c.dataset.rotation,
              split    : c.dataset.split
            })
          );
    if (typeof update3DLayout === 'function')
      update3DLayout(layout, cols, rows);
  }

  // Control bindings
  btnBuild.addEventListener('click', buildGrid);

  btnRot.addEventListener('click', () => {
    if (!activeCell) return;
    let r = +activeCell.dataset.rotation;
    r = (r + 90) % 360;
    activeCell.dataset.rotation = r;
    activeCell.style.transform   = `rotate(${r}deg)`;
    update3D();
  });

  btnSplit.addEventListener('click', () => {
    if (!activeCell || !activeCell.classList.contains('filled')) return;
    activeCell.classList.remove('half-left','half-right');
    activeCell.classList.add('half-left');
    activeCell.dataset.split = 'left';
    update3D();
  });

  btnSave.addEventListener('click', () => {
    html2canvas(document.getElementById('mainArea'), { useCORS: true })
      .then(canvas => {
        imgPrev.src = canvas.toDataURL('image/jpeg');
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

  btnClose.addEventListener('click', () => modal.style.display = 'none');

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
    document.querySelectorAll('.counter').forEach(c => c.textContent='0');
    update3D();
  });

  // Initialize
  buildTileSelector();
  buildGrid();
  if (typeof init3DViewer === 'function') init3DViewer();
});







  
  
  
  

  












  




