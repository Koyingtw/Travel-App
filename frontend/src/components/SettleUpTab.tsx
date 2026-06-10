import { useEffect, useState } from 'react';
import { 
  Users, Plus, Trash2, Edit2, FileSpreadsheet, 
  Camera, Loader2, ArrowRight, X 
} from 'lucide-react';
import { expenseApi, tripApi } from '../services/api';
import type { SettleUpExpense, ExpensesDashboard, SimplifiedSettlement, ExpenseSplit, ExpenseItem } from '../types';
import toast from 'react-hot-toast';

interface SettleUpTabProps {
  tripId: string;
  isReadOnly: boolean;
}

const expenseCategories = [
  { value: 'flight', label: '機票', emoji: '✈️' },
  { value: 'hotel', label: '住宿', emoji: '🏨' },
  { value: 'transport', label: '交通', emoji: '🚗' },
  { value: 'food', label: '餐飲', emoji: '🍽️' },
  { value: 'activity', label: '活動', emoji: '🎫' },
  { value: 'shopping', label: '購物', emoji: '🛍️' },
  { value: 'other', label: '其他', emoji: '📝' },
];

export default function SettleUpTab({ tripId, isReadOnly }: SettleUpTabProps) {
  const [dashboard, setDashboard] = useState<ExpensesDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  
  // Modals / forms
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showItemSplittingWizard, setShowItemSplittingWizard] = useState(false);
  const [itemAssignments, setItemAssignments] = useState<Record<number, string[]>>({});
  
  const [expenseForm, setExpenseForm] = useState({
    id: '',
    description: '',
    amount: '',
    currency: 'TWD',
    date: new Date().toISOString().split('T')[0],
    payer_id: '',
    split_type: 'equal' as 'equal' | 'exact',
    category: 'other',
    splits: [] as { member_id: string; amount: string }[],
    is_settlement: false,
    payee_id: '',
    items: [] as ExpenseItem[]
  });

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await expenseApi.getDashboard(tripId);
      setDashboard(data);
    } catch (error) {
      toast.error('無法載入費用數據');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [tripId]);

  const [isChangingCurrency, setIsChangingCurrency] = useState(false);

  const handleBaseCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setIsChangingCurrency(true);
    try {
      await tripApi.update(tripId, { base_currency: newCurrency });
      toast.success(`預設結算幣別已更換為 ${newCurrency}`);
      loadDashboard();
    } catch (error) {
      toast.error('更換預設結算幣別失敗');
    } finally {
      setIsChangingCurrency(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      await expenseApi.addMember(tripId, newMemberName.trim());
      setNewMemberName('');
      setIsAddingMember(false);
      toast.success('已新增成員');
      loadDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '新增成員失敗');
    }
  };

  const handleRenameMember = async (memberId: string) => {
    if (!editMemberName.trim()) return;
    try {
      await expenseApi.updateMember(tripId, memberId, editMemberName.trim());
      setEditingMemberId(null);
      setEditMemberName('');
      toast.success('已更新成員名稱');
      loadDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '更新失敗');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('確定要刪除此成員嗎？其分帳記錄也將被清除。')) return;
    try {
      await expenseApi.deleteMember(tripId, memberId);
      toast.success('已刪除成員');
      loadDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '刪除失敗');
    }
  };

  // Open add expense modal
  const openAddExpenseModal = (isSettlement = false, settlementDetails?: SimplifiedSettlement) => {
    if (!dashboard || dashboard.members.length === 0) {
      toast.error('請先新增成員！');
      return;
    }
    
    const defaultPayer = dashboard.members[0].id;
    const defaultPayee = dashboard.members.length > 1 ? dashboard.members[1].id : '';

    if (isSettlement && settlementDetails) {
      setExpenseForm({
        id: '',
        description: `還款: ${settlementDetails.from_name} ➡️ ${settlementDetails.to_name}`,
        amount: settlementDetails.amount.toString(),
        currency: settlementDetails.currency,
        date: new Date().toISOString().split('T')[0],
        payer_id: settlementDetails.from_id,
        split_type: 'equal',
        category: 'other',
        splits: [],
        is_settlement: true,
        payee_id: settlementDetails.to_id,
        items: []
      });
    } else {
      setExpenseForm({
        id: '',
        description: '',
        amount: '',
        currency: dashboard.base_currency || 'USD',
        date: new Date().toISOString().split('T')[0],
        payer_id: defaultPayer,
        split_type: 'equal',
        category: 'other',
        splits: dashboard.members.map(m => ({ member_id: m.id, amount: '' })),
        is_settlement: false,
        payee_id: defaultPayee,
        items: []
      });
    }
    setIsAddingExpense(true);
  };

  const handleSplitAmountChange = (memberId: string, value: string) => {
    setExpenseForm(prev => ({
      ...prev,
      splits: prev.splits.map(s => s.member_id === memberId ? { ...s, amount: value } : s)
    }));
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const { description, amount, currency, date, payer_id, split_type, category, splits, is_settlement, payee_id } = expenseForm;

    if (!description.trim()) {
      toast.error('請輸入項目描述');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('請輸入有效金額');
      return;
    }

    // Format split details
    let formattedSplits: ExpenseSplit[] = [];
    if (!is_settlement) {
      if (split_type === 'equal') {
        // Find which members are checked (all by default if equal, but let's assume all for simple equal split)
        // We'll pass the list of participants to split equally with
        formattedSplits = splits.map(s => ({
          member_id: s.member_id,
          amount: round(numAmount / splits.length)
        }));
      } else {
        // Custom split check sum
        const sum = splits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
        if (Math.abs(sum - numAmount) > 0.05) {
          toast.error(`分帳金額總和 ($${sum.toFixed(2)}) 必須等於總金額 ($${numAmount.toFixed(2)})`);
          return;
        }
        formattedSplits = splits.map(s => ({
          member_id: s.member_id,
          amount: parseFloat(s.amount) || 0
        }));
      }
    }

    const expensePayload: SettleUpExpense = {
      description: description.trim(),
      amount: numAmount,
      currency,
      date,
      payer_id,
      split_type,
      splits: formattedSplits,
      is_settlement,
      payee_id: is_settlement ? payee_id : undefined,
      category,
      items: expenseForm.items
    };

    try {
      await expenseApi.addExpense(tripId, expensePayload);
      toast.success(is_settlement ? '已記錄還款' : '已新增費用');
      setIsAddingExpense(false);
      loadDashboard();
    } catch (error) {
      toast.error('儲存失敗');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('確定要刪除此筆記錄嗎？')) return;
    try {
      await expenseApi.deleteExpense(tripId, expenseId);
      toast.success('已刪除記錄');
      loadDashboard();
    } catch (error) {
      toast.error('刪除失敗');
    }
  };

  // Simulated OCR Trigger
  const handleSampleOcr = async (sampleType: 'rome' | 'gas' | 'hotel') => {
    setIsScanning(true);
    // Create a dummy file with a specific name so backend triggers the mock OCR
    const filename = `${sampleType}_receipt.jpg`;
    const dummyBlob = new Blob([''], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], filename, { type: 'image/jpeg' });

    try {
      const result = await expenseApi.scanReceipt(tripId, dummyFile);
      if (result.success) {
        const items = (result as any).items || [];
        setExpenseForm(prev => ({
          ...prev,
          description: result.description,
          amount: result.amount.toString(),
          currency: result.currency,
          category: result.category,
          date: result.date,
          items: items
        }));
        
        if (items && items.length > 0) {
          const initialAssignments: Record<number, string[]> = {};
          items.forEach((_: any, index: number) => {
            initialAssignments[index] = dashboard?.members.map(m => m.id) || [];
          });
          setItemAssignments(initialAssignments);
          setShowItemSplittingWizard(true);
          toast.success('已載入模擬發票明細！');
        } else {
          toast.success(`OCR 掃描成功 (信心度: ${((result as any).confidence * 100).toFixed(0)}%)`);
        }
      }
    } catch (error) {
      toast.error('OCR 掃描失敗');
    } finally {
      setIsScanning(false);
    }
  };

  // Real OCR Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const result = await expenseApi.scanReceipt(tripId, file);
      if (result.success) {
        const items = (result as any).items || [];
        setExpenseForm(prev => ({
          ...prev,
          description: result.description,
          amount: result.amount.toString(),
          currency: result.currency,
          category: result.category,
          date: result.date,
          items: items
        }));
        
        if (items && items.length > 0) {
          const initialAssignments: Record<number, string[]> = {};
          items.forEach((_: any, index: number) => {
            initialAssignments[index] = dashboard?.members.map(m => m.id) || [];
          });
          setItemAssignments(initialAssignments);
          setShowItemSplittingWizard(true);
          toast.success('發票明細識別成功，請分配分帳！');
        } else {
          toast.success('發票自動識別成功！');
        }
      }
    } catch (error) {
      toast.error('掃描失敗，請手動輸入');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyItemSplit = () => {
    // 1. Check if all items are assigned to at least 1 person
    const unassignedItems = expenseForm.items.filter((_, index) => {
      const assigned = itemAssignments[index] || [];
      return assigned.length === 0;
    });

    if (unassignedItems.length > 0) {
      toast.error(`請指派所有品項！尚有 ${unassignedItems.length} 個項目無人認領`);
      return;
    }

    if (!dashboard) return;

    // 2. Calculate splits
    const memberTotals: Record<string, number> = {};
    dashboard.members.forEach(m => {
      memberTotals[m.id] = 0;
    });

    expenseForm.items.forEach((item, index) => {
      const assigned = itemAssignments[index] || [];
      const share = item.amount / assigned.length;
      assigned.forEach(mid => {
        memberTotals[mid] = (memberTotals[mid] || 0) + share;
      });
    });

    // 3. Update splits in form
    const newSplits = dashboard.members.map(m => ({
      member_id: m.id,
      amount: round(memberTotals[m.id] || 0).toString()
    }));

    // Update form's items with their assignments, so they save in backend
    const updatedItems = expenseForm.items.map((item, index) => ({
      ...item,
      assigned_member_ids: itemAssignments[index] || []
    }));

    setExpenseForm(prev => ({
      ...prev,
      split_type: 'exact',
      splits: newSplits,
      items: updatedItems
    }));

    setShowItemSplittingWizard(false);
    toast.success('已依發票明細分配分帳金額！');
  };

  const handleExportExcel = () => {
    window.location.href = expenseApi.getExportUrl(tripId);
    toast.success('已匯出 Excel 報表');
  };

  const round = (val: number) => Math.round(val * 100) / 100;

  if (isLoading && !dashboard) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary-500" size={36} />
        <span className="ml-3 text-gray-500">載入帳目中...</span>
      </div>
    );
  }

  const members = dashboard?.members || [];
  const expenses = dashboard?.expenses || [];
  const balances = dashboard?.balances || [];
  const settlements = dashboard?.simplified_settlements || [];
  const baseCurrency = dashboard?.base_currency || 'USD';

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="text-primary-500 dark:text-primary-400" size={20} />
          <h3 className="font-bold text-lg text-gray-950 dark:text-white">費用分攤中心</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full flex items-center space-x-1 border border-gray-200 dark:border-gray-600">
            <span>預設結算:</span>
            {isReadOnly ? (
              <span className="font-bold">{baseCurrency}</span>
            ) : (
              <select
                value={baseCurrency}
                onChange={handleBaseCurrencyChange}
                disabled={isChangingCurrency}
                className="bg-transparent font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="TWD" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">TWD</option>
                <option value="USD" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">USD</option>
                <option value="EUR" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">EUR</option>
                <option value="JPY" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">JPY</option>
                <option value="CAD" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">CAD</option>
              </select>
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <FileSpreadsheet size={16} />
            <span>匯出 Excel</span>
          </button>
          
          {!isReadOnly && (
            <button
              onClick={() => openAddExpenseModal(false)}
              className="flex items-center space-x-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
            >
              <Plus size={16} />
              <span>記一筆</span>
            </button>
          )}
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Members Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>👥 行程成員 ({members.length})</span>
            </h4>
            {!isReadOnly && !isAddingMember && (
              <button
                onClick={() => setIsAddingMember(true)}
                className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center space-x-0.5"
              >
                <Plus size={14} />
                <span>新增成員</span>
              </button>
            )}
          </div>

          {/* Add Member form */}
          {isAddingMember && (
            <form onSubmit={handleAddMember} className="flex space-x-2">
              <input
                type="text"
                placeholder="輸入姓名..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-semibold"
              >
                確認
              </button>
              <button
                type="button"
                onClick={() => { setIsAddingMember(false); setNewMemberName(''); }}
                className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-500 rounded-lg hover:bg-gray-50 text-sm"
              >
                取消
              </button>
            </form>
          )}

          {/* Members List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">暫無成員，請點擊新增</p>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                  {editingMemberId === m.id ? (
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        value={editMemberName}
                        onChange={(e) => setEditMemberName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameMember(m.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => setEditingMemberId(null)}
                        className="px-1.5 py-1 border border-gray-300 rounded text-xs text-gray-500"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.name}</span>
                      {!isReadOnly && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                          <button
                            onClick={() => { setEditingMemberId(m.id); setEditMemberName(m.name); }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 2: Balances Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
          <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
            💰 成員收支餘額 ({baseCurrency})
          </h4>
          
          <div className="space-y-3">
            {balances.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">無收支數據</p>
            ) : (
              balances.map(b => {
                const name = members.find(m => m.id === b.member_id)?.name || '未知';
                const isPositive = b.balance > 0;
                const isNegative = b.balance < 0;
                
                return (
                  <div key={b.member_id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</span>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        isPositive ? 'text-green-600 dark:text-green-400' : 
                        isNegative ? 'text-red-500 dark:text-red-400' : 
                        'text-gray-500'
                      }`}>
                        {isPositive ? '+' : ''}{b.balance.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {isPositive ? '應收款' : isNegative ? '應付款' : '已結清'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Col 3: Debt Simplification / Settlements */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
          <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center space-x-1.5">
            <span>🤝 最佳結算方案 (Settle Up)</span>
          </h4>

          <div className="space-y-2.5">
            {settlements.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">帳目已結清，無須付款！</p>
              </div>
            ) : (
              settlements.map((s, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-gradient-to-r from-primary-50/50 to-white dark:from-primary-950/20 dark:to-gray-800 rounded-xl border border-primary-100 dark:border-primary-900/30 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{s.from_name}</span>
                    <ArrowRight size={12} className="text-gray-400" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">{s.to_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
                      ${s.amount.toFixed(2)} {s.currency}
                    </span>
                    {!isReadOnly && (
                      <button
                        onClick={() => openAddExpenseModal(true, s)}
                        className="px-2 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
                      >
                        登記還款
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Expense list section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
          📝 帳目記錄明細 ({expenses.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-500">
                <th className="pb-3 text-center w-20">日期</th>
                <th className="pb-3 pl-4">項目/說明</th>
                <th className="pb-3 text-center w-24">分類</th>
                <th className="pb-3 text-center w-24">付款人</th>
                <th className="pb-3 text-right pr-6 w-32">金額</th>
                <th className="pb-3 text-center w-36">分帳對象</th>
                {!isReadOnly && <th className="pb-3 text-center w-16">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">尚無開支記錄</td>
                </tr>
              ) : (
                expenses.map(e => {
                  const payer = members.find(m => m.id === e.payer_id)?.name || '未知';
                  const payee = e.is_settlement ? (members.find(m => m.id === e.payee_id)?.name || '未知') : null;
                  const category = expenseCategories.find(c => c.value === e.category);
                  
                  return (
                    <tr key={e.id} className={`text-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ${e.is_settlement ? 'bg-green-50/20 dark:bg-green-950/10' : ''}`}>
                      <td className="py-3 text-center text-gray-500 font-mono text-xs">{e.date}</td>
                      <td className="py-3 pl-4">
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          {e.description}
                        </div>
                        {e.is_settlement && (
                          <div className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                            🤝 還款交易
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                          {e.is_settlement ? '💸 還款' : `${category?.emoji || '📝'} ${category?.label || '其他'}`}
                        </span>
                      </td>
                      <td className="py-3 text-center font-medium text-gray-700 dark:text-gray-300">{payer}</td>
                      <td className="py-3 text-right pr-6 font-extrabold text-gray-900 dark:text-white">
                        ${e.amount.toFixed(2)} <span className="text-xs text-gray-400 font-normal">{e.currency}</span>
                      </td>
                      <td className="py-3 text-center text-xs text-gray-500 max-w-[150px] truncate">
                        {e.is_settlement ? (
                          <span>給 {payee}</span>
                        ) : (
                          <span>
                            {e.split_type === 'equal' 
                              ? `均分 (${e.splits.length}人)` 
                              : `自訂 (${e.splits.length}人)`
                            }
                          </span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleDeleteExpense(e.id!)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense / Settle Up Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {expenseForm.is_settlement ? '🤝 記錄還款金額' : '📝 新增旅遊開支'}
              </h3>
              <button
                onClick={() => setIsAddingExpense(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Receipt scanning banner for normal expenses */}
              {!expenseForm.is_settlement && (
                <div className="bg-gradient-to-r from-primary-50 to-rose-50 dark:from-primary-950/20 dark:to-rose-950/20 p-4 rounded-xl border border-primary-100 dark:border-primary-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center space-x-1.5">
                      <Camera size={14} />
                      <span>發票拍照識別 (Gemini AI OCR)</span>
                    </span>
                    
                    <label className="cursor-pointer text-xs bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 font-semibold shadow-sm flex items-center space-x-1">
                      {isScanning ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        <Camera size={12} />
                      )}
                      <span>上傳發票</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isScanning}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Demo Mocks */}
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    <span className="text-[10px] text-gray-400 font-semibold">測試模擬:</span>
                    <button
                      type="button"
                      onClick={() => handleSampleOcr('rome')}
                      disabled={isScanning}
                      className="text-[10px] px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 font-semibold shadow-sm"
                    >
                      羅馬餐飲 (€128.50 EUR)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSampleOcr('gas')}
                      disabled={isScanning}
                      className="text-[10px] px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 font-semibold shadow-sm"
                    >
                      加油站 ($85.00 USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSampleOcr('hotel')}
                      disabled={isScanning}
                      className="text-[10px] px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 font-semibold shadow-sm"
                    >
                      飯店帳單 ($320 USD)
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">項目描述</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 羅馬晚餐、加油、租車..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
              </div>

              {/* Amount, Currency & Category */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">金額</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">幣別</label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TWD">TWD (NT$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">分類</label>
                  <select
                    value={expenseForm.category}
                    disabled={expenseForm.is_settlement}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  >
                    {expenseCategories.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Payer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">日期</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">
                    {expenseForm.is_settlement ? '還款人 (Payer)' : '付款人 (Who Paid?)'}
                  </label>
                  <select
                    value={expenseForm.payer_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Settle Up specific fields */}
              {expenseForm.is_settlement ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">收款人 (Payee)</label>
                  <select
                    value={expenseForm.payee_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  >
                    {members.filter(m => m.id !== expenseForm.payer_id).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Split configuration for normal expenses */
                <div className="space-y-3 pt-2">
                  {/* Linked Receipt Items */}
                  {expenseForm.items && expenseForm.items.length > 0 ? (
                    <div className="bg-primary-50/40 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/20 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center space-x-1.5">
                          <span>🧾 已連結發票明細 ({expenseForm.items.length} 項)</span>
                        </span>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowItemSplittingWizard(true)}
                            className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            編輯明細分配
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('確定要清除所有品項明細嗎？這將會把分帳重設為均分。')) {
                                setExpenseForm(prev => ({
                                  ...prev,
                                  items: [],
                                  split_type: 'equal',
                                  splits: members.map(m => ({ member_id: m.id, amount: '' }))
                                }));
                              }
                            }}
                            className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 hover:underline"
                          >
                            清除明細
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] space-y-1 text-gray-500 dark:text-gray-400 max-h-24 overflow-y-auto font-mono no-scrollbar">
                        {expenseForm.items.map((item, idx) => {
                          const assigned = itemAssignments[idx] || item.assigned_member_ids || [];
                          const names = assigned.map(id => members.find(m => m.id === id)?.name || id).join(', ');
                          return (
                            <div key={idx} className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-0.5 last:border-0 last:pb-0">
                              <span className="truncate max-w-[70%]">{item.name} (x{item.quantity}) → {names || '無'}</span>
                              <span className="font-semibold">${item.amount.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExpenseForm(prev => ({
                            ...prev,
                            items: [{ name: '品項 1', amount: parseFloat(prev.amount) || 0, quantity: 1 }]
                          }));
                          setItemAssignments({
                            0: members.map(m => m.id)
                          });
                          setShowItemSplittingWizard(true);
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 hover:border-primary-500 dark:hover:text-primary-400 dark:hover:border-primary-400 transition-all bg-gray-50/50 dark:bg-gray-800/20"
                      >
                        <Plus size={14} />
                        <span>細項拆帳：依發票明細分帳與指派成員</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                    <label className="text-xs font-bold text-gray-500">分帳方式 (Split Options)</label>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setExpenseForm({ ...expenseForm, split_type: 'equal' })}
                        className={`px-3 py-1 rounded-md font-semibold ${
                          expenseForm.split_type === 'equal' 
                            ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' 
                            : 'text-gray-500'
                        }`}
                      >
                        均分
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseForm({ ...expenseForm, split_type: 'exact' })}
                        className={`px-3 py-1 rounded-md font-semibold ${
                          expenseForm.split_type === 'exact' 
                            ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' 
                            : 'text-gray-500'
                        }`}
                      >
                        自訂
                      </button>
                    </div>
                  </div>

                  {/* List of members to split with */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {members.map(m => {
                      const splitData = expenseForm.splits.find(s => s.member_id === m.id);
                      const isIncluded = !!splitData;
                      
                      return (
                        <div key={m.id} className="flex items-center justify-between text-sm py-1">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add to splits
                                  setExpenseForm(prev => ({
                                    ...prev,
                                    splits: [...prev.splits, { member_id: m.id, amount: '' }]
                                  }));
                                } else {
                                  // Remove from splits (make sure at least 1 remains)
                                  if (expenseForm.splits.length <= 1) {
                                    toast.error('分帳對象至少需要 1 人');
                                    return;
                                  }
                                  setExpenseForm(prev => ({
                                    ...prev,
                                    splits: prev.splits.filter(s => s.member_id !== m.id)
                                    }));
                                }
                              }}
                              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{m.name}</span>
                          </label>

                          {isIncluded && (
                            <div className="flex items-center space-x-1.5">
                              {expenseForm.split_type === 'equal' ? (
                                <span className="text-xs text-gray-400 font-mono font-bold">
                                  ${expenseForm.amount ? round(parseFloat(expenseForm.amount) / expenseForm.splits.length).toFixed(2) : '0.00'}
                                </span>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-400 font-bold">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={splitData.amount}
                                    onChange={(e) => handleSplitAmountChange(m.id, e.target.value)}
                                    className="w-20 px-2 py-0.5 text-right border border-gray-300 dark:border-gray-600 rounded text-xs outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isScanning}
                  className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
                >
                  {isScanning ? '正在識別發票...' : '儲存記錄'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Item Splitting Wizard Modal */}
      {showItemSplittingWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span>🍽️ 發票明細分帳 (Item Split)</span>
                </h3>
                <p className="text-xs text-primary-100 mt-0.5">請指派發票中的各項商品給對應的成員</p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemSplittingWizard(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Receipt Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl flex justify-between items-center text-sm border border-gray-100 dark:border-gray-700">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{expenseForm.description || "收據"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{expenseForm.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {expenseForm.currency} ${parseFloat(expenseForm.amount || '0').toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-400">總金額</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex justify-between items-center">
                  <span>品項明細列表</span>
                  <span className="text-xs font-normal text-gray-400">點擊成員頭像以指派</span>
                </h4>
                
                {expenseForm.items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <span className="text-3xl">🧾</span>
                    <p className="text-sm font-medium text-gray-500 mt-2">尚無品項明細，請點擊下方按鈕新增</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenseForm.items.map((item, itemIdx) => {
                      const assignedIds = itemAssignments[itemIdx] || [];
                      
                      return (
                        <div key={itemIdx} className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 hover:shadow-sm transition-all">
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const nextItems = [...expenseForm.items];
                                  nextItems[itemIdx] = { ...nextItems[itemIdx], name: e.target.value };
                                  setExpenseForm(prev => ({ ...prev, items: nextItems }));
                                }}
                                placeholder="品項名稱"
                                className="bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Quantity */}
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-405">數量:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity || 1}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    const nextItems = [...expenseForm.items];
                                    nextItems[itemIdx] = { ...nextItems[itemIdx], quantity: val };
                                    setExpenseForm(prev => ({ ...prev, items: nextItems }));
                                  }}
                                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-center text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 w-12"
                                />
                              </div>

                              {/* Amount */}
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-bold text-gray-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.amount || ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const nextItems = [...expenseForm.items];
                                    nextItems[itemIdx] = { ...nextItems[itemIdx], amount: val };
                                    setExpenseForm(prev => ({ ...prev, items: nextItems }));
                                  }}
                                  className="bg-gray-550 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-right text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 w-24 font-mono"
                                />
                              </div>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextItems = expenseForm.items.filter((_, idx) => idx !== itemIdx);
                                  const nextAssignments = { ...itemAssignments };
                                  delete nextAssignments[itemIdx];
                                  const cleanAssignments: Record<number, string[]> = {};
                                  nextItems.forEach((_, idx) => {
                                    const oldIdx = idx >= itemIdx ? idx + 1 : idx;
                                    cleanAssignments[idx] = nextAssignments[oldIdx] || [];
                                  });
                                  setItemAssignments(cleanAssignments);
                                  setExpenseForm(prev => ({ ...prev, items: nextItems }));
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="刪除品項"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Members Assignment Row */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-50 dark:border-gray-800/40">
                            {members.map(m => {
                              const isAssigned = assignedIds.includes(m.id);
                              const shareAmount = isAssigned ? item.amount / assignedIds.length : 0;
                              
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setItemAssignments(prev => {
                                      const curr = prev[itemIdx] || [];
                                      const next = curr.includes(m.id)
                                        ? curr.filter(id => id !== m.id)
                                        : [...curr, m.id];
                                      return { ...prev, [itemIdx]: next };
                                    });
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                    isAssigned
                                      ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${isAssigned ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-650'}`} />
                                  <span>{m.name}</span>
                                  {isAssigned && (
                                    <span className="text-[10px] text-primary-500/80 font-mono">
                                      (${shareAmount.toFixed(2)})
                                    </span>
                                  )}
                                </button>
                              );
                            })}

                            {/* Quick Toggle All/None */}
                            <div className="ml-auto flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setItemAssignments(prev => ({
                                    ...prev,
                                    [itemIdx]: members.map(m => m.id)
                                  }));
                                }}
                                className="text-[10px] text-gray-400 hover:text-primary-500 font-semibold px-1"
                              >
                                全選
                              </button>
                              <span className="text-gray-300 font-normal">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setItemAssignments(prev => ({
                                    ...prev,
                                    [itemIdx]: []
                                  }));
                                }}
                                className="text-[10px] text-gray-400 hover:text-red-500 font-semibold px-1"
                              >
                                清空
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Item Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextItems = [...expenseForm.items, { name: `品項 ${expenseForm.items.length + 1}`, amount: 0, quantity: 1 }];
                    const nextIdx = nextItems.length - 1;
                    setItemAssignments(prev => ({
                      ...prev,
                      [nextIdx]: members.map(m => m.id)
                    }));
                    setExpenseForm(prev => ({ ...prev, items: nextItems }));
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 hover:border-primary-500 dark:hover:text-primary-400 dark:hover:border-primary-400 transition-all bg-gray-50/50 dark:bg-gray-800/20"
                >
                  <Plus size={14} />
                  <span>新增品項 (Add Item)</span>
                </button>

                {/* Amount Sync Warning */}
                {(() => {
                  const itemsSum = expenseForm.items.reduce((acc, item) => acc + (item.amount || 0), 0);
                  const mainAmount = parseFloat(expenseForm.amount || '0');
                  const hasMismatch = Math.abs(itemsSum - mainAmount) > 0.01;
                  
                  if (!hasMismatch || expenseForm.items.length === 0) return null;
                  
                  return (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                        <span>⚠️ 明細總和 ($${itemsSum.toFixed(2)}) 與開支金額 ($${mainAmount.toFixed(2)}) 不符。</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExpenseForm(prev => ({ ...prev, amount: itemsSum.toFixed(2) }));
                          toast.success(`開支總金額已同步為 $${itemsSum.toFixed(2)}`);
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors shadow-sm shrink-0"
                      >
                        將總金額設為 $${itemsSum.toFixed(2)}
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Summary Live Calculation preview */}
              <div className="bg-primary-50/50 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/30 p-5 rounded-2xl space-y-3">
                <h5 className="font-bold text-xs text-primary-700 dark:text-primary-300 tracking-wider uppercase">個人分帳金額預覽</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {members.map(m => {
                    let totalOwed = 0;
                    expenseForm.items.forEach((item, itemIdx) => {
                      const assigned = itemAssignments[itemIdx] || [];
                      if (assigned.includes(m.id)) {
                        totalOwed += item.amount / assigned.length;
                      }
                    });
                    
                    return (
                      <div key={m.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{m.name}</span>
                        <span className="text-base font-bold text-gray-950 dark:text-white font-mono mt-1">
                          ${totalOwed.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">
                註：明細加總須等於發票總金額
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemSplittingWizard(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleApplyItemSplit}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-indigo-600 hover:shadow-lg text-white font-bold rounded-lg text-sm transition-all"
                >
                  套用分帳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
