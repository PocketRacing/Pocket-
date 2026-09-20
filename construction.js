/* =====================================
   KARTAVIY CITY — СТРОИТЕЛЬСТВО
===================================== */

let selectedBuilding = null;
let pendingConstruction = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* =====================================
   ВЫБОР ИНСТРУМЕНТА
===================================== */

document.querySelectorAll(".build-button").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.building;

    if (!type) return;

    selectedBuilding = type;

    showNotification(
      `🔨 Выбран инструмент: ${getBuildingName(type)}`
    );
  });
});

function getBuildingName(type) {
  const names = {
    road: "Дорога",
    house: "Дом",
    shop: "Магазин",
    school: "Школа",
    hospital: "Больница",
    park: "Парк",
    bridge: "Мост",
    bulldozer: "Удаление"
  };

  return names[type] || type;
}

/* =====================================
   КЛИК ПО КАРТЕ
===================================== */

document
  .getElementById("gameContainer")
  .addEventListener("pointerdown", event => {
    if (state.mode === "walk") return;
    if (!selectedBuilding) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    mouse.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const groundPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      0
    );

    const point = new THREE.Vector3();

    if (!raycaster.ray.intersectPlane(groundPlane, point)) {
      return;
    }

    constructAt(
      Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      Math.round(point.z / GRID_SIZE) * GRID_SIZE
    );
  });

/* =====================================
   СТРОИТЕЛЬСТВО
===================================== */

function constructAt(x, z) {
  if (selectedBuilding === "bulldozer") {
    removeObjectsAt(x, z);
    return;
  }

  if (selectedBuilding === "road") {
    buildRoad(x, z);
    return;
  }

  if (selectedBuilding === "bridge") {
    buildBridge(x, z);
    return;
  }

  buildStructure(selectedBuilding, x, z);
}

/* =====================================
   ДОМА И ЗДАНИЯ
===================================== */

function buildStructure(type, x, z) {
  const cost = buildingCosts[type] || 1000;

  if (state.money < cost) {
    showNotification("❌ Недостаточно денег");
    return;
  }

  if (isWaterArea(x, z)) {
    showNotification(
      "💧 Здесь вода. Построй мост или выбери другое место."
    );
    return;
  }

  if (isOccupied(x, z)) {
    showNotification("❌ Место уже занято");
    return;
  }

  const natureCount = countNatureAt(x, z, 9);

  if (natureCount > 0) {
    pendingConstruction = {
      type,
      x,
      z,
      cost,
      natureCount
    };

    showConfirmWindow(
      `На участке есть ${natureCount} препятствий. ` +
      `Очистка будет стоить ${natureCount * 100} ₽.`
    );

    return;
  }

  finishConstruction(type, x, z, cost);
}

function finishConstruction(type, x, z, cost) {
  const totalCost =
    cost + countNatureAt(x, z, 9) * 100;

  if (state.money < totalCost) {
    showNotification("❌ Недостаточно денег");
    return;
  }

  removeNatureAt(x, z, 9);

  state.money -= cost;

  const object = createBuilding(type, x, z);

  if (!object) {
    state.money += cost;
    showNotification("❌ Не удалось построить объект");
    return;
  }

  addBuildingToState(type, x, z);

  if (type === "house") {
    state.population += 8;
  }

  state.experience += 10;

  checkLevelUp();
  updateInterface();

  showNotification(
    `✅ Построено: ${getBuildingName(type)}`
  );
}

/* =====================================
   ДОРОГА
===================================== */

function buildRoad(x, z) {
  const cost = buildingCosts.road;

  if (state.money < cost) {
    showNotification("❌ Недостаточно денег");
    return;
  }

  if (isWaterArea(x, z)) {
    showNotification(
      "💧 Здесь вода. Используй инструмент «Мост»."
    );
    return;
  }

  const obstacles = countNatureAt(x, z, 7);

  if (obstacles > 0) {
    pendingConstruction = {
      type: "road",
      x,
      z,
      cost,
      natureCount: obstacles
    };

    showConfirmWindow(
      `Очистить участок от ${obstacles} объектов?`
    );

    return;
  }

  finishRoad(x, z);
}

