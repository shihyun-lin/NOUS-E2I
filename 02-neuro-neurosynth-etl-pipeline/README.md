# Neurosynth ETL

This project implements a reproducible **Neurosynth-style ETL (Extract, Transform, Load)** pipeline. It automates the retrieval of open-access fMRI papers from PubMed/PMC, extracts coordinates **[X, Y, Z]** from tables, and consolidates metadata for neuroinformatics analysis.

[Explore Docs »](#about-the-project)

<br />

## Table of Contents

1. [About The Project](#-about-the-project)
2. [Core Features](#-core-features)
3. [Project Structure](#-project-structure)
4. [Getting Started](#-getting-started)
5. [Usage](#-usage)
6. [Roadmap](#️-roadmap)
7. [License](#️-license)

---

## 📖 About The Project

**Neurosynth ETL** is designed to provide a **transparent** and **automated** workflow for neuroimaging meta-analysis data collection.

Focusing on the topic "fmri & love", this project reproduces the core logic of collecting neuroimaging coordinates. By leveraging web scraping and parsing techniques, researchers can efficiently gather structured data from unstructured scientific literature.

### Why Neurosynth ETL?
*   **Reproducible**: detailed notebook and fixed directory structure ensure the pipeline can be run by anyone.
*   **Automated**: Automates the scraping of PMIDs and fetching of full-text HTML from PMC.
*   **Structured Output**: Converts complex paper data into a clean `info_data.csv` ready for analysis.

---

## ✨ Core Features

| Module | Description |
| :--- | :--- |
| **🔍 PubMed Query** | Uses `requests` to fetch search results for specific keywords (e.g., "fmri & love") with browser mimicking. |
| **📄 PMC Fetcher** | Batch downloads targeted Open Access papers from PubMed Central (PMC). |
| **� Metadata Extraction** | Parses HTML to extract key fields: **PMID**, **PMCID**, and **Keywords** (cleaned and normalized). |
| **📍 Coordinate Extraction** | Extracts **[X, Y, Z]** coordinates from tables using LLM/OCR or rule-based parsing. |
| **✅ Data Consolidation** | Merges all extracted data into a unified CSV format for downstream analysis. |

---

## 📂 Project Structure

```plaintext
neurosynth-etl/
├── 📄 ETL.ipynb                # Core Analysis Engine (Jupyter Notebook)
├── 📂 pmc_html/                # Raw HTML of Downloaded Papers
│   ├── PMC4863427.html
│   └── ...
├── 📂 Table/                   # Extracted Table Images/Data
├── 📂 chat_history/            # LLM Interaction Logs (GPT-4, LM Studio)
├── 📂 neurosynth_data/         # Intermediate/Source Data
├── 📄 info_data.csv            # Final Extracted Data Output
├── 📄 extracted_coordinates.csv # Intermediate Coordinate Data
├── 📄 README.md                # Project Documentation
└── 📄 LICENSE                  # License File
```

---

## 🚀 Getting Started

### Prerequisites

This project is optimized to run with a Python 3.12 environment:
*   **Python**: 3.12+
*   **Jupyter Notebook / Lab**
*   **LLM Client** (Optional): LM Studio (for local LLM-based extraction)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ntu-info/neurosynth-etl-shih-yunLin.git
    cd neurosynth-etl-shih-yunLin
    ```

2.  **Install Dependencies**
    Ensure you have the required packages installed:
    ```bash
    pip install pandas requests beautifulsoup4 lxml regex ipykernel
    ```

---

## 💡 Usage

This project uses `ETL.ipynb` as the interactive execution engine.

1.  **Launch Jupyter Notebook**
    ```bash
    jupyter notebook ETL.ipynb
    ```

2.  **Run Pipeline Steps**
    The Notebook guides you through the complete process:
    -   **Step 1-2**: Query PubMed and parse PMIDs (Test/Prep).
    -   **Step 3**: Batch download PMC HTML files.
    -   **Step 4**: Extract Metadata (PMID, PMCID, Keywords).
    -   **Step 5**: Extract Coordinates [X, Y, Z] from tables.
    -   **Step 6**: Export final results to `info_data.csv`.

### Extraction Logic Example

```python
# Conceptual extraction flow
def extract_coordinates(html_content):
    """
    Parses HTML tables to find stereotactic coordinates.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table')
    # ... Implementation details in ETL.ipynb ...
    return coordinates
```

---

## 🗺️ Roadmap

The current version focuses on "fmri & love" literature:

- [x] **PubMed Scraper**: Query and result page parsing
- [x] **HTML Downloader**: Fetching Open Access PMC articles
- [x] **Metadata Parser**: Extraction of Identifiers and Keywords
- [x] **Advanced Coordinate Extraction**: Enhanced LLM integration for complex tables
- [x] **Validation**: Automated checks against 'info_data_answer.csv'

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

