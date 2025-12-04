// АстроМаяк - Ввод натальных данных
// Основной JavaScript функционал

document.addEventListener('DOMContentLoaded', function() {
    // Глобальные переменные
    let selectedLocation = null;
    let debounceTimer = null;
    
    // Элементы DOM
    const form = document.getElementById('natal-form');
    const birthDateInput = document.getElementById('birth-date');
    const birthTimeInput = document.getElementById('birth-time');
    const birthLocationInput = document.getElementById('birth-location');
    const locationDropdown = document.getElementById('location-dropdown');
    const locationLoader = document.getElementById('location-loader');
    const generateBtn = document.getElementById('generate-btn');
    const resultSection = document.getElementById('result-section');
    const jsonResult = document.getElementById('json-result');
    const textResult = document.getElementById('text-result');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    // Элементы для отображения информации о выбранном месте
    const selectedLocationInfo = document.getElementById('selected-location-info');
    const selectedLocationName = document.getElementById('selected-location-name');
    const selectedLatitude = document.getElementById('selected-latitude');
    const selectedLongitude = document.getElementById('selected-longitude');
    const selectedTimezone = document.getElementById('selected-timezone');
    
    // Элементы для ошибок
    const dateError = document.getElementById('date-error');
    const timeError = document.getElementById('time-error');
    const locationError = document.getElementById('location-error');
    
    // Установка максимальной даты (сегодняшний день)
    const today = new Date().toISOString().split('T')[0];
    birthDateInput.setAttribute('max', today);
    
    // Функция для отображения toast уведомления
    function showToast(message, duration = 3000) {
        toastMessage.textContent = message;
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
        
        setTimeout(() => {
            toast.classList.remove('translate-x-0');
            toast.classList.add('translate-x-full');
        }, duration);
    }
    
    // Функция для валидации формы
    function validateForm() {
        let isValid = true;
        
        // Проверка даты
        if (!birthDateInput.value) {
            dateError.classList.remove('hidden');
            birthDateInput.classList.add('input-error');
            isValid = false;
        } else {
            dateError.classList.add('hidden');
            birthDateInput.classList.remove('input-error');
        }
        
        // Проверка времени
        if (!birthTimeInput.value) {
            timeError.classList.remove('hidden');
            birthTimeInput.classList.add('input-error');
            isValid = false;
        } else {
            timeError.classList.add('hidden');
            birthTimeInput.classList.remove('input-error');
        }
        
        // Проверка места
        if (!selectedLocation) {
            locationError.classList.remove('hidden');
            birthLocationInput.classList.add('input-error');
            isValid = false;
        } else {
            locationError.classList.add('hidden');
            birthLocationInput.classList.remove('input-error');
        }
        
        // Активация/деактивация кнопки генерации
        generateBtn.disabled = !isValid;
        
        return isValid;
    }
    
    // Функция для поиска местоположений через Nominatim API
    async function searchLocations(query) {
        if (!query || query.length < 3) return [];
        
        try {
            locationLoader.classList.remove('hidden');
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=ru`,
                {
                    headers: {
                        'User-Agent': 'AstroMayak Natal Data Input (https://example.com/contact)'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Ошибка при поиске местоположения');
            }
            
            const data = await response.json();
            return data.map(item => ({
                name: formatLocationName(item),
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                displayName: item.display_name,
                address: item.address
            }));
        } catch (error) {
            console.error('Ошибка при поиске местоположения:', error);
            showToast('Ошибка при поиске местоположения. Попробуйте еще раз.');
            return [];
        } finally {
            locationLoader.classList.add('hidden');
        }
    }
    
    // Функция для форматирования названия местоположения
    function formatLocationName(item) {
        const address = item.address;
        
        if (address.city) {
            return `${address.city}, ${address.country || ''}`;
        } else if (address.town) {
            return `${address.town}, ${address.country || ''}`;
        } else if (address.village) {
            return `${address.village}, ${address.country || ''}`;
        } else if (address.county) {
            return `${address.county}, ${address.country || ''}`;
        } else {
            return item.display_name;
        }
    }
    
    // Функция для получения часового пояса по координатам
    async function getTimezone(latitude, longitude) {
        try {
            // Используем TimeZoneDB API (бесплатный ключ для демонстрации)
            // В реальном приложении нужно получить свой API ключ
            const response = await fetch(
                `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${latitude}&lng=${longitude}`,
                {
                    headers: {
                        'User-Agent': 'AstroMayak Natal Data Input (https://example.com/contact)'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Ошибка при получении часового пояса');
            }
            
            const data = await response.json();
            return {
                name: data.zoneName,
                offset: data.gmtOffset
            };
        } catch (error) {
            console.error('Ошибка при получении часового пояса:', error);
            // В качестве запасного варианта используем встроенный метод
            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                return {
                    name: timezone,
                    offset: new Date().getTimezoneOffset() * -60
                };
            } catch (e) {
                return {
                    name: 'UTC',
                    offset: 0
                };
            }
        }
    }
    
    // Функция для отображения dropdown с результатами поиска
    function showLocationDropdown(locations) {
        locationDropdown.innerHTML = '';
        
        if (locations.length === 0) {
            locationDropdown.innerHTML = `
                <div class="location-dropdown-item p-4 text-center text-gray-400">
                    Местоположения не найдены
                </div>
            `;
        } else {
            locations.forEach(location => {
                const item = document.createElement('div');
                item.className = 'location-dropdown-item';
                item.innerHTML = `
                    <div class="location-name">${location.name}</div>
                    <div class="location-details">${location.displayName}</div>
                `;
                item.addEventListener('click', () => selectLocation(location));
                locationDropdown.appendChild(item);
            });
        }
        
        locationDropdown.classList.remove('hidden');
    }
    
    // Функция для выбора местоположения
    async function selectLocation(location) {
        selectedLocation = location;
        birthLocationInput.value = location.name;
        locationDropdown.classList.add('hidden');
        
        // Получение часового пояса
        const timezone = await getTimezone(location.latitude, location.longitude);
        selectedLocation.timezone = timezone;
        
        // Отображение информации о выбранном месте
        selectedLocationInfo.classList.remove('hidden');
        selectedLocationName.textContent = location.name;
        selectedLatitude.textContent = location.latitude.toFixed(4);
        selectedLongitude.textContent = location.longitude.toFixed(4);
        selectedTimezone.textContent = `${timezone.name} (UTC${timezone.offset >= 0 ? '+' : ''}${timezone.offset / 3600})`;
        
        // Валидация формы
        validateForm();
    }
    
    // Функция для форматирования смещения часового пояса
    function formatTimezoneOffset(offset) {
        const hours = Math.floor(Math.abs(offset) / 3600);
        const minutes = Math.floor((Math.abs(offset) % 3600) / 60);
        const sign = offset >= 0 ? '+' : '-';
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Функция для генерации результата
    function generateResult() {
        if (!validateForm()) return;
        
        const birthDate = birthDateInput.value;
        const birthTime = birthTimeInput.value;
        
        // Форматирование даты в формат ДД.ММ.ГГГГ
        const dateObj = new Date(birthDate);
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
        
        // Создание JSON объекта
        const jsonData = {
            birthDate: birthDate,
            birthTime: birthTime,
            location: {
                name: selectedLocation.name,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                timezone: selectedLocation.timezone.name,
                utcOffset: formatTimezoneOffset(selectedLocation.timezone.offset)
            }
        };
        
        // Создание текстового формата
        const textData = `Дата: ${formattedDate}
Время: ${birthTime}
Место: ${selectedLocation.name}
Широта: ${selectedLocation.latitude.toFixed(4)}
Долгота: ${selectedLocation.longitude.toFixed(4)}
Часовой пояс: ${selectedLocation.timezone.name} (UTC${formatTimezoneOffset(selectedLocation.timezone.offset)})`;
        
        // Отображение результатов
        jsonResult.textContent = JSON.stringify(jsonData, null, 2);
        textResult.textContent = textData;
        
        // Показ секции с результатами
        resultSection.classList.remove('hidden');
        resultSection.classList.add('fade-in');
        
        // Прокрутка к результатам
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Функция для копирования текста в буфер обмена
    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Визуальное подтверждение
            button.classList.add('copied');
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Скопировано!
            `;
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = originalHTML;
            }, 2000);
            
            showToast('Скопировано в буфер обмена!');
        } catch (error) {
            console.error('Ошибка при копировании:', error);
            showToast('Ошибка при копировании. Попробуйте еще раз.');
        }
    }
    
    // Обработчики событий
    
    // Ввод даты
    birthDateInput.addEventListener('change', validateForm);
    
    // Ввод времени
    birthTimeInput.addEventListener('change', validateForm);
    
    // Ввод местоположения с debounce
    birthLocationInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Сброс выбранного местоположения
        if (query === '') {
            selectedLocation = null;
            selectedLocationInfo.classList.add('hidden');
            locationDropdown.classList.add('hidden');
            validateForm();
            return;
        }
        
        // Отмена предыдущего таймера
        clearTimeout(debounceTimer);
        
        // Установка нового таймера
        debounceTimer = setTimeout(async () => {
            const locations = await searchLocations(query);
            showLocationDropdown(locations);
        }, 500);
    });
    
    // Закрытие dropdown при клике вне его
    document.addEventListener('click', function(event) {
        if (!birthLocationInput.contains(event.target) && !locationDropdown.contains(event.target)) {
            locationDropdown.classList.add('hidden');
        }
    });
    
    // Отправка формы
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        generateResult();
    });
    
    // Кнопки копирования
    copyJsonBtn.addEventListener('click', function() {
        copyToClipboard(jsonResult.textContent, this);
    });
    
    copyTextBtn.addEventListener('click', function() {
        copyToClipboard(textResult.textContent, this);
    });
    
    // Инициализация
    validateForm();
    
    // Создание звездного фона
    function createStars() {
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars';
        
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 4}s`;
            star.style.animationDuration = `${3 + Math.random() * 2}s`;
            starsContainer.appendChild(star);
        }
        
        document.body.appendChild(starsContainer);
    }
    
    createStars();
    
    // Сохранение данных в localStorage для кэширования
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка при сохранении в localStorage:', error);
        }
    }
    
    function getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Ошибка при получении из localStorage:', error);
            return null;
        }
    }
    
    // Кэширование результатов поиска
    function getCachedLocations(query) {
        return getFromLocalStorage(`location_${query}`);
    }
    
    function cacheLocations(query, locations) {
        saveToLocalStorage(`location_${query}`, locations);
    }
    
    // Модифицированная функция поиска с кэшированием
    async function searchLocationsWithCache(query) {
        if (!query || query.length < 3) return [];
        
        // Проверка кэша
        const cached = getCachedLocations(query);
        if (cached) {
            return cached;
        }
        
        // Поиск через API
        const locations = await searchLocations(query);
        
        // Сохранение в кэш
        cacheLocations(query, locations);
        
        return locations;
    }
    
    // Обновление функции поиска для использования кэша
    birthLocationInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query === '') {
            selectedLocation = null;
            selectedLocationInfo.classList.add('hidden');
            locationDropdown.classList.add('hidden');
            validateForm();
            return;
        }
        
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(async () => {
            const locations = await searchLocationsWithCache(query);
            showLocationDropdown(locations);
        }, 500);
    });
});