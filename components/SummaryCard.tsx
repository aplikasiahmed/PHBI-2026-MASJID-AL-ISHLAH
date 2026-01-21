import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Info } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  subtitle?: string;
  onDetailClick?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, type, subtitle, onDetailClick }) => {
  // Menggunakan warna spesifik untuk Ikon agar serasi dengan teks nominal
  const getIcon = () => {
    // REVISI: Ukuran ikon disamakan (w-7 h-7 md:w-10 md:h-10) agar ideal
    const iconClass = "w-7 h-7 md:w-10 md:h-10";
    switch (type) {
      case 'income': return <ArrowUpCircle className={`${iconClass} text-[#018f22]`} />;
      case 'expense': return <ArrowDownCircle className={`${iconClass} text-[#c91400]`} />;
      default: return <Wallet className={`${iconClass} text-[#0229e8]`} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'income': return 'bg-emerald-50 border-emerald-200';
      case 'expense': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  // Fungsi baru untuk menentukan warna font Nominal sesuai request
  const getAmountColor = () => {
    switch (type) {
      case 'income': return 'text-[#018f22]'; // Hijau Pemasukan
      case 'expense': return 'text-[#c91400]'; // Merah Pengeluaran
      default: return 'text-[#0229e8]'; // Biru Saldo
    }
  };

  return (
    <div className={`rounded-xl p-4 md:p-6 shadow-md border ${getBgColor()} relative transition hover:shadow-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs md:text-sm font-semibold uppercase tracking-wider">{title}</p>
          {/* Implementasi warna font dinamis */}
          <h3 className={`text-xl md:text-3xl font-bold mt-1 md:mt-2 ${getAmountColor()}`}>{formatCurrency(amount)}</h3>
          {subtitle && (
            <p className="text-[8px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1 font-medium italic">{subtitle}</p>
          )}
        </div>
        {getIcon()}
      </div>
      {onDetailClick && (
        <button 
          onClick={onDetailClick}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 text-[10px] md:text-xs font-semibold text-gray-500 hover:text-primary flex items-center gap-1"
        >
          <Info className="w-3 h-3 md:w-4 md:h-4" /> Detail
        </button>
      )}
    </div>
  );
};

export default SummaryCard;