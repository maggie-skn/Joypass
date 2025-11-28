import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ListFilter, LayoutGrid } from 'lucide-react';
import { WishItem, WishType, WishStatus } from './types';
import { WishCard } from './components/WishCard';
import { AddWishModal } from './components/AddWishModal';
import { StatsView } from './components/StatsView';

function App() {
  const [items, setItems] = useState<WishItem[]>(() => {
    const saved = localStorage.getItem('joypass_items');
    // Migration: Add order field if missing
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((item: any, index: number) => ({
        ...item,
        order: item.order ?? index
    }));
  });
  
  const [filter, setFilter] = useState<'all' | 'limited' | 'indefinite' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');

  useEffect(() => {
    localStorage.setItem('joypass_items', JSON.stringify(items));
  }, [items]);

  const handleAddWish = (data: Omit<WishItem, 'id' | 'status' | 'createdAt' | 'order'>) => {
    const newItem: WishItem = {
      ...data,
      id: crypto.randomUUID(),
      status: WishStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      order: Date.now(), // Simple default order
    };
    setItems(prev => [newItem, ...prev]);
  };

  const handleUpdateWish = (id: string, data: Partial<WishItem>) => {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      ));
  };

  const handleComplete = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: WishStatus.COMPLETED } : item
    ));
  };

  const handleUncomplete = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: WishStatus.ACTIVE } : item
    ));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditClick = (item: WishItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingItem(null); // Clear editing state
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

    // Swap orders
    const newItems = items.map(item => {
        if (item.id === itemA.id) return { ...item, order: itemB.order };
        if (item.id === itemB.id) return { ...item, order: itemA.order };
        return item;
    });

    setItems(newItems);
  };

  // Logic:
  // 1. Limited items -> Sorted by deadline (earliest first)
  // 2. Indefinite items -> Sorted by manual 'order'
  const filteredItems = useMemo(() => {
    let result: WishItem[] = [];

    // Separation of concerns for sorting
    const activeLimited = items
        .filter(i => i.type === WishType.LIMITED && i.status === WishStatus.ACTIVE)
        .sort((a, b) => {
            const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            return dateA - dateB;
        });

    const activeIndefinite = items
        .filter(i => i.type === WishType.INDEFINITE && i.status === WishStatus.ACTIVE)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const completed = items.filter(i => i.status === WishStatus.COMPLETED);

    switch (filter) {
      case 'limited':
        result = activeLimited;
        break;
      case 'indefinite':
        result = activeIndefinite;
        break;
      case 'completed':
        result = completed;
        break;
      case 'all':
      default:
        // Priority: Limited (by Date) -> Indefinite (by Order)
        result = [...activeLimited, ...activeIndefinite];
        break;
    }
    return result;
  }, [items, filter]);

  const totalCost = filteredItems.reduce((acc, curr) => acc + curr.price, 0);

  const TAB_LABELS = {
    all: '全部',
    limited: '限時',
    indefinite: '不限',
    completed: '已完成'
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#caedec] shadow-2xl overflow-hidden relative border-x border-gray-200/50">
      
      {/* Top Header - Reduced Height & Centered Alignment */}
      <header className="pt-6 pb-2 px-6 bg-white z-10 sticky top-0 shadow-sm">
        {/* Group Title and Subtitle in one block, align button to the center of this block */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-[#778899] tracking-tight leading-none mb-3">JoyPass</h1>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">停，等一下再Pay</p>
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'stats' : 'list')}
            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-yellow-50 transition-colors group"
          >
             {viewMode === 'list' ? (
                <LayoutGrid size={22} className="text-[#EAC100] group-hover:scale-110 transition-transform" />
             ) : (
                <ListFilter size={22} className="text-[#EAC100]" />
             )}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 p-1.5 bg-gray-100/50 rounded-2xl overflow-x-auto no-scrollbar border border-gray-200/50">
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth no-scrollbar">
        
        {viewMode === 'stats' && <StatsView items={filteredItems} />}

        <div className="mb-4 flex justify-between items-end px-2">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
             {filteredItems.length} 個項目
           </span>
           {filter !== 'completed' && viewMode === 'list' && (
             <span className="text-sm font-bold text-gray-700 font-mono">
               總計 ${totalCost.toLocaleString()}
             </span>
           )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-5 text-gray-400 border border-white">
              <Plus size={40} />
            </div>
            <p className="text-gray-700 font-bold text-lg">清單是空的</p>
            <p className="text-sm text-gray-500 mt-2">點擊右下角新增</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item, index) => {
                 // Check if item is indefinite and calculate boundaries for move buttons
                 const isIndefiniteType = item.type === WishType.INDEFINITE && item.status === WishStatus.ACTIVE;
                 let isFirst = false;
                 let isLast = false;
                 
                 if (isIndefiniteType) {
                     // We need to know where this item sits specifically within the Indefinite list to disable buttons correctly
                     const indefiniteList = filteredItems.filter(i => i.type === WishType.INDEFINITE && i.status === WishStatus.ACTIVE);
                     const internalIndex = indefiniteList.findIndex(i => i.id === item.id);
                     isFirst = internalIndex === 0;
                     isLast = internalIndex === indefiniteList.length - 1;
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
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                );
            })}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6 z-20">
        <button
          onClick={() => {
              setEditingItem(null); // Ensure fresh create mode
              setIsModalOpen(true);
          }}
          className="w-16 h-16 bg-[#EAC100] hover:bg-yellow-500 text-white rounded-2xl shadow-xl shadow-gray-400/50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={32} />
        </button>
      </div>

      <AddWishModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onAdd={handleAddWish} 
        onUpdate={handleUpdateWish}
        editingItem={editingItem}
      />
    </div>
  );
}

export default App;