// Конфигурация плеера
const CONFIG = {
  streamUrl: "https://myradio24.org/25968",
  defaultVolume: 0.7,
  radioId: "25968",
};

// Состояние приложения
const AppState = {
  isPlaying: false,
  audio: null,
  volume: CONFIG.defaultVolume,
  currentTrack: "",
  currentPlaylist: "", // Добавлено для хранения названия плейлиста
  trackUpdateInterval: null,
  playlistUpdateInterval: null, // Добавлено для обновления плейлиста
  lastUpdateTime: null,
  wakeLock: null,
  isWakeLockSupported: false,
};

// DOM элементы
const Elements = {
  recordButton: document.getElementById("recordButton"),
  statusText: document.getElementById("statusText"),
  statusIcon: document.getElementById("statusIcon"),
  volumeSlider: document.getElementById("volumeSlider"),
  skullIcon: document.getElementById("skullIcon"),
  skullGlow: document.getElementById("skullGlow"),
  body: document.body,
  marqueeContainer: document.getElementById("marqueeContainer"),
  marqueeTrack: document.getElementById("marqueeTrack"),
  currentTrackText: document.getElementById("currentTrackText"),
  playlistName: document.getElementById("playlist-name"),
  nextTrackContainer: document.getElementById("nextTrackContainer"),
  nextTrackText: document.getElementById("nextTrackText"),
  nextTrackToggle: document.getElementById("nextTrackToggle"),
  nextTracksAccordion: document.getElementById("nextTracksAccordion"),
  nextTracksList: document.getElementById("nextTracksList"),
};

Elements.nextTrackToggle.addEventListener("click", () => {
  const isOpen = Elements.nextTracksAccordion.classList.toggle("open");
  Elements.nextTrackToggle.classList.toggle("open", isOpen);
});

// Инициализация приложения
async function initApp() {
  console.log("💀 EternalRock Radio - Skull Edition 💀");

  // Проверяем поддержку Wake Lock API
  AppState.isWakeLockSupported = "wakeLock" in navigator;

  if (AppState.isWakeLockSupported) {
    console.log("✅ Wake Lock API поддерживается");
  } else {
    console.warn("⚠️ Wake Lock API не поддерживается");
  }

  // Установка начального состояния
  updateUI();

  // Настройка элементов управления
  setupEventListeners();

  // Установка начальной громкости
  Elements.volumeSlider.value = AppState.volume * 100;

  // Проверка наличия иконки
  checkSkullIcon();

  // Получаем начальные данные (трек и плейлист)
  await getCurrentTrackAndPlaylist();
}

// Проверка наличия иконки черепа
function checkSkullIcon() {
  const skullImg = Elements.skullIcon;

  skullImg.onerror = function () {
    console.warn("⚠️ Иконка черепа не найдена, создаем fallback");
    createFallbackSkull();
  };

  skullImg.onload = function () {
    console.log("✅ Иконка черепа успешно загружена");
  };
}

// функция для управления анимацией на мобильных
function setupMobileAnimation() {
  // Проверяем ширину экрана
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // На мобильных делаем анимацию быстрее
    const marqueeTrack = Elements.marqueeTrack;
    if (marqueeTrack) {
      const trackLength = AppState.currentTrack.length;

      if (trackLength > 40) {
        marqueeTrack.style.animationDuration = "20s";
      } else if (trackLength > 60) {
        marqueeTrack.style.animationDuration = "25s";
      } else {
        marqueeTrack.style.animationDuration = "15s";
      }
    }
  }
}

// при изменении размера окна
window.addEventListener("resize", setupMobileAnimation);

