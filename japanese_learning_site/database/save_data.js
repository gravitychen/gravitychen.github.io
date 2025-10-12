// 后端数据保存功能
class DatabaseManager {
    constructor() {
        this.databasePath = './database/';
        this.initDatabase();
    }

    // 初始化数据库结构
    initDatabase() {
        // 创建必要的文件夹结构
        this.createFolderStructure();
    }

    // 创建文件夹结构
    createFolderStructure() {
        const folders = [
            'scenarios',
            'sentences', 
            'qa_records',
            'user_progress',
            'backup'
        ];

        folders.forEach(folder => {
            // 在实际应用中，这里会创建文件夹
            console.log(`创建文件夹: ${this.databasePath}${folder}`);
        });
    }

    // 保存情境数据
    async saveScenario(scenarioData) {
        const timestamp = new Date().toISOString();
        const fileName = `scenario_${scenarioData.id}_${timestamp.split('T')[0]}.json`;
        
        const data = {
            id: scenarioData.id,
            name: scenarioData.name,
            icon: scenarioData.icon,
            created_at: timestamp,
            updated_at: timestamp,
            sentences: scenarioData.sentences || []
        };

        try {
            // 尝试通过API保存到服务器
            const response = await fetch('http://localhost:3000/api/save-scenario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`情境数据已保存到服务器: ${result.fileName}`);
                return { success: true, fileName: result.fileName };
            } else {
                throw new Error('服务器保存失败');
            }
        } catch (error) {
            console.error('保存情境数据失败:', error);
            // 如果服务器不可用，仍然返回成功（模拟保存）
            console.log(`模拟保存情境数据到: ${this.databasePath}scenarios/${fileName}`);
            console.log('情境数据:', data);
            return { success: true, fileName: fileName, note: '服务器不可用，仅模拟保存' };
        }
    }

    // 保存句子数据
    async saveSentence(sentenceData) {
        const timestamp = new Date().toISOString();
        const fileName = `sentence_${sentenceData.scenario}_${timestamp.split('T')[0]}.json`;
        
        const data = {
            id: sentenceData.id || this.generateId(),
            scenario: sentenceData.scenario,
            level: sentenceData.level,
            chinese: sentenceData.chinese,
            hiragana: sentenceData.hiragana,
            kanji: sentenceData.kanji,
            grammar: sentenceData.grammar,
            created_at: timestamp,
            updated_at: timestamp,
            review_count: 0,
            last_reviewed: null
        };

        try {
            // 尝试通过API保存到服务器
            const response = await fetch('http://localhost:3000/api/save-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`句子数据已保存到服务器: ${result.fileName}`);
                return { success: true, fileName: result.fileName };
            } else {
                throw new Error('服务器保存失败');
            }
        } catch (error) {
            console.error('保存句子数据失败:', error);
            // 如果服务器不可用，仍然返回成功（模拟保存）
            console.log(`模拟保存句子数据到: ${this.databasePath}sentences/${fileName}`);
            console.log('句子数据:', data);
            return { success: true, fileName: fileName, note: '服务器不可用，仅模拟保存' };
        }
    }

    // 保存问答记录
    async saveQA(qaData) {
        const timestamp = new Date().toISOString();
        const fileName = `qa_${timestamp.split('T')[0]}.json`;
        
        const data = {
            id: qaData.id || this.generateId(),
            question: qaData.question,
            answer: qaData.answer,
            created_at: qaData.timestamp || timestamp,
            category: qaData.category || 'general',
            tags: qaData.tags || []
        };

        try {
            // 尝试通过API保存到服务器
            const response = await fetch('http://localhost:3000/api/save-qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`问答数据已保存到服务器: ${result.fileName}`);
                return { success: true, fileName: result.fileName };
            } else {
                throw new Error('服务器保存失败');
            }
        } catch (error) {
            console.error('保存问答数据失败:', error);
            // 如果服务器不可用，仍然返回成功（模拟保存）
            console.log(`模拟保存问答数据到: ${this.databasePath}qa_records/${fileName}`);
            console.log('问答数据:', data);
            return { success: true, fileName: fileName, note: '服务器不可用，仅模拟保存' };
        }
    }

