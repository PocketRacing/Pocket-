/* =====================================
   KARTAVIY CITY — ГОРОД И ОКРУЖЕНИЕ
===================================== */

let scene;
let camera;
let renderer;
let cityGroup;
let natureGroup;
let roadGroup;

const CITY_SIZE = 240;
const GRID_SIZE = 10;

const cityObjects = [];
const natureObjects = [];
const roadObjects = [];

const buildingCosts = {
  house: 5000,
  shop: 8000,
  school: 15000,
  hospital: 25000,
  park: 3000,
  road: 1000,
  bridge: 12000
};

/* =====================================
   ИНИЦИАЛИЗАЦИЯ ГОРОДА
===================================== */

function createCity() {
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x9fc4d6);
  scene.fog = new THREE.Fog(0x9fc4d6, 150, 430);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(80, 100, 100);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
  );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document
    .getElementById("gameContainer")
    .appendChild(renderer.domElement);

  cityGroup = new THREE.Group();
  natureGroup = new THREE.Group();
  roadGroup = new THREE.Group();

  scene.add(cityGroup);
  scene.add(natureGroup);
  scene.add(roadGroup);

  createLighting();
  createGround();
  createInitialRoads();
  createLake();
  createForest();
  createRocks();

  window.addEventListener("resize", resizeCity);

  animateCity();
}

/* =====================================
   ОСВЕЩЕНИЕ
===================================== */

function createLighting() {
  const ambient = new THREE.HemisphereLight(
    0xddeeff,
    0x526044,
    2
  );

  scene.add(ambient);

  const sun = new THREE.DirectionalLight(
    0xffffff,
    2.5
  );

  sun.position.set(80, 150, 60);
  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  sun.shadow.camera.left = -180;
  sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180;
  sun.shadow.camera.bottom = -180;

  scene.add(sun);
}

/* =====================================
   ЗЕМЛЯ
===================================== */

function createGround() {
  const geometry = new THREE.PlaneGeometry(
    CITY_SIZE,
    CITY_SIZE
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x71965b,
    roughness: 1
  });

  const ground = new THREE.Mesh(
    geometry,
    material
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  scene.add(ground);
}

/* =====================================
   ДОРОГИ
===================================== */

function createInitialRoads() {
  createRoadSegment(0, 0, 0, 220);
  createRoadSegment(0, 0, Math.PI / 2, 220);

  createRoadSegment(-55, 0, 0, 110);
  createRoadSegment(55, 0, 0, 110);
  createRoadSegment(0, -55, Math.PI / 2, 110);
  createRoadSegment(0, 55, Math.PI / 2, 110);
}

function createRoadSegment(x, z, rotation, length) {
  const group = new THREE.Group();

  group.position.set(x, 0, z);
  group.rotation.y = rotation;

  // Асфальт
  const asphaltGeometry = new THREE.BoxGeometry(
    8,
    0.15,
    length
  );

  const asphaltMaterial = new THREE.MeshStandardMaterial({
    color: 0x30353a,
    roughness: 0.95
  });

  const asphalt = new THREE.Mesh(
    asphaltGeometry,
    asphaltMaterial
  );

  asphalt.position.y = 0.08;
  asphalt.receiveShadow = true;

  group.add(asphalt);

  // Тротуары
  createSidewalk(group, -5.2, length);
  createSidewalk(group, 5.2, length);

  // Бордюры
  createCurb(group, -4.25, length);
  createCurb(group, 4.25, length);

  // Разметка
  const lineGeometry = new THREE.BoxGeometry(
    0.18,
    0.03,
    length - 3
  );

  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4e6a1
  });

  const centerLine = new THREE.Mesh(
    lineGeometry,
    lineMaterial
  );

  centerLine.position.y = 0.18;
  centerLine.position.x = 0;

  group.add(centerLine);

  // Фонари
  for (
    let position = -length / 2 + 10;
    position < length / 2;
    position += 25
  ) {
    createStreetLamp(group, -7, position);
    createStreetLamp(group, 7, position);
  }

  roadGroup.add(group);
  roadObjects.push(group);
}

function createSidewalk(group, x, length) {
  const geometry = new THREE.BoxGeometry(
    2.1,
    0.2,
    length
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0xa8a8a0,
    roughness: 0.9
  });

  const sidewalk = new THREE.Mesh(
    geometry,
    material
  );

  sidewalk.position.set(x, 0.12, 0);
  sidewalk.receiveShadow = true;

  group.add(sidewalk);
}

function createCurb(group, x, length) {
  const geometry = new THREE.BoxGeometry(
    0.25,
    0.35,
    length
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0xd0d0c7
  });

  const curb = new THREE.Mesh(
    geometry,
    material
  );

  curb.position.set(x, 0.25, 0);

  group.add(curb);
}

