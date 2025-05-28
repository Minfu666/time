/**
 * 数据存储逻辑
 */

class TimerStorage {
    constructor() {
        this.storageKey = 'timer_history';
    }
    
    // 保存计时记录
    saveRecord(record) {
        const history = this.getHistory();
        
        // 添加任务名称和完成状态到记录中
        record.taskName = record.taskName || '未命名任务';
        record.completed = record.completed || false;
        record.id = Date.now().toString(); // 使用时间戳作为唯一ID
        
        // 添加到历史记录的开头
        history.unshift(record);
        
        // 限制历史记录数量，最多保存50条
        if (history.length > 50) {
            history.pop();
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        return record;
    }
    
    // 获取所有历史记录
    getHistory() {
        const historyJson = localStorage.getItem(this.storageKey);
        return historyJson ? JSON.parse(historyJson) : [];
    }
    
    // 清除所有历史记录
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }
    
    // 删除特定记录
    deleteRecord(recordId) {
        const history = this.getHistory();
        const updatedHistory = history.filter(record => record.id !== recordId);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedHistory));
    }
    
    // 更新记录
    updateRecord(recordId, updates) {
        const history = this.getHistory();
        const updatedHistory = history.map(record => {
            if (record.id === recordId) {
                return { ...record, ...updates };
            }
            return record;
        });
        localStorage.setItem(this.storageKey, JSON.stringify(updatedHistory));
    }
    
    // 获取统计数据
    getStats() {
        const history = this.getHistory();
        
        // 如果没有记录，返回空统计
        if (history.length === 0) {
            return {
                totalSessions: 0,
                totalTime: 0,
                averageTime: 0,
                completedSessions: 0
            };
        }
        
        // 计算统计数据
        const totalSessions = history.length;
        const totalTime = history.reduce((sum, record) => sum + record.elapsedTime, 0);
        const averageTime = totalTime / totalSessions;
        const completedSessions = history.filter(record => record.completed).length;
        
        return {
            totalSessions,
            totalTime,
            averageTime,
            completedSessions
        };
    }
}