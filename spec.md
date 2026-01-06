# 專案名稱：楓葉行程助手 (Maple Planner) - 旅遊行程安排 App

## 1. 專案概述

這是一個專為個人旅遊設計的行程規劃工具，專注於加拿大旅遊。使用者可以管理景點清單、透過拖拽排定每日行程，並利用地圖 API 進行路徑優化。

## 2. 技術棧 (Tech Stack)

* **前端**: React.js (使用 Tailwind CSS 進行 UI 樣式設計)
* **後端**: Python (FastAPI - 簡潔、高效、易於學習)
* **資料庫**: MongoDB (NoSQL 適合處理結構多變的旅遊資料)
* **地圖整合**: Google Maps Platform 或 Mapbox API

---

## 3. 功能需求 (Functional Requirements)

### A. 景點候選名單 (Backlog List)

* 使用者可以新增、編輯、刪除「想去的景點」。
* 每個景點包含：名稱、地點、預計停留時間、備註。
* **拖拽功能**: 景點可以從清單拖入行事曆中。

### B. 互動式行事曆 (Calendar Timeline)

* 以「天」為單位的垂直時間軸。
* 支援時段安排（例如：09:00 - 11:00 參觀班夫國家公園）。

### C. 地圖與路徑優化 (Map & Route Optimization)

* 地圖標註當天所有行程點。
* **路徑優化功能**: 點擊按鈕後，後端計算最短行駛距離，並自動重新排序該日的行程順序。

### D. 筆記與預算紀錄 (Notes & Budget)

* 每日行程下方設有 Rich Text 筆記區。
* **額外功能**: 增加一個簡單的「開支清單」，紀錄機票、住宿與餐飲費用。

### E. 快速匯率換算

---

## 4. 資料模型 (Data Models - MongoDB)

```json
// Trip (旅程)
{
  "_id": "ObjectId",
  "title": "加拿大 14 天之旅",
  "start_date": "2026-06-01",
  "end_date": "2026-06-14",
  "backlog_places": [
    { "name": "CN Tower", "address": "...", "duration": 120 }
  ],
  "itinerary": [
    {
      "date": "2026-06-01",
      "items": [
        { "time": "09:00", "place_name": "...", "lat": 43.6, "lng": -79.3 }
      ],
      "daily_notes": "記得帶防曬",
      "budget_items": [{ "item": "機票", "cost": 1500 }]
    }
  ]
}

```

---

## 5. API 設計 (Backend Endpoints - Python FastAPI)

| 功能 | métodos | 路徑 | 說明 |
| --- | --- | --- | --- |
| 取得所有行程 | GET | `/trips` | 獲取使用者的所有旅程清單 |
| 更新行程 | PUT | `/trips/{id}` | 更新景點順序、筆記或預算 |
| 路徑優化 | POST | `/optimize-route` | 傳入景點座標，返回排序後的清單 |

---

## 6. 前端架構與 UI 組件 (Frontend Architecture)

### 主要組件 (Main Components):

1. **SidebarComponent**: 顯示 `backlog_places`，支援 Drag-and-Drop。
2. **CalendarView**: 核心組件，使用 `react-beautiful-dnd` 或 `dnd-kit` 實作拖放。
3. **MapComponent**: 整合 Google Maps SDK，顯示 `Polyline` 路線。
4. **NoteEditor**: 簡單的文字區塊，自動儲存當日備註。

