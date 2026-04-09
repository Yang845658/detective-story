// ===== 午夜美術館 - 遊戲引擎 v2.0 =====
// 修訂版：支持場景互動物品、逐步獲得線索

class DetectiveGame {
    constructor() {
        this.storyData = null;
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.collectedClues = [];
        this.investigatedItems = []; // 已調查的物品
        this.isWaitingForChoice = false;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadStory();
        console.log('🔍 午夜美術館 v2.0 - 遊戲已初始化');
    }
    
    bindEvents() {
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restartGame();
        });
        
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
        document.getElementById('start-screen')?.classList.add('hidden');
        document.querySelector('.game-main')?.classList.remove('hidden');
        document.querySelector('.sidebar')?.classList.remove('hidden');
        this.loadScene('scene_1');
    }
    
    restartGame() {
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.collectedClues = [];
        this.investigatedItems = [];
        this.isWaitingForChoice = false;
        
        document.getElementById('clue-list').innerHTML = '<p class="empty-hint">暫无线索</p>';
        document.getElementById('end-screen')?.classList.add('hidden');
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
        this.investigatedItems = []; // 重置場景調查狀態
        
        this.updateSceneDisplay(scene);
        this.updateCharacters(scene.characters);
        this.createInteractables(scene.interactables);
        this.clearChoices();
        this.showDialogue();
    }
    
    updateSceneDisplay(scene) {
        const bg = document.getElementById('scene-bg');
        if (bg) {
            bg.style.background = scene.background;
        }
        
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
                        ${char.emoji || '👤'}
                    </div>
                    <div class="character-name">${char.name}</div>
                `;
                area.appendChild(charEl);
            }
        });
    }
    
    createInteractables(interactables) {
        const area = document.getElementById('interactables-area');
        if (!area || !interactables) {
            if (area) area.innerHTML = '';
            return;
        }
        
        area.innerHTML = '';
        
        interactables.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'interactable-btn';
            btn.innerHTML = `
                <span class="interactable-icon">${item.icon}</span>
                <span class="interactable-name">${item.name}</span>
            `;
            
            const alreadyInvestigated = this.investigatedItems.includes(item.id);
            if (alreadyInvestigated) {
                btn.classList.add('investigated');
                btn.disabled = true;
            }
            
            btn.addEventListener('click', () => {
                this.investigateItem(item);
            });
            
            area.appendChild(btn);
        });
    }
    
    investigateItem(item) {
        if (this.investigatedItems.includes(item.id)) return;
        
        this.investigatedItems.push(item.id);
        
        // 添加線索
        if (item.clueId) {
            const clue = this.currentScene.clues.find(c => c.id === item.clueId);
            if (clue && !this.collectedClues.find(c => c.id === clue.id)) {
                this.addClueToDisplay(clue);
            }
        }
        
        // 顯示調查結果
        this.showInvestigationResult(item);
        
        // 更新按鈕狀態
        this.createInteractables(this.currentScene.interactables);
    }
    
    showInvestigationResult(item) {
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            speakerEl.textContent = `🔍 調查 ${item.name}`;
            speakerEl.style.color = '#4ecca3';
        }
        
        if (textEl) {
            const result = this.getInvestigationText(item.id);
            textEl.textContent = result;
        }
    }
    
    getInvestigationText(itemId) {
        const texts = {
            'phone': '來電記錄顯示，22:28 分有人用這台電話撥打了報警中心。但在 22:25 分，有一個未接來電...號碼是張偉的手機。',
            'clock': '掛鐘顯示 11 點 05 分。和我的手錶一致。等等，掛鐘的電池蓋是鬆的...有人打開過？',
            'logbook': '最後一個訪客簽名是「李娜」，時間 18:00。備註欄寫著「閉館檢查」。',
            'cabinet': '玻璃是從內部敲碎的。碎片都在外側，說明敲擊力來自裡面。但展櫃的鎖沒有被撬的痕跡...有鑰匙的人才能從裡面敲碎。',
            'alarm': '警報器在 22:30 觸發。但警報線路有被動過的痕跡...有人故意延遲了警報？',
            'footprints': '地板上有兩種腳印。一種是保安的黑色皮鞋...另一種是高跟鞋，37 碼。李娜今天穿的就是 37 碼高跟鞋。',
            'monitor': '屏幕確實是黑的。但指示燈是綠的...說明監控主機在運行。是有人故意關閉了顯示，不是故障。',
            'shift_log': '記錄本上有塗改痕跡。「19:00」被改成「20:00」「20:00」被改成「21:00」。有人修改了值班時間！',
            'phone_msg': '（張偉忘記收起手機，屏幕亮了）「催債公司：還剩 50 萬，明天最後期限」',
            'insurance_doc': '保險單顯示，如果鑽石被盜，李娜可以獲得 500 萬賠償。但有一個條款：如果是內部人員作案，保險公司可以拒賠。',
            'briefcase': '（公文包半開，露出一個玻璃切割器）這是...玻璃切割器？',
            'file_cabinet': '文件櫃沒鎖...裡面有張偉的個人資料。「張偉，欠賭債 50 萬，催債中」。原來李娜早就知道張偉的財務狀況。'
        };
        return texts[itemId] || '沒有發現特別的。';
    }
    
    showDialogue() {
        if (!this.currentScene) return;
        
        const dialogues = this.currentScene.dialogues;
        if (this.currentDialogueIndex >= dialogues.length) {
            this.showChoices();
            return;
        }
        
        const dialogue = dialogues[this.currentDialogueIndex];
        
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            const speaker = this.storyData.characters[dialogue.speaker];
            speakerEl.textContent = speaker ? speaker.name : dialogue.speaker;
            speakerEl.style.color = speaker ? speaker.color : '#4ecca3';
        }
        
        if (textEl) {
            this.typeWriterEffect(textEl, dialogue.text);
        }
        
        // 自動收集非互動物品線索（按順序）
        if (this.currentScene.clues) {
            this.autoCollectClues(this.currentDialogueIndex);
        }
    }
    
    autoCollectClues(dialogueIndex) {
        // 只在特定對話索引收集線索（模擬逐步獲得）
        const clueCollectionPoints = {
            'scene_1': [3, 9], // 在第 4 和第 10 段對話時收集
            'scene_2': [3, 9],
            'scene_3': [3, 8],
            'scene_4': [3, 9]
        };
        
        const sceneId = this.currentScene.id;
        const points = clueCollectionPoints[sceneId];
        
        if (points && points.includes(dialogueIndex)) {
            const sceneClues = this.currentScene.clues.filter(c => !c.fromInteractable);
            const collectedCount = this.collectedClues.filter(c => 
                this.currentScene.clues.find(sc => sc.id === c.id)
            ).length;
            
            if (collectedCount < sceneClues.length) {
                const nextClue = sceneClues.find(c => 
                    !this.collectedClues.find(cc => cc.id === c.id)
                );
                if (nextClue) {
                    this.addClueToDisplay(nextClue);
                }
            }
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
    
    addClueToDisplay(clue) {
        if (this.collectedClues.find(c => c.id === clue.id)) return;
        
        this.collectedClues.push(clue);
        
        const clueList = document.getElementById('clue-list');
        if (!clueList) return;
        
        if (clueList.querySelector('.empty-hint')) {
            clueList.innerHTML = '';
        }
        
        const clueEl = document.createElement('div');
        clueEl.className = 'clue-item';
        clueEl.innerHTML = `
            <div class="clue-item-name">📌 ${clue.name}</div>
            <div class="clue-item-desc">${clue.description}</div>
        `;
        clueList.appendChild(clueEl);
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
            
            if (choice.requiredClues) {
                const hasAllClues = choice.requiredClues.every(clueId => 
                    this.collectedClues.find(c => c.id === clueId)
                );
                if (!hasAllClues) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.textContent += ' (需要更多線索)';
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

let game = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = new DetectiveGame();
    });
} else {
    game = new DetectiveGame();
}
