// src/components/ModernReportGenerator.jsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 🔹 Helper: load an image from /public and return as Base64
async function loadImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch logo: " + url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function generateModernReport(
  title,
  headers,
  rows,
  filename,
  subtitle = "",
  reportId = ""
) {
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Modern color scheme - Orange gradients
  const primaryColor = [216, 119, 6]; // #d87706
  const secondaryColor = [181, 83, 10]; // #b5530a
  const accentColor = [255, 255, 255]; // White
  const textColor = [31, 41, 55]; // Dark gray

  // ✅ Load logo from public/logo_trans2.png
  let logo = null;
  try {
    logo = await loadImageAsBase64("/logo_trans2.png");
  } catch (err) {
    console.warn("⚠️ Logo not loaded:", err.message);
  }

  // Modern Header Section with gradient background simulation
  // Draw header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Add subtle pattern
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2], 0.1);
  for (let i = 0; i < pageWidth; i += 10) {
    doc.circle(i, 25, 2, 'F');
  }

  // Logo
  if (logo) {
    doc.addImage(logo, "PNG", 14, 10, 30, 30);
  }

  // Company Name with modern typography
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("CINNEX (Pvt) Ltd", 50, 20);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Golden Taste of Nature", 50, 30);

  // Decorative line
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(2);
  doc.line(50, 35, pageWidth - 14, 35);

  // Report Title Section
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 70);

  // Subtitle and metadata
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let yPos = 80;
  if (subtitle) {
    doc.text(subtitle, 14, yPos);
    yPos += 8;
  }

  // Report ID and date in a modern box
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 15, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(14, yPos, pageWidth - 28, 15);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  if (reportId) {
    doc.text(`Report ID: ${reportId}`, 18, yPos + 6);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 18, yPos + 11);
  } else {
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 18, yPos + 8);
  }

  yPos += 25;

  // Modern Table with enhanced styling
  autoTable(doc, {
    startY: yPos,
    head: [["#", ...headers]],
    body: rows.map((r, i) => [i + 1, ...r]),
    styles: {
      fontSize: 11,
      cellPadding: 8,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: accentColor,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: textColor,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // Index column
    },
    margin: { top: 10, left: 14, right: 14 },
  });

  // Modern Footer Section
  const footerY = pageHeight - 80;

  // Signature section with modern styling
  doc.setFillColor(245, 245, 245);
  doc.rect(120, footerY, 70, 25, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.rect(120, footerY, 70, 25);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Plantation Manager", 125, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("Signature", 125, footerY + 13);
  doc.setDrawColor(100, 100, 100);
  doc.line(125, footerY + 18, 185, footerY + 18);

  // Contact Information in modern layout
  const contactY = footerY + 35;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Contact Information", 14, contactY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("117, Sir Chittampalam A. Gardiner Mawatha", 14, contactY + 8);
  doc.text("Colombo 02, Sri Lanka", 14, contactY + 13);
  doc.text("Email: cinnex@gmail.com | Phone: +94 11 2695279", 14, contactY + 18);

  // Business hours
  doc.setFont("helvetica", "bold");
  doc.text("Business Hours:", 120, contactY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("Mon - Fri: 8:00 AM - 5:00 PM", 120, contactY + 13);
  doc.text("Sat - Sun: Closed", 120, contactY + 18);

  // Copyright with modern styling
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`© ${new Date().getFullYear()} Cinnex (Pvt) Ltd — Golden Taste of Nature. All rights reserved.`, 14, pageHeight - 10);

  // Save the modern PDF
  doc.save(filename);
}