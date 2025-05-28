/**
 * 计时器核心逻辑
 */

class Timer {
    constructor() {
        // 计时器状态
        this.isRunning = false;
        this.isPaused = false;
        this.isCountdown = true; // 默认为倒计时模式
        
        // 计时相关变量
        this.startTime = 0;
        this.pausedTime = 0;
        this.totalPausedTime = 0;
        this.duration = 25 * 60; // 默认25分钟（1500秒）
        this.remainingTime = this.duration;
        this.elapsedTime = 0;
        this.timerId = null;
        
        // 回调函数
        this.onTick = null;
        this.onComplete = null;
        
        // DOM元素
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
    }
    
    // 设置倒计时时间（秒）
    setDuration(seconds) {
        if (!this.isRunning) {
            this.duration = seconds;
            this.remainingTime = seconds;
            this.updateDisplay();
        }
    }
    
    // 设置计时模式
    setCountdownMode(isCountdown) {
        if (!this.isRunning) {
            this.isCountdown = isCountdown;
            if (isCountdown) {
                this.remainingTime = this.duration;
                this.elapsedTime = 0;
            } else {
                this.remainingTime = 0;
                this.elapsedTime = 0;
            }
            this.updateDisplay();
        }
    }
    
    // 开始计时
    start() {
        if (this.isPaused) {
            // 从暂停状态恢复
            this.isPaused = false;
            this.totalPausedTime += (Date.now() - this.pausedTime) / 1000;
        } else if (!this.isRunning) {
            // 新的计时开始
            this.startTime = Date.now();
            this.totalPausedTime = 0;
        }
        
        this.isRunning = true;
        
        // 清除可能存在的旧计时器
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        
        // 设置新的计时器，每秒更新一次
        this.timerId = setInterval(() => this.tick(), 1000);
        
        // 立即执行一次tick以更新显示
        this.tick();
    }
    
    // 暂停计时
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.pausedTime = Date.now();
            clearInterval(this.timerId);
        }
    }
    
    // 重置计时器
    reset() {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.isCountdown) {
            this.remainingTime = this.duration;
            this.elapsedTime = 0;
        } else {
            this.remainingTime = 0;
            this.elapsedTime = 0;
        }
        
        this.updateDisplay();
    }
    
    // 计时器每秒执行的函数
    tick() {
        if (this.isRunning && !this.isPaused) {
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.startTime) / 1000 - this.totalPausedTime;
            
            if (this.isCountdown) {
                // 倒计时模式
                this.remainingTime = Math.max(0, this.duration - deltaTime);
                this.elapsedTime = deltaTime;
                
                // 检查是否完成
                if (this.remainingTime <= 0) {
                    this.complete();
                    return;
                }
            } else {
                // 正计时模式
                this.elapsedTime = deltaTime;
                this.remainingTime = deltaTime;
            }
            
            this.updateDisplay();
            
            // 调用回调函数
            if (this.onTick) {
                this.onTick(this.isCountdown ? this.remainingTime : this.elapsedTime);
            }
        }
    }
    
    // 计时完成
    complete() {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.isPaused = false;
        this.updateDisplay();
        
        // 调用完成回调
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    // 更新显示
    updateDisplay() {
        const timeToDisplay = this.isCountdown ? this.remainingTime : this.elapsedTime;
        const minutes = Math.floor(timeToDisplay / 60);
        const seconds = Math.floor(timeToDisplay % 60);
        
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    // 获取当前状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            isCountdown: this.isCountdown,
            duration: this.duration,
            remainingTime: this.remainingTime,
            elapsedTime: this.elapsedTime
        };
    }
    
    // 获取计时结果（用于保存记录）
    getResult() {
        return {
            date: new Date().toISOString(),
            duration: this.duration,
            elapsedTime: this.elapsedTime,
            isCountdown: this.isCountdown
        };
    }
}