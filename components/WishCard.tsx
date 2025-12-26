import React, { useState } from 'react';
import { WishItem, WishType, WishStatus } from '../types';
import { CATEGORIES, PREORDER_CATEGORIES, DEFAULT_CATEGORY, DEFAULT_PREORDER_CATEGORY } from '../constants';
import { Clock, Calendar, CheckCircle, Trash2, ChevronUp, ChevronDown, Package, Edit2, RotateCcw, ExternalLink, X, StickyNote, Truck, Banknote } from 'lucide-react';

interface WishCardProps {
  item: WishItem;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: WishItem) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const WishCard: React.FC<WishCardProps> = ({ item, onComplete, onUncomplete, onDelete, onEdit, onMove, isFirst, isLast }) => {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  const isPreorder = item.type === WishType.PREORDER;
  
  const categoryConfig = isPreorder 
    ? (PREORDER_CATEGORIES[item.category] || PREORDER_CATEGORIES[DEFAULT_PREORDER_CATEGORY])
    : (CATEGORIES[item.category] || CATEGORIES[DEFAULT_CATEGORY]);
    
  const Icon = categoryConfig.icon;

  const isLimited = item.type === WishType.LIMITED;
  const isCompleted = item.status === WishStatus.COMPLETED;
  
  const totalPrice = item.price + (item.shippingCost || 0);

  let daysLeft = '';
  let isExpired = false;

  if (isLimited && item.deadline) {
    const now = new Date();
    const deadlineDate = new Date(item.deadline);
    
    if (item.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = item.deadline.split('-').map(Number);
        deadlineDate.setFullYear(y, m - 1, d);
        deadlineDate.setHours(23, 59, 59, 999);
    }
    
    isExpired = now > deadlineDate;
    
    if (!isExpired) {
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
             daysLeft = '即將到期'; 
        } else if (diffDays > 365) {
           daysLeft = `約 ${Math.round(diffDays / 365)} 年後`;
        } else if (diffDays > 30) {
           daysLeft = `約 ${Math.round(diffDays / 30)} 個月後`;
        } else {
           daysLeft = `${diffDays}天後`;
        }
    }
  }

  const toggleNote = () => setIsNoteExpanded(!isNoteExpanded);

  return (
    <>
      {showFullImage && (
        <div 
          className="fixed inset-0 z-[999] bg-white/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowFullImage(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-gray-900 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullImage(false);
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <div className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 transition-all overflow-hidden ${isCompleted ? 'opacity-70 grayscale-[0.8] bg-gray-50' : ''}`}>
        {isPreorder && (
          <div className={`absolute top-0 right-0 px-3 py-1 ${categoryConfig.color} text-[10px] font-bold rounded-bl-xl border-l border-b flex items-center`}>
            <Package size={10} className="mr-1" />
            預購項目
          </div>
        )}

        <div className="p-4 pb-2">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-start space-x-3 w-full">
              {item.imageUrl ? (
                <div 
                  className="w-16 h-16 flex-shrink-0 cursor-zoom-in group relative"
                  onClick={() => setShowFullImage(true)}
                >
                   <img 
                     src={item.imageUrl} 
                     alt={item.title} 
                     className="w-full h-full rounded-xl object-cover border border-gray-100 bg-gray-50 group-hover:opacity-90 transition-opacity" 
                   />
                </div>
              ) : (
                 <div className={`w-16 h-16 flex items-center justify-center rounded-xl flex-shrink-0 ${categoryConfig.color}`}>
                   {typeof Icon === 'string' ? (
                     <span className="text-3xl leading-none">{Icon}</span>
                   ) : (
                     <Icon size={32} />
                   )}
                 </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2 pr-2">{item.title}</h3>
                    <div className="text-right flex-shrink-0">
                      <span className="block font-bold text-gray-900 text-lg">${totalPrice.toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-medium text-gray-400 tracking-wider block">{categoryConfig.label}</span>
                  {item.shippingCost && item.shippingCost > 0 && (
                    <span className="text-[10px] bg-green-50 text-green-600 px-1.5 rounded-md font-bold flex items-center">
                      <Banknote size={8} className="mr-1" />
                      已含二補 ${item.shippingCost}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(item.link || item.note) && (
              <div className="flex flex-col gap-1.5 mt-2 mb-1 pl-[4.75rem]">
                  {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline w-fit">
                          <ExternalLink size={12} className="mr-1" />
                          連結
                      </a>
                  )}
                  {item.note && (
                      <div 
                        onClick={toggleNote}
                        className="flex items-start text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors group"
                      >
                          <StickyNote size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                          <span className={`${!isNoteExpanded ? 'truncate' : ''} break-all`}>
                            {isNoteExpanded 
                              ? item.note 
                              : (item.note.length > 20 ? `${item.note.slice(0, 20)}...` : item.note)}
                          </span>
                      </div>
                  )}
              </div>
          )}
          
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
            <div className="flex items-center text-xs font-medium">
                {isPreorder ? (
                   <div className="flex items-center space-x-1.5 text-[#1B263B]">
                      {isCompleted ? (
                        <>
                          <Truck size={16} className="text-green-500" />
                          <span className="text-green-600 font-bold">已到貨: {item.arrivalDate || '日期不詳'}</span>
                        </>
                      ) : (
                        <>
                          <Calendar size={16} className="text-indigo-400" />
                          <span>下單: {item.deadline || '未紀錄'}</span>
                        </>
                      )}
                   </div>
                ) : (
                  isLimited ? (
                    <div className={`flex items-center space-x-1.5 ${isExpired && !isCompleted ? 'text-red-500' : 'text-primary-500'}`}>
                      <Clock size={16} />
                      <span>{isExpired && !isCompleted ? '已過期' : daysLeft}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-gray-400">
                      <Calendar size={16} />
                      <span>不限</span>
                    </div>
                  )
                )}
            </div>

            <div className="flex items-center space-x-1">
              {item.type === WishType.INDEFINITE && !isCompleted && onMove && (
                <div className="flex items-center mr-2 bg-gray-50 rounded-lg border border-gray-100 h-6">
                    <button 
                      onClick={() => onMove(item.id, 'up')}
                      disabled={isFirst}
                      className="px-1 h-full flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <div className="w-px h-3 bg-gray-200"></div>
                    <button 
                      onClick={() => onMove(item.id, 'down')}
                      disabled={isLast}
                      className="px-1 h-full flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                </div>
              )}

              {!isCompleted && (
                   <button 
                   onClick={() => onEdit(item)}
                   className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                   aria-label="編輯"
                 >
                   <Edit2 size={16} />
                 </button>
              )}

              {isCompleted ? (
                   <button 
                   onClick={() => onUncomplete(item.id)}
                   className="p-1 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"
                   aria-label="取消完成"
                 >
                   <RotateCcw size={16} />
                 </button>
              ) : (
                  <button 
                  onClick={() => onComplete(item.id)}
                  className={`p-1 transition-colors ${isPreorder ? 'text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50' : 'text-gray-300 hover:text-primary-500 hover:bg-primary-50'}`}
                  aria-label="完成"
                >
                  <CheckCircle size={18} />
                </button>
              )}

              <button 
                onClick={() => onDelete(item.id)}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="刪除"
                >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};