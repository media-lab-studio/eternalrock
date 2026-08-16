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
  currentPlaylist: "",
  trackUpdateInterval: null,
  playlistUpdateInterval: null,
  lastUpdateTime: null,
  wakeLock: null,
  isWakeLockSupported: false,
};

// DOM элементы
let Elements = {
  recordButton: null,
  recordSmall: null,
  statusText: null,
  statusIcon: null,
  volumeSlider: null,
  skullIcon: null,
  skullIconSmall: null,
  skullGlow: null,
  body: null,
  marqueeContainer: null,
  marqueeTrack: null,
  currentTrackText: null,
  playlistName: null,
  nextTrackText: null,
  volumePercent: null
};

// Инициализация приложения
async function initApp() {
  console.log("💀 EternalRock Radio - Skull Edition 💀");

  // Инициализируем элементы DOM
  initElements();
  
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
  if (Elements.volumeSlider) {
    Elements.volumeSlider.value = AppState.volume * 100;
  }

  // Проверка наличия иконки
  checkSkullIcon();

  // Получаем начальные данные (трек и плейлист)
  await getCurrentTrackAndPlaylist();
}

// Инициализация DOM элементов
function initElements() {
  Elements = {
    recordButton: document.getElementById("recordButton"),
    recordSmall: document.querySelector('.record-small'),
    statusText: document.getElementById("statusText"),
    statusIcon: document.getElementById("statusIcon"),
    volumeSlider: document.getElementById("volumeSlider"),
    skullIcon: document.getElementById("skullIcon"),
    skullIconSmall: document.querySelector('.skull-icon-small'),
    skullGlow: document.getElementById("skullGlow"),
    body: document.body,
    marqueeContainer: document.getElementById("marqueeContainer"),
    marqueeTrack: document.getElementById("marqueeTrack"),
    currentTrackText: document.getElementById("currentTrackText"),
    playlistName: document.getElementById("playlist-name"),
    nextTrackText: document.getElementById("nextTrackText"),
    volumePercent: document.getElementById("volumePercent")
  };
}

// Проверка наличия иконки черепа
function checkSkullIcon() {
  if (!Elements.skullIcon) return;
  
  const skullImg = Elements.skullIcon;
  skullImg.onerror = function () {
    console.warn("⚠️ Иконка черепа не найдена, создаем fallback");
    createFallbackSkull();
  };

  skullImg.onload = function () {
    console.log("✅ Иконка черепа успешно загружена");
  };
}

