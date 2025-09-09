/**
 * Image generator for ticket tables using HTML5 Canvas
 */

import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import type { TicketResponse } from '../models/eventos-types.js';

export interface TableImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  headerBackgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
  cellPadding?: number;
}

export class ImageGenerator {
  private defaultOptions: TableImageOptions = {
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    borderColor: '#333333',
    textColor: '#333333',
    headerBackgroundColor: '#f5f5f5',
    fontSize: 14,
    fontFamily: 'Arial',
    padding: 20,
    cellPadding: 8,
  };

  /**
   * Generate table image from ticket data
   */
  async generateTableImage(
    tickets: TicketResponse[],
    filename: string,
    options: Partial<TableImageOptions> = {},
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Prepare table data
    const tableData = this.prepareTableData(tickets);
    
    // Calculate dimensions
    const dimensions = this.calculateDimensions(tableData, opts);
    
    // Create canvas
    const canvas = createCanvas(dimensions.width, dimensions.height);
    const ctx = canvas.getContext('2d');
    
    // Set up canvas
    this.setupCanvas(ctx, opts);
    
    // Draw table
    this.drawTable(ctx, tableData, dimensions, opts);
    
    // Save image
    const imagePath = path.join(process.cwd(), 'image', filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);
    
    return imagePath;
  }

