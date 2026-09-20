// ======================================
// KARTAVIY CITY — CITY.JS
// ======================================

let scene;
let camera;
let renderer;

let cityGroup;
let natureGroup;
let roadGroup;
let waterGroup;
let decorationGroup;

const CITY_SIZE = 240;
const GRID_SIZE = 10;

const cityObjects = [];
const natureObjects = [];
const roadObjects = [];
const waterObjects = [];

const buildingCosts = {
  house: 5000,
  shop: 8000,
  school: 15000,
  hospital: 25000,
  park: 3000,
  road: 1000,
  bridge: 12000
};

// ======================================
// СОЗДАНИЕ МИРА
// ======================================

function createCity() {
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x9bb9c7);

  // Туман
  scene.fog = new THREE.Fog(0x9bb9c7, 90, 280);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    600
  );

  camera.position.set(90, 90, 90);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const container = document.getElementById("gameContainer");

  if (container) {
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
  } else {
    document.body.appendChild(renderer.domElement);
  }

  cityGroup = new THREE.Group();
  natureGroup = new THREE.Group();
  roadGroup = new THREE.Group();
  waterGroup = new THREE.Group();
  decorationGroup = new THREE.Group();

  scene.add(cityGroup);
  scene.add(natureGroup);
  scene.add(roadGroup);
  scene.add(waterGroup);
  scene.add(decorationGroup);

  createLighting();
  createGround();
  createWater();
  createInitialRoads();
  createForest();
  createRocks();
  createGrassDetails();
  createBoundary();

  window.addEventListener("resize", resizeCity);

  if (typeof bindPlayerControls === "function") {
    bindPlayerControls();
  }

  animateCity();
}

// ======================================
// ОСВЕЩЕНИЕ
// ======================================

function createLighting() {
  const hemisphere = new THREE.HemisphereLight(
    0xddeeff,
    0x405044,
    2
  );

  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);

  sun.position.set(80, 130, 60);
  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;

  scene.add(sun);
}

// ======================================
// ЗЕМЛЯ
// ======================================

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE),
    new THREE.MeshStandardMaterial({
      color: 0x597b4b,
      roughness: 1
    })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;

  ground.userData.type = "ground";

  scene.add(ground);
}

// ======================================
// ВОДА: ОЗЕРО
// ======================================

function createWater() {
  const lakeShape = new THREE.Shape();

  lakeShape.moveTo(-105, -35);
  lakeShape.bezierCurveTo(-95, -65, -55, -72, -25, -58);
  lakeShape.bezierCurveTo(5, -80, 40, -62, 52, -38);
  lakeShape.bezierCurveTo(70, -10, 54, 20, 28, 28);
  lakeShape.bezierCurveTo(0, 45, -28, 32, -45, 42);
  lakeShape.bezierCurveTo(-78, 45, -110, 12, -105, -35);

  const geometry = new THREE.ShapeGeometry(lakeShape);

  const water = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x287da2,
      transparent: true,
      opacity: 0.82,
      roughness: 0.2,
      metalness: 0.1
    })
  );

  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.04;

  water.userData.type = "water";

  waterGroup.add(water);
  waterObjects.push(water);

  // Берег
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(35, 40, 48),
    new THREE.MeshStandardMaterial({
      color: 0xb9a16e,
      roughness: 1
    })
  );

  shore.rotation.x = -Math.PI / 2;
  shore.position.set(-20, 0.01, -15);
  shore.scale.set(2.1, 1.35, 1);

  decorationGroup.add(shore);

  // Река
  createRiver();
}

function createRiver() {
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 250),
    new THREE.MeshStandardMaterial({
      color: 0x3189aa,
      transparent: true,
      opacity: 0.8
    })
  );

  river.rotation.x = -Math.PI / 2;
  river.position.set(105, 0.035, 0);

  waterGroup.add(river);
  waterObjects.push(river);
}

// ======================================
// ПРОВЕРКА ВОДЫ
// ======================================

function isWaterArea(x, z) {
  const lakeDistance =
    Math.pow((x + 20) / 2.1, 2) +
    Math.pow((z + 15) / 1.35, 2);

  if (lakeDistance < 40 * 40) {
    return true;
  }

  if (x > 93 && x < 117) {
    return true;
  }

  return false;
}

// ======================================
// ДОРОГИ
// ======================================

function createInitialRoads() {
  createRoadSegment(0, 0, 0, 220);
  createRoadSegment(0, 0, Math.PI / 2, 220);

  createRoadSegment(-50, 40, 0, 80);
  createRoadSegment(50, -45, Math.PI / 2, 80);
}

