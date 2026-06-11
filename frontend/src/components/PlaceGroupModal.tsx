import { useState } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import type { PlaceGroup } from '../types';

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

interface PlaceGroupModalProps {
  isOpen: boolean;
  groups: PlaceGroup[];
  onClose: () => void;
  onAddGroup: (group: Omit<PlaceGroup, 'id'>) => Promise<void>;
  onRemoveGroup: (groupId: string) => Promise<void>;
  onUpdateGroup: (groupId: string, updates: Partial<PlaceGroup>) => Promise<void>;
}

export default function PlaceGroupModal({
  isOpen,
  groups,
  onClose,
  onAddGroup,
  onRemoveGroup,
  onUpdateGroup,
}: PlaceGroupModalProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  if (!isOpen) return null;

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;

    await onAddGroup({
      name: newGroupName.trim(),
      color: newGroupColor,
    });

    setNewGroupName('');
    setNewGroupColor(DEFAULT_COLORS[0]);
  };

  const handleStartEdit = (group: PlaceGroup) => {
    setEditingId(group.id);
    setEditingName(group.name);
    setEditingColor(group.color || DEFAULT_COLORS[0]);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    await onUpdateGroup(editingId, {
      name: editingName.trim(),
      color: editingColor,
    });

    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-black/50 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">管理景點群組</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Add New Group */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">新增群組</h3>
            <input
              type="text"
              placeholder="群組名稱"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
              onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-2 flex-wrap flex-1">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      newGroupColor === color
                        ? 'border-gray-900 dark:border-gray-100'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                新增
              </button>
            </div>
          </div>

          {/* Existing Groups */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              現有群組 ({groups.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  尚無群組
                </p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group/item hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex ${
                      editingId === group.id ? 'flex-col gap-3' : 'items-center gap-2'
                    }`}
                  >
                    {editingId === group.id ? (
                      <div className="space-y-3 w-full">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {DEFAULT_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditingColor(color)}
                              className={`w-6 h-6 rounded-md border-2 transition-all ${
                                editingColor === color
                                  ? 'border-gray-900 dark:border-gray-100 scale-110 shadow-sm'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs font-semibold transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color || DEFAULT_COLORS[0] }}
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {group.name}
                        </span>
                        <button
                          onClick={() => handleStartEdit(group)}
                          className="p-1 opacity-0 group-hover/item:opacity-100 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          title="編輯"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onRemoveGroup(group.id)}
                          className="p-1 opacity-0 group-hover/item:opacity-100 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
