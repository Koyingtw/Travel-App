import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, MapPin, Calendar, Loader2 } from 'lucide-react';
import { tripApi } from '../services/api';
import TripCard from '../components/TripCard';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['trips', search],
    queryFn: () => tripApi.getAll(1, 20, search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: tripApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('行程已刪除');
    },
    onError: () => {
      toast.error('刪除失敗');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-block animate-bounce mb-4">
              <span className="text-6xl md:text-7xl">✈️</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Voyage Planner
            </h1>
            <p className="text-lg md:text-xl text-primary-100 dark:text-primary-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              您的智慧旅遊行程規劃工具<br/>
              <span className="text-primary-200 dark:text-primary-300">拖拽排程 · 路徑優化 · 預算與記帳</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/trip/new"
                className="group flex items-center space-x-2 px-8 py-4 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 rounded-xl font-semibold hover:bg-primary-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-200" />
                <span>建立新行程</span>
              </Link>
              <Link
                to="/exchange"
                className="flex items-center space-x-2 px-8 py-4 border-2 border-white/40 dark:border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                <span>💱</span>
                <span>匯率換算</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <svg className="fill-gray-50 dark:fill-gray-900" viewBox="0 0 1440 48" preserveAspectRatio="none">
          <path d="M0,48 L1440,48 L1440,0 C1200,32 960,48 720,48 C480,48 240,32 0,0 L0,48 Z" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋行程..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-primary-500 dark:focus:border-primary-600 transition-all"
            />
          </div>
        </div>

        {/* Trips Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">我的行程</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary-500 dark:text-primary-400" size={48} />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <p className="text-red-500 dark:text-red-400">載入失敗，請稍後再試</p>
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.items.map((trip) => (
                <TripCard
                  key={trip._id}
                  trip={trip}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="text-7xl mb-6 animate-bounce">🗺️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                尚無行程
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                開始規劃您的下一趟旅程吧！探索世界的無限魅力
              </p>
              <Link
                to="/trip/new"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus size={22} />
                <span>建立第一個行程</span>
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12 text-center">主要功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/70 transition-all duration-200 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="text-primary-600 dark:text-primary-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                拖拽排程
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                直覺的拖拽操作，輕鬆將景點排入每日行程，
                自動計算時間安排
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/70 transition-all duration-200 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-900/30 dark:to-forest-800/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="text-forest-600 dark:text-forest-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                路徑優化
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                AI 智能計算最佳遊覽順序，
                減少交通時間，讓行程更有效率
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/70 transition-all duration-200 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                智慧規劃
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                整合地圖導航，即時路線資訊，
                讓您的旅程規劃更加完善
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