// Функция для получения текущего трека и плейлиста (объединенная)
async function getCurrentTrackAndPlaylist() {
  try {
    const apiUrl = `https://myradio24.com/users/${CONFIG.radioId}/status.json`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    /* ===== ОЧЕРЕДЬ ТРЕКОВ (ПОСЛЕ СЛЕДУЮЩЕГО) ===== */
    Elements.nextTracksList.innerHTML = "";

    if (Array.isArray(data.nextsongs) && data.nextsongs.length > 1) {
      data.nextsongs.slice(1, 11).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = decodeHtmlEntities(item.song);
        Elements.nextTracksList.appendChild(li);
      });
    }

    /* ================== ТЕКУЩИЙ ТРЕК ================== */
    if (data && data.song) {
      const trackInfo = decodeHtmlEntities(data.song.trim());
      Elements.currentTrackText.textContent = trackInfo;
      AppState.currentTrack = trackInfo;
      AppState.lastUpdateTime = new Date();

      Elements.currentTrackText.textContent = trackInfo;

      // Скорость бегущей строки
      let animationClass = "";
      if (trackInfo.length > 60) animationClass = "long";
      if (trackInfo.length > 80) animationClass = "very-long";
      Elements.marqueeTrack.className = "marquee-track " + animationClass;

      Elements.currentTrackText.classList.add("track-appear");
      setTimeout(() => {
        Elements.currentTrackText.classList.remove("track-appear");
      }, 500);
    } else {
      Elements.currentTrackText.textContent = "Информация о треке недоступна";
    }

    /* ================== СЛЕДУЮЩИЙ ТРЕК ================== */
    if (
      Array.isArray(data.nextsongs) &&
      data.nextsongs.length > 0 &&
      data.nextsongs[0].song
    ) {
      const nextTrack = decodeHtmlEntities(data.nextsongs[0].song.trim());
      Elements.nextTrackText.textContent = nextTrack;

      if (AppState.isPlaying) {
        Elements.nextTrackContainer.style.display = "flex";
      }
    } else {
      Elements.nextTrackContainer.style.display = "none";
    }

    /* ================== ПЛЕЙЛИСТ ================== */
    if (data.playlist) {
      let playlistName = data.playlist
        .replace(/_/g, " ")
        .replace(/\s*\d+$/, "")
        .trim();

      AppState.currentPlaylist = playlistName;
    } else {
      AppState.currentPlaylist = "Rock / Metal / Alternative";
    }

    updatePlaylistNameUI();

    return {
      track: AppState.currentTrack,
      playlist: AppState.currentPlaylist,
    };
  } catch (error) {
    console.error("❌ Ошибка получения данных:", error);

    Elements.currentTrackText.textContent = "Ошибка загрузки";
    Elements.nextTrackContainer.style.display = "none";
    AppState.currentPlaylist = "Rock / Metal / Alternative";
    updatePlaylistNameUI();

    return null;
  }
}

setupMobileAnimation();

// Функция для обновления названия плейлиста в UI
function updatePlaylistNameUI() {
  if (!AppState.currentPlaylist) return;

  // Форматируем название (заменяем нижние подчеркивания на пробелы)
  const formattedName = AppState.currentPlaylist.replace(/_/g, " ");

  // Обновляем элемент плейлиста, если он существует
  if (Elements.playlistName) {
    // Убираем text-transform: uppercase и сохраняем обычный регистр
    Elements.playlistName.textContent = formattedName;
    Elements.playlistName.style.textTransform = "none"; // Убираем верхний регистр

    // Убираем лишние стили, оставляем только цвет
    Elements.playlistName.style.fontWeight = "normal";
    Elements.playlistName.style.letterSpacing = "normal";
    Elements.playlistName.style.padding = "0";
    Elements.playlistName.style.borderRadius = "0";
    Elements.playlistName.style.background = "transparent";
    Elements.playlistName.style.border = "none";
    Elements.playlistName.style.display = "inline"; // Обычный inline текст
    Elements.playlistName.style.marginLeft = "5px"; // Небольшой отступ
    Elements.playlistName.style.fontSize = "inherit"; // Наследуем размер шрифта
    Elements.playlistName.style.textShadow = "none"; // Убираем тень

    // Оставляем только цвет (как в CSS был #ff9d5c)
    Elements.playlistName.style.color = "#ff9d5c";

    // Добавляем анимацию обновления
    Elements.playlistName.classList.remove("playlist-update");
    void Elements.playlistName.offsetWidth; // Перезапуск анимации
    Elements.playlistName.classList.add("playlist-update");

    // Убираем класс анимации через 0.5 секунд
    setTimeout(() => {
      Elements.playlistName.classList.remove("playlist-update");
    }, 500);
  }
}

