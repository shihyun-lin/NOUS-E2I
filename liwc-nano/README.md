
# LIWC Nano

This project implements a reproducible "Nano" version of the LIWC (Linguistic Inquiry and Word Count) Positive/Negative Tone analysis. It utilizes open-source dictionaries and a transparent preprocessing pipeline, validated against the official LIWC demo for accuracy.

[Explore Docs »](#about-the-project)

<br />

## Table of Contents

1. [About The Project](#about-the-project)
2. [Core Features](#core-features)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Usage](#usage)
6. [Roadmap](#roadmap)
7. [License](#license)

---

## 📖 About The Project

**LIWC Nano** is a project designed to provide a **transparent** and **reproducible** implementation of a minimalist LIWC analysis.

Unlike the official close-sourced software, this project focuses on reproducing the core calculation logic for **Positive Tone (posemo)** and **Negative Tone (negemo)**. By using transparent dictionary structures and a clear text preprocessing pipeline, researchers can precisely understand the basis of the scores and benchmark them against the official LIWC results.

### Why LIWC Nano?
*   **Transparent**: From tokenization to dictionary matching, every line of code is verifiable, eliminating "black box" logic.
*   **Lightweight**: No heavy software dependencies required; relies primarily on the Python standard library.
*   **Compatibility**: Uses dictionaries compatible with the LIWC 2015 format and supports standard `*` wildcard matching.

---

## ✨ Core Features

| Module | Description |
| :--- | :--- |
| **📝 Text Normalization** | Standardizes quotes, handles hyphens, and removes interfering punctuation to ensure precise tokenization. |
| **🔍 Dictionary Matching** | Supports LIWC 2015 formatted dictionaries, including full prefix wildcard (`prefix*`) support. |
| **📊 Transparent Metric** | Provides a clear scoring formula: `(Match Count / Total Token Count) * 100`. |
| **✅ Benchmark Ready** | Includes built-in test texts and validation scripts for accuracy verification. |

---

## 📂 Project Structure

```plaintext
liwc-nano/
├── 📄 liwc-nano.ipynb      # Core Analysis Engine (Jupyter Notebook)
├── 📂 test/               # Validation Datasets
│   ├── test1.txt
│   └── ...
├── 📂 output/             # Analysis Output Directory
├── 📄 dict_posemo.txt     # Positive Emotion Dictionary (LIWC 2015 Compatible)
├── 📄 dict_negemo.txt     # Negative Emotion Dictionary (LIWC 2015 Compatible)
├── 📄 README.md           # Project Documentation
└── 📄 LICENSE             # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

This project is optimized to run with a basic Python environment:
*   **Python**: 3.12+ (Recommended)
*   **Jupyter Notebook / Lab**

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/shihyun-lin/NOUS-E2I.git
    cd NOUS-E2I/liwc-nano
    ```

2.  **Verify File Integrity**
    Ensure the directory contains the `dict_posemo.txt` and `dict_negemo.txt` dictionary files.

---

## 💡 Usage

This project uses `liwc-nano.ipynb` as the interactive analysis interface.

1.  **Launch Jupyter Notebook**
    ```bash
    jupyter notebook liwc-nano.ipynb
    ```

2.  **Run Analysis Pipeline**
    The Notebook contains a complete ETL (Extract, Transform, Load) pipeline:
    -   **Load**: Automatically reads all `.txt` files from the `test/` directory.
    -   **Transform**: Executes normalization and dictionary matching algorithms.
    -   **Extract**: Outputs analysis results as DataFrames and CSV files.

### Code Example (Core Logic)

```python
def analyze_text(text, posemo, negemo):
    """
    Analyze the emotional tone of the text (Simplified Logic).
    """
    import re
    words = re.findall(r'\b\w+\b', text.lower())
    total = len(words)
    
    posemo_count = sum(1 for w in words if w in posemo)
    negemo_count = sum(1 for w in words if w in negemo)
    
    return {
        'posemo': (posemo_count / total) * 100 if total else 0,
        'negemo': (negemo_count / total) * 100 if total else 0
    }
```

---

## 🗺️ Roadmap

The current version focuses on precise reproduction of core emotional dimensions:

- [x] **Core Analysis Engine**: Basic LIWC Positive/Negative Tone implementation
- [x] **Dictionary Support**: Dictionary matching with `*` wildcard parsing
- [x] **Validation**: Benchmarking and validation against the official LIWC Demo

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
