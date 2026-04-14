// ===== 午夜美術館 v3.0 - 深度優化版 =====
// 新增：時間壓力系統、證據鏈系統、閃回插敘、多視角敘事

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
        
        // v3.0 新增：時間壓力系統
        this.timePressure = {
            enabled: false,
            currentTime: '23:00',
            timeRemaining: 600, // 分鐘
            timerInterval: null
        };
        
        // v3.0 新增：證據鏈系統
        this.evidenceChain = {
            enabled: false,
            requiredForHidden: []
        };
        
        // 成就追蹤
        this.achievements = {
            allCluesCollected: false,
            allItemsInvestigated: false,
            perfectChoice: false,
            noHintsUsed: false,
            speedRun: false,
            hiddenEndingUnlocked: false
        };
        
        this.gameStartTime = null;
        this.totalItemsInGame = 20;
        this.totalCluesInGame = 30;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadStory();
        this.startInactionTimer();
        console.log('🔍 午夜美術館 v3.0 - 深度優化版');
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
            
            // v3.0: 初始化時間壓力系統
            if (this.storyData.mechanics?.timePressure?.enabled) {
                this.timePressure.enabled = true;
            }
            
            // v3.0: 初始化證據鏈系統
            if (this.storyData.mechanics?.evidenceChain?.enabled) {
                this.evidenceChain.enabled = true;
                this.evidenceChain.requiredForHidden = 
                    this.storyData.mechanics.evidenceChain.requiredForHiddenEnding || [];
            }
            
            console.log('📖 故事數據加載成功');
            console.log('⏰ 時間壓力系統:', this.timePressure.enabled ? '已啟用' : '未啟用');
            console.log('🔗 證據鏈系統:', this.evidenceChain.enabled ? '已啟用' : '未啟用');
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
            speedRun: false,
            hiddenEndingUnlocked: false
        };
        
        // v3.0: 從序幕開始
        this.loadScene('scene_prologue');
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
        this.stopTimePressureTimer();
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
        this.timePressure.timeRemaining = 600;
        
        document.getElementById('clue-list').innerHTML = '<p class="empty-hint">暫无线索</p>';
        document.getElementById('end-screen')?.classList.add('hidden');
        document.getElementById('time-display')?.remove();
        document.getElementById('start-screen')?.classList.remove('hidden');
        this.closeClueDetail();
    }
    
    // v3.0: 時間壓力系統
    startTimePressureTimer() {
        if (!this.timePressure.enabled) return;
        
        this.stopTimePressureTimer();
        
        const timeDisplay = this.createTimeDisplay();
        
        this.timePressure.timerInterval = setInterval(() => {
            this.timePressure.timeRemaining -= 1; // 每次減少 1 分鐘（1 秒 = 1 分鐘）
            this.updateTimeDisplay(timeDisplay);
            
            // 警告閾值
            const thresholds = this.storyData.mechanics?.timePressure?.warningThresholds || [480, 240, 120, 60];
            if (thresholds.includes(this.timePressure.timeRemaining)) {
                this.showTimeWarning(this.timePressure.timeRemaining);
            }
            
            // 時間到
            if (this.timePressure.timeRemaining <= 0) {
                this.showTimeUpEnding();
            }
        }, 1000); // 1 秒 = 1 分鐘，600 分鐘 = 600 秒 = 10 分鐘遊戲時間
    }
    
    stopTimePressureTimer() {
        if (this.timePressure.timerInterval) {
            clearInterval(this.timePressure.timerInterval);
            this.timePressure.timerInterval = null;
        }
    }
    
    createTimeDisplay() {
        let timeDisplay = document.getElementById('time-display');
        if (!timeDisplay) {
            timeDisplay = document.createElement('div');
            timeDisplay.id = 'time-display';
            timeDisplay.className = 'time-display';
            timeDisplay.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(231, 76, 60, 0.9);
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                z-index: 1000;
                animation: pulse 2s ease infinite;
            `;
            document.querySelector('.game-container')?.appendChild(timeDisplay);
        }
        return timeDisplay;
    }
    
    updateTimeDisplay(element) {
        const hours = Math.floor(this.timePressure.timeRemaining / 60);
        const minutes = this.timePressure.timeRemaining % 60;
        const timeText = `${hours}小時${minutes}分鐘`;
        element.innerHTML = `⏰ 距離館長抵達：<br>${timeText}`;
        
        // 顏色變化
        if (this.timePressure.timeRemaining <= 60) {
            element.style.background = 'rgba(192, 57, 43, 0.95)';
        } else if (this.timePressure.timeRemaining <= 120) {
            element.style.background = 'rgba(230, 126, 34, 0.9)';
        }
    }
    
    showTimeWarning(minutes) {
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl && textEl) {
            speakerEl.textContent = '⏰ 時間警告';
            speakerEl.style.color = '#e74c3c';
            textEl.textContent = `只剩${minutes}分鐘了！館長就要抵達了，必須盡快破案！`;
            textEl.style.animation = 'glow 0.5s ease infinite';
            
            setTimeout(() => {
                textEl.style.animation = '';
            }, 3000);
        }
    }
    
    showTimeUpEnding() {
        this.stopTimePressureTimer();
        this.isWaitingForChoice = true;
        
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        const choicesArea = document.getElementById('choices-area');
        
        if (speakerEl) {
            speakerEl.textContent = '⏰ 時間到';
            speakerEl.style.color = '#e74c3c';
        }
        
        if (textEl) {
            textEl.textContent = '館長抵達了美術館...你還沒找出真兇。館長對你的能力產生懷疑，事務所聲譽受損。';
        }
        
        choicesArea.innerHTML = `
            <button class="choice-btn" onclick="game.restartGame()">重新開始</button>
        `;
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
        
        // v3.0: 處理閃回場景
        if (scene.isFlashback) {
            this.showFlashbackEffect();
        }
        
        // v3.0: 更新時間顯示
        if (scene.timeUpdate) {
            this.timePressure.currentTime = scene.timeUpdate.currentTime;
            this.timePressure.timeRemaining = scene.timeUpdate.timeRemaining;
            if (this.timePressure.enabled && sceneId !== 'scene_prologue') {
                this.startTimePressureTimer();
            }
        }
        
        setTimeout(() => {
            this.showDialogue();
        }, 500);
    }
    
    // v3.0: 閃回效果
    showFlashbackEffect() {
        const sceneDisplay = document.getElementById('scene-display');
        if (sceneDisplay) {
            sceneDisplay.style.filter = 'sepia(0.8) brightness(1.2)';
            sceneDisplay.style.transition = 'filter 1s ease';
            
            setTimeout(() => {
                sceneDisplay.style.filter = 'none';
            }, 2000);
        }
    }
    
    setDialogueSpeedForScene(sceneId) {
        const speeds = {
            'scene_prologue': 30,
            'scene_1': 30,
            'scene_2': 30,
            'scene_3': 25,
            'scene_4': 25,
            'scene_5': 20,
            'ending_normal': 35,
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
            'phone': '來電記錄顯示，22:28 分有人用這台電話撥打了報警中心。但在 22:25 分，有一個未接來電...號碼是張偉的手機。奇怪，為什麼他要先打給自己？',
            'clock': '掛鐘顯示 11 點 05 分。和我的手錶一致。等等，掛鐘的電池蓋是鬆的...有人打開過？（你打開電池蓋，裡面什麼都沒有，但感覺怪怪的）',
            'logbook': '最後一個訪客簽名是「李娜」，時間 18:00。備註欄寫著「閉館檢查」。對了，今天還有其他人來過嗎？張偉：「下午 3 點有個記者，說要採訪館長...我沒讓他進來，他就一直在外面拍照。」',
            'newspaper': '（撿起）今天的晚報...頭版是「美術館財政危機，鎮館之寶或將拍賣」。（你想起半年前聽說過，美術館資金鏈斷裂）',
            'cabinet': '玻璃是從內部敲碎的。碎片都在外側，說明敲擊力來自裡面。但展櫃的鎖沒有被撬的痕跡...有鑰匙的人才能從裡面敲碎。等等，這個切口...太整齊了。不像是敲碎的，像是先用玻璃刀切割過！',
            'alarm': '警報器在 22:30 觸發。但警報線路有被動過的痕跡...有人故意延遲了警報？（你注意到線路板上有一個模糊的指紋）',
            'footprints': '地板上有兩種腳印。一種是保安的黑色皮鞋...另一種是高跟鞋，37 碼。李娜今天穿的就是 37 碼高跟鞋。但奇怪的是，腳印只到展櫃前，沒有離開的痕跡...',
            'window': '（走到窗邊）窗戶是開的...外面在下雨，窗台上有泥濘的痕跡。還有這個——（你用強光手電照射）窗框上有刮痕，像是有人從外面爬進來過！（你拍下了照片）',
            'monitor': '屏幕確實是黑的。但指示燈是綠的...說明監控主機在運行。是有人故意關閉了顯示，不是故障。（你打開後蓋，發現攝像頭線路被拔掉了）等等，這個接口...有新鮮的插拔痕跡。',
            'shift_log': '記錄本上有塗改痕跡。「19:00」被改成「20:00」「20:00」被改成「21:00」。有人修改了值班時間！（你用強光手電照射，看到紙張背面有壓痕）這是...「小芸」兩個字？',
            'phone_msg': '（張偉忘記收起手機，屏幕亮了）（屏幕上顯示「市立醫院：張小芸家長，欠費 38000 元，請盡快繳納」）張偉：（搶過手機）沒、沒什麼！垃圾短信...',
            'tv_news': '（電視開著）本地新聞...「美術館財政危機持續，館長表示將尋求私人買家...」（新聞畫面裡，李娜站在展櫃前，表情複雜）',
            'insurance_doc': '保險單顯示，如果鑽石被盜，李娜可以獲得 500 萬賠償。但有一個條款：如果是內部人員作案，保險公司可以拒賠。（你翻到最後一頁，看到簽名日期）奇怪，這份保險是三天前才簽的...在館長說要拍賣鑽石之後。',
            'briefcase': '（公文包半開，露出一個玻璃切割器）林明：「這是...玻璃切割器？」李娜：（急忙合上）「這是我的工作工具！有時候需要開箱子...」林明：（盯著她）「用這種專業工具開箱子？李娜，你父親是做什么的？」',
            'file_cabinet': '文件櫃沒鎖...裡面有張偉的個人資料。「張偉，欠賭債 50 萬，催債中」但等等...（你翻到下一頁）「女兒張小芸，市立醫院，白血病」原來如此...他不是為了賭博。',
            'photo': '（走近照片）這是...李娜和她父親的合照。背面寫著：「給我最愛的女兒，這顆鑽石永遠屬於你。——愛你的爸爸」（你突然明白了什麼）'
        };
        return texts[itemId] || '沒有發現特別的。';
    }
    
    showDialogue() {
        if (!this.currentScene) return;
        
        const dialogues = this.currentScene.dialogues;
        if (this.currentDialogueIndex >= dialogues.length) {
            // v3.0: 檢查是否有閃回插敘
            if (this.currentScene.flashback) {
                this.showFlashbackScene(this.currentScene.flashback);
                return;
            }
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
    
    // v3.0: 閃回插敘場景
    showFlashbackScene(flashback) {
        const speakerEl = document.getElementById('speaker-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (speakerEl) {
            speakerEl.textContent = `【閃回 - ${flashback.time}】`;
            speakerEl.style.color = '#f39c12';
            speakerEl.style.animation = 'glow 2s ease infinite';
        }
        
        if (textEl) {
            textEl.textContent = flashback.text;
            textEl.style.animation = 'fadeIn 0.5s ease';
            textEl.style.fontStyle = 'italic';
        }
        
        setTimeout(() => {
            if (speakerEl) {
                speakerEl.style.animation = '';
                speakerEl.style.color = '#4ecca3';
            }
            if (textEl) {
                textEl.style.animation = '';
                textEl.style.fontStyle = '';
            }
            this.currentDialogueIndex++;
            this.showDialogue();
        }, 4000);
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
            '內部', '嫁禍', '保險', '白血病', '女兒'
        ];
        
        return keywords.some(keyword => text.includes(keyword));
    }
    
    typeWriterEffect(element, text, isKeyDialogue = false) {
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
            
            // v3.0: 隱藏選項處理
            if (choice.hidden) {
                btn.style.display = 'none';
                const hasAllClues = choice.requiredClues.every(clueId => 
                    this.collectedClues.find(c => c.id === clueId)
                );
                if (hasAllClues) {
                    btn.style.display = 'block';
                    btn.textContent += ' ⭐';
                    btn.style.background = 'linear-gradient(135deg, #f39c12, #e74c3c)';
                }
            } else if (choice.requiredClues) {
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
            this.stopTimePressureTimer();
            this.restartGame();
        } else if (choice.nextScene) {
            if (choice.nextScene === 'ending_perfect') {
                this.achievements.hiddenEndingUnlocked = true;
            }
            this.loadScene(choice.nextScene);
        }
    }
    
    checkAchievements() {
        if (this.collectedClues.length >= this.totalCluesInGame) {
            this.achievements.allCluesCollected = true;
        }
        
        if (this.investigatedItems.length >= this.totalItemsInGame) {
            this.achievements.allItemsInvestigated = true;
        }
        
        // v3.0: 檢查隱藏結局解鎖
        if (this.evidenceChain.enabled) {
            const hasAllEvidence = this.evidenceChain.requiredForHidden.every(clueId => 
                this.collectedClues.find(c => c.id === clueId)
            );
            if (hasAllEvidence) {
                this.achievements.hiddenEndingUnlocked = true;
            }
        }
    }
    
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
                hint = '調查前台電話、掛鐘、訪客登記簿和地上的報紙，這些可能藏有重要線索。注意時間壓力：館長 9:00 抵達！';
            } else if (sceneId === 'scene_2') {
                hint = '仔細檢查破碎展櫃、警報器、地板腳印和窗戶。思考玻璃碎片為什麼在外側，窗戶為什麼開著。';
            } else if (sceneId === 'scene_3') {
                hint = '查看監控屏幕、值班記錄本、張偉的手機和電視新聞。注意時間線矛盾，以及「小芸」是誰。';
            } else if (sceneId === 'scene_4') {
                hint = '檢查保險文件、李娜的公文包、文件櫃和牆上的父女合照。找出李娜的真正動機。';
            }
            
            textEl.textContent = hint;
            textEl.style.animation = 'glow 1s ease infinite';
        }
        
        this.hintShown = true;
    }
    
    checkHintNeeded() {
        const sceneId = this.currentScene?.id;
        
        if (sceneId === 'scene_5') {
            const speakerEl = document.getElementById('speaker-name');
            const textEl = document.getElementById('dialogue-text');
            
            // 檢查隱藏選項是否應該顯示
            const hiddenChoice = this.currentScene.choices.find(c => c.hidden);
            if (hiddenChoice) {
                const hasAllClues = hiddenChoice.requiredClues.every(clueId => 
                    this.collectedClues.find(c => c.id === clueId)
                );
                
                if (!hasAllClues) {
                    const missingClues = hiddenChoice.requiredClues.filter(clueId => 
                        !this.collectedClues.find(c => c.id === clueId)
                    );
                    
                    if (speakerEl && textEl) {
                        speakerEl.textContent = '⚠️ 線索不足';
                        speakerEl.style.color = '#e74c3c';
                        textEl.textContent = `你還沒有收集足夠的線索來發現第三個人。缺失：${missingClues.length} 條線索。請返回之前的場景，調查所有物品。`;
                    }
                }
            }
        }
    }
    
    showHint() {
        this.hintShown = true;
        this.showClearHint();
    }
    
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
            'clue_logbook': '💡 李娜 18:00 最後離開，她有作案時間。下午 3 點有記者來訪被拒。',
            'clue_newspaper': '💡 美術館財政危機，可能要拍賣鑽石。這給了李娜動機。',
            'clue_cabinet': '💡 從內部敲碎 + 無撬痕 + 切口整齊 = 有鑰匙的人用玻璃刀切割後敲碎。',
            'clue_alarm': '💡 警報被故意延遲，線路上有模糊指紋。是誰的？',
            'clue_footprints': '💡 37 碼高跟鞋 = 李娜的鞋印。但為什麼只有去的腳印，沒有離開的？',
            'clue_window': '💡 窗戶開著，有泥濘和刮痕！有人從外面爬進來過？這是關鍵！',
            'clue_monitor': '💡 監控是故意關閉的，攝像頭線路被拔掉。內部人員所為。',
            'clue_shift_log': '💡 值班記錄被塗改，背面有「小芸」壓痕。小芸是誰？',
            'clue_phone_msg': '💡 市立醫院欠費通知，張小芸...是張偉的女兒！他不是為了賭博。',
            'clue_tv_news': '💡 新聞裡有李娜，她對拍賣是什麼態度？',
            'clue_insurance_doc': '💡 保險是三天前簽的，在館長說拍賣之後。內部人員作案可拒賠，所以李娜需要嫁禍。',
            'clue_briefcase': '💡 玻璃切割器是父親遺物。李娜是珠寶匠的女兒，擅長使用。',
            'clue_file_cabinet': '💡 張偉女兒患白血病，需要醫藥費。他不是賭博，是絕望。',
            'clue_photo': '💡 照片背面寫著「鑽石永遠屬於你」。李娜認為自己才是合法繼承人。'
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
