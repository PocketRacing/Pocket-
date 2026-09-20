/* =====================================
   KARTAVIY CITY — ПРОГУЛКА
===================================== */

let player;
let playerYaw = 0;
let playerPitch = 0;

let isWalking = false;
let keys = {};

let joystickActive = false;
let joystickPointerId = null;
let joystickX = 0;
let joystickY = 0;

let cameraLookPointer = null;
let lastLookX = 0;
let lastLookY = 0;

const PLAYER_HEIGHT = 1.7;
const PLAYER_SPEED = 0.12;
const MOUSE_SENSITIVITY = 0.003;

/* =====================================
   СОЗДАНИЕ ИГРОКА
===================================== */

function createPlayer() {
  player = new THREE.Object3D();

  player.position.set(0, PLAYER_HEIGHT, 15);

  scene.add(player);

  camera.position.set(0, 0, 0);
  player.add(camera);

  camera.rotation.order = "YXZ";
}

/* =====================================
   НАЧАЛО ПРОГУЛКИ
===================================== */

function startWalkMode() {
  if (!player) {
    createPlayer();
  }

  isWalking = true;
  state.mode = "walk";

  player.position.y = PLAYER_HEIGHT;

  document
    .getElementById("constructionMenu")
    .classList.add("hidden");

  document
    .getElementById("missionsPanel")
    .classList.add("hidden");

  document
    .getElementById("walkControls")
    .classList.remove("hidden");

  showNotification(
    "🚶 Прогулка началась. WASD — движение, мышь или свайп — обзор"
  );
}

/* =====================================
   ВЫХОД ИЗ ПРОГУЛКИ
===================================== */

function stopWalkMode() {
  isWalking = false;
  state.mode = "city";

  document
    .getElementById("constructionMenu")
    .classList.remove("hidden");

  document
    .getElementById("missionsPanel")
    .classList.remove("hidden");

  document
    .getElementById("walkControls")
    .classList.add("hidden");

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  showNotification("🏙️ Вы вернулись в режим города");
}

/* =====================================
   КНОПКИ
===================================== */

document
  .getElementById("walkModeButton")
  .addEventListener("click", startWalkMode);

document
  .getElementById("exitWalkButton")
  .addEventListener("click", stopWalkMode);

/* =====================================
   КЛАВИАТУРА
===================================== */

window.addEventListener("keydown", event => {
  keys[event.code] = true;

  if (
    isWalking &&
    ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)
  ) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", event => {
  keys[event.code] = false;
});

/* =====================================
   ПОВОРОТ КАМЕРЫ НА ПК
===================================== */

