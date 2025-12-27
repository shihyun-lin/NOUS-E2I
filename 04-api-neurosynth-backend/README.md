# Neurosynth Backend

A lightweight Flask backend that exposes **functional dissociation** endpoints on top of a Neurosynth-backed PostgreSQL database.

[Explore Docs »](#examples)

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

**Neurosynth Backend** is designed to provide a **simple** and **efficient** API for querying neuroimaging data.

The service provides two API endpoints that allow researchers to query studies mentioning one concept or coordinate **but not** another (A \ B). This "functional dissociation" capability is crucial for isolating specific brain regions or cognitive functions.

### Why Neurosynth Backend?
*   **Specialized**: Focused specifically on functional dissociation (A \ B) queries.
*   **Flexible**: Supports both **Term-based** and **Coordinate-based** (MNI) queries.
*   **Robust**: Built on top of a PostgreSQL database for reliable data storage and retrieval.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **🔤 Dissociate by Terms** | Returns studies that mention `term_a` but **not** `term_b`. |
| **📍 Dissociate by Coordinates** | Returns studies that mention coordinates `[x1, y1, z1]` but **not** `[x2, y2, z2]`. |
| **📊 RESTful API** | Simple Flask-based endpoints easy to integrate with any frontend or analysis pipeline. |
| **🐘 PostgreSQL Backed** | Persistent and structured data storage using PostgreSQL. |

---

## 📂 Project Structure

```plaintext
neurosynth-backend/
├── 📄 app.py                   # Main Flask Application
├── 📄 check_db.py              # Database Connection Verifier
├── 📄 create_db.py             # Database Population Script
├── 📄 sql.py                   # SQL Query Utilities
├── 📄 requirements.txt         # Python Dependencies
├── 📄 .env                     # Environment Variables (Not in repo)
├── 📄 LICENSE                  # License File
└── 📄 README.md                # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

*   **Python**: 3.10+
*   **PostgreSQL**: 12+
*   **Dependencies**: `Flask`, `SQLAlchemy`, `psycopg2-binary`, `gunicorn`

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/shihyun-lin/NOUS-E2I.git
    cd 04-neuro-neurosynth-backend
    ```

2.  **Install Dependencies**
    ```bash
    pip install flask sqlalchemy psycopg2-binary gunicorn python-dotenv
    ```

3.  **Environment Setup**
    Create a `.env` file in your project root:
    ```bash
    DB_URL=postgresql://shih_yun:<YOUR_PASSWORD>@dpg-d3jp1u49c44c73c27npg-a.oregon-postgres.render.com/neurosynthbackend
    ```
    > **Security Note**: Never commit real credentials to version control.

---

## 💡 Usage

### 1. Provision & Populate Database

First, ensure your PostgreSQL database is running and accessible.

**Verify Connection:**
```bash
python check_db.py --url "postgresql://shih_yun:<YOUR_PASSWORD>@dpg-d3jp1u49c44c73c27npg-a.oregon-postgres.render.com/neurosynthbackend"
```

**Populate Database:**
```bash
python create_db.py --url "postgresql://shih_yun:<YOUR_PASSWORD>@dpg-d3jp1u49c44c73c27npg-a.oregon-postgres.render.com/neurosynthbackend"
```

### 2. Run the Service

**Local Development:**
```bash
flask --app app.py run --port 5001 --debug
```

**Production (Gunicorn):**
```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

### 3. API Examples

**Dissociate by Terms (`/dissociate/terms/<term_a>/<term_b>`):**
Get studies mentioning *Posterior Cingulate* but NOT *Ventromedial Prefrontal*.
```bash
curl https://zero5-shih-yunlin.onrender.com/dissociate/terms/posterior_cingulate/ventromedial_prefrontal
```

**Dissociate by Coordinates (`/dissociate/locations/<coords_1>/<coords_2>`):**
Get studies mentioning `[0, -52, 26]` but NOT `[-2, 50, -6]`.
```bash
curl https://zero5-shih-yunlin.onrender.com/dissociate/locations/0_-52_26/-2_50_-6
```
*Note: Coordinates are format `x_y_z`.*

### 4. Smoke Tests
- Images: `https://zero5-shih-yunlin.onrender.com/img`
- DB Check: `https://zero5-shih-yunlin.onrender.com/test_db`

---

## 🗺️ Roadmap

- [x] **Term Dissociation**: API endpoint for term-based queries.
- [x] **Coordinate Dissociation**: API endpoint for MNI coordinate-based queries.
- [x] **Database Integration**: PostgreSQL connection and data seeding.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.