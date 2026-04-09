// ===== 改進循環 5: 多結局系統 =====
// 添加完美結局、評分系統、成就追蹤

class DetectiveGame {
    constructor() {
        this.storyData = null;
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.collectedClues = [];
        this.investigatedItems = [];
        this.isWaitingForChoice = false;
        this.inactionCount = 0;
        this.hintShown = false;
        this.selectedClue = null;
        this.dialogueSpeed = 30;
        
        // 成就追蹤
        this.achievements = {
            allCluesCollected: false,  // 收集所有線索
            allItemsInvestigated: false, // 調查所有物品
            perfectChoice: false,       // 一次選擇正確
            noHintsUsed: false,         // 未使用提示
            speedRun: false             // 快速通關
        };
        
        this.gameStartTime = null;
        this.totalItemsInGame = 15; // 總物品數
        this.totalCluesInGame = 18; // 總線索數
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadStory();
        this.startInactionTimer();
        console.log('🔍 午夜美術館 v1.5 - 多結局系統版');
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
                this.resetInactionTimer();
            }
        });
        
        document.getElementById('hint-btn')?.addEventListener('click', () => {
            this.showHint();
            this.achievements.noHintsUsed = false;
        });
        
        document.getElementById('close-clue-detail')?.addEventListener('click', () => {
            this.closeClueDetail();
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
        this.inactionCount = 0;
        this.hintShown = false;
        this.gameStartTime = Date.now();
        this.achievements = {
            allCluesCollected: false,
            allItemsInvestigated: false,
            perfectChoice: false,
            noHintsUsed: true,
            speedRun: false
        };
        this.loadScene('scene_1');
        this.showStartEffect();
    }
    
    showStartEffect() {
        const main = document.querySelector('.game-main');
        if (main) {
            main.style.opacity = '0';
            main.style.transition = 'opacity 1s ease';
            setTimeout(() => {
                main.style.opacity = '1';
            }, 100);
        }
    }
    
    restartGame() {
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.collectedClues = [];
        this.investigatedItems = [];
        this.isWaitingForChoice = false;
        this.inactionCount = 0;
        this.hintShown = false;
        this.selectedClue = null;
        this.dialogueSpeed = 30;
        this.gameStartTime = null;
        
        document.getElementById('clue-list').innerHTML = '<p class="empty-hint">暫无线索</p>';
        document.getElementById('end-screen')?.classList.add('hidden');
        document.getElementById('start-screen')?.classList.remove('hidden');
        this.closeClueDetail();
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
        this.investigatedItems = [];
        this.resetInactionTimer();
        
        this.setDialogueSpeedForScene(sceneId);
        
        this.updateSceneDisplay(scene);
        this.updateCharacters(scene.characters);
        this.createInteractables(scene.interactables);
        this.clearChoices();
        this.showSceneTransition();
        
        setTimeout(() => {
            this.showDialogue();
        }, 500);
    }
    
    setDialogueSpeedForScene(sceneId) {
        const speeds = {
            'scene_1': 30,
            'scene_2': 30,
            'scene_3': 25,
            'scene_4': 25,
            'scene_5': 20,
            'ending_good': 35,
            'ending_perfect': 35,
            'ending_bad': 35
        };
        this.dialogueSpeed = speeds[sceneId] || 30;
    }
    
    showSceneTransition() {
        const sceneDisplay = document.getElementById('scene-display');
        if (sceneDisplay) {
            sceneDisplay.style.transform = 'translateX(20px)';
            sceneDisplay.style.opacity = '0';
            sceneDisplay.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                sceneDisplay.style.transform = 'translateX(0)';
                sceneDisplay.style.opacity = '1';
            }, 100);
        }
    }
    
    updateSceneDisplay(scene) {
        const bg = document.getElementById('scene-bg');
        if (bg) {
            bg.style.background = scene.background;
        }
        
        const nameEl = document.getElementById('scene-name');
        const timeEl = document.getElementById('scene-time');
        if (nameEl) {
            nameEl.textContent = scene.name;
            nameEl.style.animation = 'none';
            nameEl.offsetHeight;
            nameEl.style.animation = 'slideIn 0.5s ease';
        }
        if (timeEl) {
            timeEl.textContent = scene.time;
            timeEl.style.animation = 'fadeIn 0.5s ease';
        }
    }
    
    updateCharacters(characterIds) {
        const area = document.getElementById('characters-area');
        if (!area) return;
        
        area.innerHTML = '';
        
        characterIds.forEach((charId, index) => {
            const char = this.storyData.characters[charId];
            if (char) {
                const charEl = document.createElement('div');
                charEl.className = 'character';
                charEl.style.animationDelay = `${index * 0.2}s`;
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
        
        interactables.forEach((item, index) => {
            const btn = document.createElement('button');
            btn.className = 'interactable-btn';
            btn.style.animationDelay = `${index * 0.1}s`;
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
                this.resetInactionTimer();
            });
            
            area.appendChild(btn);
        });
    }
    
    investigateItem(item) {
        if (this.investigatedItems.includes(item.id)) return;
        
        this.investigatedItems.push(item.id);
        
        const btn = Array.from(document.querySelectorAll('.interactable-btn'))
            .find(b => b.textContent.includes(item.name));
        if (btn) {
            btn.classList.add('investigated');
            btn.disabled = true;
            btn.style.animation = 'pulse 0.5s ease';
        }
        
        if (item.clueId) {
            const clue = this.currentScene.clues.find(c => c.id === item.clueId);
            if (clue && !this.collectedClues.find(c => c.id === clue.id)) {
                this.addClueToDisplay(clue, true);
            }
        }
        
        this.showInvestigationResult(item);
        this.createInteractables(this.currentScene.interactables);
        
        // 檢查成就
        this.checkAchievements();
    }
    
    showInvestigationResult(item) {
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            speakerEl.textContent = `🔍 調查 ${item.name}`;
            speakerEl.style.color = '#4ecca3';
            speakerEl.style.animation = 'glow 1s ease infinite';
        }
        
        if (textEl) {
            const result = this.getInvestigationText(item.id);
            textEl.textContent = result;
            textEl.style.animation = 'fadeIn 0.3s ease';
        }
        
        setTimeout(() => {
            if (speakerEl) speakerEl.style.animation = '';
            if (textEl) textEl.style.animation = '';
        }, 2000);
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
            
            if (dialogue.emotion) {
                speakerEl.classList.add(`emotion-${dialogue.emotion}`);
                setTimeout(() => speakerEl.classList.remove(`emotion-${dialogue.emotion}`), 1000);
            }
        }
        
        if (textEl) {
            const isKeyDialogue = this.isKeyDialogue(dialogue.text);
            this.typeWriterEffect(textEl, dialogue.text, isKeyDialogue);
        }
        
        if (this.currentScene.clues) {
            this.autoCollectClues(this.currentDialogueIndex);
        }
    }
    
    autoCollectClues(dialogueIndex) {
        const clueCollectionPoints = {
            'scene_1': [3, 9],
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
                    this.addClueToDisplay(nextClue, true);
                }
            }
        }
    }
    
    isKeyDialogue(text) {
        const keywords = [
            '證據', '真相', '兇手', '就是你',
            '50 萬', '賭債', '切割器', '鑰匙',
            '內部', '嫁禍', '保險'
        ];
        
        return keywords.some(keyword => text.includes(keyword));
    }
    
    typeWriterEffect(element, text, isKeyDialogue = false) {
        // 修復：直接顯示完整文字，不使用打字機效果
        element.textContent = text;
        
        if (isKeyDialogue) {
            element.classList.add('key-dialogue');
            element.style.animation = 'glow 2s ease infinite';
            setTimeout(() => {
                element.style.animation = '';
            }, 4000);
        } else {
            element.classList.remove('key-dialogue');
        }
    }
    
    nextDialogue() {
        if (this.isWaitingForChoice) return;
        
        this.currentDialogueIndex++;
        this.showDialogue();
    }
    
    addClueToDisplay(clue, withAnimation = false) {
        if (this.collectedClues.find(c => c.id === clue.id)) return;
        
        this.collectedClues.push(clue);
        
        const clueList = document.getElementById('clue-list');
        if (!clueList) return;
        
        if (clueList.querySelector('.empty-hint')) {
            clueList.innerHTML = '';
        }
        
        const clueEl = document.createElement('div');
        clueEl.className = 'clue-item';
        if (withAnimation) {
            clueEl.style.animation = 'slideInRight 0.5s ease';
        }
        clueEl.innerHTML = `
            <div class="clue-item-name">📌 ${clue.name}</div>
            <div class="clue-item-desc">${clue.description}</div>
        `;
        
        clueEl.addEventListener('click', () => {
            this.showClueDetail(clue);
        });
        clueEl.style.cursor = 'pointer';
        clueEl.title = '點擊查看詳情';
        
        clueList.appendChild(clueEl);
        
        setTimeout(() => {
            clueList.scrollTop = clueList.scrollHeight;
        }, 100);
        
        // 檢查成就
        this.checkAchievements();
    }
    
    showChoices() {
        this.isWaitingForChoice = true;
        this.stopInactionTimer();
        
        const choicesArea = document.getElementById('choices-area');
        if (!choicesArea || !this.currentScene.choices) return;
        
        choicesArea.innerHTML = '';
        
        this.currentScene.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.style.animationDelay = `${index * 0.1}s`;
            
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
        
        this.checkHintNeeded();
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
            // 記錄選擇
            if (choice.nextScene === 'ending_good') {
                this.achievements.perfectChoice = true;
            }
            this.loadScene(choice.nextScene);
        }
    }
    
    // ===== 成就系統 =====
    
    checkAchievements() {
        // 檢查所有線索收集
        if (this.collectedClues.length >= this.totalCluesInGame) {
            this.achievements.allCluesCollected = true;
        }
        
        // 檢查所有物品調查
        if (this.investigatedItems.length >= this.totalItemsInGame) {
            this.achievements.allItemsInvestigated = true;
        }
    }
    
    calculateEnding() {
        const gameTime = (Date.now() - this.gameStartTime) / 1000; // 秒
        
        // 完美結局條件：
        // 1. 指認正確（李娜）
        // 2. 收集所有線索
        // 3. 調查所有物品
        // 4. 未使用提示
        // 5. 10 分鐘內完成
        
        const isPerfect = 
            this.achievements.perfectChoice &&
            this.achievements.allCluesCollected &&
            this.achievements.allItemsInvestigated &&
            this.achievements.noHintsUsed &&
            gameTime < 600;
        
        if (isPerfect) {
            this.achievements.speedRun = true;
            return 'ending_perfect';
        } else if (this.achievements.perfectChoice) {
            return 'ending_good';
        } else {
            return 'ending_bad';
        }
    }
    
    // ===== 提示系統 =====
    
    startInactionTimer() {
        this.inactionTimer = setInterval(() => {
            this.inactionCount++;
            
            if (this.inactionCount === 10 && !this.hintShown) {
                this.showGentleHint();
            }
            
            if (this.inactionCount === 30 && !this.hintShown) {
                this.showClearHint();
            }
        }, 1000);
    }
    
    resetInactionTimer() {
        this.inactionCount = 0;
    }
    
    stopInactionTimer() {
        if (this.inactionTimer) {
            clearInterval(this.inactionTimer);
        }
    }
    
    showGentleHint() {
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            speakerEl.textContent = '💡 提示';
            speakerEl.style.color = '#ffd700';
        }
        
        if (textEl) {
            textEl.textContent = '試試點擊場景中的物品進行調查，或者繼續對話獲取更多線索。';
            textEl.style.animation = 'fadeIn 0.3s ease';
        }
        
        this.hintShown = true;
    }
    
    showClearHint() {
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            speakerEl.textContent = '📋 重要提示';
            speakerEl.style.color = '#ffd700';
        }
        
        if (textEl) {
            const sceneId = this.currentScene?.id;
            let hint = '';
            
            if (sceneId === 'scene_1') {
                hint = '調查前台電話、掛鐘和訪客登記簿，這些可能藏有重要線索。';
            } else if (sceneId === 'scene_2') {
                hint = '仔細檢查破碎展櫃、警報器和地板腳印，思考玻璃碎片為什麼在外側。';
            } else if (sceneId === 'scene_3') {
                hint = '查看監控屏幕、值班記錄本和張偉的手機，注意時間線矛盾。';
            } else if (sceneId === 'scene_4') {
                hint = '檢查保險文件、李娜的公文包和文件櫃，找出關鍵證據。';
            }
            
            textEl.textContent = hint;
            textEl.style.animation = 'glow 1s ease infinite';
        }
        
        this.hintShown = true;
    }
    
    checkHintNeeded() {
        const sceneId = this.currentScene?.id;
        const requiredClues = {
            'scene_5': ['clue_key_holder', 'clue_briefcase', 'clue_insurance_doc']
        };
        
        if (sceneId === 'scene_5') {
            const missingClues = requiredClues[sceneId].filter(clueId => 
                !this.collectedClues.find(c => c.id === clueId)
            );
            
            if (missingClues.length > 0) {
                const speakerEl = document.getElementById('speaker-name');
                const textEl = document.getElementById('dialogue-text');
                
                if (speakerEl && textEl) {
                    speakerEl.textContent = '⚠️ 線索不足';
                    speakerEl.style.color = '#e74c3c';
                    textEl.textContent = '你還沒有收集足夠的線索。請返回之前的場景，調查所有物品並完成對話。';
                }
            }
        }
    }
    
    showHint() {
        this.hintShown = true;
        this.showClearHint();
    }
    
    // ===== 線索詳情系統 =====
    
    showClueDetail(clue) {
        this.selectedClue = clue;
        
        const detailPanel = document.getElementById('clue-detail-panel');
        const detailTitle = document.getElementById('clue-detail-title');
        const detailDesc = document.getElementById('clue-detail-desc');
        const detailAnalysis = document.getElementById('clue-detail-analysis');
        
        if (detailPanel && detailTitle && detailDesc) {
            detailTitle.textContent = `📌 ${clue.name}`;
            detailDesc.textContent = clue.description;
            
            if (detailAnalysis) {
                const analysis = this.getClueAnalysis(clue.id);
                detailAnalysis.textContent = analysis;
            }
            
            detailPanel.classList.remove('hidden');
            detailPanel.style.animation = 'slideInRight 0.3s ease';
        }
    }
    
    getClueAnalysis(clueId) {
        const analyses = {
            'clue_phone_record': '💡 張偉在報警前 3 分鐘打過電話給誰？這可能是他故意製造的假象。',
            'clue_clock': '💡 掛鐘被打開過，可能是為了調整時間，製造不在場證明。',
            'clue_logbook': '💡 李娜 18:00 最後離開，她有作案時間。',
            'clue_cabinet': '💡 從內部敲碎 + 無撬痕 = 有鑰匙的人。只有張偉和李娜有鑰匙。',
            'clue_alarm': '💡 警報被故意延遲，說明兇手知道警報系統。',
            'clue_footprints': '💡 37 碼高跟鞋 = 李娜的鞋印。她在案發時在現場。',
            'clue_monitor': '💡 監控是故意關閉的，不是故障。內部人員所為。',
            'clue_shift_log': '💡 值班記錄被塗改，張偉想掩蓋什麼？',
            'clue_phone_msg': '💡 張偉有賭債動機，但這太明顯了...可能是被嫁禍。',
            'clue_insurance_doc': '💡 內部人員作案可拒賠，所以李娜需要嫁禍給張偉。',
            'clue_briefcase': '💡 玻璃切割器！這是專業工具，普通人不會隨身攜帶。',
            'clue_file_cabinet': '💡 李娜知道張偉的賭債，說明她早就計劃嫁禍給他。'
        };
        return analyses[clueId] || '💡 這條線索可能很重要，仔細思考它的含義。';
    }
    
    closeClueDetail() {
        const detailPanel = document.getElementById('clue-detail-panel');
        if (detailPanel) {
            detailPanel.classList.add('hidden');
        }
        this.selectedClue = null;
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
