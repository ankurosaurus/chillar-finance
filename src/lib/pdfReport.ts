import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import {
  Profile,
  Transaction,
  Category,
  Goal,
  DayPlan,
} from '../types/finance';
import { calculateMonthlySpendable, calculateCategoryMonthlyStatus } from './budgetMath';
import { formatINR } from './formatters';

interface GenerateReportOptions {
  monthDate: Date;
  profile: Profile;
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  dayPlans: Record<string, DayPlan>;
  username?: string;
}

export function generateMonthlyReportPDF({
  monthDate,
  profile,
  transactions,
  categories,
  goals,
  dayPlans,
  username = 'Hostel Student',
}: GenerateReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const monthStr = format(monthDate, 'MMMM yyyy');
  const monthKey = format(monthDate, 'yyyy-MM');

  // Filter transactions for this month
  const monthTxs = transactions.filter((t) => t.date.startsWith(monthKey));
  const incomeTxs = monthTxs.filter((t) => t.type === 'income');
  const expenseTxs = monthTxs.filter((t) => t.type === 'expense');

  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const netSaved = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSaved / totalIncome) * 100) : 0;

  // Day planner stats for this month
  let plannedItemsCount = 0;
  let spentItemsCount = 0;
  let skippedItemsCount = 0;
  let savedBySkipping = 0;

  Object.entries(dayPlans).forEach(([dateStr, plan]) => {
    if (dateStr.startsWith(monthKey)) {
      plan.items.forEach((item) => {
        plannedItemsCount++;
        if (item.status === 'spent') spentItemsCount++;
        if (item.status === 'skipped') {
          skippedItemsCount++;
          savedBySkipping += item.plannedAmount;
        }
      });
    }
  });

  // PDF Styling constants
  const primaryColor: [number, number, number] = [37, 99, 235]; // Royal Blue
  const darkBg: [number, number, number] = [11, 15, 25];
  const textColor: [number, number, number] = [30, 41, 59];
  const mutedColor: [number, number, number] = [100, 116, 139];

  // 1. Header Banner
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 595, 100, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('CHILLAR', 40, 48);

  // Subtitle / Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('EVERY RUPEE, ACCOUNTED FOR • FINANCIAL STATEMENT', 40, 66);

  // Report Period & User on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(monthStr.toUpperCase(), 555, 48, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Account: ${username} • Generated: ${format(new Date(), 'd MMM yyyy')}`, 555, 66, { align: 'right' });

  // 2. Executive KPI Summary Cards
  const startY = 120;
  const cardWidth = 120;
  const cardHeight = 60;
  const cardGap = 12;

  const kpis = [
    { label: 'TOTAL INFLOW', value: formatINR(totalIncome), color: [16, 185, 129] as [number, number, number] },
    { label: 'TOTAL SPENT', value: formatINR(totalExpense), color: [244, 63, 94] as [number, number, number] },
    { label: 'NET SAVED', value: formatINR(netSaved), color: [37, 99, 235] as [number, number, number] },
    { label: 'SAVINGS RATE', value: `${savingsRate}%`, color: [37, 99, 235] as [number, number, number] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 40 + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 6, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedColor);
    doc.text(kpi.label, x + 12, startY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, x + 12, startY + 44);
  });

  // 3. Category Breakdown Table
  let currentY = startY + cardHeight + 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text('Category Spending Breakdown', 40, currentY);

  const categoryRows = categories
    .map((cat) => {
      const status = calculateCategoryMonthlyStatus(cat, transactions, monthDate);
      const pctOfTotal = totalExpense > 0 ? Math.round((status.spent / totalExpense) * 100) : 0;
      return [
        cat.name,
        formatINR(status.spent),
        cat.monthlyLimit ? formatINR(cat.monthlyLimit) : 'No Limit',
        `${pctOfTotal}%`,
        status.isOverSoftCap ? 'Soft Cap Warning' : status.isOverLimit ? 'Exceeded' : 'Under Cap',
      ];
    })
    .filter((row) => row[1] !== '₹0');

  autoTable(doc, {
    startY: currentY + 8,
    head: [['Category', 'Spent This Month', 'Monthly Cap', '% of Total', 'Status']],
    body: categoryRows.length > 0 ? categoryRows : [['No categorized spending logged yet.', '-', '-', '-', '-']],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  // 4. Day Planner & Self-Control Summary
  currentY = (doc as any).lastAutoTable.finalY + 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text('Day Planner & Hostel Self-Control Summary', 40, currentY);

  const plannerSummaryRows = [
    ['Total Days Planned Prior', `${plannedItemsCount} items scheduled`],
    ['Items Marked as Spent', `${spentItemsCount} purchases logged to ledger`],
    ['Items Skipped (Self-Control)', `${skippedItemsCount} outside food/snacks resisted`],
    ['Money Saved by Skipping Swiggy/Outside Spends', formatINR(savedBySkipping)],
  ];

  autoTable(doc, {
    startY: currentY + 8,
    head: [['Planning Metric', 'Monthly Performance']],
    body: plannerSummaryRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  // 5. Recent Transactions Table
  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Add new page if close to bottom
  if (currentY > 650) {
    doc.addPage();
    currentY = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text('Transactions Ledger (Top 25)', 40, currentY);

  const txRows = monthTxs.slice(0, 25).map((t) => {
    const catName = categories.find((c) => c.id === t.categoryId)?.name || t.categoryId;
    return [
      t.date,
      t.note || catName,
      catName,
      t.mode,
      t.type === 'expense' ? `-${formatINR(t.amount)}` : `+${formatINR(t.amount)}`,
    ];
  });

  autoTable(doc, {
    startY: currentY + 8,
    head: [['Date', 'Description', 'Category', 'Mode', 'Amount']],
    body: txRows.length > 0 ? txRows : [['No transactions recorded for this month.', '-', '-', '-', '-']],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Chillar Mobile-First Finance • Page ${i} of ${pageCount} • https://chillar-blush.vercel.app`,
      297.5,
      820,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const safeFilename = `Chillar_Report_${format(monthDate, 'yyyy_MM')}.pdf`;
  doc.save(safeFilename);
}
