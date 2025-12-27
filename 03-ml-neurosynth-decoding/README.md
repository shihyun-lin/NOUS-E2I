# Neurosynth ML Decoding

This project implements a **brain neuroimaging decoding system** based on the Neurosynth dataset, utilizing machine learning methods to perform **Reverse Inference**—predicting associated psychological terms from brain activation coordinates.

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

**Neurosynth ML Decoding** is a **reproducible** and **transparent** neuroimaging decoding project.

Traditional neuroimaging research typically employs "Forward Inference": observing brain activation while subjects perform specific tasks. This project implements the opposite logic—**Reverse Inference**:

> Given a set of brain activation coordinates (e.g., `[-22, 0, -20]`), the model predicts the psychological terms most likely associated with that activation (e.g., **"amygdala"**, **"fear"**, **"emotion"**).

### Why This Project?

*   **Transparent**: Every step, from coordinate clustering to model training, is verifiable, eliminating "black box" logic.
*   **Reproducible**: Utilizes the public Neurosynth dataset, ensuring research results can be replicated.
*   **Multi-Model Support**: Provides various decoding methods for comparison, including kNN, Ridge Regression, and MLP.

---

## ✨ Core Features

| Module | Description |
| :--- | :--- |
| **🧠 Coordinate Clustering** | Uses K-Means to cluster 507,891 brain coordinates into 250 clusters, establishing spatial feature representations. |
| **📊 BoVW Representation** | Adopts the Bag-of-Visual-Words method to transform each study into a 250-dimensional histogram vector. |
| **🔍 Multi-Model Decoding** | Supports multiple decoders including kNN, Ridge/ElasticNet Regression, and MLP Neural Networks. |
| **⚡ Performance Optimization** | Integrates TruncatedSVD / PCA dimensionality reduction techniques to accelerate large-scale model training. |

---

## 📂 Project Structure

```plaintext
neurosynth-decoding-shih-yunLin/
├── 📄 neurosynth_MLdecoding.ipynb  # Core Analysis Engine (Jupyter Notebook)
├── 📄 neurosynth_dataset.pkl.gz    # Preprocessed Neurosynth Dataset
├── 📄 gpt_4o.json                  # Model Interaction Logs & Settings
├── 📂 data_process/                # Processed Data Files
│   ├── bovw_matrix.csv             # BoVW Feature Matrix
│   ├── cluster_centers.csv         # K-Means Cluster Centers
│   └── coord_cluster_labels.csv    # Coordinate Cluster Labels
├── 📄 README.md                    # Project Documentation
└── 📄 LICENSE                      # License File
```

---

## 🚀 Getting Started

### Prerequisites

*   **Python**: 3.8+ (Recommended 3.10+)
*   **Jupyter Notebook / Lab**

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ntu-info/neurosynth-decoding-shih-yunLin.git
    cd neurosynth-decoding-shih-yunLin
    ```

2.  **Install Dependencies**
    ```bash
    pip install numpy pandas scikit-learn matplotlib nimare flaml
    ```

3.  **Verify Data Integrity**
    Ensure the directory contains the `neurosynth_dataset.pkl.gz` dataset file.

---

## 💡 Usage

This project uses `neurosynth_MLdecoding.ipynb` as the interactive analysis interface.

1.  **Launch Jupyter Notebook**
    ```bash
    jupyter notebook neurosynth_MLdecoding.ipynb
    ```

2.  **Run Analysis Pipeline**
    
    The Notebook contains a complete analysis pipeline:
    
    | Step | Description |
    | :--- | :--- |
    | **Step 1** | Load Neurosynth dataset using nimare and check basic statistics. |
    | **Step 2** | K-Means Clustering: Cluster coordinates into 250 clusters. |
    | **Step 3** | Create BoVW Representation: Convert each study into a 250-dimensional vector. |
    | **Step 4** | Model Training & Decoding (kNN / Ridge / MLP). |
    | **Step 5** | Target Coordinate Decoding & Result Output. |

### Example Output

Decoding target coordinates `[x, y, z] = [-22, 0, -20]` (Left Amygdala Region):

```
Top predicted terms (@MLPRegressor):
amygdala: 0.0259
fear: 0.0212
emotion: 0.0207
memory: 0.0204
stress: 0.0194
```

---

## 🗺️ Roadmap

The current version focuses on the implementation and validation of core decoding functions:

- [x] **Data Loading**: Load Neurosynth dataset using nimare.
- [x] **Coordinate Clustering**: K-Means clustering of coordinates into 250 clusters.
- [x] **BoVW Representation**: Create Bag-of-Visual-Words feature matrix.
- [x] **kNN Decoder**: Implementation of Nearest Neighbors decoding method.
- [x] **Regression Models**: Ridge / ElasticNet Multi-output Regression.
- [x] **MLP Decoder**: Neural Network Multi-output Regression.
- [x] **Dimensionality Optimization**: TruncatedSVD / PCA for training acceleration.

---

## ⚠️ Notes

*   **Runtime**: K-Means clustering and model training may take a significant amount of time. Using dimensionality reduction techniques is highly recommended.
*   **Hardware Requirements**: A multi-core CPU is recommended, with multi-threading enabled (`n_jobs=-1`).
*   **Memory**: When processing 500k+ coordinate data, at least 16GB of RAM is recommended.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
