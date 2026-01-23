
import * as XLSX from 'xlsx';
import { AppData } from '../types';
import { formatDate, formatDateTime } from './format';
import Swal from 'sweetalert2';

export const generateExcel = (data: AppData, type: 'weekly' | 'donor' | 'expense' | 'all_income' | 'all_financial' | 'accountability') => {
  try {
      const wb = XLSX.utils.book_new();
      
      // --- SORTING HELPER (Tanggal Kecil di Atas / Ascending) ---
      const sortByDateAsc = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

      // Helper untuk menambahkan Sheet dengan Style
      const addToSheet = (sheetName: string, headers: string[], rowData: any[]) => {
        const wsData = [headers, ...rowData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // --- AUTO FIT COLUMN WIDTH CALCULATION ---
        const wscols = headers.map((header, colIndex) => {
            let maxLength = header.toString().length;
            rowData.forEach(row => {
                const cellValue = row[colIndex];
                if (cellValue) {
                    let cellLength = cellValue.toString().length;
                    if (typeof cellValue === 'number') {
                         cellLength = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(cellValue).length;
                    }
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                }
            });
            return { wch: maxLength + 5 }; 
        });

        ws['!cols'] = wscols;

        // --- BORDER STYLING & CURRENCY FORMATTING ---
        const borderStyle = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        };

        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "E5E7EB" } }, // Light Gray
            border: borderStyle
        };

        const nonCurrencyHeaders = ['No', 'Minggu', 'RT', 'No.', 'Tanggal', 'Keterangan', 'Sumber Dana / Donatur', 'Keperluan'];

        const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({r: R, c: C});
                if (!ws[cellRef]) continue;

                if (!ws[cellRef].s) ws[cellRef].s = {};
                ws[cellRef].s.border = borderStyle;

                if (R === 0) {
                    ws[cellRef].s = { ...ws[cellRef].s, ...headerStyle };
                }

                if (R > 0 && ws[cellRef].t === 'n') {
                    const currentHeader = headers[C]; 
                    if (!nonCurrencyHeaders.includes(currentHeader)) {
                        ws[cellRef].z = '"Rp" #,##0';
                    } else {
                         ws[cellRef].s.alignment = { horizontal: "center", vertical: "center" };
                    }
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      // --- 1. SALDO AWAL ---
      if (type === 'all_financial' || type === 'all_income' || type === 'accountability') {
          const headers = ['No', 'Tanggal', 'Nominal'];
          // SORT
          const sortedPrev = [...data.previousFunds].sort(sortByDateAsc);
          const rows = sortedPrev.map((item, idx) => [
              idx + 1,
              formatDate(item.date),
              item.nominal
          ]);
          const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
          rows.push(['', 'TOTAL SALDO AWAL', totalPrev]);
          addToSheet("Dana Awal", headers, rows);
      }

      // --- 2. MINGGUAN (Ada 2 Mode: Detail vs Summary) ---
      
      // MODE A: DETAIL (Untuk type weekly, all_income, all_financial)
      if (type === 'weekly' || type === 'all_income' || type === 'all_financial') {
        const headers = ['Minggu', 'Tanggal', 'RT', 'Pemasukan Kotor', 'Potongan Konsumsi (5%)', 'Potongan Komisi (10%)', 'Jumlah Bersih'];
        
        // SORT
        const sortedWeekly = [...data.weeklyData].sort(sortByDateAsc);

        const rows = sortedWeekly.map(item => [
          item.week,
          formatDate(item.date), 
          item.rt, 
          item.grossAmount,
          item.consumptionCut,
          item.commissionCut,
          item.netAmount
        ]);
        
        const totalRow = [
            'TOTAL PENDAPATAN BERSIH', '', '',
            data.weeklyData.reduce((a,b)=>a+b.grossAmount,0),
            data.weeklyData.reduce((a,b)=>a+b.consumptionCut,0),
            data.weeklyData.reduce((a,b)=>a+b.commissionCut,0),
            data.weeklyData.reduce((a,b)=>a+b.netAmount,0)
        ];
        rows.push(totalRow);

        addToSheet("Mingguan Detail", headers, rows);
      }

      // MODE B: SUMMARY / RINGKASAN (KHUSUS ACCOUNTABILITY)
      if (type === 'accountability') {
          const headers = ['No', 'Tanggal', 'Nominal Bersih', 'Keterangan'];
          
          const groupedWeeks: Record<string, { date: string, netTotal: number, name: string }> = {};
          
          // SORT RAW DATA FOR GROUPING
          const sortedWeeklyRaw = [...data.weeklyData].sort(sortByDateAsc);
          
          sortedWeeklyRaw.forEach(item => {
             if (!groupedWeeks[item.week]) {
                 groupedWeeks[item.week] = { date: item.date, netTotal: 0, name: item.week };
             }
             groupedWeeks[item.week].netTotal += item.netAmount;
          });
     
          const summaryWeeks = Object.values(groupedWeeks).sort((a, b) => {
             const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
             const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
             return numA - numB;
          });

          const rows = summaryWeeks.map((item, idx) => [
              idx + 1,
              formatDate(item.date),
              item.netTotal,
              item.name
          ]);

          const totalRow = ['', 'TOTAL', summaryWeeks.reduce((a,b)=>a+b.netTotal,0), ''];
          rows.push(totalRow);

          addToSheet("Mingguan Ringkasan", headers, rows);
      }

      // --- 3. DONATUR ---
      if (type === 'donor' || type === 'all_income' || type === 'all_financial' || type === 'accountability') {
        const headers = ['No', 'Tanggal', 'Sumber Dana / Donatur', 'Nominal'];
        // SORT
        const sortedDonors = [...data.donors].sort(sortByDateAsc);
        const rows = sortedDonors.map((item, idx) => [
          idx + 1,
          formatDate(item.date),
          item.name,
          item.nominal
        ]);

        const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
        rows.push(['', '', 'TOTAL PEMASUKAN PROPOSAL/AMPLOP', totalDonor]);

        addToSheet("Donatur", headers, rows);
      }

      // --- 4. PENGELUARAN ---
      if (type === 'expense' || type === 'all_financial' || type === 'accountability') {
        const headers = ['No', 'Tanggal', 'Keperluan', 'Nominal'];
        // SORT
        const sortedExpenses = [...data.expenses].sort(sortByDateAsc);
        const rows = sortedExpenses.map((item, idx) => [
          idx + 1,
          formatDate(item.date),
          item.purpose,
          item.nominal
        ]);

        const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
        rows.push(['', '', 'TOTAL DANA PENGELUARAN', totalExpense]);

        addToSheet("Pengeluaran", headers, rows);
      }

      // --- 5. REKAPITULASI ---
      if (type === 'all_financial' || type === 'accountability') {
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
            ['SISA SALDO SAAT INI (Update: ' + formatDateTime(data.lastUpdated) + ')', balance]
        ];
        addToSheet("Rekapitulasi", headers, rows);
      }

      // Helper for unified file naming
      const getFileName = (reportType: string) => {
        switch (reportType) {
            case 'all_financial': return 'Laporan_PHBI_Rekapitulasi';
            case 'weekly': return 'Laporan_PHBI_Mingguan_Per_RT';
            case 'donor': return 'Laporan_PHBI_Proposal_Amplop';
            case 'expense': return 'Laporan_PHBI_Pengeluaran';
            case 'all_income': return 'Laporan_PHBI_Pemasukan_Gabungan';
            case 'accountability': return 'LAPORAN_PERTANGGUNG_JAWABAN_PHBI';
            default: return `Laporan_PHBI_${reportType}`;
        }
      };

      const fileName = `${getFileName(type)}_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
  
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
