const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    icon: path.join(__dirname, 'icon.png'),
    alwaysOnTop: true, // 默认置顶
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 创建系统托盘
  createTray();

  // 窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 创建系统托盘
function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示/隐藏', 
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      } 
    },
    { 
      label: '置顶/取消置顶', 
      click: () => {
        const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
      } 
    },
    { type: 'separator' },
    { 
      label: '退出', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('番茄钟计时工具');
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，除非用户用Cmd + Q确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口
  if (mainWindow === null) createWindow();
});

const fs = require('fs');

// 添加IPC通信，处理渲染进程发来的消息
ipcMain.on('toggle-always-on-top', (event) => {
  const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
  event.returnValue = !isAlwaysOnTop;
});

ipcMain.on('save-music-file', (event, fileData) => {
  const userDataPath = app.getPath('userData');
  const musicCachePath = path.join(userDataPath, 'music_cache');
  if (!fs.existsSync(musicCachePath)) {
    fs.mkdirSync(musicCachePath, { recursive: true });
  }
  const filePath = path.join(musicCachePath, fileData.name);
  fs.writeFileSync(filePath, Buffer.from(fileData.data));
  event.returnValue = filePath;
});