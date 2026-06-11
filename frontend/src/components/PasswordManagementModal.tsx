import React, { useState, useEffect } from 'react';
import { Lock, X, Shield, Unlock } from 'lucide-react';

interface PasswordManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  isProtected: boolean;
  onPasswordChange: () => void;
}

export function PasswordManagementModal({
  isOpen,
  onClose,
  tripId,
  isProtected,
  onPasswordChange
}: PasswordManagementModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'set' | 'remove'>('set');

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setMode(isProtected ? 'set' : 'set');
    }
  }, [isOpen, isProtected]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不一致');
      return;
    }

    if (newPassword.length < 4) {
      setError('密碼長度至少需要 4 個字元');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trips/${tripId}/password/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          current_password: isProtected ? currentPassword : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '設定密碼失敗');
        return;
      }

      setSuccess(isProtected ? '密碼已更新' : '密碼保護已啟用');
      onPasswordChange();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('發生錯誤，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('請輸入目前的密碼');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trips/${tripId}/password/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '移除密碼失敗');
        return;
      }

      setSuccess('密碼保護已移除');
      onPasswordChange();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('發生錯誤，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">密碼管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
          {/* Mode Toggle */}
          {isProtected && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode('set')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm font-semibold ${
                  mode === 'set'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Lock className="h-4 w-4 inline mr-2" />
                更改密碼
              </button>
              <button
                type="button"
                onClick={() => setMode('remove')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm font-semibold ${
                  mode === 'remove'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Unlock className="h-4 w-4 inline mr-2" />
                移除保護
              </button>
            </div>
          )}

          {/* Set/Update Password Form */}
          {mode === 'set' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              {isProtected && (
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    目前密碼
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-650 focus:border-transparent outline-none text-sm"
                    placeholder="請輸入目前的密碼"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  新密碼
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-650 focus:border-transparent outline-none text-sm"
                  placeholder="至少 4 個字元"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  確認新密碼
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-650 focus:border-transparent outline-none text-sm"
                  placeholder="再次輸入新密碼"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '處理中...' : isProtected ? '更新密碼' : '設定密碼'}
                </button>
              </div>
            </form>
          )}

          {/* Remove Password Form */}
          {mode === 'remove' && isProtected && (
            <form onSubmit={handleRemovePassword} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                移除密碼保護後，任何人都可以編輯此行程。
              </p>

              <div>
                <label htmlFor="remove-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  目前密碼
                </label>
                <input
                  type="password"
                  id="remove-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-650 focus:border-transparent outline-none text-sm"
                  placeholder="請輸入目前的密碼以確認"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '處理中...' : '移除保護'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
