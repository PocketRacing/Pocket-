/* =====================================
   KARTAVIY CITY — СОХРАНЕНИЕ
===================================== */

const SAVE_KEY = "kartaviy_city_save_v1";

/**
 * Сохранение игры
 */
function saveGame() {
  try {
    const saveData = {
      money: state.money,
      population: state.population,
      level: state.level,
      experience: state.experience,
      day: state.day,
      buildings: state.buildings,
      workers: state.workers
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

    showNotification("💾 Город сохранён");
  } catch (error) {
    console.error("Ошибка сохранения:", error);
    showNotification("❌ Не удалось сохранить город");
  }
}

/**
 * Загрузка игры
 */
function loadGame() {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);

    if (!savedData) {
      showNotification("ℹ️ Сохранённый город не найден");
      return false;
    }

    const data = JSON.parse(savedData);

    state.money = data.money ?? 50000;
    state.population = data.population ?? 0;
    state.level = data.level ?? 1;
    state.experience = data.experience ?? 0;
    state.day = data.day ?? 1;
    state.buildings = data.buildings ?? [];
    state.workers = data.workers ?? {
      builders: 0,
      doctors: 0,
      teachers: 0,
      police: 0,
      firefighters: 0,
      garbage: 0
    };

    updateInterface();

    showNotification("📂 Город загружен");

    return true;
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    showNotification("❌ Сохранение повреждено");
    return false;
  }
}

/**
 * Удаление сохранения
 */
function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  showNotification("🗑️ Сохранение удалено");
}

/**
 * Автосохранение каждые 30 секунд
 */
setInterval(() => {
  if (
    typeof state !== "undefined" &&
    state.gameStarted === true
  ) {
    saveGame();
  }
}, 30000);

/**
 * Сохранение перед закрытием страницы
 */
window.addEventListener("beforeunload", () => {
  if (
    typeof state !== "undefined" &&
    state.gameStarted === true
  ) {
    const saveData = {
      money: state.money,
      population: state.population,
      level: state.level,
      experience: state.experience,
      day: state.day,
      buildings: state.buildings,
      workers: state.workers
    };

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(saveData)
    );
  }
});
