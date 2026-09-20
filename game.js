/* =====================================
   KARTAVIY CITY — ОСНОВНАЯ ЛОГИКА
===================================== */

const state = {
  gameStarted: false,
  mode: "city",

  money: 50000,
  population: 0,
  level: 1,
  experience: 0,
  day: 1,

  buildings: [],

  workers: {
    builders: 0,
    doctors: 0,
    teachers: 0,
    police: 0,
    firefighters: 0,
    garbage: 0
  }
};

/* =====================================
   ЗАПУСК ИГРЫ
===================================== */

document
  .getElementById("startGame")
  .addEventListener("click", () => {
    state.gameStarted = true;
    state.mode = "city";

    document
      .getElementById("mainMenu")
      .classList.add("hidden");

    document
      .getElementById("gameInterface")
      .classList.remove("hidden");

    createCity();
    updateInterface();

    showNotification(
      "🏙️ Добро пожаловать в Kartaviy City!"
    );
  });

/* =====================================
   ЗАГРУЗКА ИГРЫ
===================================== */

document
  .getElementById("loadGame")
  .addEventListener("click", () => {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
      showNotification("ℹ️ Сохранённый город не найден");
      return;
    }

    state.gameStarted = true;
    state.mode = "city";

    document
      .getElementById("mainMenu")
      .classList.add("hidden");

    document
      .getElementById("gameInterface")
      .classList.remove("hidden");

    createCity();

    if (loadGame()) {
      restoreBuildings();
      updateInterface();
    }
  });

/* =====================================
   ВОССТАНОВЛЕНИЕ ЗДАНИЙ
===================================== */

function restoreBuildings() {
  if (!state.buildings) return;

  for (const building of state.buildings) {
    if (!building || !building.type) continue;

    if (building.type === "road") {
      createRoadSegment(
        building.x,
        building.z,
        building.rotation || 0,
        40
      );

      continue;
    }

    if (building.type === "bridge") {
      createRestoredBridge(
        building.x,
        building.z
      );

      continue;
    }

    createBuilding(
      building.type,
      building.x,
      building.z
    );
  }
}

function createRestoredBridge(x, z) {
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

  bridge.userData = {
    type: "bridge",
    removable: true
  };

  cityGroup.add(bridge);
  cityObjects.push(bridge);
}

/* =====================================
   ИНТЕРФЕЙС
===================================== */

function updateInterface() {
  document.getElementById("money").textContent =
    Math.floor(state.money).toLocaleString("ru-RU");

  document.getElementById("population").textContent =
    state.population.toLocaleString("ru-RU");

  document.getElementById("level").textContent =
    state.level;

  updateMission();
}

/* =====================================
   УВЕДОМЛЕНИЯ
===================================== */

let notificationTimer = null;

function showNotification(message) {
  const notification =
    document.getElementById("notification");

  notification.textContent = message;
  notification.classList.remove("hidden");

  clearTimeout(notificationTimer);

  notificationTimer = setTimeout(() => {
    notification.classList.add("hidden");
  }, 3500);
}

/* =====================================
   УРОВНИ
===================================== */

function checkLevelUp() {
  const requiredExperience =
    state.level * 100;

  if (state.experience >= requiredExperience) {
    state.experience -= requiredExperience;
    state.level++;

    state.money += state.level * 2000;

    showNotification(
      `🎉 Новый уровень: ${state.level}! Бонус: ${state.level * 2000} ₽`
    );
  }
}

/* =====================================
   ЗАДАНИЯ
===================================== */

function updateMission() {
  const missionText =
    document.getElementById("missionText");

  const missionReward =
    document.getElementById("missionReward");

  if (state.population === 0) {
    missionText.textContent =
      "Построй первый дом";

    missionReward.textContent =
      "1000";
  } else if (state.population < 40) {
    missionText.textContent =
      "Засели город 40 жителями";

    missionReward.textContent =
      "3000";
  } else if (state.level < 3) {
    missionText.textContent =
      "Достигни 3-го уровня";

    missionReward.textContent =
      "5000";
  } else {
    missionText.textContent =
      "Развивай город и открывай новые здания";

    missionReward.textContent =
      "10000";
  }
}

/* =====================================
   ДОПОЛНИТЕЛЬНЫЕ КЛАВИШИ
===================================== */

window.addEventListener("keydown", event => {
  if (event.code === "Escape" && state.mode === "walk") {
    stopWalkMode();
  }

  if (
    event.code === "KeyF" &&
    state.mode === "walk"
  ) {
    interactWithObject();
  }
});

/* =====================================
   ИГРОВОЙ ЦИКЛ
===================================== */

function gameLoop() {
  requestAnimationFrame(gameLoop);

  if (state.gameStarted && state.mode === "walk") {
    updatePlayer();
  }
}

gameLoop();

/* =====================================
   ПЕРИОДИЧЕСКАЯ ЭКОНОМИКА
===================================== */

setInterval(() => {
  if (!state.gameStarted) return;

  if (state.population > 0) {
    const income = Math.floor(
      state.population * 2
    );

    state.money += income;

    updateInterface();
  }
}, 10000);
