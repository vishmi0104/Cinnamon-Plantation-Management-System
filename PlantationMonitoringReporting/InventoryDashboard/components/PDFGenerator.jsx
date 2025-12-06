import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PDFGenerator = () => {
  const generateInventoryPDF = (inventoryData, reportType = 'comprehensive') => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Modern color scheme
    const primaryColor = '#d87706';
    const secondaryColor = '#b5530a';
    const darkGray = '#374151';
    const lightGray = '#f3f4f6';
    const textColor = '#1f2937';

    // Helper function to convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Add modern header with gradient effect
    const addModernHeader = () => {
      // Background gradient simulation
      const primaryRgb = hexToRgb(primaryColor);
      const secondaryRgb = hexToRgb(secondaryColor);
      
      // Header background
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Gradient effect with overlapping rectangles
      doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setGState(new doc.GState({opacity: 0.7}));
      doc.rect(pageWidth * 0.3, 0, pageWidth * 0.7, 45, 'F');
      doc.setGState(new doc.GState({opacity: 1}));

      // Company logo placeholder (circle with C)
      doc.setFillColor(255, 255, 255);
      doc.circle(25, 22.5, 12, 'F');
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('C', 22, 27);

      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('CINNEX', 45, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Cinnamon Plantation Management System', 45, 28);
      
      // Report title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const reportTitle = reportType === 'comprehensive' ? 'COMPREHENSIVE INVENTORY REPORT' : 'INVENTORY SUMMARY REPORT';
      doc.text(reportTitle, 45, 38);

      // Date and time
      const now = new Date();
      const dateTime = `Generated: ${now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} at ${now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(dateTime, pageWidth - 10, 15, { align: 'right' });

      // Decorative line
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(20, 42, pageWidth - 20, 42);
    };

    // Add modern footer
    const addModernFooter = (pageNum, totalPages) => {
      const y = pageHeight - 15;
      
      // Footer background
      const lightRgb = hexToRgb(lightGray);
      doc.setFillColor(lightRgb.r, lightRgb.g, lightRgb.b);
      doc.rect(0, y - 5, pageWidth, 20, 'F');

      // Footer content
      doc.setTextColor(darkGray);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Left side - Company info
      doc.text('Cinnex Plantation Management | Confidential Report', 20, y + 2);
      
      // Right side - Page number
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, y + 2, { align: 'right' });
      
      // Contact info
      doc.text('Email: info@cinnex.com | Phone: +94 XXX XXX XXX', 20, y + 7);
      
      // Website
      doc.text('www.cinnex.com', pageWidth - 20, y + 7, { align: 'right' });
    };

    // Add executive summary
    const addExecutiveSummary = (data) => {
      let yPos = 55;
      
      // Section title
      doc.setTextColor(darkGray);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', 20, yPos);
      
      // Decorative line under title
      const titleRgb = hexToRgb(primaryColor);
      doc.setDrawColor(titleRgb.r, titleRgb.g, titleRgb.b);
      doc.setLineWidth(2);
      doc.line(20, yPos + 2, 80, yPos + 2);
      
      yPos += 15;

      // Summary metrics in cards
      const totalItems = data.length;
      const totalValue = data.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
      const lowStockItems = data.filter(item => item.status === 'Low Stock').length;
      const categories = [...new Set(data.map(item => item.category))].length;

      // Create metric cards
      const metrics = [
        { label: 'Total Items', value: totalItems.toString(), color: primaryColor },
        { label: 'Total Value', value: `$${totalValue.toFixed(2)}`, color: secondaryColor },
        { label: 'Low Stock Items', value: lowStockItems.toString(), color: '#ef4444' },
        { label: 'Categories', value: categories.toString(), color: '#10b981' }
      ];

      const cardWidth = 40;
      const cardHeight = 25;
      let xPos = 20;

      metrics.forEach((metric, index) => {
        if (index === 2) {
          yPos += 35;
          xPos = 20;
        }

        // Card background
        const metricRgb = hexToRgb(metric.color);
        doc.setFillColor(metricRgb.r, metricRgb.g, metricRgb.b);
        doc.setGState(new doc.GState({opacity: 0.1}));
        doc.rect(xPos, yPos, cardWidth, cardHeight, 'F');
        doc.setGState(new doc.GState({opacity: 1}));

        // Card border
        doc.setDrawColor(metricRgb.r, metricRgb.g, metricRgb.b);
        doc.setLineWidth(0.5);
        doc.rect(xPos, yPos, cardWidth, cardHeight);

        // Metric value
        doc.setTextColor(metric.color);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, xPos + cardWidth/2, yPos + 12, { align: 'center' });

        // Metric label
        doc.setTextColor(darkGray);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, xPos + cardWidth/2, yPos + 20, { align: 'center' });

        xPos += cardWidth + 10;
      });

      return yPos + 45;
    };

    // Add inventory table with modern styling
    const addInventoryTable = (data, startY) => {
      // Section title
      doc.setTextColor(darkGray);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('INVENTORY DETAILS', 20, startY);
      
      // Decorative line under title
      const titleRgb = hexToRgb(primaryColor);
      doc.setDrawColor(titleRgb.r, titleRgb.g, titleRgb.b);
      doc.setLineWidth(2);
      doc.line(20, startY + 2, 80, startY + 2);

      // Prepare table data
      const tableData = data.map(item => [
        item.itemId || 'N/A',
        item.name || 'N/A',
        item.category || 'N/A',
        `${item.quantity || 0} ${item.unit || ''}`,
        `$${(item.price || 0).toFixed(2)}`,
        `$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`,
        item.status || 'N/A',
        item.supplier || 'N/A'
      ]);

      // Modern table styling
      const primaryRgb = hexToRgb(primaryColor);
      const secondaryRgb = hexToRgb(secondaryColor);
      
      doc.autoTable({
        head: [['Item ID', 'Name', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status', 'Supplier']],
        body: tableData,
        startY: startY + 10,
        margin: { left: 20, right: 20 },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: [31, 41, 55],
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          cellPadding: 6,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Item ID
          1: { cellWidth: 30 }, // Name
          2: { cellWidth: 20 }, // Category
          3: { cellWidth: 20 }, // Quantity
          4: { cellWidth: 20 }, // Unit Price
          5: { cellWidth: 25 }, // Total Value
          6: { cellWidth: 20 }, // Status
          7: { cellWidth: 25 }, // Supplier
        },
        didParseCell: function(data) {
          // Color code status column
          if (data.column.index === 6) { // Status column
            const status = data.cell.text[0];
            if (status === 'Low Stock') {
              data.cell.styles.textColor = [239, 68, 68]; // Red
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Available') {
              data.cell.styles.textColor = [16, 185, 129]; // Green
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Out of Stock') {
              data.cell.styles.textColor = [239, 68, 68]; // Red
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      return doc.lastAutoTable.finalY + 20;
    };

    // Add category breakdown chart (text-based)
    const addCategoryBreakdown = (data, startY) => {
      // Section title
      doc.setTextColor(darkGray);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CATEGORY BREAKDOWN', 20, startY);
      
      // Decorative line under title
      const titleRgb = hexToRgb(primaryColor);
      doc.setDrawColor(titleRgb.r, titleRgb.g, titleRgb.b);
      doc.setLineWidth(2);
      doc.line(20, startY + 2, 95, startY + 2);

      let yPos = startY + 15;

      // Calculate category statistics
      const categoryStats = {};
      data.forEach(item => {
        const category = item.category || 'Unknown';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, value: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].value += (item.price || 0) * (item.quantity || 0);
      });

      // Display category information
      Object.entries(categoryStats).forEach(([category, stats]) => {
        const percentage = ((stats.count / data.length) * 100).toFixed(1);
        
        // Category name
        doc.setTextColor(darkGray);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(category.toUpperCase(), 25, yPos);
        
        // Statistics
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Items: ${stats.count} (${percentage}%)`, 25, yPos + 6);
        doc.text(`Total Value: $${stats.value.toFixed(2)}`, 25, yPos + 12);
        
        // Visual bar
        const barWidth = 100;
        const barHeight = 4;
        const fillWidth = (stats.count / data.length) * barWidth;
        
        // Bar background
        doc.setFillColor(240, 240, 240);
        doc.rect(25, yPos + 15, barWidth, barHeight, 'F');
        
        // Bar fill
        const primaryRgb = hexToRgb(primaryColor);
        doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.rect(25, yPos + 15, fillWidth, barHeight, 'F');
        
        yPos += 25;
      });

      return yPos + 10;
    };

    // Add recommendations section
    const addRecommendations = (data, startY) => {
      // Section title
      doc.setTextColor(darkGray);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMMENDATIONS & INSIGHTS', 20, startY);
      
      // Decorative line under title
      const titleRgb = hexToRgb(primaryColor);
      doc.setDrawColor(titleRgb.r, titleRgb.g, titleRgb.b);
      doc.setLineWidth(2);
      doc.line(20, startY + 2, 120, startY + 2);

      let yPos = startY + 15;

      // Generate smart recommendations
      const recommendations = [];
      
      const lowStockItems = data.filter(item => item.status === 'Low Stock');
      const outOfStockItems = data.filter(item => item.status === 'Out of Stock');
      const highValueItems = data.filter(item => (item.price || 0) * (item.quantity || 0) > 1000);
      
      if (lowStockItems.length > 0) {
        recommendations.push({
          type: 'warning',
          title: 'Stock Level Alert',
          message: `${lowStockItems.length} items are running low on stock. Consider reordering to avoid stockouts.`
        });
      }
      
      if (outOfStockItems.length > 0) {
        recommendations.push({
          type: 'critical',
          title: 'Critical Stock Alert',
          message: `${outOfStockItems.length} items are out of stock. Immediate restocking required.`
        });
      }
      
      if (highValueItems.length > 0) {
        recommendations.push({
          type: 'info',
          title: 'High Value Inventory',
          message: `${highValueItems.length} items have high total value. Ensure proper security and monitoring.`
        });
      }
      
      recommendations.push({
        type: 'success',
        title: 'Inventory Performance',
        message: `Total inventory value: $${data.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0).toFixed(2)}. Regular monitoring recommended.`
      });

      // Display recommendations
      recommendations.forEach((rec, index) => {
        // Icon and title
        let iconColor, icon;
        switch (rec.type) {
          case 'warning':
            iconColor = '#f59e0b';
            icon = '⚠';
            break;
          case 'critical':
            iconColor = '#ef4444';
            icon = '🚨';
            break;
          case 'info':
            iconColor = '#3b82f6';
            icon = 'ℹ';
            break;
          default:
            iconColor = '#10b981';
            icon = '✓';
        }
        
        // Icon
        doc.setTextColor(iconColor);
        doc.setFontSize(14);
        doc.text(icon, 22, yPos);
        
        // Title
        doc.setTextColor(darkGray);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(rec.title, 30, yPos);
        
        // Message
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitMessage = doc.splitTextToSize(rec.message, pageWidth - 50);
        doc.text(splitMessage, 30, yPos + 5);
        
        yPos += 15 + (splitMessage.length - 1) * 4;
      });

      return yPos + 10;
    };

    // Main PDF generation
    let currentY = 0;
    
    // Add header
    addModernHeader();
    
    // Add executive summary
    currentY = addExecutiveSummary(inventoryData);
    
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add inventory table
    currentY = addInventoryTable(inventoryData, currentY);
    
    // Check if we need a new page for category breakdown
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add category breakdown
    currentY = addCategoryBreakdown(inventoryData, currentY);
    
    // Check if we need a new page for recommendations
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add recommendations
    addRecommendations(inventoryData, currentY);
    
    // Add footer to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addModernFooter(i, totalPages);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Cinnex_Inventory_Report_${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);
  };

  return { generateInventoryPDF };
};

export default PDFGenerator;