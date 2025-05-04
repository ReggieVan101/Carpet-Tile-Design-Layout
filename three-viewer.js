(function(){
  let scene, camera, renderer, controls, tileGroup;
  let tileTextures = [];

  window.init3DViewer = function() {
    const container = document.getElementById('threeContainer');

    // Setup scene & camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const fov    = 45;
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    camera.position.set(0, 8, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan     = false;
    controls.zoomSpeed     = 1.2;
    controls.update();

    // Light
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemi);

    // Group for tiles
    tileGroup = new THREE.Group();
    scene.add(tileGroup);

    // Load textures
    const loader = new THREE.TextureLoader();
    const files = [
      'Tile01_CottonCandy.jpg','Tile02_AvacadoToastMesh.jpg',
      'Tile03_EWalk.jpg','Tile04_FirstBlush.jpg','Tile05_ForestFloor.jpg',
      'Tile06_Hampton.jpg','Tile07_ShiftingSands.jpg','Tile08_PlumbPudding.jpg',
      'Tile09_Luxury02.jpg','Tile10_Luxury.jpg'
    ];
    files.forEach(fn => {
      const tx = loader.load(`images/${fn}`);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tileTextures.push(tx);
    });

    // Double-click to recenter
    container.addEventListener('dblclick', () => {
      const box = new THREE.Box3().setFromObject(tileGroup);
      if (!box.isEmpty()) {
        const c = box.getCenter(new THREE.Vector3());
        controls.target.copy(c);
        controls.update();
      }
    });

    animate();
  };

  window.update3DLayout = function(gridData, columns, rows) {
    if (!tileTextures.length) return;

    tileGroup.clear();

    const size  = 1;
    const halfW = (columns - 1) / 2;
    const halfH = (rows - 1) / 2;

    gridData.forEach((cell, i) => {
      const ti = cell.tileIndex;
      if (ti < 0 || ti >= tileTextures.length) return;

      const x = i % columns;
      const y = Math.floor(i / columns);
      const baseX = x - halfW;
      const baseZ = y - halfH;
      const rotDeg = cell.rotation || 0;
      const rotRad = rotDeg * Math.PI / 180;
      const mat    = new THREE.MeshStandardMaterial({ map: tileTextures[ti] });

      if (!cell.split) {
        // Full tile
        const geom = new THREE.BoxGeometry(size, 0.05, size);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(baseX, 0, baseZ);
        mesh.rotation.y = rotRad;
        tileGroup.add(mesh);

      } else {
        // Half-tile
        const geom = new THREE.BoxGeometry(size / 2, 0.05, size);
        const mesh = new THREE.Mesh(geom, mat);

        // Local offset ±size/4 on X axis
        const localOffset = (cell.split === 'left') ? -size/4 : size/4;
        // Rotate that offset into world X/Z:
        const worldOffsetX = localOffset * Math.cos(rotRad);
        const worldOffsetZ = localOffset * Math.sin(rotRad);

        mesh.position.set(baseX + worldOffsetX, 0, baseZ + worldOffsetZ);
        mesh.rotation.y = rotRad;
        tileGroup.add(mesh);
      }
    });

    // Recenter on placed geometry
    const box = new THREE.Box3().setFromObject(tileGroup);
    if (!box.isEmpty()) {
      const c = box.getCenter(new THREE.Vector3());
      controls.target.copy(c);
      controls.update();
    }
  };

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
})();