// Функция для обновления треков и плейлиста с интервалом
function startTrackAndPlaylistUpdates() {
  // Получаем данные сразу при включении
  getCurrentTrackAndPlaylist();

  // Очищаем старые интервалы, если есть
  if (AppState.trackUpdateInterval) {
    clearInterval(AppState.trackUpdateInterval);
  }

  // Устанавливаем интервал обновления (каждые 30 секунд)
  AppState.trackUpdateInterval = setInterval(getCurrentTrackAndPlaylist, 30000);

  console.log("🔄 Запущено обновление данных каждые 30 секунд");
}

// Функция для остановки обновления
function stopTrackAndPlaylistUpdates() {
  if (AppState.trackUpdateInterval) {
    clearInterval(AppState.trackUpdateInterval);
    AppState.trackUpdateInterval = null;
    console.log("⏹️ Обновление данных остановлено");
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Клик по пластинке
  Elements.recordButton.addEventListener("click", togglePlayback);

  // Изменение громкости
  Elements.volumeSlider.addEventListener("input", handleVolumeChange);

  // Управление клавиатурой
  document.addEventListener("keydown", handleKeyboard);

  // Эффекты при наведении на пластинку
  setupHoverEffects();

  // Слушаем события видимости страницы для Wake Lock
  if (AppState.isWakeLockSupported) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
}

// Обработчик изменения видимости страницы
function handleVisibilityChange() {
  if (document.hidden && AppState.wakeLock !== null && AppState.isPlaying) {
    console.log("Страница скрыта, но Wake Lock продолжает работать");
  }
}

// Активация Wake Lock
async function enableWakeLock() {
  if (!AppState.isWakeLockSupported) {
    console.log("Wake Lock API не поддерживается, пропускаем");
    return;
  }

  try {
    if (AppState.wakeLock !== null) {
      console.log("Wake Lock уже активирован");
      return;
    }

    AppState.wakeLock = await navigator.wakeLock.request("screen");

    AppState.wakeLock.addEventListener("release", () => {
      console.log("Wake Lock был освобожден");
    });

    console.log("✅ Wake Lock активирован");
  } catch (err) {
    console.error(`❌ Ошибка активации Wake Lock: ${err.name}, ${err.message}`);
    AppState.wakeLock = null;
  }
}

// Деактивация Wake Lock
async function disableWakeLock() {
  if (!AppState.isWakeLockSupported || AppState.wakeLock === null) {
    return;
  }

  try {
    await AppState.wakeLock.release();
    AppState.wakeLock = null;
    console.log("✅ Wake Lock деактивирован");
  } catch (err) {
    console.error(
      `❌ Ошибка деактивации Wake Lock: ${err.name}, ${err.message}`,
    );
  }
}

// Переключение воспроизведения
async function togglePlayback() {
  if (AppState.isPlaying) {
    await stopPlayback();
  } else {
    await startPlayback();
  }

  updateUI();
}

// Запуск воспроизведения
async function startPlayback() {
  try {
    AppState.audio = new Audio(CONFIG.streamUrl);
    AppState.audio.volume = AppState.volume;
    AppState.audio.preload = "auto";

    // Обработчики событий аудио
    AppState.audio.addEventListener("playing", onAudioPlaying);
    AppState.audio.addEventListener("error", onAudioError);
    AppState.audio.addEventListener("ended", onAudioEnded);

    // Запуск воспроизведения
    await AppState.audio.play();

    AppState.isPlaying = true;

    // Запускаем обновление треков и плейлиста
    startTrackAndPlaylistUpdates();

    // Активируем Wake Lock
    await enableWakeLock();

    updateUI();
    startSkullAnimation();
  } catch (error) {
    console.error("❌ Ошибка воспроизведения:", error);
    showError("Не удалось подключиться к радио");
    AppState.isPlaying = false;
    updateUI();
  }
}

// Остановка воспроизведения
async function stopPlayback() {
  if (AppState.audio) {
    AppState.audio.pause();
    AppState.audio.currentTime = 0;

    // Удаляем обработчики
    AppState.audio.removeEventListener("playing", onAudioPlaying);
    AppState.audio.removeEventListener("error", onAudioError);
    AppState.audio.removeEventListener("ended", onAudioEnded);

    AppState.audio = null;
  }

  AppState.isPlaying = false;

  // Деактивируем Wake Lock
  await disableWakeLock();

  // Останавливаем обновление
  stopTrackAndPlaylistUpdates();

  updateUI();
  stopSkullAnimation();
}

// Запуск анимации черепа - ИСПРАВЛЕННАЯ ВЕРСИЯ
function startSkullAnimation() {
  // Убираем все классы и стили, которые могли сбить центрирование
  Elements.skullIcon.classList.remove("skull-hover");
  Elements.skullIcon.classList.remove("skull-click");

  // Добавляем только один класс для анимации
  Elements.skullIcon.classList.add("skull-icon-playing");
  Elements.skullGlow.classList.add("skull-glow-playing");

  // Используем CSS класс для свечения вместо прямого стиля
  Elements.skullGlow.classList.add("skull-glow-active");
}

// Остановка анимации черепа - ИСПРАВЛЕННАЯ ВЕРСИЯ
function stopSkullAnimation() {
  Elements.skullIcon.classList.remove("skull-icon-playing");
  Elements.skullGlow.classList.remove("skull-glow-playing");

  // Убираем все дополнительные классы
  Elements.skullIcon.classList.remove("skull-hover");
  Elements.skullIcon.classList.remove("skull-click");
  Elements.skullGlow.classList.remove("skull-glow-active");

  // Возвращаем обычный фильтр через CSS класс
  Elements.skullIcon.classList.add("skull-default");
}

// Обработчики событий аудио
function onAudioPlaying() {
  console.log("✅ Радио запущено успешно");
}

function onAudioError(event) {
  console.error("❌ Ошибка аудио:", event);
  showError("Ошибка подключения к радиостанции");
  AppState.isPlaying = false;
  updateUI();
  stopSkullAnimation();
  stopTrackAndPlaylistUpdates();
  disableWakeLock();
}

function onAudioEnded() {
  console.log("⏹️ Воспроизведение завершено");
  AppState.isPlaying = false;
  updateUI();
  stopSkullAnimation();
  stopTrackAndPlaylistUpdates();
  disableWakeLock();
}

// Управление громкостью
function handleVolumeChange(event) {
  const volume = event.target.value / 100;
  AppState.volume = volume;

  if (AppState.audio) {
    AppState.audio.volume = volume;
  }
}

// Управление клавиатурой
function handleKeyboard(event) {
  switch (event.code) {
    case "Space":
      event.preventDefault();
      togglePlayback();
      break;

    case "ArrowUp":
      event.preventDefault();
      increaseVolume();
      break;

    case "ArrowDown":
      event.preventDefault();
      decreaseVolume();
      break;

    case "KeyM":
      event.preventDefault();
      toggleMute();
      break;

    case "KeyR":
      event.preventDefault();
      getCurrentTrackAndPlaylist(); // Обновляем и трек, и плейлист
      break;
  }
}

// Увеличение громкости
function increaseVolume() {
  let newVolume = AppState.volume + 0.1;
  if (newVolume > 1) newVolume = 1;

  AppState.volume = newVolume;
  Elements.volumeSlider.value = newVolume * 100;

  if (AppState.audio) {
    AppState.audio.volume = newVolume;
  }
}

// Уменьшение громкости
function decreaseVolume() {
  let newVolume = AppState.volume - 0.1;
  if (newVolume < 0) newVolume = 0;

  AppState.volume = newVolume;
  Elements.volumeSlider.value = newVolume * 100;

  if (AppState.audio) {
    AppState.audio.volume = newVolume;
  }
}

// Включение/выключение звука
function toggleMute() {
  if (AppState.audio) {
    AppState.audio.muted = !AppState.audio.muted;
    Elements.volumeSlider.disabled = AppState.audio.muted;
  }
}

// Эффекты при наведении - ИСПРАВЛЕННАЯ ВЕРСИЯ
function setupHoverEffects() {
  Elements.recordButton.addEventListener("mousedown", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.classList.add("record-click");
      Elements.skullIcon.classList.remove("skull-hover");
      Elements.skullIcon.classList.add("skull-click");
    }
  });

  Elements.recordButton.addEventListener("mouseup", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.classList.remove("record-click");
      Elements.recordButton.classList.add("record-hover");
      Elements.skullIcon.classList.remove("skull-click");
      Elements.skullIcon.classList.add("skull-hover");
    }
  });

  Elements.recordButton.addEventListener("mouseenter", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.classList.add("record-hover");
      Elements.skullIcon.classList.add("skull-hover");
      Elements.skullGlow.classList.add("skull-glow-hover");
    }
  });

  Elements.recordButton.addEventListener("mouseleave", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.classList.remove("record-hover", "record-click");
      Elements.skullIcon.classList.remove("skull-hover", "skull-click");
      Elements.skullGlow.classList.remove("skull-glow-hover");

      // Если радио выключено, добавляем дефолтный класс
      if (!AppState.isPlaying) {
        Elements.skullIcon.classList.add("skull-default");
      }
    }
  });
}