function createRoadSegment(
  x,
  z,
  rotation = 0,
  length = 40
) {
  const road = new THREE.Group();

  const asphalt = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.16, length),
    new THREE.MeshStandardMaterial({
      color: 0x30343b,
      roughness: 0.95
    })
  );

  asphalt.position.y = 0.08;
  asphalt.receiveShadow = true;

  road.add(asphalt);

  // Тротуары
  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x999b9b
  });

  const leftSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.22, length),
    sidewalkMaterial
  );

  leftSidewalk.position.set(-5.5, 0.11, 0);
  road.add(leftSidewalk);

  const rightSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.22, length),
    sidewalkMaterial
  );

  rightSidewalk.position.set(5.5, 0.11, 0);
  road.add(rightSidewalk);

  // Разметка
  for (let i = -length / 2 + 5; i < length / 2; i += 10) {
    const marking = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.03, 4),
      new THREE.MeshBasicMaterial({
        color: 0xf4df8a
      })
    );

    marking.position.set(0, 0.18, i);
    road.add(marking);
  }

  road.position.set(x, 0, z);
  road.rotation.y = rotation;

  road.userData.type = "road";
  road.userData.removable = true;

  roadGroup.add(road);
  roadObjects.push(road);
  cityObjects.push(road);

  // Фонари
  for (let i = -length / 2 + 8; i < length / 2; i += 20) {
    createStreetLamp(x, z + i, rotation);
  }

  return road;
}

function createStreetLamp(x, z, rotation = 0) {
  const lamp = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 4, 8),
    new THREE.MeshStandardMaterial({
      color: 0x34383d
    })
  );

  pole.position.y = 2;
  lamp.add(pole);

  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffe9a3,
      emissive: 0xffb52e,
      emissiveIntensity: 1.5
    })
  );

  light.position.y = 4.2;
  lamp.add(light);

  lamp.position.set(
    x + Math.cos(rotation) * 7,
    0,
    z + Math.sin(rotation) * 7
  );

  decorationGroup.add(lamp);
}

// ======================================
// ЛЕС
// ======================================

function createForest() {
  for (let i = 0; i < 115; i++) {
    const x = random(-112, 112);
    const z = random(-112, 112);

    if (Math.abs(x) < 28 && Math.abs(z) < 28) {
      continue;
    }

    if (isWaterArea(x, z)) {
      continue;
    }

    if (Math.abs(x) > 92 || Math.abs(z) > 92) {
      createTree(x, z);
    } else if (Math.random() > 0.45) {
      createTree(x, z);
    }
  }
}

function createTree(x, z) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 3, 8),
    new THREE.MeshStandardMaterial({
      color: 0x65432d
    })
  );

  trunk.position.y = 1.5;
  trunk.castShadow = true;

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 5, 8),
    new THREE.MeshStandardMaterial({
      color: 0x2d6339
    })
  );

  crown.position.y = 5;
  crown.castShadow = true;

  tree.add(trunk);
  tree.add(crown);

  tree.position.set(x, 0, z);

  tree.userData.type = "tree";
  tree.userData.removable = true;

  natureGroup.add(tree);
  natureObjects.push(tree);

  return tree;
}

// ======================================
// КАМНИ
// ======================================

function createRocks() {
  for (let i = 0; i < 55; i++) {
    const x = random(-112, 112);
    const z = random(-112, 112);

    if (isWaterArea(x, z)) {
      continue;
    }

    createRock(x, z);
  }
}

function createRock(x, z) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(
      random(0.5, 1.4),
      0
    ),
    new THREE.MeshStandardMaterial({
      color: 0x777773,
      roughness: 1
    })
  );

  rock.position.set(x, 0.7, z);
  rock.rotation.set(
    random(0, 1),
    random(0, 3),
    random(0, 1)
  );

  rock.castShadow = true;

  rock.userData.type = "rock";
  rock.userData.removable = true;

  natureGroup.add(rock);
  natureObjects.push(rock);

  return rock;
}

// ======================================
// ТРАВА И КУСТЫ
// ======================================

function createGrassDetails() {
  for (let i = 0; i < 90; i++) {
    const x = random(-112, 112);
    const z = random(-112, 112);

    if (isWaterArea(x, z)) {
      continue;
    }

    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(random(0.4, 1), 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0x3b793e
      })
    );

    bush.position.set(x, 0.5, z);
    bush.scale.y = 0.7;

    bush.userData.type = "bush";
    bush.userData.removable = true;

    natureGroup.add(bush);
    natureObjects.push(bush);
  }
}

// ======================================
// ГРАНИЦЫ КАРТЫ
// ======================================

