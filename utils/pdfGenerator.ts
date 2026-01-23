import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppData } from '../types';
import { formatCurrency, formatDate, formatDateTime } from './format';

// Link Logo Baru
const LOGO_URL = "https://bmcenhkcwuxnclmlcriy.supabase.co/storage/v1/object/sign/image/logo%20phbi%20png.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iODZjZjM2NS1mNTBmLTQwMmQtYjUwMC00Mjg3YjVlYTgxYzkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9sb2dvIHBoYmkgcG5nLnBuZyIsImlhdCI6MTc2ODU1OTQxNywiZXhwIjoxODAwMDk1NDE3fQ.njyWJkqHScwEEVDgYKwdbOVpJ6Cr4fZQWAxU_L51_FY";

// Helper: Fungsi Terbilang (Angka ke Kata)
const terbilang = (nilai: number): string => {
  const bilangan = Math.abs(nilai);
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";

  if (bilangan < 12) {
    temp = " " + angka[bilangan];
  } else if (bilangan < 20) {
    temp = terbilang(bilangan - 10) + " Belas ";
  } else if (bilangan < 100) {
    temp = terbilang(Math.floor(bilangan / 10)) + " Puluh " + terbilang(bilangan % 10);
  } else if (bilangan < 200) {
    temp = " Seratus " + terbilang(bilangan - 100);
  } else if (bilangan < 1000) {
    temp = terbilang(Math.floor(bilangan / 100)) + " Ratus " + terbilang(bilangan % 100);
  } else if (bilangan < 2000) {
    temp = " Seribu" + terbilang(bilangan - 1000);
  } else if (bilangan < 1000000) {
    temp = terbilang(Math.floor(bilangan / 1000)) + " Ribu " + terbilang(bilangan % 1000);
  } else if (bilangan < 1000000000) {
    temp = terbilang(Math.floor(bilangan / 1000000)) + " Juta " + terbilang(bilangan % 1000000);
  } else if (bilangan < 1000000000000) {
    temp = terbilang(Math.floor(bilangan / 1000000000)) + " Milyar" + terbilang(bilangan % 1000000000);
  }

  return temp.trim();
}

// Helper untuk memuat gambar menjadi Base64
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};

