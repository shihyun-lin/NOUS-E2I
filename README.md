[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/npiYAKgd)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20464692&assignment_repo_type=AssignmentRepo)

# 02 Homework - Neurosynth ETL

學號：R13546008

---

## 作業流程說明

本作業目標：  
**從 PubMed 查詢 "fmri & love" 相關論文，萃取目標論文的 [X, Y, Z] 座標，並整理成 info_data.csv 格式。**

---

### 1. PubMed 查詢與下載 

- 使用 requests 下載 PubMed 查詢結果 HTML（關鍵字："fmri & love"）。
- 設定 headers 模擬瀏覽器，避免被網站阻擋。
- 儲存 HTML 檔案：`front_psychol_fmri_love.html`

### 2. 解析 PMIDs

- 用 BeautifulSoup 解析 HTML，萃取所有 PMIDs。
- 使用正則表達式取得 PMID 清單。

> **說明：第 1、2 步為測試與前置流程，正式作業資料處理從第 3 步開始。**

### 3. 下載目標論文 HTML

- 目標論文（3 篇）：
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC4863427
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC7223160
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC7264388
- 用 requests 批次下載，儲存於 `pmc_html/` 資料夾。

### 4. 萃取論文基本資訊

- 用 BeautifulSoup 解析每篇 HTML，萃取：
  - PMID
  - PMCID（只保留數字）
  - Keywords（去除多餘標點、排序、標準化）

### 5. 表格座標萃取

- 針對每篇論文的目標 Table，將表格圖片存於 `Table/` 資料夾。
- 使用 LM Studio API（或其他 LLM）進行圖片 OCR，萃取 [X, Y, Z] 座標。
- 將所有座標整理成 DataFrame。

### 6. 合併與輸出

- 合併 meta 資訊與座標資料，整理成 info_data.csv。

---

## 主要使用套件

- pandas
- requests
- BeautifulSoup
- re
- base64
- json

---

## 執行方式

1. 依序執行 Jupyter Notebook (`ETL.ipynb`) 各區塊。
2. 確認 `pmc_html/`、`Table/` 資料夾已存在並有對應檔案。
3. 執行完畢後，會產生 `info_data.csv`，可與 `info_data_answer.csv` 比對。

---
## AI 互動紀錄

- 本專案所有與 LLM（如 GPT-4.1、LM Studio API）的互動過程（包含 prompt、回應、座標萃取 JSON 結果等），皆已儲存於 `chat_history/` 資料夾。
- Vscode:chat_history/GPT-4.1.json
- LM studio:chat_history/gemma-3-4b-it-qa.json

---
## 注意事項

- 若 merge 時出現 dtype 不一致，請將 key 欄位（如 PMID, PMCID, Table, X, Y, Z）都轉為字串。
- 若比對結果有差異，請檢查座標或關鍵字是否有格式或內容上的細微不同。
- LM Studio API 需本地啟動，並確認模型可用。


