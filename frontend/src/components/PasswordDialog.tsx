import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean>;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function PasswordDialog({
  isOpen,
  onClose,
  onVerify,
  title = '輸入密碼',
  description = '此行程受密碼保護，請輸入密碼以解鎖編輯功能',
  submitLabel = '解鎖'
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const isValid = await onVerify(password);
      if (isValid) {
        setPassword('');
        onClose();
      } else {
        setError('密碼錯誤，請重試');
      }
    } catch (err) {
      setError('驗證失敗，請重試');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600 dark:text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密碼
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-650 focus:border-transparent outline-none"
                placeholder="請輸入密碼"
                autoFocus
                disabled={isVerifying}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-650 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isVerifying}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isVerifying || !password.trim()}
              >
                {isVerifying ? '驗證中...' : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