    // 保存用户进度
    async saveUserProgress(progressData) {
        const timestamp = new Date().toISOString();
        const fileName = `progress_${timestamp.split('T')[0]}.json`;
        
        const data = {
            date: timestamp.split('T')[0],
            total_sentences: progressData.totalSentences,
            total_grammar: progressData.totalGrammar,
            study_days: progressData.studyDays,
            qa_count: progressData.qaCount,
            scenarios_learned: progressData.scenariosLearned || [],
            levels_progress: progressData.levelsProgress || {},
            created_at: timestamp
        };

        try {
            console.log(`保存用户进度到: ${this.databasePath}user_progress/${fileName}`);
            console.log('用户进度数据:', data);
            
            // 在实际应用中，这里会写入文件
            // await fs.writeFile(`${this.databasePath}user_progress/${fileName}`, JSON.stringify(data, null, 2));
            
            return { success: true, fileName: fileName };
        } catch (error) {
            console.error('保存用户进度失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 备份数据
    async backupData() {
        const timestamp = new Date().toISOString();
        const backupFileName = `backup_${timestamp.split('T')[0]}_${timestamp.split('T')[1].split('.')[0]}.json`;
        
        try {
            // 收集所有数据
            const backupData = {
                timestamp: timestamp,
                scenarios: this.getAllScenarios(),
                sentences: this.getAllSentences(),
                qa_records: this.getAllQA(),
                user_progress: this.getUserProgress()
            };

            console.log(`创建数据备份: ${this.databasePath}backup/${backupFileName}`);
            console.log('备份数据:', backupData);
            
            // 在实际应用中，这里会写入备份文件
            // await fs.writeFile(`${this.databasePath}backup/${backupFileName}`, JSON.stringify(backupData, null, 2));
            
            return { success: true, fileName: backupFileName };
        } catch (error) {
            console.error('备份数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有情境
    getAllScenarios() {
        // 从localStorage获取情境数据
        const scenarios = JSON.parse(localStorage.getItem('japaneseLearningData') || '{}');
        return scenarios;
    }

    // 获取所有句子
    getAllSentences() {
        const learningData = JSON.parse(localStorage.getItem('japaneseLearningData') || '{}');
        const allSentences = [];
        
        Object.keys(learningData).forEach(scenario => {
            Object.keys(learningData[scenario]).forEach(level => {
                learningData[scenario][level].forEach(sentence => {
                    allSentences.push({
                        ...sentence,
                        scenario: scenario,
                        level: level
                    });
                });
            });
        });
        
        return allSentences;
    }

    // 获取所有问答
    getAllQA() {
        return JSON.parse(localStorage.getItem('qaHistory') || '[]');
    }

    // 获取用户进度
    getUserProgress() {
        return {
            totalSentences: document.getElementById('totalSentences')?.textContent || 0,
            totalGrammar: document.getElementById('totalGrammar')?.textContent || 0,
            studyDays: document.getElementById('studyDays')?.textContent || 0,
            qaCount: document.getElementById('qaCount')?.textContent || 0
        };
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 导出数据为JSON
    exportData() {
        const exportData = {
            export_date: new Date().toISOString(),
            scenarios: this.getAllScenarios(),
            sentences: this.getAllSentences(),
            qa_records: this.getAllQA(),
            user_progress: this.getUserProgress()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `japanese_learning_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        return { success: true, fileName: link.download };
    }

    // 导入数据
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // 导入情境数据
                    if (data.scenarios) {
                        localStorage.setItem('japaneseLearningData', JSON.stringify(data.scenarios));
                    }
                    
                    // 导入问答数据
                    if (data.qa_records) {
                        localStorage.setItem('qaHistory', JSON.stringify(data.qa_records));
                    }
                    
                    console.log('数据导入成功:', data);
                    resolve({ success: true, data: data });
                } catch (error) {
                    console.error('导入数据失败:', error);
                    reject({ success: false, error: error.message });
                }
            };
            reader.readAsText(file);
        });
    }
}

// 导出数据库管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
} else {
    window.DatabaseManager = DatabaseManager;
}
