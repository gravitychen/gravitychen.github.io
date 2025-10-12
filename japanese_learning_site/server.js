// 简单的Node.js服务器，用于保存数据到文件
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 确保database文件夹存在
const databasePath = path.join(__dirname, 'database');
const folders = ['scenarios', 'sentences', 'qa_records', 'user_progress', 'backup'];

folders.forEach(folder => {
    const folderPath = path.join(databasePath, folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`创建文件夹: ${folderPath}`);
    }
});

// 保存情境数据
app.post('/api/save-scenario', (req, res) => {
    try {
        const { id, name, icon, sentences } = req.body;
        const timestamp = new Date().toISOString();
        const fileName = `scenario_${id}_${timestamp.split('T')[0]}.json`;
        
        const data = {
            id,
            name,
            icon,
            sentences: sentences || [],
            created_at: timestamp,
            updated_at: timestamp
        };
        
        const filePath = path.join(databasePath, 'scenarios', fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`情境数据已保存: ${filePath}`);
        res.json({ success: true, fileName });
    } catch (error) {
        console.error('保存情境数据失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 保存句子数据
app.post('/api/save-sentence', (req, res) => {
    try {
        const { scenario, level, chinese, hiragana, kanji, grammar } = req.body;
        const timestamp = new Date().toISOString();
        const fileName = `sentence_${scenario}_${timestamp.split('T')[0]}.json`;
        
        const data = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            scenario,
            level,
            chinese,
            hiragana,
            kanji,
            grammar,
            created_at: timestamp,
            updated_at: timestamp,
            review_count: 0,
            last_reviewed: null
        };
        
        const filePath = path.join(databasePath, 'sentences', fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`句子数据已保存: ${filePath}`);
        res.json({ success: true, fileName });
    } catch (error) {
        console.error('保存句子数据失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 保存问答数据
app.post('/api/save-qa', (req, res) => {
    try {
        const { question, answer, timestamp } = req.body;
        const fileName = `qa_${new Date().toISOString().split('T')[0]}.json`;
        
        const data = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            question,
            answer,
            created_at: timestamp || new Date().toISOString(),
            category: 'general',
            tags: []
        };
        
        const filePath = path.join(databasePath, 'qa_records', fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`问答数据已保存: ${filePath}`);
        res.json({ success: true, fileName });
    } catch (error) {
        console.error('保存问答数据失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取所有数据
app.get('/api/get-data', (req, res) => {
    try {
        const data = {
            scenarios: [],
            sentences: [],
            qa_records: [],
            user_progress: []
        };
        
        // 读取所有文件夹中的数据
        folders.forEach(folder => {
            const folderPath = path.join(databasePath, folder);
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                files.forEach(file => {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(folderPath, file);
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        data[folder].push(content);
                    }
                });
            }
        });
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取数据失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`数据库路径: ${databasePath}`);
});

// 导出app用于测试
module.exports = app;