// Функция для получения текущего трека и плейлиста
async function getCurrentTrackAndPlaylist() {
  try {
    const apiUrl = `https://myradio24.com/users/${CONFIG.radioId}/status.json`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Форматирование символов UTF
    function decodeHtmlEntities(str) {
      const txt = document.createElement("textarea");
      txt.innerHTML = str;
      return txt.value;
    }

    /* ================== ТЕКУЩИЙ ТРЕК ================== */
    if (data && data.song) {
      const trackInfo = decodeHtmlEntities(data.song.trim());
      if (Elements.currentTrackText) {
        Elements.currentTrackText.textContent = trackInfo;
      }
      AppState.currentTrack = trackInfo;
      AppState.lastUpdateTime = new Date();

      // Скорость бегущей строки
      if (Elements.marqueeTrack) {
        let animationClass = "";
        if (trackInfo.length > 60) animationClass = "long";
        if (trackInfo.length > 80) animationClass = "very-long";
        Elements.marqueeTrack.className = "marquee-track " + animationClass;

        if (Elements.currentTrackText) {
          Elements.currentTrackText.classList.add("track-appear");
          setTimeout(() => {
            Elements.currentTrackText.classList.remove("track-appear");
          }, 500);
        }
      }
    } else if (Elements.currentTrackText) {
      Elements.currentTrackText.textContent = "Информация о треке недоступна";
    }

    /* ================== СЛЕДУЮЩИЙ ТРЕК ================== */
    if (Elements.nextTrackText) {
      if (
        Array.isArray(data.nextsongs) &&
        data.nextsongs.length > 0 &&
        data.nextsongs[0].song
      ) {
        const nextTrack = decodeHtmlEntities(data.nextsongs[0].song.trim());
        Elements.nextTrackText.textContent = nextTrack;
      } else {
        Elements.nextTrackText.textContent = "Информация недоступна";
      }
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

    if (Elements.currentTrackText) {
      Elements.currentTrackText.textContent = "Ошибка загрузки";
    }
    
    if (Elements.nextTrackText) {
      Elements.nextTrackText.textContent = "Ошибка загрузки";
    }
    
    AppState.currentPlaylist = "Rock / Metal / Alternative";
    updatePlaylistNameUI();

    return null;
  }
}

// Функция для обновления названия плейлиста в UI
function updatePlaylistNameUI() {
  if (!AppState.currentPlaylist || !Elements.playlistName) return;

  // Форматируем название (заменяем нижние подчеркивания на пробелы)
  const formattedName = AppState.currentPlaylist.replace(/_/g, " ");

  // Обновляем элемент плейлиста
  Elements.playlistName.textContent = formattedName;
  Elements.playlistName.style.textTransform = "none";
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
  if (Elements.recordButton) {
    Elements.recordButton.addEventListener("click", togglePlayback);
  }
  
  // Клик по маленькой пластинке
  if (Elements.recordSmall) {
    Elements.recordSmall.addEventListener("click", togglePlayback);
  }

  // Изменение громкости
  if (Elements.volumeSlider) {
    Elements.volumeSlider.addEventListener("input", handleVolumeChange);
    
    // Обновление процента громкости
    Elements.volumeSlider.addEventListener("input", function() {
      if (Elements.volumePercent) {
        Elements.volumePercent.textContent = `${this.value}%`;
      }
    });
  }

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
    AppState.audio.crossOrigin = "anonymous"; // Добавляем CORS заголовок

    // Обработчики событий аудио
    AppState.audio.addEventListener("playing", onAudioPlaying);
    AppState.audio.addEventListener("error", onAudioError);
    AppState.audio.addEventListener("ended", onAudioEnded);

    // Запуск воспроизведения
    const playPromise = AppState.audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          AppState.isPlaying = true;
          startTrackAndPlaylistUpdates();
          enableWakeLock();
          updateUI();
          startSkullAnimation();
        })
        .catch(error => {
          console.error("❌ Ошибка воспроизведения:", error);
          showError("Не удалось подключиться к радио");
          AppState.isPlaying = false;
          updateUI();
        });
    }
  } catch (error) {
    console.error("❌ Ошибка создания аудио:", error);
    showError("Не удалось создать плеер");
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

function startSkullAnimation() {
  // Большой череп
  if (Elements.skullIcon) {
    Elements.skullIcon.classList.remove("skull-hover", "skull-click");
    Elements.skullIcon.style.animation = "skull-pulse 2s ease-in-out infinite";
  }
  
  if (Elements.skullGlow) {
    Elements.skullGlow.classList.add("skull-glow-playing", "skull-glow-active");
  }
  
  // Маленький череп
  if (Elements.skullIconSmall) {
    Elements.skullIconSmall.style.filter = "drop-shadow(0 0 8px rgba(255, 94, 0, 1))";
    Elements.skullIconSmall.style.animation = "skull-pulse 2s ease-in-out infinite";
  }
  
  // Вращение пластинки
  if (Elements.recordButton) {
    Elements.recordButton.classList.add("record-playing");
  }
  
  if (Elements.recordSmall) {
    Elements.recordSmall.classList.add("record-playing-small");
  }
}

// Остановка анимации черепа
function stopSkullAnimation() {
  // Большой череп
  if (Elements.skullIcon) {
    Elements.skullIcon.style.animation = "none";
    Elements.skullIcon.classList.add("skull-default");
  }
  
  if (Elements.skullGlow) {
    Elements.skullGlow.classList.remove("skull-glow-playing", "skull-glow-active");
  }
  
  // Маленький череп
  if (Elements.skullIconSmall) {
    Elements.skullIconSmall.style.filter = "drop-shadow(0 0 5px rgba(255, 94, 0, 0.7))";
    Elements.skullIconSmall.style.animation = "none";
  }
  
  // Остановка вращения пластинки
  if (Elements.recordButton) {
    Elements.recordButton.classList.remove("record-playing");
  }
  
  if (Elements.recordSmall) {
    Elements.recordSmall.classList.remove("record-playing-small");
  }
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
      getCurrentTrackAndPlaylist();
      break;
  }
}