  /**
   * Prepare table data from tickets
   */
  private prepareTableData(tickets: TicketResponse[]): string[][] {
    const headers = ['ID', 'チケット名', '価格', '優先度', '販売期間', 'チェックイン', '複数料金'];
    const rows: string[][] = [headers];
    
    for (const ticket of tickets) {
      const row = [
        ticket.id.toString(),
        this.getTicketName(ticket),
        `¥${ticket.common.price}`,
        ticket.common.priority.toString(),
        this.formatSalesPeriod(ticket),
        this.formatCheckinMethod(ticket),
        ticket.common.enable_multiple_price ? 'あり' : 'なし',
      ];
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Get ticket name (Japanese first)
   */
  private getTicketName(ticket: TicketResponse): string {
    const japanese = ticket.language_data.find(ld => ld.language_id === 1);
    if (japanese?.title) {
      return japanese.title;
    }
    const firstLang = ticket.language_data[0];
    return firstLang?.title || 'タイトルなし';
  }

  /**
   * Format sales period
   */
  private formatSalesPeriod(ticket: TicketResponse): string {
    if (!ticket.common.enable_sales_period) {
      return '期間設定なし';
    }
    const start = ticket.common.sales_period_start?.split(' ')[0] || '';
    const end = ticket.common.sales_period_end?.split(' ')[0] || '';
    if (start && end) {
      return `${start}～${end}`;
    }
    return '期間不明';
  }

  /**
   * Format checkin method
   */
  private formatCheckinMethod(ticket: TicketResponse): string {
    const methods = [];
    if (ticket.common.checkin_method?.qr) {
      methods.push('QR');
    }
    if (ticket.common.checkin_method?.manual) {
      methods.push('手動');
    }
    return methods.length > 0 ? methods.join(', ') : 'なし';
  }

  /**
   * Calculate canvas dimensions based on table data
   */
  private calculateDimensions(tableData: string[][], opts: TableImageOptions): {
    width: number;
    height: number;
    cellWidths: number[];
    rowHeight: number;
  } {
    const minCellWidths = [80, 200, 80, 60, 150, 100, 80]; // Minimum widths for each column
    const cellWidths = [...minCellWidths];
    
    // Calculate required widths based on content
    tableData.forEach(row => {
      row.forEach((cell, colIndex) => {
        const textWidth = this.measureText(cell, opts.fontSize!, opts.fontFamily!);
        const requiredWidth = textWidth + (opts.cellPadding! * 2);
        if (colIndex < cellWidths.length && cellWidths[colIndex] !== undefined && requiredWidth > cellWidths[colIndex]) {
          cellWidths[colIndex] = requiredWidth;
        }
      });
    });
    
    const totalWidth = cellWidths.reduce((sum, width) => sum + width, 0) + (opts.padding! * 2);
    const rowHeight = opts.fontSize! + (opts.cellPadding! * 2);
    const totalHeight = (tableData.length * rowHeight) + (opts.padding! * 2) + 100; // Extra space for title and stats
    
    return {
      width: Math.max(totalWidth, opts.width!),
      height: Math.max(totalHeight, opts.height!),
      cellWidths,
      rowHeight,
    };
  }

  /**
   * Measure text width
   */
  private measureText(text: string, fontSize: number, _fontFamily: string): number {
    // Approximate text width calculation (more accurate measurement would require actual canvas context)
    return text.length * fontSize * 0.6;
  }

  /**
   * Setup canvas context
   */
  private setupCanvas(ctx: any, opts: TableImageOptions): void {
    // Fill background
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Set font
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
  }

  /**
   * Draw table on canvas
   */
  private drawTable(
    ctx: any,
    tableData: string[][],
    dimensions: { width: number; height: number; cellWidths: number[]; rowHeight: number },
    opts: TableImageOptions,
  ): void {
    const startX = opts.padding!;
    const startY = opts.padding! + 40; // Space for title
    
    // Draw title
    ctx.fillStyle = opts.textColor;
    ctx.font = `bold ${opts.fontSize! + 4}px ${opts.fontFamily}`;
    ctx.fillText(`チケット一覧 (${tableData.length - 1}件)`, startX, startY - 20);
    
    // Reset font for table
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    
    let currentY = startY;
    
    tableData.forEach((row, rowIndex) => {
      let currentX = startX;
      
      // Draw row background (header vs data)
      if (rowIndex === 0) {
        ctx.fillStyle = opts.headerBackgroundColor;
        ctx.fillRect(startX, currentY, dimensions.cellWidths.reduce((sum, w) => sum + w, 0), dimensions.rowHeight);
      }
      
      row.forEach((cell, colIndex) => {
        const cellWidth = dimensions.cellWidths[colIndex];
        if (!cellWidth) return; // Skip if cellWidth is undefined
        
        // Draw cell border
        ctx.strokeStyle = opts.borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, cellWidth, dimensions.rowHeight);
        
        // Draw cell text
        ctx.fillStyle = opts.textColor;
        const textX = currentX + opts.cellPadding!;
        const textY = currentY + (dimensions.rowHeight / 2);
        
        // Truncate text if too long
        let displayText = cell;
        const maxWidth = cellWidth - (opts.cellPadding! * 2);
        if (this.measureText(cell, opts.fontSize!, opts.fontFamily!) > maxWidth) {
          displayText = cell.substring(0, Math.floor(maxWidth / (opts.fontSize! * 0.6))) + '...';
        }
        
        ctx.fillText(displayText, textX, textY);
        
        currentX += cellWidth;
      });
      
      currentY += dimensions.rowHeight;
    });
    
    // Draw statistics below table
    if (tableData.length > 1) {
      this.drawStatistics(ctx, tableData.slice(1), startX, currentY + 20, opts);
    }
  }

  /**
   * Draw statistics below the table
   */
  private drawStatistics(
    ctx: any,
    dataRows: string[][],
    startX: number,
    startY: number,
    opts: TableImageOptions,
  ): void {
    ctx.fillStyle = opts.textColor;
    ctx.font = `bold ${opts.fontSize}px ${opts.fontFamily}`;
    ctx.fillText('=== 統計情報 ===', startX, startY);
    
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    
    const totalTickets = dataRows.length;
    const prices = dataRows.map(row => {
      const priceStr = row[2]?.replace('¥', '').replace(',', '') || '0';
      return parseInt(priceStr) || 0;
    });
    const totalRevenue = prices.reduce((sum, price) => sum + price, 0);
    const avgPrice = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;
    
    const stats = [
      `総チケット数: ${totalTickets}件`,
      `総売上予想: ¥${totalRevenue.toLocaleString()}`,
      `平均価格: ¥${avgPrice.toLocaleString()}`,
    ];
    
    stats.forEach((stat, index) => {
      ctx.fillText(stat, startX, startY + 30 + (index * 25));
    });
  }

  /**
   * Generate image with summary statistics
   */
  async generateSummaryImage(
    tickets: TicketResponse[],
    filename: string,
    options: Partial<TableImageOptions> = {},
  ): Promise<string> {
    return this.generateTableImage(tickets, filename, {
      ...options,
      height: 900, // More height for statistics
    });
  }
}