function createStreetLamp(group, x, z) {
  const lampGroup = new THREE.Group();

  const poleGeometry = new THREE.CylinderGeometry(
    0.08,
    0.1,
    3.5,
    8
  );

  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x353b40
  });

  const pole = new THREE.Mesh(
    poleGeometry,
    poleMaterial
  );

  pole.position.y = 1.8;

  lampGroup.add(pole);

  const lightGeometry = new THREE.SphereGeometry(
    0.25,
    8,
    8
  );

  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe7a3
  });

  const light = new THREE.Mesh(
    lightGeometry,
    lightMaterial
  );

  light.position.y = 3.6;

  lampGroup.add(light);

  lampGroup.position.set(x, 0, z);

  group.add(lampGroup);
}

/* =====================================
   ОЗЕРО С НЕРОВНОЙ БЕРЕГОВОЙ ЛИНИЕЙ
===================================== */

function createLake() {
  const shape = new THREE.Shape();

  shape.moveTo(-28, -18);
  shape.bezierCurveTo(
    -40, -10,
    -35, 10,
    -20, 18
  );

  shape.bezierCurveTo(
    -5, 29,
    22, 25,
    32, 8
  );

  shape.bezierCurveTo(
    43, -8,
    28, -25,
    10, -28
  );

  shape.bezierCurveTo(
    -5, -32,
    -18, -28,
    -28, -18
  );

  const geometry = new THREE.ShapeGeometry(shape);

  const material = new THREE.MeshStandardMaterial({
    color: 0x398db5,
    transparent: true,
    opacity: 0.88,
    roughness: 0.2
  });

  const lake = new THREE.Mesh(
    geometry,
    material
  );

  lake.rotation.x = -Math.PI / 2;
  lake.position.set(75, 0.08, 65);

  natureGroup.add(lake);

  // Берег
  const shoreGeometry = new THREE.ShapeGeometry(shape);

  const shoreMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9b783,
    side: THREE.DoubleSide
  });

  const shore = new THREE.Mesh(
    shoreGeometry,
    shoreMaterial
  );

  shore.rotation.x = -Math.PI / 2;
  shore.scale.set(1.08, 1.08, 1.08);
  shore.position.set(75, 0.02, 65);

  natureGroup.add(shore);

  // Вода поверх берега
  lake.renderOrder = 2;
  shore.renderOrder = 1;
}

/* =====================================
   ЛЕС
===================================== */

function createForest() {
  for (let i = 0; i < 100; i++) {
    const x = random(-105, 105);
    const z = random(-105, 105);

    if (Math.abs(x) < 25 || Math.abs(z) < 25) {
      continue;
    }

    if (distanceToLake(x, z) < 42) {
      continue;
    }

    createTree(x, z);
  }
}

function createTree(x, z) {
  const group = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(
    0.3,
    0.45,
    2.5,
    8
  );

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x765033
  });

  const trunk = new THREE.Mesh(
    trunkGeometry,
    trunkMaterial
  );

  trunk.position.y = 1.25;
  trunk.castShadow = true;

  group.add(trunk);

  const crownGeometry = new THREE.ConeGeometry(
    2.2,
    5,
    8
  );

  const crownMaterial = new THREE.MeshStandardMaterial({
    color: 0x285c35
  });

  const crown = new THREE.Mesh(
    crownGeometry,
    crownMaterial
  );

  crown.position.y = 4.5;
  crown.castShadow = true;

  group.add(crown);

  group.position.set(x, 0, z);

  group.userData = {
    type: "tree",
    removable: true
  };

  natureGroup.add(group);
  natureObjects.push(group);
}

/* =====================================
   КАМНИ
===================================== */

function createRocks() {
  for (let i = 0; i < 45; i++) {
    const x = random(-105, 105);
    const z = random(-105, 105);

    if (Math.abs(x) < 20 || Math.abs(z) < 20) {
      continue;
    }

    createRock(x, z);
  }
}

function createRock(x, z) {
  const geometry = new THREE.DodecahedronGeometry(
    random(0.5, 1.3),
    0
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x737b7c,
    roughness: 1
  });

  const rock = new THREE.Mesh(
    geometry,
    material
  );

  rock.position.set(x, 0.6, z);
  rock.rotation.y = Math.random() * Math.PI;
  rock.castShadow = true;

  rock.userData = {
    type: "rock",
    removable: true
  };

  natureGroup.add(rock);
  natureObjects.push(rock);
}

/* =====================================
   ЗДАНИЯ
===================================== */

