const path = require('path');

/**
 * 背景音乐播放器逻辑
 */

class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true; // 循环播放
        this.audio.volume = 0.5; // 默认音量
        this.isPlaying = false;
        this.playlist = [];
        this.currentTrackIndex = 0;
        
        // 从本地存储加载播放列表
        this.loadPlaylist();
    }
    
    // 加载播放列表
    loadPlaylist() {
        const savedPlaylist = localStorage.getItem('music_playlist');
        if (savedPlaylist) {
            this.playlist = JSON.parse(savedPlaylist).map(track => ({
                name: track.name,
                url: path.toNamespacedPath(track.url) // 确保路径格式正确
            }));
        }
    }
    
    // 保存播放列表到本地存储
    savePlaylist() {
        localStorage.setItem('music_playlist', JSON.stringify(this.playlist));
    }
    
    // 添加音乐到播放列表
    addTrack(track) {
        this.playlist.push(track);
        this.savePlaylist();
    }
    
    // 从播放列表中移除音乐
    removeTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.playlist.splice(index, 1);
            this.savePlaylist();
            
            // 如果删除的是当前播放的音乐，则停止播放
            if (index === this.currentTrackIndex) {
                this.stop();
                // 如果播放列表还有音乐，播放下一首
                if (this.playlist.length > 0) {
                    this.currentTrackIndex = 0;
                    this.play();
                }
            } else if (index < this.currentTrackIndex) {
                // 如果删除的是当前播放音乐之前的音乐，调整当前索引
                this.currentTrackIndex--;
            }
        }
    }
    
    // 播放音乐
    play() {
        if (this.playlist.length === 0) return;
        
        const track = this.playlist[this.currentTrackIndex];
        this.audio.src = track.url;
        this.audio.play();
        this.isPlaying = true;
    }
    
    // 暂停音乐
    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }
    
    // 停止音乐
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }
    
    // 播放下一首
    next() {
        if (this.playlist.length === 0) return;
        
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        if (this.isPlaying) {
            this.play();
        }
    }
    
    // 播放上一首
    previous() {
        if (this.playlist.length === 0) return;
        
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        if (this.isPlaying) {
            this.play();
        }
    }
    
    // 设置音量 (0-1)
    setVolume(volume) {
        if (volume >= 0 && volume <= 1) {
            this.audio.volume = volume;
        }
    }
    
    // 获取当前播放的音乐信息
    getCurrentTrack() {
        if (this.playlist.length === 0) return null;
        return this.playlist[this.currentTrackIndex];
    }
}