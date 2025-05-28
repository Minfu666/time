/**
 * Electron渲染进程脚本
 * 处理与主进程的通信和Electron特定功能
 */

// 检查是否在Electron环境中运行
const isElectron = () => {
    return window && window.process && window.process.type;
};

document.addEventListener('DOMContentLoaded', () => {
    const electronControls = document.getElementById('electron-controls');
    const togglePinBtn = document.getElementById('toggle-pin');
    
    // 如果在Electron环境中运行，显示Electron特定控件
    if (isElectron()) {
        // 引入Electron的ipcRenderer模块
        const { ipcRenderer } = require('electron');
        
        // 显示Electron控件
        electronControls.style.display = 'block';
        
        // 窗口置顶按钮点击事件
        togglePinBtn.addEventListener('click', () => {
            ipcRenderer.send('toggle-always-on-top');
            
            // 切换按钮样式
            togglePinBtn.classList.toggle('active');
            if (togglePinBtn.classList.contains('active')) {
                togglePinBtn.innerHTML = '<i class="bi bi-pin-fill"></i> 取消置顶';
                togglePinBtn.classList.replace('btn-outline-secondary', 'btn-secondary');
            } else {
                togglePinBtn.innerHTML = '<i class="bi bi-pin"></i> 窗口置顶';
                togglePinBtn.classList.replace('btn-secondary', 'btn-outline-secondary');
            }
        });
    }
});