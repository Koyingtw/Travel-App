import { useState, useCallback } from 'react';
import { X, Upload, FileJson, MapPin, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { BacklogPlace, PlaceCategory } from '../types';

interface ImportGoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (places: Omit<BacklogPlace, 'id'>[]) => void;
}

interface ParsedPlace {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  note?: string;
  selected: boolean;
}

// Google Maps Saved Places JSON structure
interface GoogleMapsFeature {
  type: string;
  geometry?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  properties?: {
    Title?: string;
    'Google Maps URL'?: string;
    Published?: string;
    Updated?: string;
    Location?: {
      'Business Name'?: string;
      Address?: string;
      'Geo Coordinates'?: {
        Latitude?: number;
        Longitude?: number;
      };
    };
    // Alternative format (newer exports)
    title?: string;
    note?: string;
    address?: string;
  };
}

interface GoogleMapsSavedList {
  type: string;
  features: GoogleMapsFeature[];
}

// Simple category detection based on keywords
function detectCategory(name: string, address?: string): PlaceCategory {
  const text = `${name} ${address || ''}`.toLowerCase();
  
  if (/restaurant|café|cafe|coffee|bakery|bar|pub|食|餐|咖啡|酒/.test(text)) {
    return 'restaurant';
  }
  if (/hotel|motel|inn|hostel|airbnb|住宿|酒店|旅館/.test(text)) {
    return 'hotel';
  }
  if (/museum|gallery|博物館|美術館|展覽/.test(text)) {
    return 'museum';
  }
  if (/park|mountain|lake|beach|forest|nature|falls|公園|山|湖|海|自然/.test(text)) {
    return 'nature';
  }
  if (/mall|shop|store|market|outlet|購物|商場|市場/.test(text)) {
    return 'shopping';
  }
  if (/theater|cinema|amusement|zoo|aquarium|劇院|電影|遊樂|動物園/.test(text)) {
    return 'entertainment';
  }
  if (/tower|monument|landmark|bridge|castle|temple|church|塔|橋|城|寺|教堂/.test(text)) {
    return 'landmark';
  }
  if (/station|airport|terminal|bus|train|metro|車站|機場|巴士/.test(text)) {
    return 'transportation';
  }
  
  return 'other';
}