function createBoundary() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x38533b,
    transparent: true,
    opacity: 0.4
  });

  const walls = [
    [0, 0, CITY_SIZE, 1],
    [0, CITY_SIZE / 2, CITY_SIZE, 1],
    [-CITY_SIZE / 2, 0, 1, CITY_SIZE],
    [CITY_SIZE / 2, 0, 1, CITY_SIZE]
  ];

  walls.forEach(([x, z, width, depth]) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(width, 2, depth),
      material
    );

    wall.position.set(x, 1, z);
    decorationGroup.add(wall);
  });
}

// ======================================
// ЗДАНИЯ
// ======================================

function createBuilding(type, x, z) {
  const settings = {
    house: {
      size: [8, 8, 8],
      color: 0xd8b18a,
      population: 5
    },

    shop: {
      size: [10, 7, 10],
      color: 0x4b8ed1,
      population: 0
    },

    school: {
      size: [14, 7, 12],
      color: 0xd5c16f,
      population: 0
    },

    hospital: {
      size: [16, 9, 14],
      color: 0xe8e8e8,
      population: 0
    }
  };

  if (type === "park") {
    return createPark(x, z);
  }

  const config = settings[type] || settings.house;
  const [width, height, depth] = config.size;

  const building = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.8
    })
  );

  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;

  building.add(body);

  // Крыша
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.6, 0.5, depth + 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x45454a
    })
  );

  roof.position.y = height + 0.25;
  roof.castShadow = true;

  building.add(roof);

  // Окна
  for (let i = -1; i <= 1; i++) {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.4, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x9dd9e8,
        emissive: 0x173b48,
        emissiveIntensity: 0.35
      })
    );

    windowMesh.position.set(
      i * 2.2,
      height * 0.62,
      depth / 2 + 0.07
    );

    building.add(windowMesh);
  }

  // Вход
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.3, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x49352b
    })
  );

  door.position.set(0, 1.15, depth / 2 + 0.1);
  building.add(door);

  building.position.set(
    Math.round(x / GRID_SIZE) * GRID_SIZE,
    0,
    Math.round(z / GRID_SIZE) * GRID_SIZE
  );

  building.userData = {
    type,
    removable: true,
    population: config.population || 0,
    level: 1
  };

  cityGroup.add(building);
  cityObjects.push(building);

  return building;
}

function createPark(x, z) {
  const park = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 12),
    new THREE.MeshStandardMaterial({
      color: 0x3d984e
    })
  );

  ground.position.y = 0.1;
  park.add(ground);

  for (let i = 0; i < 4; i++) {
    createTreeInPark(
      park,
      random(-4, 4),
      random(-4, 4)
    );
  }

  park.position.set(
    Math.round(x / GRID_SIZE) * GRID_SIZE,
    0,
    Math.round(z / GRID_SIZE) * GRID_SIZE
  );

  park.userData = {
    type: "park",
    removable: true,
    population: 0,
    level: 1
  };

  cityGroup.add(park);
  cityObjects.push(park);

  return park;
}

function createTreeInPark(parent, x, z) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 1.5, 8),
    new THREE.MeshStandardMaterial({
      color: 0x65432d
    })
  );

  trunk.position.y = 0.75;

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x286d37
    })
  );

  crown.position.y = 2;

  tree.add(trunk);
  tree.add(crown);

  tree.position.set(x, 0, z);
  parent.add(tree);
}

// ======================================
// ПРИРОДА И ЗАНЯТОСТЬ
// ======================================

function countNatureAt(x, z, radius = 9) {
  let count = 0;

  natureObjects.forEach(object => {
    if (!object.parent) return;

    const position = new THREE.Vector3();
    object.getWorldPosition(position);

    const distance = Math.hypot(
      position.x - x,
      position.z - z
    );

    if (distance < radius) {
      count++;
    }
  });

  return count;
}

function removeNatureAt(x, z, radius = 9) {
  let removed = 0;

  for (let i = natureObjects.length - 1; i >= 0; i--) {
    const object = natureObjects[i];

    if (!object.parent) continue;

    const position = new THREE.Vector3();
    object.getWorldPosition(position);

    const distance = Math.hypot(
      position.x - x,
      position.z - z
    );

    if (distance < radius) {
      if (object.parent) {
        object.parent.remove(object);
      }

      natureObjects.splice(i, 1);
      removed++;
    }
  }

  return removed;
}

function hasNature(x, z, radius = 9) {
  return countNatureAt(x, z, radius) > 0;
}

function isOccupied(x, z, radius = 7) {
  for (const object of cityObjects) {
    if (!object.parent) continue;

    const position = new THREE.Vector3();
    object.getWorldPosition(position);

    const distance = Math.hypot(
      position.x - x,
      position.z - z
    );

    if (distance < radius) {
      return true;
    }
  }

  return false;
}

// ======================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================================

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCity() {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}

function animateCity() {
  requestAnimationFrame(animateCity);

  if (!renderer || !scene || !camera) {
    return;
  }

  renderer.render(scene, camera);
}
