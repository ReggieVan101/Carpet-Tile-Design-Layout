// three-viewer.js

// Core variables
let scene, camera, renderer, controls, tileGroup;
let tileTextures = [];
let pivot = new THREE.Vector3(0, 0, 0);

// Auto–initialize the 3D viewer when this script loads
init3DViewer();

function init3DViewer() {
  // 1) Scene & background
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // 2) Camera
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(5, 10, 15);

  // 3) Hemisphere light
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(hemi);

  

  // 4) Group for tile meshes
  tileGroup = new THREE.Group();
  scene.add(tileGroup);

  // 5) Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 1);
  updateRendererSize();

  // 6) Attach canvas to DOM
  const container = document.getElementById('threeContainer');
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // 7) OrbitControls (rotate, pan, zoom)
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableRotate = true;
  controls.enablePan    = true;
  controls.enableZoom   = true;
  controls.panSpeed     = 1.0;
  controls.mouseButtons = {
    LEFT:   THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN
  };

  // Start looking at the pivot
  controls.target.copy(pivot);
  controls.update();

  // Snap back to pivot after any drag ends
  controls.addEventListener('end', () => {
    controls.target.copy(pivot);
    controls.update();
  });

  // 8) Handle window resize
  window.addEventListener('resize', onWindowResize);

  // 9) Start render loop
  animate();

  // 10) Preload tile textures
  const tileFiles = [
    'Tile01_CottonCandy.jpg',
    'Tile02_AvacadoToastMesh.jpg',
    'Tile03_EWalk.jpg',
    'Tile04_FirstBlush.jpg',
    'Tile05_ForestFloor.jpg',
    'Tile06_Hampton.jpg',
    'Tile07_ShiftingSands.jpg',
    'Tile08_PlumbPudding.jpg',
    'Tile09_Luxury02.jpg',
    'Tile10_Luxury.jpg'
  ];
  const loader = new THREE.TextureLoader();
  tileTextures = tileFiles.map(fn => loader.load(`images/${fn}`));
}

// Resize renderer & update camera aspect
function updateRendererSize() {
  const c = document.getElementById('threeContainer');
  const w = c.clientWidth, h = c.clientHeight;
  renderer.setSize(w, h, true);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function onWindowResize() {
  updateRendererSize();
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

/**
 * Rebuilds the 3D layout from your 2D grid state.
 * @param {Array<{tileIndex:number,rotation:number,split:string}>} layout
 * @param {number} cols
 * @param {number} rows
 */
function update3DLayout(layout, cols, rows) {
  // Clear existing meshes
  while (tileGroup.children.length) {
    tileGroup.remove(tileGroup.children[0]);
  }

  const tileSize = 1;
  const halfX = (cols * tileSize) / 2 - tileSize / 2;
  const halfY = (rows * tileSize) / 2 - tileSize / 2;

  layout.forEach((cell, idx) => {
    const { tileIndex, rotation, split } = cell;
    if (tileIndex < 0 || tileIndex >= tileTextures.length) return;

    // Base geometry
    const geom = new THREE.BoxGeometry(tileSize, 0.1, tileSize);

    // Handle half-tile if split
    if (split === 'left' || split === 'right') {
      const sx = split === 'left'  ? 0.5 : 1;
      const sz = split === 'right' ? 0.5 : 1;
      geom.scale(sx, 1, sz);
    }

    const mat  = new THREE.MeshStandardMaterial({ map: tileTextures[tileIndex] });
    const mesh = new THREE.Mesh(geom, mat);

    // Compute position
    const row = Math.floor(idx / cols),
          col = idx % cols;
    mesh.position.x = col * tileSize - halfX;
    mesh.position.z = -(row * tileSize - halfY);
    mesh.rotation.y = THREE.MathUtils.degToRad(rotation);

    tileGroup.add(mesh);
  });
}

// Expose global pivot setter for app.js to call
window.set3DPivot     = (x, z) => {
  pivot.set(x, 0, z);
  controls.target.copy(pivot);
  controls.update();
};

// Expose the core functions
window.init3DViewer   = init3DViewer;
window.update3DLayout = update3DLayout;














