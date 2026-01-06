# 📚 Maple Planner - 詳細技術文件

本文件提供 Maple Planner 專案的詳細技術說明，包含 API 規格、資料模型、架構設計等。

---

## 目錄

1. [系統架構](#系統架構)
2. [資料模型](#資料模型)
3. [API 規格](#api-規格)
4. [前端架構](#前端架構)
5. [路徑優化演算法](#路徑優化演算法)
6. [部署指南](#部署指南)
7. [效能優化](#效能優化)
8. [安全性考量](#安全性考量)

---

## 系統架構

### 整體架構圖

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React 前端     │────▶│   FastAPI 後端   │────▶│  MongoDB Atlas  │
│   (Port 3000)   │     │   (Port 8000)   │     │   (雲端資料庫)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Google Maps    │     │  Exchange Rate  │
│      API        │     │      API        │
└─────────────────┘     └─────────────────┘
```

### 技術選型理由

| 技術 | 選擇原因 |
|------|----------|
| **FastAPI** | 高效能、自動生成 API 文檔、async 支援 |
| **MongoDB Atlas** | 雲端託管、自動擴展、免費方案可用 |
| **React** | 組件化、生態系豐富、TypeScript 支援 |
| **dnd-kit** | 輕量、accessible、高度客製化 |
| **OR-Tools** | Google 開源、TSP 問題專家、高效 |

---

## 資料模型

### Trip (行程)

```json
{
  "_id": "ObjectId",
  "title": "加拿大 14 天之旅",
  "description": "夢想中的楓葉之旅",
  "destination": "Canada",
  "start_date": "2026-06-01",
  "end_date": "2026-06-14",
  "cover_image": "https://...",
  "tags": ["family", "nature"],
  "user_id": null,
  
  "backlog_places": [
    {
      "id": "abc123",
      "name": "CN Tower",
      "address": "290 Bremner Blvd, Toronto",
      "coordinates": { "lat": 43.6426, "lng": -79.3871 },
      "duration": 120,
      "category": "landmark",
      "notes": "建議傍晚去看夕陽",
      "image_url": null,
      "rating": 4.5,
      "priority": 5
    }
  ],
  
  "itinerary": [
    {
      "date": "2026-06-01",
      "items": [
        {
          "id": "item001",
          "time": "09:00",
          "end_time": "11:00",
          "place_name": "Toronto Pearson Airport",
          "address": "...",
          "coordinates": { "lat": 43.6777, "lng": -79.6248 },
          "duration": 120,
          "notes": "領取租車",
          "category": "transportation",
          "completed": false,
          "order": 0
        }
      ],
      "daily_notes": "抵達日，調整時差",
      "budget_items": [
        {
          "id": "budget001",
          "item": "機票 - 台北到多倫多",
          "cost": 45000,
          "currency": "TWD",
          "category": "flight",
          "paid": true,
          "payment_method": "credit_card"
        }
      ],
      "weather": null
    }
  ],
  
  "total_budget": 0,
  "created_at": "2026-01-06T12:00:00Z",
  "updated_at": "2026-01-06T12:00:00Z"
}
```

### 景點分類 (PlaceCategory)

| 值 | 描述 | 圖示 |
|---|------|------|
| `nature` | 自然景觀 | 🏔️ |
| `museum` | 博物館 | 🏛️ |
| `restaurant` | 餐廳 | 🍽️ |
| `hotel` | 住宿 | 🏨 |
| `shopping` | 購物 | 🛍️ |
| `entertainment` | 娛樂 | 🎭 |
| `landmark` | 地標 | 🗼 |
| `transportation` | 交通 | 🚌 |
| `other` | 其他 | 📍 |

### 預算分類

| 值 | 描述 |
|---|------|
| `flight` | 機票 |
| `hotel` | 住宿 |
| `transport` | 交通 |
| `food` | 餐飲 |
| `activity` | 活動/門票 |
| `shopping` | 購物 |
| `other` | 其他 |

---

## API 規格

### 基本資訊

- **Base URL**: `http://localhost:8000/api`
- **Content-Type**: `application/json`
- **認證**: 目前無需認證（未來可擴展 JWT）

### 行程 API

#### GET /trips

獲取所有行程列表（分頁）

**Query Parameters**

| 參數 | 類型 | 必填 | 預設值 | 描述 |
|------|------|------|--------|------|
| `page` | int | 否 | 1 | 頁碼 |
| `page_size` | int | 否 | 20 | 每頁數量 (max: 100) |
| `search` | string | 否 | - | 搜尋關鍵字 |

**Response**

```json
{
  "items": [
    {
      "_id": "...",
      "title": "加拿大 14 天之旅",
      "destination": "Canada",
      "start_date": "2026-06-01",
      "end_date": "2026-06-14",
      "cover_image": null,
      "total_places": 15,
      "total_days": 14
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

#### POST /trips

建立新行程

**Request Body**

```json
{
  "title": "加拿大 14 天之旅",
  "description": "夢想中的楓葉之旅",
  "destination": "Canada",
  "start_date": "2026-06-01",
  "end_date": "2026-06-14",
  "cover_image": null,
  "tags": ["family", "nature"]
}
```

**Response**

```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip_id": "507f1f77bcf86cd799439011"
  }
}
```

#### GET /trips/{trip_id}

獲取單一行程詳情

**Response**: 完整的 Trip 物件

#### PUT /trips/{trip_id}

更新行程

**Request Body** (所有欄位皆為選填)

```json
{
  "title": "新標題",
  "backlog_places": [...],
  "itinerary": [...]
}
```

#### DELETE /trips/{trip_id}

刪除行程

### 路徑優化 API

#### POST /optimize-route

優化行程路線順序

**Request Body**

```json
{
  "points": [
    { "id": "1", "name": "CN Tower", "lat": 43.6426, "lng": -79.3871 },
    { "id": "2", "name": "ROM", "lat": 43.6677, "lng": -79.3948 },
    { "id": "3", "name": "AGO", "lat": 43.6536, "lng": -79.3925 }
  ],
  "start_point_id": "1",
  "end_point_id": null,
  "optimize_for": "distance"
}
```

**Response**

```json
{
  "ordered_points": [
    { "id": "1", "name": "CN Tower", "lat": 43.6426, "lng": -79.3871 },
    { "id": "3", "name": "AGO", "lat": 43.6536, "lng": -79.3925 },
    { "id": "2", "name": "ROM", "lat": 43.6677, "lng": -79.3948 }
  ],
  "total_distance_km": 3.45,
  "estimated_duration_minutes": 12,
  "polyline": null
}
```

### 匯率 API

#### GET /exchange/currencies

獲取支援的貨幣列表

**Response**

```json
[
  { "code": "CAD", "name": "Canadian Dollar", "symbol": "$" },
  { "code": "TWD", "name": "Taiwan Dollar", "symbol": "NT$" },
  ...
]
```

#### GET /exchange/rates

獲取匯率

**Query Parameters**

| 參數 | 類型 | 預設值 |
|------|------|--------|
| `base` | string | CAD |

**Response**

```json
{
  "base": "CAD",
  "rates": {
    "USD": 0.74,
    "TWD": 23.5,
    "EUR": 0.68,
    ...
  }
}
```

#### POST /exchange/convert

貨幣換算

**Request Body**

```json
{
  "amount": 100,
  "from_currency": "CAD",
  "to_currency": "TWD"
}
```

**Response**

```json
{
  "original_amount": 100,
  "converted_amount": 2350.00,
  "from_currency": "CAD",
  "to_currency": "TWD",
  "exchange_rate": 23.5,
  "last_updated": "2026-01-06T12:00:00Z"
}
```

---

## 前端架構

### 組件結構

```
src/
├── components/
│   ├── Layout.tsx           # 頁面布局（Header + Footer）
│   ├── TripCard.tsx         # 行程卡片（首頁列表用）
│   ├── TripPlanner.tsx      # 主規劃介面（含拖拽）
│   ├── PlaceCards.tsx       # 景點卡片（Backlog + Itinerary）
│   ├── AddPlaceModal.tsx    # 新增景點彈窗
│   ├── MapComponent.tsx     # Google Maps 整合
│   ├── NoteEditor.tsx       # 每日備註編輯器
│   └── BudgetTracker.tsx    # 預算追蹤組件
│
├── pages/
│   ├── HomePage.tsx         # 首頁（行程列表）
│   ├── NewTripPage.tsx      # 新增行程頁面
│   ├── TripDetailPage.tsx   # 行程詳情頁面
│   └── ExchangePage.tsx     # 匯率換算頁面
│
├── store/
│   └── tripStore.ts         # Zustand 狀態管理
│
├── services/
│   └── api.ts               # API 請求封裝
│
└── types/
    └── index.ts             # TypeScript 類型定義
```

### 狀態管理

使用 Zustand 進行全域狀態管理：

```typescript
interface TripStore {
  // 狀態
  currentTrip: Trip | null;
  selectedDate: string | null;
  isLoading: boolean;
  
  // 行程操作
  fetchTrip: (tripId: string) => Promise<void>;
  addBacklogPlace: (place: Omit<BacklogPlace, 'id'>) => Promise<void>;
  moveToItinerary: (place: BacklogPlace, date: string, time: string) => Promise<void>;
  reorderItinerary: (date: string, items: ItineraryItem[]) => Promise<void>;
  optimizeRoute: (date: string) => Promise<void>;
  
  // 備註與預算
  updateDailyNotes: (date: string, notes: string) => Promise<void>;
}
```

### 拖拽流程

```
1. 使用者從 Backlog 拖拽景點
   ↓
2. DndContext 偵測 dragStart
   ↓
3. 顯示 DragOverlay（預覽卡片）
   ↓
4. 拖到 Itinerary 區域
   ↓
5. dragEnd 事件觸發
   ↓
6. 呼叫 moveToItinerary()
   ↓
7. 更新本地狀態 + 同步後端
   ↓
8. Toast 顯示成功訊息
```

---

## 路徑優化演算法

### TSP (Traveling Salesman Problem)

使用 Google OR-Tools 的 TSP 解決方案：

```python
def optimize_route(points: List[RoutePoint]) -> List[RoutePoint]:
    # 1. 計算距離矩陣
    distance_matrix = create_distance_matrix(points)
    
    # 2. 建立路由模型
    manager = pywrapcp.RoutingIndexManager(len(points), 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    # 3. 設定距離回調
    def distance_callback(from_idx, to_idx):
        return distance_matrix[from_idx][to_idx]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # 4. 設定搜尋參數
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    
    # 5. 求解
    solution = routing.SolveWithParameters(search_parameters)
    
    # 6. 提取結果
    return extract_ordered_points(solution, points)
```

### 距離計算

使用 Haversine 公式計算地球表面兩點距離：

```python
def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    R = 6371  # 地球半徑 (km)
    
    φ1, φ2 = radians(lat1), radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lon2 - lon1)
    
    a = sin(Δφ/2)**2 + cos(φ1) * cos(φ2) * sin(Δλ/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c
```

---

## 部署指南

### Docker 部署

```bash
# 建置並啟動所有服務
docker-compose up -d --build

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f backend

# 停止服務
docker-compose down

# 完全清除（含資料）
docker-compose down -v
```

### 雲端部署選項

#### Railway / Render

1. 連接 GitHub 倉庫
2. 設定環境變數
3. 部署 Backend 為 Web Service
4. 部署 Frontend 為 Static Site
5. 使用 MongoDB Atlas 作為資料庫

#### AWS

```
Frontend: S3 + CloudFront
Backend: ECS or Lambda
Database: DocumentDB or MongoDB Atlas
```

### 環境變數清單

| 變數 | 服務 | 必填 | 描述 |
|------|------|------|------|
| `MONGODB_URL` | Backend | ✅ | MongoDB 連接字串 |
| `DATABASE_NAME` | Backend | ✅ | 資料庫名稱 |
| `GOOGLE_MAPS_API_KEY` | Backend | ❌ | Google Maps API |
| `EXCHANGE_RATE_API_KEY` | Backend | ❌ | 匯率 API Key |
| `CORS_ORIGINS` | Backend | ✅ | 允許的來源 |
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend | ❌ | 前端地圖 API |

---

## 效能優化

### 後端

1. **MongoDB 索引**
   ```javascript
   db.trips.createIndex({ "user_id": 1 })
   db.trips.createIndex({ "start_date": 1, "end_date": 1 })
   ```

2. **匯率快取**
   - 快取時間：1 小時
   - 儲存於 MongoDB

3. **路徑優化限制**
   - 最多 25 個景點
   - 計算超時：5 秒

### 前端

1. **React Query 快取**
   - staleTime: 5 分鐘
   - 自動重新獲取

2. **程式碼分割**
   - 路由懶載入
   - 按需載入地圖組件

3. **圖片優化**
   - 使用 Unsplash 壓縮參數
   - 延遲載入

---

## 安全性考量

### 目前實作

1. **CORS** - 限制允許的來源
2. **輸入驗證** - Pydantic 資料驗證
3. **無敏感資料** - 目前無用戶認證

### 未來建議

1. **JWT 認證** - 用戶登入系統
2. **Rate Limiting** - API 速率限制
3. **HTTPS** - 強制 SSL
4. **資料加密** - 敏感資料加密儲存
5. **XSS 防護** - 內容安全政策

---

## 擴展功能建議

### 短期 (v1.1)

- [ ] Google Places 自動完成
- [ ] 天氣預報整合
- [ ] PDF 行程匯出
- [ ] 分享連結

### 中期 (v1.5)

- [ ] 用戶認證系統
- [ ] 多人協作
- [ ] 行程模板
- [ ] 評論系統

### 長期 (v2.0)

- [ ] AI 行程推薦
- [ ] 預訂整合（Booking.com, Airbnb）
- [ ] 社群功能
- [ ] 移動 App (React Native)

---

## 常見問題

### Q: 地圖沒有顯示？

A: 請確認已設定 `VITE_GOOGLE_MAPS_API_KEY` 環境變數，並在 Google Cloud Console 啟用 Maps JavaScript API。

### Q: 路徑優化失敗？

A: 確保所有景點都有正確的座標（經緯度），且至少有 2 個景點。

### Q: 匯率不準確？

A: 免費 API 有更新延遲，如需即時匯率請使用付費 API（如 Open Exchange Rates）。

---

<div align="center">

📧 有問題？歡迎提交 Issue！

🍁 Happy Travels!

</div>
