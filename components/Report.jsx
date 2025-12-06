// src/components/Report.jsx
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

export async function generateReport(
  title,
  headers,
  rows,
  filename,
  subtitle = "",
  reportId = ""
) {
  const doc = new jsPDF();

  // ✅ Load logo from public/logo_trans2.png
  try {
    const logo = await loadImageAsBase64("/logo_trans2.png");
    doc.addImage(logo, "PNG", 14, 10, 20, 20);
  } catch (err) {
    console.warn("⚠️ Logo not loaded:", err.message);
  }

  // 🔹 CINNEX Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CINNEX (Pvt) Ltd", 40, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Golden Taste of Nature", 40, 22);

  // 🔹 Report Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 45);

  // 🔹 Subtitle, Report ID, Generated Date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (subtitle) doc.text(subtitle, 14, 52);
  if (reportId) doc.text("Report ID: " + reportId, 200, 52, { align: "right" });
  doc.text("Generated on: " + new Date().toLocaleString(), 14, 60);

  // 🔹 Table
  autoTable(doc, {
    startY: 80,
    head: [["#", ...headers]],
    body: rows.map((r, i) => [i + 1, ...r]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [218, 165, 32] }, // CINNEX gold
  });

  // 🔹 Footer
  const pageHeight = doc.internal.pageSize.height;

  doc.text("Plantation Manager Signature", 150, pageHeight - 85);
  doc.text("____________________", 150, pageHeight - 90);

  doc.setDrawColor(150);
  doc.line(14, pageHeight - 70, 200, pageHeight - 70);

  const leftX = 14;
  const rightX = 110;
  const baseY = pageHeight - 60;

  doc.setFont("helvetica", "bold");
  doc.text("Our Office:", leftX, baseY);
  doc.text("Business Hours:", rightX, baseY);

  doc.setFont("helvetica", "normal");
  doc.text("117, Sir Chittampalam A Gardinar Mawatha,", leftX, baseY + 5);
  doc.text("Mon - Fri: 8.00 AM - 5.00 PM", rightX, baseY + 5);
  doc.text("Colombo 02, Sri Lanka", leftX, baseY + 10);
  doc.text("Sat - Sun: Closed", rightX, baseY + 10);
  doc.text("cinnex@gmail.com | +94 11 2695279", leftX, baseY + 15);

  doc.setFontSize(9);
  doc.text(
    `© ${new Date().getFullYear()} Cinnex — Golden Taste of Nature. All rights reserved.`,
    14,
    pageHeight - 10
  );

  // Save PDF
  doc.save(filename);
}
