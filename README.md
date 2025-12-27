# Neurosynth Frontend

This project provides a **static frontend interface** for querying Neurosynth neuroimaging terminology. It connects to the NTU Psychology backend API and enables real-time term searching, Boolean queries, and study exploration with an elegant, modern UI.

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

**Neurosynth Frontend** is designed to provide a **user-friendly** and **responsive** interface for exploring Neurosynth terminology and associated neuroimaging studies.

This project serves as a web-based client for the NTU Psychology backend, allowing researchers to efficiently search through 3,000+ neuroscience terms, explore co-occurrence relationships, and discover relevant fMRI studies using Boolean query logic.

### Why Neurosynth Frontend?
*   **Real-time**: Instant filtering and search results without form submission.
*   **Intuitive**: Boolean query builder with AND/OR/NOT operators and parentheses support.
*   **Resilient**: Multi-host failover ensures continuous availability.
*   **Modern UI**: Built with Tailwind CSS for a polished, professional appearance.

---

## ✨ Core Features

| Module | Description |
| :--- | :--- |
| **🔍 Term Search** | Real-time filtering of 3,000+ Neurosynth terms as you type. |
| **🔗 Co-occurrence Display** | Shows related terms with co-occurrence count and Jaccard index metrics. |
| **🧮 Boolean Query Builder** | Supports `AND`, `OR`, `NOT` operators and parentheses for complex queries. |
| **📚 Study Browser** | Displays matching studies with year sorting, pagination, and keyword highlighting. |
| **⚡ Smart Caching** | Query results are cached for sub-150ms response times on repeated searches. |
| **🔄 Multi-host Failover** | Automatically switches between HPC and MIL servers if one is unavailable. |

---

## 📂 Project Structure

```plaintext
neurosynth-frontend/
├── 📄 index.html              # Main HTML Page
├── 📂 assets/
│   ├── 📄 app.css             # Compiled Tailwind CSS
│   └── 📄 app.js              # Core Application Logic (Fetch/Cache/UI)
├── 📂 src/
│   └── 📄 styles.css          # Tailwind Source with CSS Variables
├── 📄 tailwind.config.js      # Tailwind Configuration (Colors, Fonts)
├── 📄 postcss.config.js       # PostCSS + Autoprefixer Config
├── 📄 package.json            # Project Dependencies & Scripts
├── 📄 gpt-5-codex.pdf         # Development Chat History with LLM
├── 📄 README.md               # Project Documentation
└── 📄 LICENSE                 # License File
```

---

## 🚀 Getting Started

### Prerequisites

This project requires Node.js for building Tailwind CSS:
*   **Node.js**: 18+
*   **npm**: 9+ (recommended)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/neurosynth-frontend.git
    cd neurosynth-frontend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Build CSS**
    ```bash
    npm run build
    ```

---

## 💡 Usage

### Development Mode

Start the Tailwind watcher for live CSS compilation:
```bash
npm run dev
```

Then open `index.html` with a local server (e.g., `npx serve .` or VS Code Live Server).

### Production Build

Generate minified CSS for deployment:
```bash
npm run build
```

### Workflow Overview

1.  **Search Terms**: Type keywords (e.g., "amygdala", "emotion") in the search box.
2.  **Select Term**: Click on a term to load its co-occurrence data.
3.  **Build Query**: Use AND/OR/NOT buttons to construct Boolean queries.
4.  **Browse Studies**: View matching studies with sorting and pagination.

### API Endpoints Used

| Endpoint | Description |
| :--- | :--- |
| `GET /terms` | Fetches all available Neurosynth terms |
| `GET /terms/<term>` | Fetches co-occurrence data for a specific term |
| `GET /query/<query>/studies` | Executes Boolean query and returns matching studies |

---

## 🗺️ Roadmap

- [x] **Real-time Term Search**: Instant filtering with ranked results
- [x] **Co-occurrence Display**: Related terms with metrics
- [x] **Boolean Query Builder**: Full AND/OR/NOT/() support
- [x] **Study Browser**: Year sorting and pagination
- [x] **Keyword Highlighting**: Visual emphasis on matched terms
- [x] **Multi-host Failover**: Automatic server switching
- [x] **Query Caching**: Fast repeated searches

---

## 🚀 Deployment

### GitHub Pages

1.  Push the repository to GitHub.
2.  Go to `Settings → Pages`.
3.  Select `Deploy from a branch` → `main` → `/` (root).
4.  Access at `https://<username>.github.io/<repo>/`.

### Other Platforms

*   **Netlify / Vercel / Cloudflare Pages**: Set build command to `npm run build`, deploy root directory.
*   **Self-hosted (Nginx/Apache)**: Upload `index.html` and `assets/` to DocumentRoot.

---

## ⚖️ License

This project is a course assignment. For reuse, modification, or public distribution, please confirm with the course requirements or contact the author.
