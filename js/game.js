// ===== 午夜美術館 - 遊戲引擎 =====

class DetectiveGame {
    constructor() {
        this.storyData = null;
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.collectedClues = [];
        this.isWaitingForChoice = false;
        
        this.init();
    }
    
    async init() {
        // 綁定事件
        this.bindEvents();
        
        // 加載故事數據
        await this.loadStory();
        
        console.log('🔍 午夜美術館 - 遊戲已初始化');
    }
    
    bindEvents() {
        // 開始按鈕
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.startGame();
        });
        
        // 重新開始按鈕
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restartGame();
        });
        
        // 對話框點擊
        document.getElementById('dialogue-box')?.addEventListener('click', () => {
            if (!this.isWaitingForChoice) {
                this.nextDialogue();
            }
        });
    }
    
    async loadStory() {
        try {
            const response = await fetch('data/story.json');
            this.storyData = await response.json();
            console.log('📖 故事數據加載成功');
        } catch (error) {
            console.error('❌ 加載故事數據失敗:', error);
            alert('加載故事失敗，請刷新頁面重試');
        }
    }
    
    startGame() {
        // 隱藏開始界面
        document.getElementById('start-screen')?.classList.add('hidden');
        
        // 顯示遊戲主界面
        document.querySelector('.game-main')?.classList.remove('hidden');
        document.querySelector('.sidebar')?.classList.remove('hidden');
        
        // 開始第一個場景
        this.loadScene('scene_1');
    }
    
    restartGame() {
        // 重置狀態
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.collectedClues = [];
        this.isWaitingForChoice = false;
        
        // 清空線索
        document.getElementById('clue-list').innerHTML = '<p class="empty-hint">暫无线索</p>';
        
        // 隱藏結束界面
        document.getElementById('end-screen')?.classList.add('hidden');
        
        // 顯示開始界面
        document.getElementById('start-screen')?.classList.remove('hidden');
    }
    
    loadScene(sceneId) {
        const scene = this.storyData.scenes.find(s => s.id === sceneId);
        if (!scene) {
            console.error('場景不存在:', sceneId);
            return;
        }
        
        this.currentScene = scene;
        this.currentDialogueIndex = 0;
        this.isWaitingForChoice = false;
        
        // 更新場景顯示
        this.updateSceneDisplay(scene);
        
        // 更新角色顯示
        this.updateCharacters(scene.characters);
        
        // 清除選項
        this.clearChoices();
        
        // 顯示第一段對話
        this.showDialogue();
    }
    
    updateSceneDisplay(scene) {
        // 更新背景
        const bg = document.getElementById('scene-bg');
        if (bg) {
            bg.style.background = scene.background;
        }
        
        // 更新場景信息
        const nameEl = document.getElementById('scene-name');
        const timeEl = document.getElementById('scene-time');
        if (nameEl) nameEl.textContent = scene.name;
        if (timeEl) timeEl.textContent = scene.time;
    }
    
    updateCharacters(characterIds) {
        const area = document.getElementById('characters-area');
        if (!area) return;
        
        area.innerHTML = '';
        
        characterIds.forEach(charId => {
            const char = this.storyData.characters[charId];
            if (char) {
                const charEl = document.createElement('div');
                charEl.className = 'character';
                charEl.innerHTML = `
                    <div class="character-avatar" style="background: ${char.color}20; border-color: ${char.color}">
                        ${this.getCharacterEmoji(charId)}
                    </div>
                    <div class="character-name">${char.name}</div>
                `;
                area.appendChild(charEl);
            }
        });
    }
    
    getCharacterEmoji(charId) {
        const emojis = {
            'linming': '🕵️',
            'zhangwei': '👮',
            'lina': '👩',
            'wangye': '👴',
            'narrator': '📖'
        };
        return emojis[charId] || '👤';
    }
    
    showDialogue() {
        if (!this.currentScene) return;
        
        const dialogues = this.currentScene.dialogues;
        if (this.currentDialogueIndex >= dialogues.length) {
            // 對話結束，顯示選項
            this.showChoices();
            return;
        }
        
        const dialogue = dialogues[this.currentDialogueIndex];
        
        // 更新對話框
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            const speaker = this.storyData.characters[dialogue.speaker];
            speakerEl.textContent = speaker ? speaker.name : dialogue.speaker;
            speakerEl.style.color = speaker ? speaker.color : '#4ecca3';
        }
        
        if (textEl) {
            // 打字機效果
            this.typeWriterEffect(textEl, dialogue.text);
        }
        
        // 收集線索
        if (this.currentScene.clues) {
            this.collectClues(this.currentScene.clues);
        }
    }
    
    typeWriterEffect(element, text) {
        element.textContent = '';
        let index = 0;
        
        const timer = setInterval(() => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(timer);
            }
        }, 30);
    }
    
    nextDialogue() {
        if (this.isWaitingForChoice) return;
        
        this.currentDialogueIndex++;
        this.showDialogue();
    }
    
    collectClues(clues) {
        const clueList = document.getElementById('clue-list');
        if (!clueList) return;
        
        // 清空空提示
        if (clueList.querySelector('.empty-hint')) {
            clueList.innerHTML = '';
        }
        
        clues.forEach(clue => {
            // 檢查是否已收集
            if (!this.collectedClues.find(c => c.id === clue.id)) {
                this.collectedClues.push(clue);
                
                const clueEl = document.createElement('div');
                clueEl.className = 'clue-item';
                clueEl.innerHTML = `
                    <div class="clue-item-name">📌 ${clue.name}</div>
                    <div class="clue-item-desc">${clue.description}</div>
                `;
                clueList.appendChild(clueEl);
            }
        });
    }
    
    showChoices() {
        this.isWaitingForChoice = true;
        
        const choicesArea = document.getElementById('choices-area');
        if (!choicesArea || !this.currentScene.choices) return;
        
        choicesArea.innerHTML = '';
        
        this.currentScene.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            
            if (choice.requiredClue) {
                const hasClue = this.collectedClues.find(c => c.id === choice.requiredClue);
                if (!hasClue) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.textContent += ' (需要線索)';
                }
            }
            
            btn.addEventListener('click', () => {
                this.makeChoice(choice);
            });
            
            choicesArea.appendChild(btn);
        });
    }
    
    clearChoices() {
        const choicesArea = document.getElementById('choices-area');
        if (choicesArea) {
            choicesArea.innerHTML = '';
        }
        this.isWaitingForChoice = false;
    }
    
    makeChoice(choice) {
        if (choice.restart) {
            this.restartGame();
        } else if (choice.nextScene) {
            this.loadScene(choice.nextScene);
        }
    }
}

// 啟動遊戲
let game = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = new DetectiveGame();
    });
} else {
    game = new DetectiveGame();
}
