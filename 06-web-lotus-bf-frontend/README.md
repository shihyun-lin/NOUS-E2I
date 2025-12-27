# NOUS Frontend

A modern **React-powered frontend** for neuroscience literature search, analysis, and visualization. Built with Vite + React 19, this project integrates NIfTI file browsing, Boolean query search, bookmark management, and interactive brain coordinate visualization.

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

**NOUS Frontend** is designed to provide a **seamless** and **intuitive** interface for exploring neuroimaging meta-analysis data.

This project serves as the web frontend for the NOUS platform, enabling researchers to search, filter, and visualize neuroscience literature with associated brain coordinates. By integrating advanced visualization tools like NiiVue, users can interactively explore MNI coordinates directly in the browser.

### Why NOUS Frontend?
*   **Interactive**: Real-time Boolean query builder with autocomplete suggestions.
*   **Visual**: Integrated NIfTI viewer for 3D brain coordinate visualization.
*   **Organized**: Bookmark system with notes and persistent localStorage storage.

---

## ✨ Core Features

| Module | Description |
| :--- | :--- |
| **🔍 Boolean Query Search** | Supports AND / OR / NOT operators for precise literature filtering with real-time term suggestions. |
| **📚 Bookmark System** | Save studies with custom notes, persistent across sessions via localStorage. |
| **🧠 NIfTI Viewer** | Integrated `@niivue/niivue` for interactive 3D brain visualization with coordinate selection. |
| **📊 Study Table** | Modern table with auto-width columns, horizontal scrolling, and inline coordinate preview. |
| **🎯 Coordinate Selection** | Click-to-select coordinates from study tables, synced with NiiViewer display. |
| **👥 Author Spotlight** | Dedicated page showcasing NOUS team members, expertise, and publications. |

---

## 📂 Project Structure

```plaintext
lotus-frontend/
├── 📄 index.html               # Entry HTML
├── 📄 vite.config.js           # Vite Configuration
├── 📄 package.json             # Dependencies & Scripts
├── 📂 public/                  # Static Assets
│   └── static/                 # Logo & Images
├── 📂 src/                     # Source Code
│   ├── 📄 main.jsx             # React Entry Point
│   ├── 📄 App.jsx              # Main Application Logic & Routing
│   ├── 📄 App.css              # Global Styles
│   ├── 📄 api.js               # API Endpoint Configuration
│   ├── 📂 components/          # React Components
│   │   ├── Header.jsx          # Navigation Header
│   │   ├── QueryBuilder.jsx    # Boolean Query Interface
│   │   ├── Studies.jsx         # Study List & Table
│   │   ├── NiiViewer.jsx       # NIfTI Brain Viewer
│   │   ├── NiiMiniWidget.jsx   # Compact NIfTI Preview
│   │   ├── BookmarksPage.jsx   # Bookmark Management
│   │   ├── BookmarkButton.jsx  # Bookmark Toggle Button
│   │   ├── Filters.jsx         # Filter Panel
│   │   ├── Locations.jsx       # Coordinate Display
│   │   └── Terms.jsx           # Term Suggestions
│   ├── 📂 hooks/               # Custom React Hooks
│   │   └── useUrlQueryState.js # URL State Management
│   └── 📂 lib/                 # Utility Functions
│       └── bookmarks.js        # localStorage Bookmark Logic
└── 📂 dist/                    # Production Build Output
```

---

## 🚀 Getting Started

### Prerequisites

This project requires Node.js and npm:
*   **Node.js**: 18+ (LTS recommended)
*   **npm**: 9+

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ntu-info/nous-frontend.git
    cd nous-frontend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Endpoint** (Optional)
    
    Edit `src/api.js` to point to your backend:
    ```javascript
    // For local development
    export const API_BASE = 'http://localhost:5000';
    
    // For production
    export const API_BASE = 'https://mil.psy.ntu.edu.tw:5000';
    ```

---

## 💡 Usage

### Development Mode

Start the Vite development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

Build optimized static files for deployment:

```bash
npm run build
```

Output will be generated in the `dist/` folder.

### Preview Production Build

Test the production build locally:

```bash
npm run preview
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server (HMR enabled) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint code checks |

---

## 🗺️ Roadmap

Current features and planned enhancements:

- [x] **Boolean Query Builder**: AND / OR / NOT operators with autocomplete
- [x] **NIfTI Viewer Integration**: Interactive 3D brain visualization
- [x] **Bookmark System**: Persistent study bookmarks with notes
- [x] **Responsive Design**: Desktop and mobile support
- [x] **Author Spotlight**: Team member profiles
- [ ] **Dark/Light Theme Toggle**: User-selectable color schemes
- [ ] **Export Functionality**: Download bookmarks as CSV/JSON
- [ ] **Advanced Filters**: Year, journal, author filtering

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact & Contributing

*   This project is developed by **NOUS Team** in collaboration with **NTU Psychology Information Group**.
*   Issues, pull requests, and feedback are welcome!
*   For questions, please contact the project maintainers.
