# VocaFace (語音捏臉小遊戲)

一個基於網頁的應用程式，系統分析使用者的「聲音特色」（如音高、音量、語調），自動生成一個符合該聲音感覺的 3D 風格人像。

使用技術：Web Audio API (前端音訊分析) + Pollinations AI (圖像生成)

## 核心機制 (Core Mechanics)
系統將使用 Web Audio API 進行客戶端即時音訊分析，不需額外後端模型。

### 1. 音訊特徵提取
系統將在錄音期間即時分析：

- **音高 (Pitch/Frequency)**:
    - 低頻 -> 傾向生成「男性」、「壯碩」、「沈穩」、「深色系」。
    - 高頻 -> 傾向生成「女性」、「年輕」、「可愛」、「亮色系」。
- **音量 (Volume/Amplitude)**:
    - 大聲 -> 傾向生成「外向」、「激動」、「Cyberpunk 強烈風格」。
    - 小聲 -> 傾向生成「內向」、「神秘」、「柔和風格」。

### 2. 生成邏輯
- **Prompt 組合**:
    - High Pitch -> "Cute, young female, anime style, bright colors"
    - Low Pitch -> "Tough, strong male, warrior, dark atmosphere"
    - Loud -> "Cyberpunk, neon lights, energetic expression"
- **生成**: 發送至 Pollinations.ai 生成 3D Render 風格圖片。

## 使用說明 (Usage)
1. 開啟 `index.html`。
2. 允許麥克風權限。
3. 按住按鈕說話 (Hold to Speak)。
4. 放開按鈕後，觀看分析結果與生成的 3D 人像。

## 專案結構 (Structure)
- `index.html`: 主介面 (Cyberpunk 風格)。
- `style.css`: 樣式表 (霓虹、玻璃質感)。
- `script.js`: 負責語音識別、音頻分析與控制流程。
- `audio_engine.js`: 處理 Web Audio API 音訊串流分析。

## 驗證計畫
- 測試語音辨識是否能正確抓取特徵。
- 測試圖片是否能成功載入。
- 驗證 UI 動畫效果。
