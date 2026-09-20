// ======================================
// KARTAVIY CITY — PLAYER.JS
// ======================================

let player;
let playerYaw = 0;
let playerPitch = 0;
let isWalking = false;

let keys = {};
let joystickX = 0;
let joystickY = 0;

const PLAYER_HEIGHT = 1.7;
const PLAYER_SPEED = 0.18;
const MOUSE_SENSITIVITY = 0.003;

let playerControlsBound = false;
let touchStartX = 0;
let touchStartY = 0;
let touchMoving = false;

// ======================================
// СОЗДАНИЕ ПЕРСОНАЖА
// ======================================

function createPlayer() {
  if (player) return;

  player = new THREE.Object3D();
  player.position.set(0, PLAYER_HEIGHT, 15);

  scene.add(player);

  player.add(camera);

  camera.position.set(0, 0, 0);
  camera.rotation.order = "YXZ";

  playerYaw = 0;
  playerPitch = 0;

  player.rotation.y = playerYaw;
  camera.rotation.x = playerPitch;
}

// ======================================
// ПРИВЯЗКА УПРАВЛЕНИЯ
// ======================================

function bindPlayerControls() {
  if (playerControlsBound) return;
  if (!renderer || !renderer.domElement) return;

  playerControlsBound = true;

  const canvas = renderer.domElement;

  // Клавиатура
  document.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;
  });

  document.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
  });

  // Мышь
  canvas.addEventListener("click", () => {
    if (isWalking && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  });

  document.addEventListener("mousemove", event => {
    if (!isWalking) return;
    if (document.pointerLockElement !== canvas) return;

    playerYaw -= event.movementX * MOUSE_SENSITIVITY;
    playerPitch -= event.movementY * MOUSE_SENSITIVITY;

    playerPitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, playerPitch)
    );

    updatePlayerCamera();
  });

  // Свайп на телефоне
  canvas.addEventListener("touchstart", event => {
    if (!isWalking) return;

    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchMoving = true;
  }, { passive: true });

  canvas.addEventListener("touchmove", event => {
    if (!isWalking || !touchMoving) return;

    const touch = event.touches[0];

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    playerYaw -= dx * 0.006;
    playerPitch -= dy * 0.006;

    playerPitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, playerPitch)
    );

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    updatePlayerCamera();

    event.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchMoving = false;
  });
}

// ======================================
// КАМЕРА
// ======================================

function updatePlayerCamera() {
  if (!player) return;

  player.rotation.y = playerYaw;
  camera.rotation.x = playerPitch;
}

// ======================================
// РЕЖИМ ПРОГУЛКИ
// ======================================

function startWalkMode() {
  if (isWalking) return;
  if (!scene || !camera || !renderer) return;

  bindPlayerControls();
  createPlayer();

  isWalking = true;

  const controls = document.getElementById("walkControls");

  if (controls) {
    controls.style.display = "block";
  }

  const mode = document.getElementById("mode");

  if (mode) {
    mode.textContent = "Прогулка";
  }

  updatePlayerCamera();
}

function stopWalkMode() {
  isWalking = false;

  if (document.pointerLockElement) {
    document.exitPointerLock?.();
  }

  if (player) {
    scene.remove(player);
    player = null;
  }

  const controls = document.getElementById("walkControls");

  if (controls) {
    controls.style.display = "none";
  }

  const mode = document.getElementById("mode");

  if (mode) {
    mode.textContent = "Карта";
  }
}

// Совместимость со старыми кнопками
function startWalk() {
  startWalkMode();
}

function stopWalk() {
  stopWalkMode();
}

// ======================================
// ДВИЖЕНИЕ
// ======================================

function updatePlayer() {
  if (!isWalking || !player) return;

  let forward = 0;
  let side = 0;

  if (keys["w"] || keys["arrowup"]) forward += 1;
  if (keys["s"] || keys["arrowdown"]) forward -= 1;
  if (keys["a"] || keys["arrowleft"]) side -= 1;
  if (keys["d"] || keys["arrowright"]) side += 1;

  forward += -joystickY;
  side += joystickX;

  const length = Math.hypot(forward, side);

  if (length > 1) {
    forward /= length;
    side /= length;
  }

  const direction = new THREE.Vector3(
    side,
    0,
    forward
  );

  direction.applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    playerYaw
  );

  player.position.x += direction.x * PLAYER_SPEED;
  player.position.z += direction.z * PLAYER_SPEED;

  // Границы города
  player.position.x = THREE.MathUtils.clamp(
    player.position.x,
    -112,
    112
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z,
    -112,
    112
  );
}

// ======================================
// ДЖОЙСТИК
// ======================================

function setJoystick(x, y) {
  joystickX = Math.max(-1, Math.min(1, x));
  joystickY = Math.max(-1, Math.min(1, y));
}

function resetJoystick() {
  setJoystick(0, 0);

  const knob = document.getElementById("joystickKnob");

  if (knob) {
    knob.style.left = "37px";
    knob.style.top = "37px";
  }
}

// ======================================
// ВЗАИМОДЕЙСТВИЕ
// ======================================

function interactWithObject() {
  if (!player || !scene) return;

  const raycaster = new THREE.Raycaster();

  raycaster.setFromCamera(
    new THREE.Vector2(0, 0),
    camera
  );

  const objects = [];

  scene.traverse(object => {
    if (object.isMesh) {
      objects.push(object);
    }
  });

  const hits = raycaster.intersectObjects(objects, true);

  if (hits.length > 0) {
    const object = hits[0].object;

    alert(
      object.userData?.type
        ? "Объект: " + object.userData.type
        : "Вы посмотрели на объект"
    );
  }
}

function interact() {
  interactWithObject();
}
