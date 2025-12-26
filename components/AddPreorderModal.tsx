import React, { useState, useEffect, useRef } from 'react';
import { WishType, WishItem } from '../types';
import { PREORDER_CATEGORIES } from '../constants';
import { X, Image as ImageIcon, Link as LinkIcon, StickyNote, Upload, Package, Calendar } from 'lucide-react';

interface AddPreorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: Partial<WishItem>) => void;
  editingItem?: WishItem | null;
}

export const AddPreorderModal: React.FC<AddPreorderModalProps> = ({ isOpen, onClose, onAdd, onUpdate, editingItem }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState('Hanwha');
  const [deadline, setDeadline] = useState('');
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setPrice(editingItem.price.toString());
      setCategory(editingItem.category);
      setDeadline(editingItem.deadline || '');
      setLink(editingItem.link || '');
      setNote(editingItem.note || '');
      setImageUrl(editingItem.imageUrl || '');
    } else {
      resetForm();
    }
  }, [editingItem, isOpen]);

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setCategory('Hanwha');
    setDeadline(new Date().toISOString().split('T')[0]); // Default to today
    setLink('');
    setNote('');
    setImageUrl('');
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 500; // Updated from 800 to 500
        
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Updated quality from 0.6 to 0.5 as requested
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImageUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wishData = {
      title,
      price: parseFloat(price) || 0,
      category,
      type: WishType.PREORDER,
      deadline: deadline || undefined,
      priority: 'high' as const,
      link,
      note,
      imageUrl
    };

    if (editingItem) {
        onUpdate(editingItem.id, wishData);
    } else {
        onAdd(wishData);
    }
    
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm p-0 sm:p-4 transition-all">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="bg-[#1B263B] px-6 py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center text-white">
            <Package size={20} className="mr-2 text-indigo-300" />
            <h2 className="text-xl font-bold tracking-wide">預購管理</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/50 hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="relative">
              <label className="block text-sm font-bold text-gray-500 mb-1.5">預購商品名稱</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="輸入商品標題"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl focus:ring-0 focus:border-[#1B263B] outline-none transition-all placeholder:text-gray-300 text-gray-700"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">專屬類別</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PREORDER_CATEGORIES).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        category === key 
                          ? 'border-[#1B263B] bg-indigo-50/50' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {typeof config.icon === 'string' ? (
                        <span className="text-2xl">{config.icon}</span>
                      ) : (
                        <config.icon className={config.color.split(' ')[0]} size={20} />
                      )}
                      <span className={`text-xs font-bold mt-1 ${category === key ? 'text-[#1B263B]' : 'text-gray-400'}`}>
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5 flex items-center">
                  <Calendar size={14} className="mr-1 text-indigo-400" />
                  下單日期
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-[#1B263B] outline-none text-sm text-gray-700"
                  required={true}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">預購金額</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-[#1B263B] outline-none placeholder:text-gray-300 text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-gray-50">
              <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5 flex items-center">
                      <ImageIcon size={14} className="mr-1.5 text-gray-400" />
                      預覽圖
                  </label>
                  <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${imageUrl ? 'border-indigo-100 bg-indigo-50/20' : 'border-gray-200 hover:border-indigo-100 hover:bg-gray-50'}`}
                  >
                      {imageUrl ? (
                          <>
                              <img src={imageUrl} alt="Preview" className="w-full h-full object-contain bg-gray-50 opacity-90" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-medium opacity-0 hover:opacity-100 transition-opacity">
                                 更換
                              </div>
                          </>
                      ) : (
                          <div className="text-center text-gray-400">
                              <Upload size={24} className="mx-auto mb-1" />
                              <span className="text-xs">上傳商品圖片</span>
                          </div>
                      )}
                      <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5 flex items-center">
                      <LinkIcon size={14} className="mr-1.5 text-gray-400" />
                      預購網址
                  </label>
                  <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-200 outline-none text-sm placeholder:text-gray-300 text-gray-700"
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5 flex items-center">
                      <StickyNote size={14} className="mr-1.5 text-gray-400" />
                      備註
                  </label>
                  <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="紀錄預購細節、特典或訂單編號..."
                      rows={2}
                      className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-200 outline-none text-sm placeholder:text-gray-300 resize-none text-gray-700"
                  />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 mt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                >
                    返回
                </button>
                <button
                    type="submit"
                    className="px-8 py-3 bg-[#1B263B] text-white font-bold text-lg rounded-2xl shadow-md hover:bg-[#2c3e50] transition-transform active:scale-[0.98]"
                >
                    {editingItem ? '儲存更新' : '確認預購'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};