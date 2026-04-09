# 📦 GitHub 推送指南

## 當前狀態

✅ **本地版本**: v1.0  
✅ **Git 標籤**: v1.0, v1.0-release  
❌ **GitHub 倉庫**: 尚未創建

---

## 🚀 推送步驟

### 方法 1: 創建新倉庫（推薦）

```bash
# 1. 在 GitHub 上創建新倉庫
# 訪問：https://github.com/new
# 倉庫名：detective-story
# 設置為 Public 或 Private

# 2. 添加 remote
cd ~/webgames/detective-story
git remote add origin git@github.com:Yang845658/detective-story.git

# 3. 推送代碼
git push -u origin master

# 4. 推送標籤
git push origin --tags
```

### 方法 2: 使用 GitHub CLI

```bash
# 1. 創建倉庫
gh repo create detective-story --public --source=. --remote=origin

# 2. 推送
git push -u origin master
git push origin --tags
```

---

## 📊 倉庫信息

### 文件統計
| 類型 | 數量 | 大小 |
|------|------|------|
| HTML | 1 | 3.5KB |
| CSS | 1 | 9.5KB |
| JS | 1 | 12KB |
| JSON | 1 | 16KB |
| MD | 5 | 15KB |
| **總計** | **9** | **56KB** |

### 代碼行數
- **總計**: ~1,800 行
- **遊戲引擎**: ~350 行
- **故事數據**: ~500 行
- **樣式**: ~250 行
- **文檔**: ~700 行

---

## 🎯 推薦的 GitHub 設置

### 1. 啟用 GitHub Pages
```
Settings → Pages
Source: Deploy from branch
Branch: master
Folder: / (root)
```

訪問：`https://Yang845658.github.io/detective-story/`

### 2. 添加 Topics
- `interactive-fiction`
- `visual-novel`
- `detective-game`
- `html5-game`
- `javascript-game`

### 3. 添加 Description
```
🔍 午夜美術館 - 偵探推理互動小說
HTML5 偵探遊戲，找出盜竊「月光之淚」的真兇！
```

---

## 📸 截圖建議

上傳到 GitHub 倉庫的圖片：
1. 遊戲開始界面
2. 場景調查界面
3. 對話界面
4. 線索本界面
5. 結局界面

---

## ✅ 檢查清單

- [ ] 創建 GitHub 倉庫
- [ ] 添加 remote
- [ ] 推送代碼
- [ ] 推送標籤
- [ ] 啟用 GitHub Pages
- [ ] 添加 Topics
- [ ] 上傳截圖

---

_完成後訪問倉庫測試遊戲！_
