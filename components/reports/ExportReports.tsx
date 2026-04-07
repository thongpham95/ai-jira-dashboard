"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Printer, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export interface ExportData {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    summary?: Record<string, string | number>;
}

interface ExportReportsProps {
    data: ExportData;
    fileName?: string;
    onExport?: (type: "csv" | "pdf" | "print") => void;
}

export function ExportReports({ data, fileName = "report", onExport }: ExportReportsProps) {
    const { language } = useLanguage();
    const [exporting, setExporting] = useState<string | null>(null);

    const vi = language === "vi";

    const exportToCSV = () => {
        setExporting("csv");
        try {
            // Build CSV content
            const csvContent = [
                // Title row
                [data.title],
                [],
                // Headers
                data.headers,
                // Data rows
                ...data.rows,
                [],
                // Summary if exists
                ...(data.summary
                    ? [
                        [vi ? "Tổng kết" : "Summary"],
                        ...Object.entries(data.summary).map(([key, value]) => [key, String(value)]),
                    ]
                    : []),
            ]
                .map((row) =>
                    row.map((cell) => {
                        // Escape quotes and wrap in quotes if contains comma
                        const cellStr = String(cell);
                        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                            return `"${cellStr.replace(/"/g, '""')}"`;
                        }
                        return cellStr;
                    }).join(",")
                )
                .join("\n");

            // Add BOM for Excel UTF-8 compatibility
            const bom = "\uFEFF";
            const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

            // Download file
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            onExport?.("csv");
        } finally {
            setExporting(null);
        }
    };

    const exportToPDF = () => {
        setExporting("pdf");
        try {
            // Create a printable HTML document
            const printContent = generatePrintableHTML(data, vi);

            // Open in new window for printing/saving as PDF
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(printContent);
                printWindow.document.close();

                // Wait for content to load then trigger print
                printWindow.onload = () => {
                    printWindow.print();
                };
            }

            onExport?.("pdf");
        } finally {
            setExporting(null);
        }
    };

    const handlePrint = () => {
        setExporting("print");
        try {
            const printContent = generatePrintableHTML(data, vi);
            const printFrame = document.createElement("iframe");
            printFrame.style.position = "absolute";
            printFrame.style.width = "0";
            printFrame.style.height = "0";
            printFrame.style.border = "none";
            document.body.appendChild(printFrame);

            const frameDoc = printFrame.contentWindow?.document;
            if (frameDoc) {
                frameDoc.write(printContent);
                frameDoc.close();

                printFrame.contentWindow?.focus();
                printFrame.contentWindow?.print();
            }

            // Clean up
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 1000);

            onExport?.("print");
        } finally {
            setExporting(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting}>
                    {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {vi ? "Xuất báo cáo" : "Export"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4" />
                    {vi ? "Xuất CSV (Excel)" : "Export CSV (Excel)"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    {vi ? "Xuất PDF" : "Export PDF"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
                    <Printer className="h-4 w-4" />
                    {vi ? "In báo cáo" : "Print"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function generatePrintableHTML(data: ExportData, vi: boolean): string {
    const now = new Date().toLocaleString(vi ? "vi-VN" : "en-US");

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${data.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.5;
        }
        .header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header .meta {
            color: #6b7280;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 13px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        tr:hover {
            background-color: #f9fafb;
        }
        .summary {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
        }
        .summary h3 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #374151;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
        }
        .summary-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
        }
        .summary-item .label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        .summary-item .value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
        }
        @media print {
            body {
                padding: 20px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.title}</h1>
        <div class="meta">${vi ? "Ngày tạo" : "Generated"}: ${now}</div>
    </div>

    <table>
        <thead>
            <tr>
                ${data.headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${data.rows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join("")}
                </tr>
            `).join("")}
        </tbody>
    </table>

    ${data.summary ? `
        <div class="summary">
            <h3>${vi ? "Tổng kết" : "Summary"}</h3>
            <div class="summary-grid">
                ${Object.entries(data.summary).map(([key, value]) => `
                    <div class="summary-item">
                        <div class="label">${key}</div>
                        <div class="value">${value}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    ` : ""}

    <div class="footer">
        JiraDash - ${vi ? "Báo cáo được tạo tự động" : "Auto-generated report"}
    </div>
</body>
</html>
    `;
}

// Helper to convert dashboard data to export format
export function prepareExportData(
    title: string,
    columns: { key: string; label: string }[],
    items: Record<string, any>[],
    summary?: Record<string, string | number>
): ExportData {
    return {
        title,
        headers: columns.map((c) => c.label),
        rows: items.map((item) => columns.map((c) => item[c.key] ?? "")),
        summary,
    };
}
