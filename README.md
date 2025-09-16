[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/npiYAKgd)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20464692&assignment_repo_type=AssignmentRepo)

# 📘 Neurosynth ETL — 02 Homework

**Author:** Shih-Yun Lin（R13546008）
**Course:** PSY5261 Psychoinformatics & Neuroinformatics (NTU)

本專案實作一個可重現的 **Neurosynth 風格 ETL**：從 PubMed/PMC 抓取「`fmri & love`」主題的開放獲取論文，萃取表格中的 **\[X, Y, Z]** 座標與基本中介資訊（PMID、PMCID、Keywords），整併為 `info_data.csv` 以支援後續分析。

---

## 🚀 Overview

**🎯 目標與範圍**

* 取得 3 篇 PMC 開放論文的 HTML，抽取 **PMID / PMCID / Keywords / \[X,Y,Z]**。
* 產出單一整潔資料表 `info_data.csv`（可直接下游分析）。
* 提供 Notebook 與固定資料夾結構，確保他人能重現。


---

## 🧩 Method（ETL Pipeline）

1. **PubMed 查詢與下載**
   使用 `requests` 以關鍵字「`fmri & love`」抓取搜尋頁，存為 `front_psychol_fmri_love.html`（加上 headers 模擬瀏覽器）。
2. **解析 PMIDs**
   `BeautifulSoup` + 正則式，擷取結果頁中的 **PMID** 集合（僅保留數字）。
3. **下載目標論文（3 篇）**
   批次下載以下 **PMC Open Access** 頁面至 `pmc_html/`：

   * [https://pmc.ncbi.nlm.nih.gov/articles/PMC4863427](https://pmc.ncbi.nlm.nih.gov/articles/PMC4863427)
   * [https://pmc.ncbi.nlm.nih.gov/articles/PMC7223160](https://pmc.ncbi.nlm.nih.gov/articles/PMC7223160)
   * [https://pmc.ncbi.nlm.nih.gov/articles/PMC7264388](https://pmc.ncbi.nlm.nih.gov/articles/PMC7264388)
4. **基本欄位萃取**
   逐篇 HTML 解析：**PMID、PMCID（數字化）、Keywords**（去除雜訊、標準化、排序）。
5. **表格座標萃取**
   針對目標表格（必要時將表格區塊擷取為圖片存入 `Table/`），以 LLM/OCR（如 LM Studio 本地模型）或規則法抽取 **\[X,Y,Z]**。
6. **整合與輸出**
   合併 meta 與座標，輸出 **`info_data.csv`**；可與 `info_data_answer.csv` 對照。

> ✍️ 1–2 步為前置/測試；正式處理從第 3 步開始。


---

## 📦 Environment

* **Python** 3.12
* 主要套件：`pandas`, `requests`, `beautifulsoup4`, `lxml`, `regex`（或 `re`）, `ipykernel`
  （若用 LLM/OCR：LM Studio 或相容客戶端）

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


