import React, { useMemo } from 'react';
import { WishItem, WishType, WishStatus } from '../types';
import { WishCard } from './WishCard';
import { PREORDER_CATEGORIES } from '../constants';
import { Package, Info } from 'lucide-react';

interface PreorderViewProps {
  items: WishItem[];
  activeTab: 'all' | 'active' | 'completed' | 'stats';
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: WishItem) => void;
  onBack: () => void;
}

export const PreorderView: React.FC<PreorderViewProps> = ({ 
  items, 
  activeTab,
  onComplete, 
  onUncomplete, 
  onDelete, 
  onEdit 
}) => {
  const allPreorderItems = useMemo(() => 
    items
      .filter(i => i.type === WishType.PREORDER)
      .sort((a, b) => {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return dateA - dateB;
      }),
    [items]
  );

  const displayItems = useMemo(() => {
    switch (activeTab) {
      case 'active': return allPreorderItems.filter(i => i.status !== WishStatus.COMPLETED);
      case 'completed': return allPreorderItems.filter(i => i.status === WishStatus.COMPLETED);
      default: return allPreorderItems;
    }
  }, [allPreorderItems, activeTab]);

  const categoryStats = useMemo(() => {
    return Object.keys(PREORDER_CATEGORIES).map(catKey => {
      const catItems = allPreorderItems.filter(i => i.category === catKey);
      const total = catItems.reduce((sum, item) => sum + item.price + (item.shippingCost || 0), 0);
      return {
        key: catKey,
        label: PREORDER_CATEGORIES[catKey].label,
        color: PREORDER_CATEGORIES[catKey].color,
        icon: PREORDER_CATEGORIES[catKey].icon,
        count: catItems.length,
        total
      };
    });
  }, [allPreorderItems]);

  const totalCost = displayItems.reduce((acc, curr) => acc + curr.price + (curr.shippingCost || 0), 0);

  return (
    <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* 簡約統計列：模仿主頁面樣式 */}
      <div className="flex justify-between items-end px-2 mt-2 mb-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {displayItems.length} 個項目
        </span>
        <span className="text-sm font-bold text-gray-700">
          預算總計 ${totalCost.toLocaleString()}
        </span>
      </div>

      {activeTab === 'stats' ? (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300 py-2">
          {categoryStats.map(stat => (
            <div key={stat.key} className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-50 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${stat.color}`}>
                  {typeof stat.icon === 'string' ? (
                    <span className="text-3xl">{stat.icon}</span>
                  ) : (
                    <stat.icon size={28} />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-lg text-gray-800">{stat.label}</h4>
                  <p className="text-xs font-bold text-gray-400">{stat.count} 個項目</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[#1B263B] tabular-nums">${stat.total.toLocaleString()}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">累積消費</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          {displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-indigo-100">
              <Package size={48} className="text-indigo-200 mb-4" />
              <p className="text-indigo-900 font-black text-xl">目前無此類別項目</p>
              <p className="text-indigo-400/60 text-sm mt-2">快去新增你的預購目標吧！</p>
            </div>
          ) : (
            displayItems.map((item) => (
              <WishCard 
                key={item.id} 
                item={item} 
                onComplete={onComplete} 
                onUncomplete={onUncomplete}
                onDelete={onDelete} 
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      )}
      
      <div className="flex items-center space-x-2 px-3 py-2 pb-6">
        <Info size={16} className="text-indigo-400" />
        <span className="text-xs font-bold text-indigo-400/80 italic tracking-wide">含本金與補運費/二補金額</span>
      </div>
    </div>
  );
};