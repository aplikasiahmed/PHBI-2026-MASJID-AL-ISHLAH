import * as XLSX from 'xlsx';
import { AppData } from '../types';
import { formatDate, formatDateTime } from './format';
import Swal from 'sweetalert2';

export const generateExcel = (data: AppData, type: 'weekly' | 'donor' | 'expense' | 'all_income' | 'all_financial') => {
  try {
      const wb = XLSX.utils.book_new();

      // Helper untuk menambahkan Sheet dengan Style
      const addToSheet = (sheetName: string, headers: string[], rowData: any[]) => {
        const wsData = [headers, ...rowData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // --- AUTO FIT COLUMN WIDTH CALCULATION ---
        // Iterasi setiap kolom (berdasarkan jumlah header)
        const wscols = headers.map((header, colIndex) => {
            // Mulai dengan panjang header
            let maxLength = header.toString().length;

            // Cek setiap baris data untuk kolom ini
            rowData.forEach(row => {
                const cellValue = row[colIndex];
                if (cellValue) {
                    // Konversi ke string (termasuk angka format rupiah nanti)
                    let cellLength = cellValue.toString().length;
                    
                    // Jika tipe datanya number, kita estimasi format "Rp " menambah panjang
                    if (typeof cellValue === 'number') {
                         cellLength = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(cellValue).length;
                    }

                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                }
            });

            // Tambahkan padding extra biar lega
            return { wch: maxLength + 5 }; 
        });

        ws['!cols'] = wscols;

        // --- BORDER STYLING & CURRENCY FORMATTING ---
        // Style Object untuk Border Tipis Semua Sisi
        const borderStyle = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        };

        // Header Style
        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "E5E7EB" } }, // Light Gray
            border: borderStyle
        };

        // Daftar Header yang BUKAN Mata Uang (Agar tidak diformat Rp)
        const nonCurrencyHeaders = ['No', 'Minggu', 'RT', 'No.', 'Tanggal'];

        const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({r: R, c: C});
                if (!ws[cellRef]) continue;

                // 1. TERAPKAN BORDER KE SEMUA SEL
                if (!ws[cellRef].s) ws[cellRef].s = {};
                ws[cellRef].s.border = borderStyle;

                // 2. TERAPKAN STYLE KHUSUS HEADER
                if (R === 0) {
                    ws[cellRef].s = { ...ws[cellRef].s, ...headerStyle };
                }

                // 3. TERAPKAN FORMAT MATA UANG (KECUALI KOLOM NO, MINGGU, RT)
                // Cek apakah baris data (R > 0) DAN tipe datanya number ('n')
                if (R > 0 && ws[cellRef].t === 'n') {
                    const currentHeader = headers[C]; // Ambil nama header kolom ini
                    
                    // Jika header TIDAK ada dalam daftar nonCurrencyHeaders, maka format Rupiah
                    if (!nonCurrencyHeaders.includes(currentHeader)) {
                        ws[cellRef].z = '"Rp" #,##0';
                    } else {
                        // Jika kolom No/Minggu/RT, pastikan format general/angka biasa (center align opsional)
                         ws[cellRef].s.alignment = { horizontal: "center", vertical: "center" };
                    }
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      // --- PREVIOUS FUNDS (UPDATE: Muncul untuk 'all_financial' DAN 'all_income') ---
      if (type === 'all_financial' || type === 'all_income') {
          const headers = ['No', 'Tanggal', 'Nominal'];
          const rows = data.previousFunds.map((item, idx) => [
              idx + 1,
              formatDate(item.date),
              item.nominal
          ]);
          const totalRow = ['', 'TOTAL', data.previousFunds.reduce((a,b)=>a+b.nominal,0)];
          rows.push(totalRow);
          addToSheet("Dana Awal", headers, rows);
      }

      // --- MINGGUAN ---
      if (type === 'weekly' || type === 'all_income' || type === 'all_financial') {
        // REVISI URUTAN HEADER: Minggu -> Tanggal -> RT
        const headers = ['Minggu', 'Tanggal', 'RT', 'Pemasukan Kotor', 'Potongan Konsumsi (5%)', 'Potongan Komisi (10%)', 'Jumlah Bersih'];
        
        // REVISI URUTAN DATA
        const rows = data.weeklyData.map(item => [
          item.week, // String
          formatDate(item.date), // Swapped (Before RT)
          item.rt,   // Swapped (After Date)
          item.grossAmount,
          item.consumptionCut,
          item.commissionCut,
          item.netAmount
        ]);
        
        const totalRow = [
            'TOTAL', '', '',
            data.weeklyData.reduce((a,b)=>a+b.grossAmount,0),
            data.weeklyData.reduce((a,b)=>a+b.consumptionCut,0),
            data.weeklyData.reduce((a,b)=>a+b.commissionCut,0),
            data.weeklyData.reduce((a,b)=>a+b.netAmount,0)
        ];
        rows.push(totalRow);

        addToSheet("Mingguan", headers, rows);
      }

      // --- DONATUR ---
      if (type === 'donor' || type === 'all_income' || type === 'all_financial') {
        const headers = ['No', 'Tanggal', 'Sumber Dana', 'Nominal'];
        const rows = data.donors.map((item, idx) => [
          idx + 1,
          formatDate(item.date),
          item.name,
          item.nominal
        ]);

        const totalRow = ['', '', 'TOTAL', data.donors.reduce((a,b)=>a+b.nominal,0)];
        rows.push(totalRow);

        addToSheet("Donatur", headers, rows);
      }

      // --- PENGELUARAN ---
      if (type === 'expense' || type === 'all_financial') {
        const headers = ['No', 'Tanggal', 'Keperluan', 'Nominal'];
        const rows = data.expenses.map((item, idx) => [
          idx + 1,
          formatDate(item.date),
          item.purpose,
          item.nominal
        ]);

        const totalRow = ['', '', 'TOTAL', data.expenses.reduce((a,b)=>a+b.nominal,0)];
        rows.push(totalRow);

        addToSheet("Pengeluaran", headers, rows);
      }

      // --- REKAPITULASI ---
      if (type === 'all_financial') {
        const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
        const totalWeekly = data.weeklyData.reduce((a,b)=>a+b.netAmount,0);
        const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
        const totalIncome = totalPrev + totalWeekly + totalDonor;
        const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
        const balance = totalIncome - totalExpense;

        const headers = ['KATEGORI', 'TOTAL NOMINAL'];
        const rows = [
            ['Total Dana Panitia Sebelumnya', totalPrev],
            ['Total Pemasukan Mingguan (Bersih)', totalWeekly],
            ['Total Pemasukan Proposal / Amplop', totalDonor],
            ['TOTAL SEMUA PEMASUKAN', totalIncome],
            ['TOTAL PENGELUARAN', totalExpense],
            // UPDATE: Menggunakan formatDateTime
            ['SISA SALDO SAAT INI (Update: ' + formatDateTime(data.lastUpdated) + ')', balance]
        ];
        addToSheet("Rekapitulasi", headers, rows);
      }

      // Tulis File
      XLSX.writeFile(wb, `Laporan_PHBI_${type}_${new Date().toISOString().slice(0,10)}.xlsx`);
  
  } catch (error: any) {
      console.error("Excel Error:", error);
      Swal.fire({
          icon: 'error',
          title: 'Gagal Download Excel',
          text: 'Terjadi kesalahan saat membuat file excel. Pastikan browser mendukung fitur ini.',
          footer: error.message
      });
  }
};