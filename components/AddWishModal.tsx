import React, { useState, useEffect, useRef } from 'react';
import { WishType, WishItem } from '../types';
import { CATEGORIES } from '../constants';
import { X, Image as ImageIcon, Link as LinkIcon, StickyNote, Upload } from 'lucide-react';

interface AddWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: Partial<WishItem>) => void;
  editingItem?: WishItem | null;
}

export const AddWishModal: React.FC<AddWishModalProps> = ({ isOpen, onClose, onAdd, onUpdate, editingItem }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState('Other');
  const [type, setType] = useState<WishType>(WishType.INDEFINITE);
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
      setType(editingItem.type);
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
    setCategory('Other');
    setType(WishType.INDEFINITE);
    setDeadline('');
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
      type: type === WishType.PREORDER ? WishType.INDEFINITE : type, // Force non-preorder
      deadline: type === WishType.LIMITED ? deadline : undefined,
      priority: 'medium' as const,
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
        
        <div className="bg-[#caedec] px-6 py-5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-700 tracking-wide">{editingItem ? '編輯願望' : '新增願望'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-black/5 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="relative">
              <label className="block text-sm font-bold text-gray-500 mb-1.5">我想買……</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="你的♥"
                className="w-full px-4 py-3 bg-white border-2 border-[#caedec] rounded-xl focus:ring-0 focus:border-[#4fd1c5] outline-none transition-all placeholder:text-gray-300 text-gray-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-500 mb-2">類型</label>
                <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType(WishType.LIMITED)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      type === WishType.LIMITED 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    限時
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(WishType.INDEFINITE)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      type === WishType.INDEFINITE 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    不限
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">分類</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-[#caedec] outline-none appearance-none text-gray-700"
                  >
                    {Object.entries(CATEGORIES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">預期金額</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-[#caedec] outline-none placeholder:text-gray-300 text-gray-700"
                />
              </div>
            </div>

            {type === WishType.LIMITED && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-bold text-gray-500 mb-1.5">
                  截止日期
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-[#caedec] outline-none text-gray-700"
                  required={true}
                />
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-gray-50">
              <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5 flex items-center">
                      <ImageIcon size={14} className="mr-1.5 text-gray-400" />
                      圖片
                  </label>
                  <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${imageUrl ? 'border-[#caedec] bg-[#f0fdfa]' : 'border-gray-200 hover:border-[#caedec] hover:bg-gray-50'}`}
                  >
                      {imageUrl ? (
                          <>
                              <img src={imageUrl} alt="Preview" className="w-full h-full object-contain bg-gray-50 opacity-90" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-medium opacity-0 hover:opacity-100 transition-opacity">
                                 更換圖片
                              </div>
                          </>
                      ) : (
                          <div className="text-center text-gray-400">
                              <Upload size={24} className="mx-auto mb-1" />
                              <span className="text-xs">點擊上傳圖片</span>
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
                      連結
                  </label>
                  <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-[#caedec] outline-none text-sm placeholder:text-gray-300 text-gray-700"
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
                      placeholder="寫下型號、規格或備註..."
                      rows={2}
                      className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-[#caedec] outline-none text-sm placeholder:text-gray-300 resize-none text-gray-700"
                  />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 mt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-8 py-3 bg-[#EAC100] text-white font-bold text-lg rounded-2xl shadow-md hover:bg-[#d6b000] transition-transform active:scale-[0.98]"
                >
                    {editingItem ? '儲存' : '新增'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};