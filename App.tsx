import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ListFilter, LayoutGrid, Package, HardDrive, AlertTriangle } from 'lucide-react';
import { WishItem, WishType, WishStatus } from './types';
import { WishCard } from './components/WishCard';
import { AddWishModal } from './components/AddWishModal';
import { AddPreorderModal } from './components/AddPreorderModal';
import { PreorderCompleteModal } from './components/PreorderCompleteModal';
import { StatsView } from './components/StatsView';
import { PreorderView } from './components/PreorderView';

type ViewMode = 'list' | 'stats' | 'preorder';
type PreorderTab = 'all' | 'active' | 'completed' | 'stats';

function App() {
  const [items, setItems] = useState<WishItem[]>(() => {
    try {
      const saved = localStorage.getItem('joypass_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load items", e);
      return [];
    }
  });
  
  const [filter, setFilter] = useState<'all' | 'limited' | 'indefinite' | 'completed'>('all');
  const [preorderFilter, setPreorderFilter] = useState<PreorderTab>('all');
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isPreorderModalOpen, setIsPreorderModalOpen] = useState(false);
  const [isCompletePreorderModalOpen, setIsCompletePreorderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Storage usage calculation
  const storageInfo = useMemo(() => {
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalChars += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }
    // localStorage is typically 5MB (5,000,000 chars in some browsers, or bytes)
    const limitChars = 5 * 1024 * 1024; 
    const percent = (totalChars / limitChars) * 100;
    const usedMB = (totalChars / 1024 / 1024).toFixed(2);
    
    return {
      percent: Math.min(100, percent).toFixed(1),
      usedMB,
      isWarning: percent > 85,
      isFull: percent > 98
    };
  }, [items]);

  useEffect(() => {
    localStorage.setItem('joypass_items', JSON.stringify(items));
  }, [items]);

  const handleAddWish = (data: Omit<WishItem, 'id' | 'status' | 'createdAt' | 'order'>) => {
    const newItem: WishItem = {
      ...data,
      id: crypto.randomUUID(),
      status: WishStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      order: Date.now(),
    };
    
    setItems(prev => [newItem, ...prev]);
  };

  const handleUpdateWish = (id: string, data: Partial<WishItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
  };

  const handleComplete = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item?.type === WishType.PREORDER) {
      setEditingItem(item);
      setIsCompletePreorderModalOpen(true);
    } else {
      handleUpdateWish(id, { status: WishStatus.COMPLETED });
    }
  };

  const handleConfirmPreorderComplete = (id: string, arrivalDate: string, additionalCost: number) => {
    handleUpdateWish(id, { 
      status: WishStatus.COMPLETED,
      arrivalDate: arrivalDate,
      shippingCost: additionalCost
    });
  };

  const handleUncomplete = (id: string) => {
    handleUpdateWish(id, { status: WishStatus.ACTIVE, arrivalDate: undefined, shippingCost: 0 });
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除嗎？')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEditClick = (item: WishItem) => {
      setEditingItem(item);
      if (item.type === WishType.PREORDER) {
          setIsPreorderModalOpen(true);
      } else {
          setIsWishModalOpen(true);
      }
  };

  const handleCloseModals = () => {
      setIsWishModalOpen(false);
      setIsPreorderModalOpen(false);
      setIsCompletePreorderModalOpen(false);
      setEditingItem(null);
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const activeIndefiniteItems = items
      .filter(i => i.type === WishType.INDEFINITE && i.status === WishStatus.ACTIVE)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const currentIndex = activeIndefiniteItems.findIndex(i => i.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeIndefiniteItems.length) return;

    const itemA = activeIndefiniteItems[currentIndex];
    const itemB = activeIndefiniteItems[targetIndex];

    const newOrderA = itemB.order;
    const newOrderB = itemA.order;

    setItems(prev => prev.map(item => {
        if (item.id === itemA.id) return { ...item, order: newOrderA };
        if (item.id === itemB.id) return { ...item, order: newOrderB };
        return item;
    }));
  };

  const categorizedItems = useMemo(() => {
    const nonPreorderItems = items.filter(i => i.type !== WishType.PREORDER);

    const activeLimited = nonPreorderItems
        .filter(i => i.type === WishType.LIMITED && i.status === WishStatus.ACTIVE)
        .sort((a, b) => {
            const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            return dateA - dateB;
        });

    const activeIndefinite = nonPreorderItems
        .filter(i => i.type === WishType.INDEFINITE && i.status === WishStatus.ACTIVE)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const completed = nonPreorderItems.filter(i => i.status === WishStatus.COMPLETED);

    return { activeLimited, activeIndefinite, completed };
  }, [items]);

  const wishListItems = useMemo(() => {
    const { activeLimited, activeIndefinite, completed } = categorizedItems;
    switch (filter) {
      case 'limited': return activeLimited;
      case 'indefinite': return activeIndefinite;
      case 'completed': return completed;
      case 'all':
      default: return [...activeLimited, ...activeIndefinite];
    }
  }, [categorizedItems, filter]);

  const totalCost = wishListItems.reduce((acc, curr) => acc + curr.price, 0);

  const TAB_LABELS = {
    all: '全部',
    limited: '限時',
    indefinite: '不限',
    completed: '已完成'
  };

  const PREORDER_TAB_LABELS = {
    all: '全部',
    active: '預購中',
    completed: '已到貨',
    stats: '分類統計'
  };

  const handleFabClick = () => {
      setEditingItem(null);
      if (viewMode === 'preorder') {
          setIsPreorderModalOpen(true);
      } else {
          setIsWishModalOpen(true);
      }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#caedec] shadow-2xl overflow-hidden relative border-x border-gray-200/50">
      
      <header className="pt-6 pb-2 px-6 bg-white z-10 sticky top-0 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-[#778899] tracking-tight leading-none mb-3">JoyPass</h1>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">停，等一下再Pay</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                  setViewMode(viewMode === 'preorder' ? 'list' : 'preorder');
                  setFilter('all');
                  setPreorderFilter('all');
              }}
              className={`p-2.5 rounded-xl transition-all group ${viewMode === 'preorder' ? 'bg-[#1B263B] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-400'}`}
              title="預購管理"
            >
              <Package size={22} className={`${viewMode === 'preorder' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            </button>
            <button 
              onClick={() => setViewMode(viewMode === 'stats' ? 'list' : 'stats')}
              className={`p-2.5 rounded-xl transition-all group ${viewMode === 'stats' ? 'bg-yellow-50 text-[#EAC100]' : 'bg-gray-50 text-gray-400 hover:bg-yellow-50 hover:text-[#EAC100]'}`}
              title="消費統計"
            >
               {viewMode === 'stats' ? (
                  <ListFilter size={22} className="scale-110 transition-transform" />
               ) : (
                  <LayoutGrid size={22} className="group-hover:scale-110 transition-transform" />
               )}
            </button>
          </div>
        </div>

        {viewMode !== 'preorder' ? (
          <div className="flex space-x-1 p-1.5 bg-gray-100/50 rounded-2xl overflow-x-auto no-scrollbar border border-gray-200/50 animate-in fade-in duration-200">
            {(['all', 'limited', 'indefinite', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  filter === f 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {TAB_LABELS[f]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex space-x-1 p-1.5 bg-gray-100/50 rounded-2xl overflow-x-auto no-scrollbar border border-indigo-100/50 animate-in slide-in-from-top-2 duration-300">
            {(['all', 'active', 'completed', 'stats'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPreorderFilter(f)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  preorderFilter === f 
                    ? 'bg-white text-[#1B263B] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {PREORDER_TAB_LABELS[f]}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-2 scroll-smooth no-scrollbar">
        {viewMode === 'stats' && <StatsView items={wishListItems} />}
        
        {viewMode === 'preorder' && (
          <PreorderView 
            items={items}
            activeTab={preorderFilter}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onDelete={handleDelete}
            onEdit={handleEditClick}
            onBack={() => setViewMode('list')}
          />
        )}

        {viewMode === 'list' && (
          <>
            <div className="mb-4 flex justify-between items-end px-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {wishListItems.length} 個願望
              </span>
              {filter !== 'completed' && (
                  <span className="text-sm font-bold text-gray-700">
                  預算總計 ${totalCost.toLocaleString()}
                  </span>
              )}
            </div>

            {wishListItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-5 text-gray-400 border border-white">
                  <Plus size={40} />
                  </div>
                  <p className="text-gray-700 font-bold text-lg">願望清單是空的</p>
                  <p className="text-sm text-gray-500 mt-2">點擊右下角新增夢想</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                  {wishListItems.map((item, idx) => {
                      const isIndefiniteType = item.type === WishType.INDEFINITE && item.status === WishStatus.ACTIVE;
                      
                      let isFirstInSubGroup = false;
                      let isLastInSubGroup = false;

                      if (filter === 'all') {
                          const indefiniteItems = wishListItems.filter(i => i.type === WishType.INDEFINITE);
                          const currentIndefiniteIdx = indefiniteItems.findIndex(i => i.id === item.id);
                          if (currentIndefiniteIdx !== -1) {
                              isFirstInSubGroup = currentIndefiniteIdx === 0;
                              isLastInSubGroup = currentIndefiniteIdx === indefiniteItems.length - 1;
                          }
                      } else {
                          isFirstInSubGroup = idx === 0;
                          isLastInSubGroup = idx === wishListItems.length - 1;
                      }

                      return (
                        <WishCard 
                            key={item.id} 
                            item={item} 
                            onComplete={handleComplete} 
                            onUncomplete={handleUncomplete}
                            onDelete={handleDelete} 
                            onEdit={handleEditClick}
                            onMove={isIndefiniteType ? handleMoveItem : undefined}
                            isFirst={isFirstInSubGroup}
                            isLast={isLastInSubGroup}
                        />
                      );
                  })}
              </div>
            )}
          </>
        )}

        {/* Storage Usage Section */}
        <div className="mt-8 mb-24 px-2">
           <div className={`p-4 rounded-3xl border transition-all ${storageInfo.isWarning ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <HardDrive size={14} className={storageInfo.isWarning ? 'text-red-500' : 'text-gray-400'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${storageInfo.isWarning ? 'text-red-500' : 'text-gray-400'}`}>
                    LocalStorage 容量
                  </span>
                </div>
                <span className={`text-[10px] font-black ${storageInfo.isWarning ? 'text-red-600' : 'text-gray-500'}`}>
                  {storageInfo.usedMB} MB / 5.0 MB ({storageInfo.percent}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${storageInfo.isWarning ? 'bg-red-500' : 'bg-indigo-400'}`}
                  style={{ width: `${storageInfo.percent}%` }}
                ></div>
              </div>
              {storageInfo.isWarning && (
                <div className="mt-2 flex items-center text-[10px] text-red-500 font-bold">
                  <AlertTriangle size={12} className="mr-1" />
                  儲存空間即將爆滿！請嘗試清理舊項目或壓縮照片。
                </div>
              )}
           </div>
        </div>
      </main>

      <div className="absolute bottom-8 right-6 z-20">
        <button
          onClick={handleFabClick}
          className={`w-16 h-16 rounded-2xl shadow-xl shadow-gray-400/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${viewMode === 'preorder' ? 'bg-[#1B263B] text-white' : 'bg-[#EAC100] text-white'}`}
        >
          {viewMode === 'preorder' ? <Package size={32} /> : <Plus size={32} />}
        </button>
      </div>

      <AddWishModal 
        isOpen={isWishModalOpen} 
        onClose={handleCloseModals} 
        onAdd={handleAddWish} 
        onUpdate={handleUpdateWish}
        editingItem={editingItem}
      />

      <AddPreorderModal 
        isOpen={isPreorderModalOpen} 
        onClose={handleCloseModals} 
        onAdd={handleAddWish} 
        onUpdate={handleUpdateWish}
        editingItem={editingItem}
      />

      <PreorderCompleteModal
        isOpen={isCompletePreorderModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmPreorderComplete}
        item={editingItem}
      />
    </div>
  );
}

export default App;