function createBuilding(type, x, z) {
  const group = new THREE.Group();

  const settings = {
    house: {
      width: 7,
      depth: 7,
      height: 7,
      color: 0xd5a477,
      population: 8
    },

    shop: {
      width: 8,
      depth: 7,
      height: 6,
      color: 0x6a9dcc,
      population: 3
    },

    school: {
      width: 12,
      depth: 9,
      height: 8,
      color: 0xd9c57a,
      population: 0
    },

    hospital: {
      width: 13,
      depth: 10,
      height: 10,
      color: 0xe5e5e5,
      population: 0
    },

    park: {
      width: 10,
      depth: 10,
      height: 0.3,
      color: 0x4b9b55,
      population: 0
    }
  };

  const config = settings[type];

  if (!config) {
    return null;
  }

  const buildingGeometry = new THREE.BoxGeometry(
    config.width,
    config.height,
    config.depth
  );

  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: 0.8
  });

  const building = new THREE.Mesh(
    buildingGeometry,
    buildingMaterial
  );

  building.position.y = config.height / 2;
  building.castShadow = true;
  building.receiveShadow = true;

  group.add(building);

  if (type !== "park") {
    createWindows(
      group,
      config.width,
      config.height,
      config.depth
    );

    createRoof(group, config.width, config.depth);
    createEntrance(group, config.width, config.depth);
  } else {
    createParkDetails(group);
  }

  group.position.set(x, 0, z);

  group.userData = {
    type,
    removable: true,
    population: config.population
  };

  cityGroup.add(group);
  cityObjects.push(group);

  return group;
}

function createWindows(group, width, height, depth) {
  const geometry = new THREE.BoxGeometry(
    0.8,
    1,
    0.08
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x9bd0df,
    emissive: 0x152b35
  });

  for (
    let y = 2;
    y < height - 0.5;
    y += 2.2
  ) {
    for (
      let x = -width / 2 + 1.4;
      x < width / 2;
      x += 2
    ) {
      const window = new THREE.Mesh(
        geometry,
        material
      );

      window.position.set(
        x,
        y,
        depth / 2 + 0.05
      );

      group.add(window);
    }
  }
}

function createRoof(group, width, depth) {
  const geometry = new THREE.BoxGeometry(
    width + 0.4,
    0.35,
    depth + 0.4
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x4a4541
  });

  const roof = new THREE.Mesh(
    geometry,
    material
  );

  const height = group.children[0].geometry.parameters.height;

  roof.position.y = height + 0.18;

  group.add(roof);
}

function createEntrance(group, width, depth) {
  const geometry = new THREE.BoxGeometry(
    1.3,
    2.2,
    0.15
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x42352b
  });

  const entrance = new THREE.Mesh(
    geometry,
    material
  );

  entrance.position.set(
    0,
    1.1,
    depth / 2 + 0.1
  );

  group.add(entrance);
}

function createParkDetails(group) {
  for (let i = 0; i < 5; i++) {
    const tree = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 2, 8),
      new THREE.MeshStandardMaterial({
        color: 0x236b37
      })
    );

    tree.position.set(
      random(-4, 4),
      1.1,
      random(-4, 4)
    );

    group.add(tree);
  }
}

/* =====================================
   ПРОВЕРКИ ТЕРРИТОРИИ
===================================== */

function distanceToLake(x, z) {
  const lakeX = 75;
  const lakeZ = 65;

  return Math.sqrt(
    Math.pow(x - lakeX, 2) +
    Math.pow(z - lakeZ, 2)
  );
}

function isWaterArea(x, z) {
  return distanceToLake(x, z) < 35;
}

function isOccupied(x, z, width = 8, depth = 8) {
  for (const object of cityObjects) {
    const position = object.position;

    if (
      Math.abs(position.x - x) < width &&
      Math.abs(position.z - z) < depth
    ) {
      return true;
    }
  }

  return false;
}

function hasNature(x, z, radius = 8) {
  for (const object of natureObjects) {
    const position = object.position;

    const distance = Math.sqrt(
      Math.pow(position.x - x, 2) +
      Math.pow(position.z - z, 2)
    );

    if (distance < radius) {
      return true;
    }
  }

  return false;
}

/* =====================================
   УДАЛЕНИЕ ЛЕСА И КАМНЕЙ
===================================== */

function removeNatureAt(x, z, radius = 10) {
  let removed = 0;

  for (let i = natureObjects.length - 1; i >= 0; i--) {
    const object = natureObjects[i];

    const distance = Math.sqrt(
      Math.pow(object.position.x - x, 2) +
      Math.pow(object.position.z - z, 2)
    );

    if (
      distance < radius &&
      object.userData.removable
    ) {
      natureGroup.remove(object);
      natureObjects.splice(i, 1);
      removed++;
    }
  }

  if (removed > 0) {
    const cost = removed * 100;

    if (state.money >= cost) {
      state.money -= cost;
      showNotification(
        `🌲 Убрано объектов: ${removed}. Стоимость: ${cost} ₽`
      );
    } else {
      showNotification("❌ Недостаточно денег для очистки");
    }

    updateInterface();
  }

  return removed;
}

/* =====================================
   ДОБАВЛЕНИЕ ЗДАНИЯ В СОХРАНЕНИЕ
===================================== */

function addBuildingToState(type, x, z) {
  state.buildings.push({
    type,
    x,
    z
  });
}

/* =====================================
   АНАЛОГИЧНЫЕ ФУНКЦИИ
===================================== */

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCity() {
  if (!camera || !renderer) return;

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}

function animateCity() {
  requestAnimationFrame(animateCity);

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