// Обновление интерфейса
function updateUI() {
  if (AppState.isPlaying) {
    /* ===== РАДИО ВКЛЮЧЕНО ===== */
    Elements.recordButton.classList.add("record-playing");
    Elements.statusIcon.className = "fas fa-play";
    Elements.body.classList.add("playing");

    Elements.recordButton.classList.remove("record-hover", "record-click");
    Elements.skullIcon.classList.remove(
      "skull-hover",
      "skull-click",
      "skull-default",
    );

    Elements.statusText.style.display = "none";
    Elements.marqueeContainer.style.display = "block";

    if (!AppState.currentTrack) {
      Elements.currentTrackText.textContent = "Загрузка информации о треке...";
    }

    // Следующий трек показываем только если есть текст
    if (Elements.nextTrackText.textContent) {
      Elements.nextTrackContainer.style.display = "flex";
    }
  } else {
    /* ===== РАДИО ВЫКЛЮЧЕНО ===== */
    Elements.recordButton.classList.remove("record-playing");
    Elements.statusIcon.className = "fas fa-pause";
    Elements.body.classList.remove("playing");

    Elements.skullIcon.classList.add("skull-default");

    Elements.statusText.style.display = "block";
    Elements.marqueeContainer.style.display = "none";
    Elements.statusText.textContent = "Радио выключено. Нажмите на пластинку";

    // ⬇️ обязательно скрываем
    Elements.nextTrackContainer.style.display = "none";
  }
}