renderer?.domElement?.addEventListener("click", () => {
  if (!isWalking) return;

  if (
    document.pointerLockElement !== renderer.domElement &&
    renderer.domElement.requestPointerLock
  ) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener("mousemove", event => {
  if (!isWalking) return;

  if (document.pointerLockElement === renderer.domElement) {
    playerYaw -= event.movementX * MOUSE_SENSITIVITY;
    playerPitch -= event.movementY * MOUSE_SENSITIVITY;

    limitCameraRotation();
    updateCameraRotation();
  }
});

/* =====================================
   ПОВОРОТ КАМЕРЫ СВАЙПОМ
===================================== */

renderer?.domElement?.addEventListener(
  "pointerdown",
  event => {
    if (!isWalking) return;

    if (event.pointerType === "mouse") return;

    if (
      event.clientX < window.innerWidth * 0.35 &&
      event.clientY > window.innerHeight * 0.55
    ) {
      return;
    }

    cameraLookPointer = event.pointerId;

    lastLookX = event.clientX;
    lastLookY = event.clientY;

    renderer.domElement.setPointerCapture(
      event.pointerId
    );
  }
);

renderer?.domElement?.addEventListener(
  "pointermove",
  event => {
    if (!isWalking) return;

    if (event.pointerId !== cameraLookPointer) {
      return;
    }

    const deltaX = event.clientX - lastLookX;
    const deltaY = event.clientY - lastLookY;

    lastLookX = event.clientX;
    lastLookY = event.clientY;

    playerYaw -= deltaX * 0.006;
    playerPitch -= deltaY * 0.006;

    limitCameraRotation();
    updateCameraRotation();
  }
);

function stopCameraLook(event) {
  if (event.pointerId === cameraLookPointer) {
    cameraLookPointer = null;
  }
}

renderer?.domElement?.addEventListener(
  "pointerup",
  stopCameraLook
);

renderer?.domElement?.addEventListener(
  "pointercancel",
  stopCameraLook
);

/* =====================================
   ОГРАНИЧЕНИЕ ОБЗОРА
===================================== */

function limitCameraRotation() {
  const limit = Math.PI / 2 - 0.1;

  playerPitch = Math.max(
    -limit,
    Math.min(limit, playerPitch)
  );
}

function updateCameraRotation() {
  player.rotation.y = playerYaw;
  camera.rotation.x = playerPitch;
}

/* =====================================
   ДВИЖЕНИЕ ИГРОКА
===================================== */

function updatePlayerMovement() {
  if (!isWalking || !player) return;

  let forward = 0;
  let right = 0;

  if (keys["KeyW"] || keys["ArrowUp"]) {
    forward += 1;
  }

  if (keys["KeyS"] || keys["ArrowDown"]) {
    forward -= 1;
  }

  if (keys["KeyD"] || keys["ArrowRight"]) {
    right += 1;
  }

  if (keys["KeyA"] || keys["ArrowLeft"]) {
    right -= 1;
  }

  forward += -joystickY;
  right += joystickX;

  const length = Math.hypot(forward, right);

  if (length > 1) {
    forward /= length;
    right /= length;
  }

  const direction = new THREE.Vector3(
    right,
    0,
    -forward
  );

  direction.applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    playerYaw
  );

  const nextX =
    player.position.x +
    direction.x * PLAYER_SPEED;

  const nextZ =
    player.position.z +
    direction.z * PLAYER_SPEED;

  if (!isWaterArea(nextX, nextZ)) {
    player.position.x = THREE.MathUtils.clamp(
      nextX,
      -115,
      115
    );

    player.position.z = THREE.MathUtils.clamp(
      nextZ,
      -115,
      115
    );
  }
}

/* =====================================
   МОБИЛЬНЫЙ ДЖОЙСТИК
===================================== */

const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");

joystick.addEventListener("pointerdown", event => {
  if (!isWalking) return;

  joystickActive = true;
  joystickPointerId = event.pointerId;

  joystick.setPointerCapture(event.pointerId);

  updateJoystick(event);
});

joystick.addEventListener("pointermove", event => {
  if (!joystickActive) return;
  if (event.pointerId !== joystickPointerId) return;

  updateJoystick(event);
});

function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let x = event.clientX - centerX;
  let y = event.clientY - centerY;

  const maxDistance = rect.width / 2 - 26;

  const distance = Math.hypot(x, y);

  if (distance > maxDistance) {
    x = (x / distance) * maxDistance;
    y = (y / distance) * maxDistance;
  }

  joystickX = x / maxDistance;
  joystickY = y / maxDistance;

  joystickKnob.style.transform =
    `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}

function resetJoystick() {
  joystickActive = false;
  joystickPointerId = null;

  joystickX = 0;
  joystickY = 0;

  joystickKnob.style.transform =
    "translate(-50%, -50%)";
}

joystick.addEventListener(
  "pointerup",
  resetJoystick
);

joystick.addEventListener(
  "pointercancel",
  resetJoystick
);

/* =====================================
   ВЗАИМОДЕЙСТВИЕ
===================================== */

document
  .getElementById("interactButton")
  .addEventListener("click", interactWithObject);

function interactWithObject() {
  if (!isWalking || !player) return;

  const direction = new THREE.Vector3(0, 0, -1);

  direction.applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    playerYaw
  );

  const origin = player.position.clone();

  const ray = new THREE.Raycaster(
    origin,
    direction.normalize(),
    0,
    4
  );

  const objects = [
    ...cityObjects,
    ...natureObjects
  ];

  const intersections = ray.intersectObjects(
    objects,
    true
  );

  if (intersections.length === 0) {
    showNotification("ℹ️ Рядом нет объектов");
    return;
  }

  let object = intersections[0].object;

  while (object.parent && !object.userData.type) {
    object = object.parent;
  }

  if (object.userData.type) {
    showNotification(
      `🏢 Объект: ${getBuildingName(object.userData.type)}`
    );
  } else {
    showNotification("ℹ️ Здесь пока нельзя взаимодействовать");
  }
}

/* =====================================
   ОБНОВЛЕНИЕ ДВИЖЕНИЯ
===================================== */

const originalAnimateCity = animateCity;

function updatePlayer() {
  updatePlayerMovement();
}

/*
  Игровой цикл вызывается из game.js.
  Не создаём второй requestAnimationFrame,
  чтобы не нагружать компьютер.
*/