function finishRoad(x, z) {
  const cost = buildingCosts.road;

  if (state.money < cost) {
    showNotification("❌ Недостаточно денег");
    return;
  }

  removeNatureAt(x, z, 7);

  state.money -= cost;

  createRoadSegment(
    x,
    z,
    0,
    40
  );

  state.buildings.push({
    type: "road",
    x,
    z,
    rotation: 0
  });

  state.experience += 5;

  checkLevelUp();
  updateInterface();

  showNotification("🛣️ Дорога построена");
}

/* =====================================
   МОСТ
===================================== */

function buildBridge(x, z) {
  const cost = buildingCosts.bridge;

  if (state.money < cost) {
    showNotification("❌ Недостаточно денег");
    return;
  }

  if (!isWaterArea(x, z)) {
    showNotification(
      "🌉 Мост можно строить только через воду"
    );
    return;
  }

  state.money -= cost;

  const geometry = new THREE.BoxGeometry(
    10,
    0.8,
    30
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.9
  });

  const bridge = new THREE.Mesh(
    geometry,
    material
  );

  bridge.position.set(x, 1, z);
  bridge.castShadow = true;
  bridge.receiveShadow = true;

  cityGroup.add(bridge);
  cityObjects.push(bridge);

  state.buildings.push({
    type: "bridge",
    x,
    z
  });

  state.experience += 20;

  checkLevelUp();
  updateInterface();

  showNotification("🌉 Мост построен");
}

/* =====================================
   УДАЛЕНИЕ ОБЪЕКТОВ
===================================== */

function removeObjectsAt(x, z) {
  let removed = false;

  for (let i = cityObjects.length - 1; i >= 0; i--) {
    const object = cityObjects[i];

    const distance = Math.hypot(
      object.position.x - x,
      object.position.z - z
    );

    if (distance < 8 && object.userData.removable !== false) {
      cityGroup.remove(object);
      cityObjects.splice(i, 1);
      removed = true;
    }
  }

  if (removeNatureAt(x, z, 9) > 0) {
    removed = true;
  }

  if (removed) {
    showNotification("🚜 Территория очищена");
  } else {
    showNotification("ℹ️ Здесь нечего убирать");
  }
}

/* =====================================
   ПРОВЕРКА ПРИРОДЫ
===================================== */

function countNatureAt(x, z, radius) {
  let count = 0;

  for (const object of natureObjects) {
    const distance = Math.hypot(
      object.position.x - x,
      object.position.z - z
    );

    if (
      distance < radius &&
      object.userData.removable
    ) {
      count++;
    }
  }

  return count;
}

/* =====================================
   ОКНО ПОДТВЕРЖДЕНИЯ
===================================== */

function showConfirmWindow(text) {
  document
    .getElementById("confirmText")
    .textContent = text;

  document
    .getElementById("confirmBox")
    .classList.remove("hidden");
}

document
  .getElementById("confirmRemove")
  .addEventListener("click", () => {
    if (!pendingConstruction) return;

    const data = pendingConstruction;

    document
      .getElementById("confirmBox")
      .classList.add("hidden");

    pendingConstruction = null;

    const cleaningCost = data.natureCount * 100;

    if (state.money < data.cost + cleaningCost) {
      showNotification("❌ Недостаточно денег");
      return;
    }

    removeNatureAt(data.x, data.z, 10);

    if (data.type === "road") {
      finishRoad(data.x, data.z);
    } else {
      finishConstruction(
        data.type,
        data.x,
        data.z,
        data.cost
      );
    }
  });

document
  .getElementById("cancelRemove")
  .addEventListener("click", () => {
    pendingConstruction = null;

    document
      .getElementById("confirmBox")
      .classList.add("hidden");

    showNotification("❌ Строительство отменено");
  });