function decodeHtmlEntities(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

// Показать ошибку
function showError(message) {
  const originalText = Elements.statusText.textContent;
  const originalColor = Elements.statusText.style.color;

  // Временно показываем ошибку
  Elements.statusText.style.display = "block";
  Elements.marqueeContainer.style.display = "none";
  Elements.statusText.textContent = `❌ ${message}`;
  Elements.statusText.style.color = "#ff4444";

  setTimeout(() => {
    if (AppState.isPlaying) {
      // Возвращаем бегущую строку
      Elements.statusText.style.display = "none";
      Elements.marqueeContainer.style.display = "block";
    } else {
      // Возвращаем обычный текст
      Elements.statusText.textContent = originalText;
      Elements.statusText.style.color = originalColor;
    }
  }, 3000);
}

// Fallback для иконки черепа (если изображение не загрузилось)
function createFallbackSkull() {
  const fallbackSVG = `
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#222" stroke="#ff5e00" stroke-width="2"/>
      <circle cx="35" cy="45" r="8" fill="#fff"/>
      <circle cx="65" cy="45" r="8" fill="#fff"/>
      <circle cx="35" cy="45" r="4" fill="#000"/>
      <circle cx="65" cy="45" r="4" fill="#000"/>
      <path d="M30,65 Q50,80 70,65" stroke="#ff5e00" stroke-width="3" fill="none"/>
      <ellipse cx="50" cy="80" rx="15" ry="5" fill="#ff5e00"/>
    </svg>
  `;

  Elements.skullIcon.outerHTML = fallbackSVG;
  console.log("✅ Fallback иконка черепа создана");
}

// Запуск при загрузке страницы
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Информация для консоли
console.log(
  "%c💀 EternalRock Radio - Skull Edition 💀",
  "color: #ff5e00; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px #ff5e00;",
);
console.log("%cУправление:", "color: #ff9d5c; font-weight: bold;");
console.log("• Нажмите на пластинку или пробел для воспроизведения/паузы");
console.log("• Стрелки Вверх/Вниз для регулировки громкости");
console.log("• M для отключения звука");
console.log("• R для обновления информации о текущем треке и плейлисте");
console.log("%cПоток: " + CONFIG.streamUrl, "color: #00ff88;");
