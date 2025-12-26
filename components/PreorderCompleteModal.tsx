import React, { useState } from 'react';
import { WishItem } from '../types';
import { X, Calendar, PackageCheck, Banknote } from 'lucide-react';

interface PreorderCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, arrivalDate: string, additionalCost: number) => void;
  item: WishItem | null;
}

export const PreorderCompleteModal: React.FC<PreorderCompleteModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [additionalCost, setAdditionalCost] = useState<string>('0');

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    onConfirm(item.id, arrivalDate, parseFloat(additionalCost) || 0);
    setAdditionalCost('0');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-[#1B263B] px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center text-white">
            <PackageCheck size={20} className="mr-2 text-indigo-300" />
            <h2 className="text-lg font-bold tracking-wide">預購到貨確認</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/50 hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            太棒了！<span className="font-bold text-[#1B263B]">「{item.title}」</span>已經到貨了嗎？請紀錄細節：
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center">
                <Calendar size={12} className="mr-1" />
                到貨日期
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1B263B] outline-none text-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center">
                <Banknote size={12} className="mr-1" />
                二補金額 / 補運費
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1B263B] outline-none text-gray-700"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-1">此金額將計入該項目的總消費中</p>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-[#1B263B] text-white font-bold rounded-2xl shadow-md hover:bg-[#2c3e50] transition-transform active:scale-[0.98]"
            >
              確認到貨
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              再等一下
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};