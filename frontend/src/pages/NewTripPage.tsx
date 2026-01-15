import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Calendar, MapPin, FileText, Tag, Image, Loader2, Lock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { tripApi } from '../services/api';
import toast from 'react-hot-toast';

// Popular Canadian destinations
const destinations = [
  { name: '多倫多 Toronto', image: '🏙️' },
  { name: '溫哥華 Vancouver', image: '🌲' },
  { name: '班夫 Banff', image: '🏔️' },
  { name: '蒙特婁 Montreal', image: '🎭' },
  { name: '魁北克城 Quebec City', image: '🏰' },
  { name: '尼加拉瀑布 Niagara Falls', image: '💦' },
  { name: '渥太華 Ottawa', image: '🏛️' },
  { name: '卡加利 Calgary', image: '🤠' },
  { name: '維多利亞 Victoria', image: '🌸' },
  { name: '惠斯勒 Whistler', image: '⛷️' },
];

export default function NewTripPage() {
  const navigate = useNavigate();
  
  const today = new Date();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: 'Canada',
    start_date: format(addDays(today, 30), 'yyyy-MM-dd'),
    end_date: format(addDays(today, 44), 'yyyy-MM-dd'),
    cover_image: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const createMutation = useMutation({
    mutationFn: tripApi.create,
    onSuccess: (data) => {
      toast.success('行程建立成功！');
      if (data.data?.trip_id) {
        navigate(`/trip/${data.data.trip_id}`);
      }
    },
    onError: () => {
      toast.error('建立失敗，請稍後再試');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('請輸入行程名稱');
      return;
    }
    
    if (!formData.start_date || !formData.end_date) {
      toast.error('請選擇日期');
      return;
    }
    
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('結束日期必須在開始日期之後');
      return;
    }
    
    // 驗證密碼
    if (enablePassword) {
      if (!password || password.length < 4) {
        toast.error('密碼長度至少需要 4 個字元');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('兩次輸入的密碼不一致');
        return;
      }
    }

    createMutation.mutate(formData, {
      onSuccess: async (data) => {
        const tripId = data.data?.trip_id;
        
        // 如果啟用密碼保護，設定密碼
        if (enablePassword && password && tripId) {
          try {
            const response = await fetch(`/api/trips/${tripId}/password/set`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
            });
            
            if (!response.ok) {
              toast.error('密碼設定失敗，但行程已建立');
            }
          } catch (err) {
            toast.error('密碼設定失敗，但行程已建立');
          }
        }
        
        toast.success('行程建立成功！');
        if (tripId) {
          navigate(`/trip/${tripId}`);
        }
      }
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleDestinationClick = (dest: string) => {
    setFormData({
      ...formData,
      destination: dest,
      title: formData.title || `${dest}之旅`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            建立新行程 ✈️
          </h1>
          <p className="text-gray-600">
            開始規劃您的加拿大冒險之旅
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Title */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              行程名稱 *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：加拿大 14 天之旅"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                required
              />
            </div>
          </div>

          {/* Destination Quick Select */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              熱門目的地
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {destinations.map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => handleDestinationClick(dest.name)}
                  className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                    formData.destination === dest.name
                      ? 'border-maple-500 bg-maple-50 text-maple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-xl block mb-1">{dest.image}</span>
                  <span className="text-xs">{dest.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="或輸入其他目的地"
              className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
            />
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行日期 *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">開始日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">結束日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              行程描述
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述這次旅行的目的或期待..."
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500 resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              標籤
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-maple-100 text-maple-700 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-maple-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="輸入標籤後按 Enter"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                新增
              </button>
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面圖片 URL（選填）
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="url"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
              />
            </div>
            {formData.cover_image && (
              <div className="mt-3">
                <img
                  src={formData.cover_image}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Password Protection (Optional) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="text-gray-400" size={20} />
                <label className="text-sm font-medium text-gray-700">
                  密碼保護（選填）
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnablePassword(!enablePassword);
                  if (enablePassword) {
                    setPassword('');
                    setConfirmPassword('');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enablePassword ? 'bg-maple-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enablePassword ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {enablePassword && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  設定密碼後，需要輸入正確密碼才能編輯此行程
                </p>
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="輸入密碼（至少 4 個字元）"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                    minLength={4}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="確認密碼"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                  />
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">密碼不一致</p>
                )}
              </div>
            )}
          </div>

          {/* Password Protection (Optional) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="text-gray-400" size={20} />
                <label className="text-sm font-medium text-gray-700">
                  密碼保護（選填）
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnablePassword(!enablePassword);
                  if (enablePassword) {
                    setPassword('');
                    setConfirmPassword('');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enablePassword ? 'bg-maple-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enablePassword ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {enablePassword && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  設定密碼後，需要輸入正確密碼才能編輯此行程
                </p>
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="輸入密碼（至少 4 個字元）"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                    minLength={4}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="確認密碼"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500"
                  />
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">密碼不一致</p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-maple-500 text-white rounded-xl font-medium hover:bg-maple-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>建立中...</span>
                </>
              ) : (
                <span>建立行程</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