export const generatePDF = async (data: AppData, type: 'weekly' | 'donor' | 'expense' | 'all_income' | 'all_financial' | 'accountability') => {
  // SETTING UKURAN KERTAS F4 (210mm x 330mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 330] 
  });

  const updateDateStr = `(Update: ${formatDateTime(data.lastUpdated)}) `;
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // --- SORTING HELPER (Tanggal Kecil di Atas / Ascending) ---
  const sortByDateAsc = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();
  
  // --- 1. PREPARE LOGO (Muat sekali di awal) ---
  let logoBase64 = '';
  try {
    logoBase64 = await getBase64ImageFromURL(LOGO_URL);
  } catch (error) {
    console.error("Gagal memuat Logo", error);
  }

  // --- 2. FUNGSI UNTUK MENGGAMBAR HEADER/KOP SURAT ---
  const printHeader = (doc: jsPDF) => {
      const centerX = 112; 

      if (logoBase64) {
         doc.addImage(logoBase64, 'PNG', 15, 8, 26, 26); 
      }

      doc.setTextColor(0, 0, 0); 
      doc.setFont("times", "bold");
      doc.setFontSize(14); 
      doc.text("PANITIA HARI BESAR ISLAM", centerX, 15, { align: 'center' });
      doc.text("MAULID NABI MUHAMMAD SAW", centerX, 21, { align: 'center' });
      doc.text("DEWAN KEMAKMURAN MASJID (DKM) JAMI' AL-ISHLAH", centerX, 27, { align: 'center' });
      
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text("Jl. H.A Djuminta Kp. Teriti Rw. 04 Desa Karet Kec. Sepatan Kab. Tangerang", centerX, 33, { align: 'center' });

      doc.setDrawColor(0, 0, 0); 
      doc.setLineWidth(0.5);
      doc.line(10, 37, 200, 37); 
      doc.setLineWidth(0.3); 
      doc.line(10, 38, 200, 38); 
      doc.setLineWidth(0.1); 
  };

  // --- 3. LOGIKA TABLE & ISI ---
  let startY = 46; 

  const compactStyles: any = {
      fontSize: 8,
      textColor: [0, 0, 0],       
      cellPadding: 1.5,  
      valign: 'middle',
      overflow: 'linebreak'
  };
  
  const compactHeadStyles: any = {
      fontSize: 8,
      textColor: [255, 255, 255],       
      valign: 'middle',
      halign: 'center'
  };

  const lpjStyles: any = {
      fontSize: 8.5, 
      textColor: [0, 0, 0],
      cellPadding: 1.2, 
      valign: 'middle',
      overflow: 'linebreak'
  };

  const lpjHeadStyles: any = {
      fontSize: 8.5,
      textColor: [255, 255, 255],
      valign: 'middle',
      halign: 'center',
      fontStyle: 'bold'
  };

  const tableMargin = { top: 42, bottom: 20 };

  const colWidthNo = 10;
  const colWidthDate = 30;
  const colWidthNominal = 35;

  const addTitle = (title: string, isFirstSection = false, color: [number, number, number] = [0, 0, 0]) => {
    if (!isFirstSection) {
        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        startY = lastTableY + 8; 
        if (startY > 280) {
            doc.addPage();
            startY = 46; 
        }
    }
    doc.setFontSize(9); 
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]); 
    doc.text(title, 105, startY, { align: 'center' });
    doc.setTextColor(0, 0, 0); 
    startY += 5; 
  };

  const addLeftTitle = (numberStr: string, title: string, isFirstSection = false) => {
    if (!isFirstSection) {
        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        startY = lastTableY + 6; 
        if (startY > 280) {
            doc.addPage();
            startY = 46; 
        }
    }
    doc.setFontSize(8); 
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); 
    doc.text(`${numberStr}. ${title}`, 15, startY, { align: 'left' });
    startY += 2; 
  };

  if (type === 'accountability') {
      doc.setFont("times", "bold"); 
      doc.setFontSize(12); 
      doc.text("LAPORAN PERTANGGUNG JAWABAN", 108, startY + 2, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text("PANITIA PERINGATAN HARI BESAR ISLAM (PHBI)", 108, startY + 7, { align: 'center' });
      doc.text("MAULID NABI MUHAMMAD SAW 1448 H / 2026 M", 108, startY + 12, { align: 'center' });
      
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text("Masjid Jam'i Al-Ishlah Kp. Teriti RW. 04", 108, startY + 17, { align: 'center' });

      startY += 25;
      
      addLeftTitle('I', 'LAPORAN SALDO AWAL (PANITIA SEBELUMNYA)', true);
      
      if (data.previousFunds.length > 0) {
        const sortedPrev = [...data.previousFunds].sort(sortByDateAsc);
        const rows = sortedPrev.map((item, idx) => [
            idx + 1,
            formatDate(item.date),
            formatCurrency(item.nominal)
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['NO', 'TANGGAL', 'NOMINAL']],
            body: rows,
            theme: 'grid',
            styles: lpjStyles, 
            showHead: 'firstPage',
            showFoot: 'lastPage',
            headStyles: { ...lpjHeadStyles, fillColor: [88, 28, 135] }, 
            footStyles: { ...lpjStyles, fillColor: [233, 213, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 
                0: { halign: 'center', cellWidth: colWidthNo }, 
                1: { cellWidth: colWidthDate, halign: 'center' },
                2: { halign: 'right', cellWidth: colWidthNominal }
            },
            margin: tableMargin,
            foot: [[
                { content: '', colSpan: 1 },
                { content: 'SALDO AWAL ', styles: { halign: 'right'} },
                { content: formatCurrency(data.previousFunds.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
            ]]
        });
     } else {
         doc.setFontSize(10); doc.setFont("helvetica", "italic");
         doc.text("(Tidak ada data dana awal)", 15, startY + 5);
         (doc as any).lastAutoTable = { finalY: startY + 8 };
     }

     addLeftTitle('II', 'LAPORAN PEMASUKAN MINGGUAN');
     const groupedWeeks: Record<string, { date: string, netTotal: number, name: string }> = {};
     const sortedWeeklyRaw = [...data.weeklyData].sort(sortByDateAsc);

     sortedWeeklyRaw.forEach(item => {
        if (!groupedWeeks[item.week]) {
            groupedWeeks[item.week] = {
                date: item.date,
                netTotal: 0,
                name: item.week
            };
        }
        groupedWeeks[item.week].netTotal += item.netAmount;
     });

     const summaryWeeks = Object.values(groupedWeeks).sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
     });

     const summaryRows = summaryWeeks.map((item, idx) => [
         idx + 1,
         formatDate(item.date),
         item.name, 
         formatCurrency(item.netTotal)
     ]);

     const totalWeeklyNet = summaryWeeks.reduce((a, b) => a + b.netTotal, 0);

     autoTable(doc, {
        startY: startY,
        head: [['NO', 'TANGGAL', 'MINGGU KE', 'NOMINAL']], 
        body: summaryRows,
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'firstPage', 
        showFoot: 'lastPage',
        margin: tableMargin,
        headStyles: { ...lpjHeadStyles, fillColor: [13, 148, 136] }, 
        footStyles: { ...lpjStyles, fillColor: [204, 251, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 
            0: { halign: 'center', cellWidth: colWidthNo }, 
            1: { halign: 'center', cellWidth: colWidthDate }, 
            2: { halign: 'left', cellWidth: 'auto' }, 
            3: { halign: 'right', cellWidth: colWidthNominal } 
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL PEMASUKAN MINGGUAN ', styles: { halign: 'right'} },
            { content: formatCurrency(totalWeeklyNet), styles: { halign: 'right' } }
        ]]
     });

     addLeftTitle('III', 'LAPORAN PEMASUKAN PROPOSAL / AMPLOP');
     const sortedDonors = [...data.donors].sort(sortByDateAsc);
     const donorRows = sortedDonors.map((item, idx) => [
         idx + 1,
         formatDate(item.date),
         item.name,
         formatCurrency(item.nominal)
     ]);

     autoTable(doc, {
        startY: startY,
        head: [['NO', 'TANGGAL', 'SUMBER DANA / DONATUR', 'NOMINAL']],
        body: donorRows,
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'firstPage', 
        showFoot: 'lastPage',
        margin: tableMargin,
        headStyles: { ...lpjHeadStyles, fillColor: [30, 64, 175] }, 
        footStyles: { ...lpjStyles, fillColor: [219, 234, 254], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 
            0: { halign: 'center', cellWidth: colWidthNo }, 
            1: { halign: 'center', cellWidth: colWidthDate }, 
            2: { halign: 'left', cellWidth: 'auto' }, 
            3: { halign: 'right', cellWidth: colWidthNominal } 
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL PEMASUKAN PROPOSAL/AMPLOP ', styles: { halign: 'right' } },
            { content: formatCurrency(data.donors.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
        ]]
     });

     addLeftTitle('IV', 'LAPORAN DANA PENGELUARAN');
     const sortedExpenses = [...data.expenses].sort(sortByDateAsc);
     const expenseRows = sortedExpenses.map((item, idx) => [
        idx + 1,
        formatDate(item.date),
        item.purpose,
        formatCurrency(item.nominal)
      ]);
  
      autoTable(doc, {
        startY: startY,
        head: [['NO', 'TANGGAL', 'KEPERLUAN', 'NOMINAL']],
        body: expenseRows,
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'firstPage', 
        showFoot: 'lastPage',
        margin: tableMargin,
        headStyles: { ...lpjHeadStyles, fillColor: [185, 28, 28] }, 
        footStyles: { ...lpjStyles, fillColor: [254, 226, 226], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 
            0: { halign: 'center', cellWidth: colWidthNo }, 
            1: { halign: 'center', cellWidth: colWidthDate }, 
            2: { halign: 'left', cellWidth: 'auto' }, 
            3: { halign: 'right', cellWidth: colWidthNominal } 
        },
        foot: [[
            { content: '', colSpan: 2 },
            { content: 'TOTAL DANA PENGELUARAN ', styles: { halign: 'right' } },
            { content: formatCurrency(data.expenses.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
        ]]
      });

     addLeftTitle('V', 'LAPORAN REKAPITULASI DANA PHBI');
     const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
     const totalWeekly = data.weeklyData.reduce((a,b)=>a+b.netAmount,0);
     const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
     const totalIncome = totalPrev + totalWeekly + totalDonor;
     const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
     const balance = totalIncome - totalExpense;

     autoTable(doc, {
        startY: startY, 
        head: [['KETERANGAN', 'NOMINAL']],
        body: [
            [{ content: ' Total Saldo Awal (Panitia Sebelumnya)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalPrev), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
            [{ content: ' Total Pemasukan Bersih Mingguan (Ringkasan)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalWeekly), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
            [{ content: ' Total Pemasukan Proposal / Amplop', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalDonor), styles: { fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' } }],
            [{ content: ' TOTAL SEMUA PEMASUKAN', styles: { fontStyle: 'bold', textColor: [6, 78, 59], fontSize: 10 } }, { content: formatCurrency(totalIncome), styles: { fontStyle: 'bold', fontSize: 10, textColor: [6, 78, 59], halign: 'right' } }],
            [{ content: ' TOTAL PENGELUARAN', styles: { fontStyle: 'bold', textColor: [185, 28, 28], fontSize: 10 } }, { content: formatCurrency(totalExpense), styles: { fontStyle: 'bold', fontSize: 10, textColor: [185, 28, 28], halign: 'right' } }],
            [
                { 
                    content: '', 
                    styles: { 
                        halign: 'right', 
                        fillColor: [255, 200, 100] 
                    } 
                }, 
                { 
                    content: formatCurrency(balance), 
                    styles: { 
                        fontStyle: 'bold', 
                        fontSize: 10, 
                        textColor: [30, 64, 175], 
                        halign: 'right',
                        fillColor: [255, 200, 100] 
                    } 
                }
            ]
        ],
        theme: 'grid',
        styles: lpjStyles, 
        showHead: 'firstPage', 
        margin: tableMargin,
        pageBreak: 'avoid', 
        headStyles: { ...lpjHeadStyles, fillColor: [204, 85, 0] }, 
        columnStyles: { 
            0: { halign: 'left', cellWidth: 'auto' }, 
            1: { halign: 'right', cellWidth: colWidthNominal } 
        },
        didDrawCell: (hookData) => {
            if (hookData.section === 'body' && hookData.row.index === 5 && hookData.column.index === 0) {
                const doc = hookData.doc;
                const cell = hookData.cell;
                const textLabel = " SISA SALDO SAAT INI";
                doc.setFont("helvetica", "bold"); doc.setFontSize(10);
                const wLabel = doc.getTextWidth(textLabel);
                const paddingRight = 4;
                const startX = cell.x + cell.width - paddingRight - wLabel;
                const finalY = cell.y + (cell.height / 2) + 1.25; 
                doc.setTextColor(30, 64, 175); 
                doc.text(textLabel, startX, finalY);
            }
        }
    });

    const finalYTable = (doc as any).lastAutoTable?.finalY;
    if (finalYTable) {
        const textTerbilang = terbilang(balance);
        doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(0, 0, 0);
        doc.text(`Terbilang : ${textTerbilang} Rupiah`, 196, finalYTable + 6, { align: 'right' }); 
        
        // --- TAMBAHAN TANDA TANGAN ---
        let sigY = finalYTable + 25;
        if (sigY + 50 > 320) {
            doc.addPage();
            sigY = 50;
        }

        const col1 = 45;
        const col2 = 105;
        const col3 = 165;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Tangerang, ${dateStr}`, col3, sigY - 8, { align: 'center' });

        // Row 1 Title
        doc.text("Wakil Ketua,", col1, sigY, { align: 'center' });
        doc.text("Sekertaris,", col2, sigY, { align: 'center' });
        doc.text("Bendahara,", col3, sigY, { align: 'center' });

        // Row 1 Name
        sigY += 22;
        doc.setFont("helvetica", "bold");
        doc.text("AHMAD FARHAN", col1, sigY, { align: 'center' });
        doc.text("AHMAD NAWASYI", col2, sigY, { align: 'center' });
        doc.text("MAHENDRA", col3, sigY, { align: 'center' });
        

        // Mengetahui
        sigY += 10;
        doc.setFont("helvetica", "normal");
        doc.text("Mengetahui,", col2, sigY, { align: 'center' });

        // Row 2 Title
        sigY += 8;
        doc.text("Ketua DKM Al-Ishlah,", col1, sigY, { align: 'center' });
        doc.text("Ketua RW. 04", col2, sigY, { align: 'center' });
        doc.text("Ketua Pemuda,", col3, sigY, { align: 'center' });

        // Row 2 Name
        sigY += 22;
        doc.setFont("helvetica", "bold");
        doc.text("Ustd. MUHAMMAD ASMUR", col1, sigY, { align: 'center' });
        doc.text("MUHAMMAD ROMLI", col2, sigY, { align: 'center' });
        doc.text("USUP BIN H. USAN", col3, sigY, { align: 'center' });

    }

  } else {
    if (type === 'all_financial' || type === 'all_income') {
        addTitle('LAPORAN SALDO AWAL (PANITIA SEBELUMNYA)', true);
        if (data.previousFunds.length > 0) {
            const sortedPrev = [...data.previousFunds].sort(sortByDateAsc);
            const rows = sortedPrev.map((item, idx) => [
                idx + 1,
                formatDate(item.date),
                formatCurrency(item.nominal)
            ]);
            autoTable(doc, {
                startY: startY,
                head: [['No', 'TANGGAL', 'NOMINAL']],
                body: rows,
                theme: 'grid',
                styles: compactStyles,
                showHead: 'firstPage',
                showFoot: 'lastPage',
                headStyles: { ...compactHeadStyles, fillColor: [88, 28, 135] }, 
                footStyles: { ...compactStyles, fillColor: [233, 213, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
                columnStyles: { 
                    0: { halign: 'center', textColor: [0, 0, 0], cellWidth: 15 }, 
                    2: { halign: 'right', textColor: [0, 0, 0], cellWidth: 35 } 
                },
                margin: tableMargin, 
                foot: [[
                    { content: '', colSpan: 1, styles: { textColor: [0, 0, 0] }},
                    { content: 'TOTAL SALDO AWAL ', styles: { halign: 'right'} },
                    { content: formatCurrency(data.previousFunds.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right', textColor: [0, 0, 0] } }
                ]]
            });
        } else {
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text("(Tidak ada data dana awal)", 105, startY + 4, { align: 'center' });
            (doc as any).lastAutoTable = { finalY: startY + 8 }; 
        }
    }

    if (type === 'weekly' || type === 'all_income' || type === 'all_financial') {
        addTitle('LAPORAN PEMASUKAN MINGGUAN (PER RT)', type !== 'all_financial' && type !== 'all_income');
        const groupedByWeek: Record<string, any[]> = {};
        const sortedWeeklyRaw = [...data.weeklyData].sort(sortByDateAsc);
        sortedWeeklyRaw.forEach(item => {
            if (!groupedByWeek[item.week]) groupedByWeek[item.week] = [];
            groupedByWeek[item.week].push(item);
        });
        const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });
        const bodyData: any[] = [];
        let totalGrossAll = 0, totalConsAll = 0, totalCommAll = 0, totalNetAll = 0;
        sortedWeeks.forEach(week => {
            const items = groupedByWeek[week];
            items.sort((a, b) => a.rt.localeCompare(b.rt));
            let totalGrossWeek = 0, totalConsWeek = 0, totalCommWeek = 0, totalNetWeek = 0;
            items.forEach(item => {
                bodyData.push([
                    item.week, formatDate(item.date), item.rt, formatCurrency(item.grossAmount),
                    formatCurrency(item.consumptionCut), formatCurrency(item.commissionCut), formatCurrency(item.netAmount)
                ]);
                totalGrossWeek += item.grossAmount; totalConsWeek += item.consumptionCut;
                totalCommWeek += item.commissionCut; totalNetWeek += item.netAmount;
            });
            bodyData.push([
                { content: `Total ${week}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', textColor: [6, 78, 59] } }, 
                { content: formatCurrency(totalGrossWeek), styles: { fontStyle: 'bold', textColor: [6, 78, 59], halign: 'right' } },
                { content: formatCurrency(totalConsWeek), styles: { fontStyle: 'bold', textColor: [185, 28, 28], halign: 'right' } }, 
                { content: formatCurrency(totalCommWeek), styles: { fontStyle: 'bold', textColor: [185, 28, 28], halign: 'right' } }, 
                { content: formatCurrency(totalNetWeek), styles: { fontStyle: 'bold', textColor: [6, 78, 59], halign: 'right' } }
            ]);
            totalGrossAll += totalGrossWeek; totalConsAll += totalConsWeek;
            totalCommAll += totalCommWeek; totalNetAll += totalNetWeek;
        });
        bodyData.push([
            { content: 'TOTAL PENDAPATAN BERSIH ', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8  } },
            { content: formatCurrency(totalGrossAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } },
            { content: formatCurrency(totalConsAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } },
            { content: formatCurrency(totalCommAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } },
            { content: formatCurrency(totalNetAll), styles: { fontStyle: 'bold', fontSize: 8, halign: 'right' } }
        ]);
        autoTable(doc, {
            startY: startY,
            head: [['MINGGU', 'TANGGAL', 'RT', 'PEMASUKAN', 'KONSUMSI 5%', 'KOMISI 10%', 'PENDAPATAN BERSIH']],
            body: bodyData,
            theme: 'grid',
            styles: compactStyles,
            showHead: 'firstPage',
            margin: tableMargin, 
            headStyles: { ...compactHeadStyles, fillColor: [13, 148, 136] },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' }, 
                1: { cellWidth: 25, halign: 'center' }, 
                2: { cellWidth: 12, halign: 'center' }, 
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right', cellWidth: 35 },
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const row = data.row.raw as any[];
                    if (row[0] && typeof row[0] === 'object') {
                        data.cell.styles.fillColor = [204, 251, 241]; 
                    } else if (data.column.index === 4 || data.column.index === 5) {
                        data.cell.styles.textColor = [255, 0, 0];
                    }
                }
            }
        });
    }

    if (type === 'donor' || type === 'all_income' || type === 'all_financial') {
        addTitle('LAPORAN PEMASUKAN PROPOSAL / AMPLOP', type === 'donor');
        const sortedDonors = [...data.donors].sort(sortByDateAsc);
        const rows = sortedDonors.map((item, idx) => [
            idx + 1, formatDate(item.date), item.name, formatCurrency(item.nominal)
        ]);
        autoTable(doc, {
            startY: startY,
            head: [['NO', 'TANGGAL', 'SUMBER DANA / DONATUR', 'NOMINAL']],
            body: rows,
            theme: 'grid',
            styles: compactStyles,
            showHead: 'firstPage',
            showFoot: 'lastPage',
            margin: tableMargin, 
            headStyles: { ...compactHeadStyles, fillColor: [30, 64, 175] }, 
            footStyles: { ...compactStyles, fillColor: [219, 234, 254], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 1: { cellWidth: 28, halign: 'center' }, 3: { halign: 'right', cellWidth: 35 } },
            foot: [[
                { content: '', colSpan: 2 },
                { content: 'TOTAL PEMASUKAN PROPOSAL/AMPLOP ', styles: { halign: 'right' } }, 
                { content: formatCurrency(data.donors.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
            ]]
        });
    }

    if (type === 'expense' || type === 'all_financial') {
        addTitle('LAPORAN DANA PENGELUARAN', type === 'expense');
        const sortedExpenses = [...data.expenses].sort(sortByDateAsc);
        const rows = sortedExpenses.map((item, idx) => [
            idx + 1, formatDate(item.date), item.purpose, formatCurrency(item.nominal)
        ]);
        autoTable(doc, {
            startY: startY,
            head: [['NO', 'TANGGAL', 'KEPERLUAN', 'NOMINAL']],
            body: rows,
            theme: 'grid',
            styles: compactStyles,
            showHead: 'firstPage',
            showFoot: 'lastPage',
            margin: tableMargin, 
            headStyles: { ...compactHeadStyles, fillColor: [185, 28, 28] }, 
            footStyles: { ...compactStyles, fillColor: [254, 226, 226], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 1: { cellWidth: 28, halign: 'center' }, 3: { halign: 'right', cellWidth: 35 } },
            foot: [[
                { content: '', colSpan: 2 },
                { content: 'TOTAL DANA PENGELUARAN ', styles: { halign: 'right' } },
                { content: formatCurrency(data.expenses.reduce((a,b)=>a+b.nominal,0)), styles: { halign: 'right' } }
            ]]
        });
    }

    if (type === 'all_financial') {
        const totalPrev = data.previousFunds.reduce((a,b)=>a+b.nominal,0);
        const totalWeekly = data.weeklyData.reduce((a,b)=>a+b.netAmount,0);
        const totalDonor = data.donors.reduce((a,b)=>a+b.nominal,0);
        const totalIncome = totalPrev + totalWeekly + totalDonor;
        const totalExpense = data.expenses.reduce((a,b)=>a+b.nominal,0);
        const balance = totalIncome - totalExpense;
        const lastTableY = (doc as any).lastAutoTable?.finalY || startY;
        let rekapY = lastTableY + 10; 
        if (rekapY > 250) { doc.addPage(); rekapY = 46; }
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
        doc.text("LAPORAN REKAPITULASI DANA PHBI", 105, rekapY, { align: 'center' });
        autoTable(doc, {
            startY: rekapY + 4, 
            head: [['KETERANGAN', 'NOMINAL']],
            body: [
                [{ content: ' Total Saldo Awal (Panitia Sebelumnya)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalPrev), styles: { fontStyle: 'bold', fontSize: 9, halign: 'right' } }],
                [{ content: ' Total Pemasukan Bersih Mingguan (Per RT)', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalWeekly), styles: { fontStyle: 'bold', fontSize: 9, halign: 'right' } }],
                [{ content: ' Total Pemasukan Proposal / Amplop', styles: { textColor: [0, 0, 0], fontSize: 9 } }, { content: formatCurrency(totalDonor), styles: { fontStyle: 'bold', fontSize: 9, halign: 'right' } }],
                [{ content: ' TOTAL SEMUA PEMASUKAN', styles: { fontStyle: 'bold', textColor: [6, 78, 59], fontSize: 10 } }, { content: formatCurrency(totalIncome), styles: { fontStyle: 'bold', fontSize: 10, textColor: [6, 78, 59], halign: 'right' } }],
                [{ content: ' TOTAL PENGELUARAN', styles: { fontStyle: 'bold', textColor: [185, 28, 28], fontSize: 10 } }, { content: formatCurrency(totalExpense), styles: { fontStyle: 'bold', fontSize: 10, textColor: [185, 28, 28], halign: 'right' } }],
                [{ content: '', styles: { fillColor: [255, 200, 100] } }, { content: formatCurrency(balance), styles: { fontStyle: 'bold', fontSize: 10, textColor: [30, 64, 175], halign: 'right', fillColor: [255, 200, 100] } }]
            ],
            theme: 'grid',
            styles: compactStyles,
            showHead: 'firstPage',
            margin: tableMargin, 
            pageBreak: 'avoid', 
            headStyles: { ...compactHeadStyles, fillColor: [204, 85, 0] }, 
            columnStyles: { 0: { halign: 'left', cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 35 } },
            didDrawCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === 5 && hookData.column.index === 0) {
                    const doc = hookData.doc, cell = hookData.cell, textDate = updateDateStr, textLabel = " SISA SALDO SAAT INI";
                    doc.setFont("helvetica", "italic"); doc.setFontSize(8);
                    const wDate = doc.getTextWidth(textDate);
                    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
                    const wLabel = doc.getTextWidth(textLabel);
                    const totalW = wDate + wLabel, paddingRight = 4, startX = cell.x + cell.width - paddingRight - totalW;
                    const finalY = cell.y + (cell.height / 2) + 1.25;
                    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(80);
                    doc.text(textDate, startX, finalY);
                    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 64, 175);
                    doc.text(textLabel, startX + wDate, finalY);
                }
            }
        });
        const finalY = (doc as any).lastAutoTable?.finalY;
        if (finalY) {
            const textTerbilang = terbilang(balance);
            doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(0, 0, 0); 
            doc.text(`Terbilang : ${textTerbilang} Rupiah`, 196, finalY + 6, { align: 'right' }); 
        }
    }
  }

  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    printHeader(doc);
    doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(100);
    const nowLocal = new Date(), timeStr = nowLocal.toLocaleTimeString('id-ID');
    let footerLeftText = `didownload pada: ${dateStr}, Pukul : ${timeStr}`;
    if (type === 'accountability') {
        footerLeftText = `Laporan Pertanggung Jawaban Panitia PHBI 1448 H/2026 M | dibuat pada ${dateStr} pukul ${timeStr}`;
    }
    doc.text(footerLeftText, 15, doc.internal.pageSize.height - 10);
    doc.text(`Hal ${i} dari ${pageCount}`, 195, doc.internal.pageSize.height - 10, { align: 'right' });
  }

  const getFileName = (reportType: string) => {
      switch (reportType) {
          case 'all_financial': return 'Laporan_PHBI_Rekapitulasi';
          case 'weekly': return 'Laporan_PHBI_Mingguan_Per_RT';
          case 'donor': return 'Laporan_PHBI_Proposal_Amplop';
          case 'expense': return 'Laporan_PHBI_Pengeluaran';
          case 'all_income': return 'Laporan_PHBI_Gabungan_Pemasukan';
          case 'accountability': return 'LAPORAN_PERTANGGUNG_JAWABAN_PHBI';
          default: return `Laporan_PHBI_${reportType}`;
      }
  };

  const fileName = `${getFileName(type)}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};