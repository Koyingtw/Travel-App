# 🍁 Maple Planner - 楓葉行程助手

<div align="center">

![Maple Planner](https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80)

**專為加拿大旅遊設計的智慧行程規劃工具**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Cloud-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

[English](#english) | [繁體中文](#繁體中文)

</div>

---

## 繁體中文

### 📖 專案簡介

Maple Planner 是一個現代化的旅遊行程規劃應用程式，專注於加拿大旅遊體驗。透過直覺的拖拽介面、智慧路徑優化、預算追蹤等功能，讓您的旅遊規劃更加輕鬆愉快。

### ✨ 主要功能

| 功能 | 描述 |
|------|------|
| 🗂️ **景點候選清單** | 新增、編輯、刪除想去的景點，設定優先順序 |
| 📥 **匯入 Google Maps** | 支援匯入 Google Maps 儲存清單 (Takeout JSON)，分享連結功能開發中 |
| 🔍 **智慧搜尋** | 整合 Google Places API，輸入地點自動帶入座標和資訊 |
| 📅 **互動式行事曆** | 拖拽景點到時間軸，自動計算行程時間 |
| 🗺️ **地圖整合** | Google Maps 標註行程點，顯示路線 |
| 🚗 **路徑優化** | TSP 演算法計算最短路徑，自動重排行程 |
| 📝 **每日備註** | Rich Text 筆記，記錄重要事項 |
| 💰 **預算追蹤** | 記錄開支，分類統計，追蹤已付/未付款項 |
| 💱 **匯率換算** | 即時匯率轉換，支援多種貨幣 |

### 🛠️ 技術棧

**前端 (Frontend)**
- React 18 + TypeScript
- Tailwind CSS
- dnd-kit (拖拽功能)
- React Query (資料管理)
- Zustand (狀態管理)
- React Router (路由)
- Google Maps API

**後端 (Backend)**
- Python 3.11
- FastAPI
- Motor (MongoDB async driver)
- OR-Tools (路徑優化)
- Pydantic (資料驗證)

**資料庫 (Database)**
- MongoDB 7.0

### 📁 專案結構

```
Travel-App/
├── backend/                 # Python FastAPI 後端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 應用程式入口
│   │   ├── config.py        # 環境設定
│   │   ├── database.py      # MongoDB 連接
│   │   ├── models.py        # Pydantic 資料模型
│   │   ├── routes/          # API 路由
│   │   │   ├── trips.py     # 行程 CRUD
│   │   │   ├── route_optimization.py
│   │   │   └── exchange.py  # 匯率換算
│   │   └── services/        # 業務邏輯
│   │       ├── trip_service.py
│   │       ├── route_optimizer.py
│   │       └── exchange_service.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # UI 組件
│   │   │   ├── Layout.tsx
│   │   │   ├── TripCard.tsx
│   │   │   ├── TripPlanner.tsx
│   │   │   ├── PlaceCards.tsx
│   │   │   ├── MapComponent.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── BudgetTracker.tsx
│   │   │   └── AddPlaceModal.tsx
│   │   ├── pages/           # 頁面組件
│   │   │   ├── HomePage.tsx
│   │   │   ├── NewTripPage.tsx
│   │   │   ├── TripDetailPage.tsx
│   │   │   └── ExchangePage.tsx
│   │   ├── services/        # API 服務
│   │   │   └── api.ts
│   │   ├── store/           # 狀態管理
│   │   │   └── tripStore.ts
│   │   ├── types/           # TypeScript 類型
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml       # Docker 編排
├── README.md
├── DOCS.md                  # 詳細文件
└── spec.md                  # 規格書
```

### 🚀 快速開始

#### 方式一：使用 Docker（推薦）

```bash
# 克隆專案
git clone https://github.com/yourusername/Travel-App.git
cd Travel-App

# 設定環境變數（必填 API 金鑰）
cp .env.example .env

# 啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

服務啟動後：
- 前端：http://localhost:3000
- 後端 API：http://localhost:8000
- API 文檔：http://localhost:8000/docs

#### 方式二：本地開發

**1. 註冊 MongoDB Atlas (免費雲端資料庫)**

1. 前往 [MongoDB Atlas](https://www.mongodb.com/atlas) 註冊帳號
2. 建立一個免費的 Cluster (M0 Free Tier)
3. 在 Database Access 建立資料庫使用者
4. 在 Network Access 加入你的 IP 地址 (或允許 0.0.0.0/0)
5. 在 Cluster 頁面點擊 "Connect" 取得連線字串

```
# 連線字串格式
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**2. 啟動後端**

```bash
cd backend

# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 複製環境變數
cp .env.example .env

# 啟動服務
uvicorn app.main:app --reload
```

**3. 啟動前端**

```bash
cd frontend

# 安裝依賴
npm install

# 複製環境變數
cp .env.example .env.local

# 啟動開發伺服器
npm run dev
```

### ⚙️ 環境變數

**後端 (.env)**

```env
# MongoDB Atlas (雲端資料庫)
MONGODB_URL=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/maple_planner?retryWrites=true&w=majority
DATABASE_NAME=maple_planner

# Google Maps API (路徑優化用，選填)
GOOGLE_MAPS_API_KEY=your_key_here

# 匯率 API (選填，有免費方案)
EXCHANGE_RATE_API_KEY=your_key_here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**前端 (.env.local)**

```env
# Google Maps API (地圖顯示用，選填)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### 📚 API 文檔

啟動後端後，訪問以下網址查看互動式 API 文檔：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

主要 API 端點：

| 方法 | 路徑 | 描述 |
|------|------|------|
| GET | `/api/trips` | 獲取所有行程 |
| POST | `/api/trips` | 建立新行程 |
| GET | `/api/trips/{id}` | 獲取單一行程 |
| PUT | `/api/trips/{id}` | 更新行程 |
| DELETE | `/api/trips/{id}` | 刪除行程 |
| POST | `/api/optimize-route` | 路徑優化 |
| GET | `/api/exchange/rates` | 獲取匯率 |
| POST | `/api/exchange/convert` | 貨幣換算 |

### 🎨 UI/UX 設計

- **楓葉主題**：使用加拿大國旗的楓葉紅為主色調
- **響應式設計**：支援桌面和移動設備
- **拖拽體驗**：使用 dnd-kit 實現流暢的拖放操作
- **即時回饋**：Toast 通知、Loading 狀態

### 🔧 開發指南

**程式碼風格**

```bash
# 後端格式化
cd backend
black .
flake8 .

# 前端格式化
cd frontend
npm run lint
```

**新增功能建議**

1. 🌤️ **天氣整合** - 顯示目的地天氣預報
2. 📍 **Google Places API** - 自動搜尋景點
3. 👥 **多人協作** - 分享行程給旅伴
4. 📱 **PWA 支援** - 離線使用
5. 📊 **行程分析** - 統計圖表
6. 🔔 **提醒功能** - 行程提醒通知
7. 📸 **照片日記** - 上傳旅遊照片
8. 🎫 **訂位整合** - 連結餐廳/景點預訂

### 📄 授權

MIT License

---

## English

### 📖 Overview

Maple Planner is a modern travel itinerary planning application focused on Canada travel experiences. With intuitive drag-and-drop interface, smart route optimization, budget tracking, and more, it makes travel planning easier and more enjoyable.

### ✨ Features

- 🗂️ **Backlog Management** - Add, edit, and prioritize places you want to visit
- 📅 **Interactive Calendar** - Drag places to timeline with auto time calculation
- 🗺️ **Map Integration** - Google Maps with route visualization
- 🚗 **Route Optimization** - TSP algorithm for shortest path
- 📝 **Daily Notes** - Rich text notes for each day
- 💰 **Budget Tracking** - Track expenses by category
- 💱 **Currency Exchange** - Real-time exchange rates

### 🚀 Quick Start

```bash
# Clone and run with Docker
git clone https://github.com/yourusername/Travel-App.git
cd Travel-App
cp .env.example .env
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### 📄 License

MIT License

---

<div align="center">

Made with ❤️ for Canadian Travel Adventures 🍁

</div>