export default function ImportGoogleMapsModal({ isOpen, onClose, onImport }: ImportGoogleMapsModalProps) {
  const [parsedPlaces, setParsedPlaces] = useState<ParsedPlace[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file');

  const parseGoogleMapsJSON = (content: string): ParsedPlace[] => {
    try {
      const data: GoogleMapsSavedList = JSON.parse(content);
      
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('無效的 Google Maps 儲存清單格式');
      }

      return data.features
        .filter((feature) => feature.type === 'Feature')
        .map((feature) => {
          const props = feature.properties || {};
          const location = props.Location;
          const coords = feature.geometry?.coordinates;
          
          // Handle different export formats
          const name = props.Title || props.title || location?.['Business Name'] || '未命名地點';
          const address = location?.Address || props.address;
          const geoCoords = location?.['Geo Coordinates'];
          
          // Coordinates: GeoJSON uses [lng, lat], Google's geo uses separate fields
          let lat: number | undefined;
          let lng: number | undefined;
          
          if (geoCoords) {
            lat = geoCoords.Latitude;
            lng = geoCoords.Longitude;
          } else if (coords && coords.length === 2) {
            lng = coords[0];
            lat = coords[1];
          }

          return {
            name,
            address,
            lat,
            lng,
            note: props.note,
            selected: true,
          };
        })
        .filter((place) => place.name && place.name !== '未命名地點');
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('JSON 格式錯誤，請確認檔案內容正確');
      }
      throw err;
    }
  };

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const content = await file.text();
      const places = parseGoogleMapsJSON(content);
      
      if (places.length === 0) {
        throw new Error('找不到任何地點，請確認檔案格式正確');
      }
      
      setParsedPlaces(places);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析檔案時發生錯誤');
      setParsedPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFile(file);
    } else {
      setError('請上傳 JSON 檔案');
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const togglePlace = (index: number) => {
    setParsedPlaces((prev) =>
      prev.map((place, i) =>
        i === index ? { ...place, selected: !place.selected } : place
      )
    );
  };

  const selectAll = () => {
    setParsedPlaces((prev) => prev.map((place) => ({ ...place, selected: true })));
  };

  const deselectAll = () => {
    setParsedPlaces((prev) => prev.map((place) => ({ ...place, selected: false })));
  };

  const handleImport = () => {
    const selectedPlaces = parsedPlaces
      .filter((place) => place.selected)
      .map((place) => ({
        name: place.name,
        address: place.address,
        coordinates: place.lat && place.lng
          ? { lat: place.lat, lng: place.lng }
          : undefined,
        duration: 60,
        category: detectCategory(place.name, place.address),
        notes: place.note,
        priority: 0,
      }));

    if (selectedPlaces.length === 0) {
      setError('請至少選擇一個地點');
      return;
    }

    onImport(selectedPlaces);
    handleClose();
  };

  const handleClose = () => {
    setParsedPlaces([]);
    setError(null);
    setFileName(null);
    onClose();
  };

  const selectedCount = parsedPlaces.filter((p) => p.selected).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50 max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">匯入 Google Maps 清單</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">支援 JSON 檔案或分享連結（開發中）</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
            {parsedPlaces.length === 0 ? (
              <>
                {/* Method selector */}
                <div className="mb-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setImportMethod('file')}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      importMethod === 'file'
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650'
                    }`}
                  >
                    📄 JSON 檔案匯入
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMethod('url')}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      importMethod === 'url'
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650'
                    }`}
                  >
                    🔗 分享連結
                  </button>
                </div>

                {importMethod === 'file' ? (
                  <>
                    {/* JSON File Instructions */}
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">如何匯出 Google Maps 儲存清單？</h3>
                      <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                        <li>前往 <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Takeout</a></li>
                        <li>點擊「取消全選」，然後只勾選「儲存的地點」或「Maps (我的地圖)」</li>
                        <li>選擇 JSON 格式匯出</li>
                        <li>下載並解壓縮後，上傳 <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">Saved Places.json</code> 檔案</li>
                      </ol>
                    </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                      <p className="mt-3 text-gray-600 dark:text-gray-300">正在解析檔案...</p>
                    </div>
                  ) : (
                    <>
                      <FileJson className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-500" />
                      <p className="mt-3 text-gray-600 dark:text-gray-300">
                        將 JSON 檔案拖放到此處
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">或</p>
                      <label className="mt-3 inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 cursor-pointer transition-colors">
                        <Upload size={18} className="mr-2" />
                        選擇檔案
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center text-red-700 dark:text-red-300">
                    <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                  </>
                ) : (
                  <>
                    {/* Share URL Instructions */}
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                      <h3 className="font-medium text-amber-900 dark:text-amber-300 mb-2 flex items-center">
                        <AlertCircle size={18} className="mr-2" />
                        目前限制說明
                      </h3>
                      <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                        <p>由於 Google Maps 的 API 限制，目前無法直接透過分享連結即時同步清單內容。</p>
                        <p className="font-medium">建議使用方式：</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>使用上方「JSON 檔案匯入」功能</li>
                          <li>或手動複製清單內的地點名稱到搜尋欄位新增</li>
                        </ol>
                        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                          💡 <strong>未來功能：</strong>我們計劃開發瀏覽器擴充功能來直接讀取 Google Maps 清單
                        </p>
                      </div>
                    </div>

                    {/* URL Input (disabled for now) */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Google Maps 分享連結
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={shareUrl}
                          onChange={(e) => setShareUrl(e.target.value)}
                          placeholder="https://maps.app.goo.gl/AvnhrjQyTDioAaJP8"
                          disabled
                          className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                        />
                        <button
                          type="button"
                          disabled
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-300 dark:bg-gray-750 text-gray-500 dark:text-gray-400 rounded text-sm cursor-not-allowed"
                        >
                          載入
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        此功能開發中，請使用 JSON 檔案匯入
                      </p>
                    </div>

                    {/* How to get share link */}
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center">
                        <span className="mr-2">▶</span>
                        如何取得 Google Maps 分享連結？
                      </summary>
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <ol className="list-decimal list-inside space-y-1">
                          <li>在 Google Maps 中開啟你的「已儲存」清單</li>
                          <li>點擊清單右上角的「⋮」選單</li>
                          <li>選擇「分享清單」</li>
                          <li>複製分享連結（例如：https://maps.app.goo.gl/...）</li>
                        </ol>
                        <div className="mt-3 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">
                          <strong>範例連結：</strong>
                          <code className="block mt-1 text-gray-600 dark:text-gray-400">https://maps.app.goo.gl/AvnhrjQyTDioAaJP8</code>
                        </div>
                      </div>
                    </details>

                    {/* Workaround suggestion */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 替代方案</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        如果你想快速新增清單中的景點：
                      </p>
                      <ol className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-decimal list-inside">
                        <li>開啟你的 Google Maps 分享清單</li>
                        <li>複製想要的地點名稱</li>
                        <li>在新增景點時使用「搜尋景點」功能</li>
                        <li>貼上地點名稱，系統會自動填入座標 and 資訊</li>
                      </ol>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* File info & select controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FileJson size={18} className="mr-2" />
                    <span>{fileName}</span>
                    <span className="mx-2">·</span>
                    <span>{parsedPlaces.length} 個地點</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      全選
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      取消全選
                    </button>
                  </div>
                </div>

                {/* Places list */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {parsedPlaces.map((place, index) => (
                    <div
                      key={index}
                      onClick={() => togglePlace(index)}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                        place.selected
                          ? 'border-primary-300 bg-primary-50 dark:bg-primary-950/20 dark:border-primary-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        place.selected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {place.selected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {place.name}
                        </div>
                        {place.address && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center mt-0.5">
                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                            {place.address}
                          </div>
                        )}
                        {place.lat && place.lng && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center text-red-700 dark:text-red-300">
                    <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {parsedPlaces.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50 dark:bg-gray-800/80">
              <button
                onClick={() => {
                  setParsedPlaces([]);
                  setFileName(null);
                  setError(null);
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← 重新選擇檔案
              </button>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  已選擇 {selectedCount} 個地點
                </span>
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Upload size={18} className="mr-2" />
                  匯入選取的地點
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
