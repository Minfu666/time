const { ipcRenderer } = require('electron');
const path = require('path');

/**
 * 应用主逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化计时器、存储和音乐播放器
    const timer = new Timer();
    const storage = new TimerStorage();
    const musicPlayer = new MusicPlayer();
    
    // DOM元素
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const countdownModeRadio = document.getElementById('countdown-mode');
    const countupModeRadio = document.getElementById('countup-mode');
    const presetTimesSelect = document.getElementById('preset-times');
    const customTimeContainer = document.getElementById('custom-time-container');
    const customMinutesInput = document.getElementById('custom-minutes');
    const taskNameInput = document.getElementById('task-name');
    const historyContainer = document.getElementById('history-container');
    const emptyHistoryMessage = document.getElementById('empty-history');
    const clearHistoryBtn = document.getElementById('clear-history');
    const timerCompleteSound = document.getElementById('timer-complete-sound');
    const timerCard = document.querySelector('.timer-card');
    
    // 音乐播放器DOM元素
    const playMusicBtn = document.getElementById('play-music');
    const pauseMusicBtn = document.getElementById('pause-music');
    const prevTrackBtn = document.getElementById('prev-track');
    const nextTrackBtn = document.getElementById('next-track');
    const volumeSlider = document.getElementById('volume-slider');
    const musicFileInput = document.getElementById('music-file-input');
    const addMusicBtn = document.getElementById('add-music');
    const musicPlaylist = document.getElementById('music-playlist');
    const removeTrackBtn = document.getElementById('remove-track');
    const currentTrackName = document.getElementById('current-track-name');
    const autoPlayMusic = document.getElementById('auto-play-music');
    
    // 初始化历史记录显示
    renderHistory();
    
    // 设置计时器完成回调
    timer.onComplete = () => {
        // 播放提示音
        timerCompleteSound.play();
        
        // 显示通知
        if (Notification.permission === 'granted') {
            const taskName = taskNameInput.value || '未命名任务';
            new Notification('计时完成', {
                body: `${taskName} 已完成！`,
                icon: 'https://cdn-icons-png.flaticon.com/512/2784/2784459.png'
            });
        }
        
        // 保存记录
        const result = timer.getResult();
        result.taskName = taskNameInput.value;
        result.completed = true;
        storage.saveRecord(result);
        
        // 更新UI
        updateButtonStates();
        renderHistory();
        timerCard.classList.remove('timer-running', 'timer-paused');
    };
    
    // 请求通知权限
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // 事件监听器 - 开始按钮
    startBtn.addEventListener('click', () => {
        timer.start();
        updateButtonStates();
        timerCard.classList.add('timer-running');
        timerCard.classList.remove('timer-paused');
        
        // 如果设置了自动播放音乐，则开始播放
        if (autoPlayMusic.checked && !musicPlayer.isPlaying && musicPlayer.playlist.length > 0) {
            musicPlayer.play();
            updateMusicPlayerUI();
        }
    });
    
    // 事件监听器 - 暂停按钮
    pauseBtn.addEventListener('click', () => {
        timer.pause();
        updateButtonStates();
        timerCard.classList.remove('timer-running');
        timerCard.classList.add('timer-paused');
        
        // 如果设置了自动播放音乐，则暂停音乐
        if (autoPlayMusic.checked && musicPlayer.isPlaying) {
            musicPlayer.pause();
            updateMusicPlayerUI();
        }
    });
    
    // 事件监听器 - 重置按钮
    resetBtn.addEventListener('click', () => {
        timer.reset();
        updateButtonStates();
        timerCard.classList.remove('timer-running', 'timer-paused');
        
        // 如果设置了自动播放音乐，则停止音乐
        if (autoPlayMusic.checked && musicPlayer.isPlaying) {
            musicPlayer.stop();
            updateMusicPlayerUI();
        }
    });
    
    // 事件监听器 - 模式切换
    countdownModeRadio.addEventListener('change', () => {
        if (countdownModeRadio.checked) {
            timer.setCountdownMode(true);
            document.getElementById('countdown-settings').style.display = 'block';
            updatePresetTime();
        }
    });
    
    countupModeRadio.addEventListener('change', () => {
        if (countupModeRadio.checked) {
            timer.setCountdownMode(false);
            document.getElementById('countdown-settings').style.display = 'none';
        }
    });
    
    // 事件监听器 - 预设时间选择
    presetTimesSelect.addEventListener('change', () => {
        if (presetTimesSelect.value === 'custom') {
            customTimeContainer.style.display = 'block';
        } else {
            customTimeContainer.style.display = 'none';
            timer.setDuration(parseInt(presetTimesSelect.value));
        }
    });
    
    // 事件监听器 - 自定义时间输入
    customMinutesInput.addEventListener('change', () => {
        let minutes = parseInt(customMinutesInput.value);
        if (isNaN(minutes) || minutes < 1) minutes = 25;
        minutes = Math.min(Math.max(minutes, 1), 180); // 限制在1-180分钟
        customMinutesInput.value = minutes;
        timer.setDuration(minutes * 60);
    });
    
    // 事件监听器 - 清除历史
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有历史记录吗？')) {
            storage.clearHistory();
            renderHistory();
        }
    });
    
    // 更新预设时间
    function updatePresetTime() {
        if (presetTimesSelect.value === 'custom') {
            const minutes = parseInt(customMinutesInput.value) || 25;
            timer.setDuration(minutes * 60);
        } else {
            timer.setDuration(parseInt(presetTimesSelect.value));
        }
    }
    
    // 更新按钮状态
    function updateButtonStates() {
        const status = timer.getStatus();
        
        startBtn.disabled = status.isRunning && !status.isPaused;
        pauseBtn.disabled = !status.isRunning || status.isPaused;
        resetBtn.disabled = !status.isRunning && !status.isPaused && 
                           ((status.isCountdown && status.remainingTime === status.duration) || 
                            (!status.isCountdown && status.elapsedTime === 0));
        
        countdownModeRadio.disabled = status.isRunning || status.isPaused;
        countupModeRadio.disabled = status.isRunning || status.isPaused;
        presetTimesSelect.disabled = status.isRunning || status.isPaused || !status.isCountdown;
        customMinutesInput.disabled = status.isRunning || status.isPaused || !status.isCountdown || presetTimesSelect.value !== 'custom';
    }
    
    // 音乐播放器事件监听器
    playMusicBtn.addEventListener('click', () => {
        musicPlayer.play();
        updateMusicPlayerUI();
    });
    
    pauseMusicBtn.addEventListener('click', () => {
        musicPlayer.pause();
        updateMusicPlayerUI();
    });
    
    prevTrackBtn.addEventListener('click', () => {
        musicPlayer.previous();
        updateMusicPlayerUI();
    });
    
    nextTrackBtn.addEventListener('click', () => {
        musicPlayer.next();
        updateMusicPlayerUI();
    });
    
    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        musicPlayer.setVolume(volume);
    });
    
    // 添加音乐到播放列表
    addMusicBtn.addEventListener('click', () => {
        const file = musicFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const fileData = {
                    name: file.name,
                    data: Array.from(new Uint8Array(reader.result))
                };
                const filePath = ipcRenderer.sendSync('save-music-file', fileData);
                const track = {
                    name: file.name,
                    url: path.toNamespacedPath(filePath) // 使用path.toNamespacedPath处理路径
                };
                musicPlayer.addTrack(track);
                updatePlaylistUI();
                musicFileInput.value = '';
            };
            reader.readAsArrayBuffer(file);
        }
    });
    
    // 从播放列表中移除音乐
    removeTrackBtn.addEventListener('click', () => {
        const selectedIndex = musicPlaylist.selectedIndex;
        if (selectedIndex !== -1) {
            musicPlayer.removeTrack(selectedIndex);
            updatePlaylistUI();
            updateMusicPlayerUI();
        }
    });
    
    // 选择播放列表中的音乐
    musicPlaylist.addEventListener('dblclick', () => {
        const selectedIndex = musicPlaylist.selectedIndex;
        if (selectedIndex !== -1) {
            musicPlayer.currentTrackIndex = selectedIndex;
            musicPlayer.play();
            updateMusicPlayerUI();
        }
    });
    
    // 更新音乐播放器UI
    function updateMusicPlayerUI() {
        // 更新当前播放的音乐名称
        const currentTrack = musicPlayer.getCurrentTrack();
        if (currentTrack) {
            currentTrackName.textContent = currentTrack.name;
        } else {
            currentTrackName.textContent = '未选择音乐';
        }
        
        // 更新播放/暂停按钮状态
        if (musicPlayer.isPlaying) {
            playMusicBtn.disabled = true;
            pauseMusicBtn.disabled = false;
        } else {
            playMusicBtn.disabled = musicPlayer.playlist.length === 0;
            pauseMusicBtn.disabled = true;
        }
        
        // 更新上一首/下一首按钮状态
        prevTrackBtn.disabled = musicPlayer.playlist.length <= 1;
        nextTrackBtn.disabled = musicPlayer.playlist.length <= 1;
    }
    
    // 更新播放列表UI
    function updatePlaylistUI() {
        // 清空播放列表
        musicPlaylist.innerHTML = '';
        
        // 添加音乐到播放列表
        musicPlayer.playlist.forEach((track, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = track.name;
            if (index === musicPlayer.currentTrackIndex) {
                option.selected = true;
            }
            musicPlaylist.appendChild(option);
        });
        
        // 更新按钮状态
        updateMusicPlayerUI();
    }
    
    // 初始化音乐播放器UI
    updatePlaylistUI();
    
    // 渲染历史记录
    function renderHistory() {
        const history = storage.getHistory();
        historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            emptyHistoryMessage.style.display = 'block';
            return;
        }
        
        emptyHistoryMessage.style.display = 'none';
        
        history.forEach(record => {
            const date = new Date(record.date);
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            const minutes = Math.floor(record.elapsedTime / 60);
            const seconds = Math.floor(record.elapsedTime % 60);
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'list-group-item history-item';
            historyItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${record.taskName}</h6>
                    <small>${formattedDate}</small>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <p class="mb-1">
                        <span class="badge ${record.isCountdown ? 'bg-primary' : 'bg-success'} me-2">
                            ${record.isCountdown ? '倒计时' : '正计时'}
                        </span>
                        时长: ${formattedTime}
                    </p>
                    <button class="btn btn-sm btn-outline-danger delete-record" data-id="${record.id}">
                        删除
                    </button>
                </div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
        
        // 添加删除记录的事件监听器
        document.querySelectorAll('.delete-record').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.getAttribute('data-id');
                storage.deleteRecord(recordId);
                renderHistory();
            });
        });
    }
    
    // 初始化UI状态
    updateButtonStates();
});