// Увеличение громкости
function increaseVolume() {
  let newVolume = AppState.volume + 0.1;
  if (newVolume > 1) newVolume = 1;

  AppState.volume = newVolume;
  if (Elements.volumeSlider) {
    Elements.volumeSlider.value = newVolume * 100;
  }

  if (AppState.audio) {
    AppState.audio.volume = newVolume;
  }
}

// Уменьшение громкости
function decreaseVolume() {
  let newVolume = AppState.volume - 0.1;
  if (newVolume < 0) newVolume = 0;

  AppState.volume = newVolume;
  if (Elements.volumeSlider) {
    Elements.volumeSlider.value = newVolume * 100;
  }

  if (AppState.audio) {
    AppState.audio.volume = newVolume;
  }
}

// Включение/выключение звука
function toggleMute() {
  if (AppState.audio) {
    AppState.audio.muted = !AppState.audio.muted;
    if (Elements.volumeSlider) {
      Elements.volumeSlider.disabled = AppState.audio.muted;
    }
  }
}

// Эффекты при наведении
function setupHoverEffects() {
  if (!Elements.recordButton || !Elements.skullIcon) return;

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
      if (Elements.skullGlow) {
        Elements.skullGlow.classList.add("skull-glow-hover");
      }
    }
  });

  Elements.recordButton.addEventListener("mouseleave", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.classList.remove("record-hover", "record-click");
      Elements.skullIcon.classList.remove("skull-hover", "skull-click");
      if (Elements.skullGlow) {
        Elements.skullGlow.classList.remove("skull-glow-hover");
      }
      
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
    // Большая пластинка
    if (Elements.recordButton) {
      Elements.recordButton.classList.add("record-playing");
    }
    
    // Маленькая пластинка
    if (Elements.recordSmall) {
      Elements.recordSmall.classList.add("record-playing-small");
    }
    
    // Статус иконка
    if (Elements.statusIcon) {
      Elements.statusIcon.className = "fas fa-play";
    }
    
    if (Elements.body) {
      Elements.body.classList.add("playing");
    }

    // Убираем эффекты наведения
    if (Elements.recordButton) {
      Elements.recordButton.classList.remove("record-hover", "record-click");
    }
    
    if (Elements.skullIcon) {
      Elements.skullIcon.classList.remove("skull-hover", "skull-click", "skull-default");
    }

    // Если нет информации о треке
    if (Elements.currentTrackText && !AppState.currentTrack) {
      Elements.currentTrackText.textContent = "Загрузка информации о треке...";
    }

  } else {
    /* ===== РАДИО ВЫКЛЮЧЕНО ===== */
    // Большая пластинка
    if (Elements.recordButton) {
      Elements.recordButton.classList.remove("record-playing");
    }
    
    // Маленькая пластинка
    if (Elements.recordSmall) {
      Elements.recordSmall.classList.remove("record-playing-small");
    }
    
    // Статус иконка
    if (Elements.statusIcon) {
      Elements.statusIcon.className = "fas fa-pause";
    }
    
    if (Elements.body) {
      Elements.body.classList.remove("playing");
    }

    // Возвращаем стандартный вид черепу
    if (Elements.skullIcon) {
      Elements.skullIcon.classList.add("skull-default");
    }
  }
}

// Показать ошибку
function showError(message) {
  console.error("❌ " + message);
  // Можно добавить уведомление для пользователя
}

// Fallback для иконки черепа
function createFallbackSkull() {
  if (!Elements.skullIcon) return;
  
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