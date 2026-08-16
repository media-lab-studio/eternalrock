// Слайдер с полноэкранным режимом
class SlideShow {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.querySelector('.slide-nav.prev');
        this.nextBtn = document.querySelector('.slide-nav.next');
        this.fullscreenToggle = document.getElementById('fullscreenToggle');
        this.fullscreenExit = document.getElementById('fullscreenExit');
        this.slideShow = document.getElementById('slideShow'); // Используем ID
        this.currentSlide = 0;
        this.slideInterval = null;
        this.slideDuration = 5000;
        this.isFullscreen = false;
        
        console.log('Конструктор SlideShow вызван');
        console.log('slideShow элемент:', this.slideShow);
        console.log('fullscreenToggle:', this.fullscreenToggle);
        console.log('fullscreenExit:', this.fullscreenExit);
        
        this.init();
    }
    
    init() {
        console.log('Инициализация слайдера...');
        
        // Инициализация первого слайда
        this.showSlide(0);
        
        // Настройка кнопок навигации
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
            console.log('Кнопка prev найдена и настроена');
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
            console.log('Кнопка next найдена и настроена');
        }
        
        // Настройка индикаторов
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.showSlide(index));
        });
        
        // Настройка полноэкранного режима
        if (this.fullscreenToggle) {
            console.log('Кнопка полноэкранного режима найдена, добавляем обработчик');
            this.fullscreenToggle.addEventListener('click', (e) => {
                console.log('Клик по fullscreenToggle', e);
                this.toggleFullscreen();
            });
        } else {
            console.error('Кнопка полноэкранного режима НЕ найдена!');
        }
        
        if (this.fullscreenExit) {
            this.fullscreenExit.addEventListener('click', () => this.toggleFullscreen());
        }
        
        // Обработка клавиши ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.toggleFullscreen();
            }
        });
        
        // Автоматическое переключение
        this.startAutoSlide();
        
        // Пауза при наведении
        if (this.slideShow) {
            this.slideShow.addEventListener('mouseenter', () => this.stopAutoSlide());
            this.slideShow.addEventListener('mouseleave', () => {
                if (!this.isFullscreen) {
                    this.startAutoSlide();
                }
            });
        }
        
        console.log('Слайдер инициализирован');
    }
    
    showSlide(index) {
        // Скрыть текущий слайд
        this.slides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');
        
        // Установить новый индекс
        this.currentSlide = (index + this.slides.length) % this.slides.length;
        
        // Показать новый слайд
        this.slides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');
    }
    
    nextSlide() {
        this.showSlide(this.currentSlide + 1);
    }
    
    prevSlide() {
        this.showSlide(this.currentSlide - 1);
    }
    
    startAutoSlide() {
        this.stopAutoSlide();
        this.slideInterval = setInterval(() => this.nextSlide(), this.slideDuration);
    }
    
    stopAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    // Переключение полноэкранного режима
    toggleFullscreen() {
        console.log('toggleFullscreen вызван, isFullscreen:', this.isFullscreen);
        
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    // Вход в полноэкранный режим
    enterFullscreen() {
        console.log('enterFullscreen вызван');
        
        if (!this.slideShow) {
            console.error('slideShow элемент не найден!');
            return;
        }
        
        // Добавляем класс для CSS стилей
        this.slideShow.classList.add('fullscreen');
        this.isFullscreen = true;
        
        // Отключаем скролл страницы
        document.body.style.overflow = 'hidden';
        
        // Меняем иконку кнопки
        if (this.fullscreenToggle) {
            const icon = this.fullscreenToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-compress';
            }
        }
        
        // Показываем кнопку выхода
        if (this.fullscreenExit) {
            this.fullscreenExit.style.display = 'flex';
        }
        
        // Останавливаем автослайд
        this.stopAutoSlide();
        
        console.log('Полноэкранный режим активирован');
    }
    
    // Выход из полноэкранного режима
    exitFullscreen() {
        console.log('exitFullscreen вызван');
        
        if (!this.slideShow) {
            console.error('slideShow элемент не найден!');
            return;
        }
        
        // Убираем класс полноэкранного режима
        this.slideShow.classList.remove('fullscreen');
        this.isFullscreen = false;
        
        // Восстанавливаем скролл страницы
        document.body.style.overflow = 'auto';
        
        // Меняем иконку кнопки обратно
        if (this.fullscreenToggle) {
            const icon = this.fullscreenToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-expand';
            }
        }
        
        // Скрываем кнопку выхода
        if (this.fullscreenExit) {
            this.fullscreenExit.style.display = 'none';
        }
        
        // Возобновляем автослайд
        this.startAutoSlide();
        
        console.log('Выход из полноэкранного режима выполнен');
    }
}

// Обновление текущего времени
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (!timeElement) return;
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    timeElement.textContent = `${hours}:${minutes}`;
}

// Подсветка текущего пункта расписания
function highlightCurrentSchedule() {
    const items = document.querySelectorAll('.schedule-item');
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    let activeFound = false;
    
    items.forEach((item) => {
        const timeText = item.querySelector('.time').textContent;
        const times = timeText.match(/(\d{2}):(\d{2})/g);
        
        if (times && times.length === 2) {
            const [start, end] = times;
            const [startHour, startMinute] = start.split(':').map(Number);
            const [endHour, endMinute] = end.split(':').map(Number);
            
            const startTime = startHour * 60 + startMinute;
            let endTime = endHour * 60 + endMinute;
            
            if (endTime < startTime) {
                endTime += 24 * 60;
            }
            
            let currentTimeAdjusted = currentTime;
            if (currentTime < startTime && endTime > 24 * 60) {
                currentTimeAdjusted += 24 * 60;
            }
            
            item.classList.remove('active');
            
            const liveBadge = item.querySelector('.live-badge');
            if (liveBadge) {
                liveBadge.remove();
            }
            
            if (currentTimeAdjusted >= startTime && currentTimeAdjusted < endTime) {
                item.classList.add('active');
                activeFound = true;
                
                const programSpan = item.querySelector('.program');
                if (programSpan && !programSpan.querySelector('.live-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'live-badge';
                    badge.textContent = 'СЕЙЧАС В ЭФИРЕ';
                    programSpan.appendChild(badge);
                }
            }
        }
    });
    
    if (!activeFound) {
        items.forEach(item => {
            item.classList.remove('active');
            const liveBadge = item.querySelector('.live-badge');
            if (liveBadge) {
                liveBadge.remove();
            }
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ===');
    
    // Инициализация слайдера
    if (document.querySelector('.slide-show')) {
        console.log('Создание SlideShow...');
        window.slideShow = new SlideShow();
        console.log('SlideShow создан:', window.slideShow);
    } else {
        console.error('Элемент .slide-show не найден!');
    }
    
    // Обновление времени
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    
    // Подсветка расписания
    highlightCurrentSchedule();
    setInterval(highlightCurrentSchedule, 60000);
    
    // Обновление процента громкости
    const volumeSlider = document.getElementById('volumeSlider');
    const volumePercent = document.getElementById('volumePercent');
    
    if (volumeSlider && volumePercent) {
        volumeSlider.addEventListener('input', function() {
            volumePercent.textContent = `${this.value}%`;
        });
    }
    
    console.log('Инициализация завершена');
});