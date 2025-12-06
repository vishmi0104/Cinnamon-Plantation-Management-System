import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
  postWithRetry,
  putWithRetry,
  deleteWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaFilePdf, FaPlus, FaEdit, FaTrash, FaSearch, FaReply, FaEye, FaUserMd, FaCheckCircle, FaTimes, FaHeadset, FaChartLine, FaShieldAlt, FaSignOutAlt, FaExclamationTriangle, FaStar, FaLightbulb, FaCertificate, FaTools, FaSeedling } from "react-icons/fa";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DeliveryIssuesSupportPanel from './DeliveryIssuesSupportPanel';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isResponseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [responseFormData, setResponseFormData] = useState({
    responseText: "",
    expertiseLevel: "moderate",
    responseCategory: "",
    responseUrgency: "medium",
    followUpRequired: false,
    recommendedProducts: "",
  });
  const [errors, setErrors] = useState({});
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationProgress, setValidationProgress] = useState(0);

  const fetchData = async () => {
    try {
      const [iRes, rRes] = await Promise.all([
        getWithRetry("/issues", 3),
        getWithRetry("/responses", 3),
      ]);
      setIssues(iRes.data);
      setResponses(rRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch:", err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await fetchData();
      } catch {
        setTimeout(fetchData, 1000);
      }
    })();
  }, []);

  const handleAddResponse = (issue) => {
    setSelectedIssue(issue);
    // Set default response category based on issue type
    let defaultCategory = "";
    if (issue.issueType === "Pest") defaultCategory = "pest-control";
    if (issue.issueType === "Disease") defaultCategory = "disease-treatment";
    if (issue.issueType === "Soil Problem") defaultCategory = "soil-management";
    if (issue.issueType === "Water Stress") defaultCategory = "irrigation";

    setResponseFormData({ 
      responseText: "", 
      expertiseLevel: "moderate",
      responseCategory: defaultCategory,
      responseUrgency: "medium",
      followUpRequired: false,
      recommendedProducts: "",
    });
    setValidationProgress(0);
    setResponseModalOpen(true);
  };

  const handleEditResponse = (response) => {
    setSelectedIssue(response.issueId);
    // For existing responses, maintain backward compatibility by adding default values for new fields
    setResponseFormData({ 
      responseText: response.responseText, 
      _id: response._id,
      expertiseLevel: response.expertiseLevel || "moderate",
      responseCategory: response.responseCategory || "",
      responseUrgency: response.responseUrgency || "medium",
      followUpRequired: response.followUpRequired || false,
      recommendedProducts: response.recommendedProducts || "",
    });
    updateValidationProgress(response.responseText, response.responseCategory || "");
    setResponseModalOpen(true);
  };

  // Function to update validation progress
  const updateValidationProgress = (text, category) => {
    let progress = 0;
    
    // Check text length - contributes 50% of validation score
    if (text && text.trim().length > 0) {
      if (text.trim().length >= 10) progress += 15;
      if (text.trim().length >= 50) progress += 15;
      if (text.trim().length >= 100) progress += 20;
    }
    
    // Check if category is selected - contributes 30% of validation score
    if (category && category.trim() !== "") {
      progress += 30;
    }
    
    // Check for recommended products - contributes 20% of validation score
    if (responseFormData.recommendedProducts && responseFormData.recommendedProducts.trim().length > 0) {
      progress += 20;
    }
    
    setValidationProgress(progress);
  };

  const handleSaveResponse = async () => {
    const newErrors = {};
    
    // Enhanced validation
    if (!responseFormData.responseText.trim()) {
      newErrors.responseText = "⚠️ Response text is required";
    } else if (responseFormData.responseText.length < 10) {
      newErrors.responseText = "⚠️ Response text must be at least 10 characters for clarity";
    }
    
    if (!responseFormData.responseCategory) {
      newErrors.responseCategory = "⚠️ Please select a response category";
    }
    
    if (responseFormData.expertiseLevel === "high" && responseFormData.responseText.length < 50) {
      newErrors.expertiseLevel = "⚠️ High expertise responses should be more detailed (min 50 chars)";
    }
    
    if (responseFormData.responseUrgency === "high" && !responseFormData.followUpRequired) {
      newErrors.followUp = "⚠️ High urgency issues typically require follow-up";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // Generate concise but meaningful response text from form data
      const generateResponseText = (formData) => {
        const categoryLabels = {
          'pest-control': 'Pest Control',
          'disease-treatment': 'Disease Treatment',
          'soil-management': 'Soil Management',
          'irrigation': 'Water Management',
          'fertilization': 'Fertilization',
          'harvesting': 'Harvesting Techniques',
          'quality-control': 'Quality Control',
          'general': 'General Guidance'
        };

        const expertiseLevels = {
          'basic': 'Agricultural Technician',
          'moderate': 'Agricultural Specialist',
          'high': 'Senior Expert'
        };

        // Core recommendations by category
        const categoryRecommendations = {
          'pest-control': `Key actions: 1) Implement IPM combining cultural and biological controls. 2) Regular field monitoring of pest populations. 3) Use biological controls first; chemical treatments as last resort. 4) Maintain field sanitation.`,
          
          'disease-treatment': `Key actions: 1) Isolate affected plants immediately. 2) Improve ventilation and reduce humidity. 3) Apply appropriate fungicides based on disease type. 4) Implement preventive measures.`,
          
          'soil-management': `Key actions: 1) Conduct comprehensive soil testing. 2) Adjust soil pH as needed. 3) Add organic matter to improve structure. 4) Implement conservation practices.`,
          
          'irrigation': `Key actions: 1) Install efficient irrigation system. 2) Monitor soil moisture regularly. 3) Schedule irrigation based on crop needs. 4) Maintain equipment properly.`,
          
          'fertilization': `Key actions: 1) Base applications on soil tests. 2) Use split applications for efficiency. 3) Choose appropriate fertilizer types. 4) Monitor crop response.`,
          
          'harvesting': `Key actions: 1) Monitor crop maturity carefully. 2) Use proper harvesting techniques. 3) Implement post-harvest handling protocols. 4) Maintain quality standards.`,
          
          'quality-control': `Key actions: 1) Establish clear quality standards. 2) Regular inspections throughout process. 3) Train staff on procedures. 4) Maintain detailed records.`,
          
          'general': `Key actions: 1) Monitor crop health regularly. 2) Maintain accurate records. 3) Follow best practices. 4) Seek expert guidance when needed.`
        };

        let response = `[${expertiseLevels[formData.expertiseLevel]} Consultation]\n\n`;
        response += `Category: ${categoryLabels[formData.responseCategory]}\n`;
        response += `Priority: ${formData.responseUrgency.toUpperCase()}\n`;
        
        // Add recommendations
        response += `\n${categoryRecommendations[formData.responseCategory]}\n`;
        
        // Add timeline
        response += `\nTimeline: `;
        if (formData.responseUrgency === 'high') {
          response += 'Begin implementation within 24 hours. Monitor daily.';
        } else if (formData.responseUrgency === 'medium') {
          response += 'Implement within 3-5 days. Regular monitoring.';
        } else {
          response += 'Plan and implement as convenient. Monitor periodically.';
        }

        // Add follow-up note
        response += `\n\nFollow-up: ${formData.followUpRequired ? 'Required - Schedule regular assessments' : 'Optional - Monitor as needed'}.`;

        // Add products if specified
        if (formData.recommendedProducts && formData.recommendedProducts.trim()) {
          response += `\n\nRecommended Products: ${formData.recommendedProducts}`;
          response += `\nSafety Note: Follow all product labels and safety guidelines.`;
        }

        response += `\n\nCinnex Agricultural Support Services`;

        return response;
      };

      const responseText = generateResponseText(responseFormData);

      if (responseFormData._id) {
        await putWithRetry(`/responses/${responseFormData._id}`, {
          responseText: responseFormData.responseText,
          expertiseLevel: responseFormData.expertiseLevel,
          responseCategory: responseFormData.responseCategory,
          responseUrgency: responseFormData.responseUrgency,
          followUpRequired: responseFormData.followUpRequired,
          recommendedProducts: responseFormData.recommendedProducts,
        });
      } else {
        await postWithRetry("/responses", {
          issueId: selectedIssue._id,
          responseText: responseFormData.responseText,
          expertiseLevel: responseFormData.expertiseLevel,
          responseCategory: responseFormData.responseCategory,
          responseUrgency: responseFormData.responseUrgency,
          followUpRequired: responseFormData.followUpRequired,
          recommendedProducts: responseFormData.recommendedProducts,
        });
      }
      await fetchData();
      setResponseModalOpen(false);
      setResponseFormData({ 
        responseText: "",
        expertiseLevel: "moderate",
        responseCategory: "",
        responseUrgency: "medium",
        followUpRequired: false,
        recommendedProducts: "",
      });
      setErrors({});
      setSuccessMessage('Expert response saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error saving response:", err.response?.data || err.message);
      setErrors({ submit: err.response?.data?.error || "Failed to save response" });
    }
  };

  const handleDeleteResponse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;
    try {
      await deleteWithRetry(`/responses/${id}`);
      await fetchData();
      setSuccessMessage('Response deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error deleting response:", err);
      setErrors({ submit: 'Failed to delete response. Please try again.' });
      setTimeout(() => setErrors({}), 3000);
    }
  };

  const handleReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load logo
    try {
      const logoResponse = await fetch('/logo_trans2.png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
      }
    } catch (err) {
      console.warn('Logo not loaded:', err.message);
    }

    // Modern Header Design
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 150, 243); // Modern blue
    doc.text('CINNEX (Pvt) Ltd', 45, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(96, 125, 139); // Blue grey
    doc.text('Expert Support & Consultation Services', 45, 28);

    // Professional Report Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Support Dashboard Analytics Report', 14, 50);

    // Metadata section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(117, 117, 117);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 60);
    doc.text(`Total Issues: ${issues.length} | Responses: ${responses.length}`, 14, 67);

    // Executive Summary Card
    doc.setFillColor(245, 247, 250); // Light blue background
    doc.setDrawColor(229, 231, 235); // Border
    doc.roundedRect(14, 75, pageWidth - 28, 45, 3, 3, 'DF');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // Indigo
    doc.text('EXECUTIVE SUMMARY', 20, 87);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81); // Gray

    // Calculate metrics
    const openIssues = issues.filter(i => i.status === 'Open').length;
    const closedIssues = issues.filter(i => i.status === 'Closed').length;
    const responseRate = issues.length > 0 ? ((responses.length / issues.length) * 100).toFixed(1) : 0;
    const avgResponseTime = "2.4 days"; // Placeholder - could be calculated from actual data
    
    const issuesByType = {
      'Pest': issues.filter(i => i.issueType === 'Pest').length,
      'Disease': issues.filter(i => i.issueType === 'Disease').length,
      'Soil Problem': issues.filter(i => i.issueType === 'Soil Problem').length,
      'Water Stress': issues.filter(i => i.issueType === 'Water Stress').length,
      'Other': issues.filter(i => i.issueType === 'Other').length
    };

    // Add Executive Summary metrics to PDF
    doc.text(`• Active Issues: ${openIssues} open, ${closedIssues} resolved`, 20, 97);
    doc.text(`• Response Coverage: ${responseRate}% (${responses.length} responses for ${issues.length} issues)`, 20, 104);
    doc.text(`• Average Response Time: ${avgResponseTime}`, 20, 111);

    let yPosition = 130;

    // Issue Type Distribution
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('ISSUE TYPE ANALYSIS', 14, yPosition);
    yPosition += 15;

    const issueTypeData = Object.entries(issuesByType)
      .filter(([type, count]) => count > 0)
      .map(([type, count]) => [
        type,
        count.toString(),
        `${((count / issues.length) * 100).toFixed(1)}%`,
        count > 3 ? 'High Priority' : count > 1 ? 'Medium' : 'Low'
      ]);

    if (issueTypeData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Issue Type', 'Count', 'Percentage', 'Priority Level']],
        body: issueTypeData,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [251, 146, 60], // Orange
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [254, 243, 199] },
        margin: { left: 14, right: 14 },
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Recent Issues (Top 10)
    if (issues.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 69, 19);
      doc.text('RECENT ISSUES OVERVIEW', 14, yPosition);
      yPosition += 15;

      const recentIssues = issues
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(issue => {
          const issueResponses = responses.filter(r => r.issueId && r.issueId._id === issue._id);
          return [
            `#${issue.plantIssueid}`,
            `Plot ${issue.plotid}`,
            issue.issueType,
            issue.status,
            issueResponses.length.toString(),
            new Date(issue.createdAt).toLocaleDateString()
          ];
        });

      autoTable(doc, {
        startY: yPosition,
        head: [['Issue ID', 'Plot', 'Type', 'Status', 'Responses', 'Date']],
        body: recentIssues,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [16, 185, 129], // Emerald
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [236, 253, 245] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }
    // Expert Responses Summary
    if (responses.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 69, 19);
      doc.text('EXPERT CONSULTATION RESPONSES', 14, yPosition);
      yPosition += 15;

      const recentResponses = responses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)
        .map(response => [
          `#${response.issueId?.plantIssueid || 'N/A'}`,
          `Plot ${response.issueId?.plotid || 'N/A'}`,
          response.issueId?.issueType || 'N/A',
          response.responseText.length > 50 ? response.responseText.substring(0, 50) + '...' : response.responseText,
          new Date(response.createdAt).toLocaleDateString()
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Issue ID', 'Plot', 'Type', 'Response Summary', 'Date']],
        body: recentResponses,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [168, 85, 247], // Purple
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 60 },
          4: { cellWidth: 25 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // Recommendations Section
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('EXPERT RECOMMENDATIONS', 14, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    const recommendations = [];
    
    if (openIssues > 5) {
      recommendations.push('• PRIORITY: High volume of open issues requires immediate attention and resource allocation');
    }
    if (responseRate < 80) {
      recommendations.push('• Increase response coverage - aim for 80%+ response rate to ensure comprehensive support');
    }
    if (issuesByType['Disease'] > issuesByType['Pest']) {
      recommendations.push('• Focus on disease prevention protocols - disease issues are trending higher than pest issues');
    }
    if (issuesByType['Soil Problem'] > 2) {
      recommendations.push('• Implement soil health monitoring program to address recurring soil-related concerns');
    }
    if (responses.length < issues.length * 0.5) {
      recommendations.push('• Enhance expert consultation capacity to improve response times and coverage');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• Excellent performance across all metrics - maintain current support protocols');
      recommendations.push('• Consider implementing proactive monitoring to prevent issues before they occur');
    }

    recommendations.forEach((rec, index) => {
      doc.text(rec, 14, yPosition + (index * 7));
    });

    // Professional Footer
    const footerY = pageHeight - 35;
    doc.setDrawColor(229, 231, 235);
    doc.line(14, footerY, pageWidth - 14, footerY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);

    // Left side footer
    doc.text('CINNEX (Pvt) Ltd - Expert Agricultural Support Division', 14, footerY + 8);
    doc.text('117, Sir Chittampalam A Gardinar Mawatha, Colombo 02, Sri Lanka', 14, footerY + 14);
    doc.text('Email: support@cinnex.lk | Phone: +94 11 2695279', 14, footerY + 20);

    // Signature section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Authorized Signature:', 14, footerY + 30);
    doc.line(50, footerY + 35, 120, footerY + 35); // Signature line

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Expert Support Manager', 14, footerY + 42);
    // Right side footer
    doc.text('Confidential Support Analytics Report', pageWidth - 14, footerY + 8, { align: 'right' });
    doc.text(`Page ${doc.internal.getNumberOfPages()} | Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, footerY + 14, { align: 'right' });
    doc.text('© 2025 Cinnex - Professional Plantation Management', pageWidth - 14, footerY + 20, { align: 'right' });

    // Save the PDF
    const filename = `SupportDashboard_Analytics_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const toggleExpanded = (issueId) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const filteredIssues = issues.filter(
    (i) =>
      i.plantIssueid?.toLowerCase().includes(search.toLowerCase()) ||
      i.plotid?.toString().includes(search) ||
      i.issueType?.toLowerCase().includes(search.toLowerCase())
  ).filter((i) => {
    if (statusFilter === "all") return true;
    return i.status === statusFilter;
  }).filter((i) => {
    if (issueTypeFilter === "all") return true;
    return i.issueType === issueTypeFilter;
  }).filter((i) => {
    if (responseFilter === "all") return true;
    const issueResponses = responses.filter((r) => r.issueId && r.issueId._id === i._id);
    if (responseFilter === "has-responses") return issueResponses.length > 0;
    if (responseFilter === "no-responses") return issueResponses.length === 0;
    return true;
  }).filter((i) => {
    if (dateFilter === "all") return true;
    const issueDate = new Date(i.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - issueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dateFilter === "today") return diffDays === 1;
    if (dateFilter === "week") return diffDays <= 7;
    if (dateFilter === "month") return diffDays <= 30;
    return true;
  });

  const getStatusColor = (status) => {
    return status === "Open"
      ? "bg-red-100 text-red-800"
      : "bg-orange-100 text-orange-800";
  };

  const getIssueTypeColor = (type) => {
    const colors = {
      Pest: "bg-orange-100 text-orange-800",
      Disease: "bg-red-100 text-red-800",
      "Soil Problem": "bg-yellow-100 text-yellow-800",
      "Water Stress": "bg-orange-100 text-orange-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        
        {/* Modern Professional Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-xl border-b border-amber-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl blur-sm opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl shadow-xl">
                    <FaHeadset className="text-white text-3xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                    Expert Support Center
                  </h1>
                  <p className="text-slate-600 font-medium mt-1">Professional consultation & expert guidance platform</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Quick Stats */}
                <div className="hidden lg:flex items-center gap-4 mr-6">
                  <div className="text-center px-4 py-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Issues</p>
                    <p className="text-xl font-bold text-amber-600">{issues.length}</p>
                  </div>
                  <div className="text-center px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Responses</p>
                    <p className="text-xl font-bold text-orange-600">{responses.length}</p>
                  </div>
                  <div className="text-center px-4 py-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Coverage</p>
                    <p className="text-xl font-bold text-amber-600">
                      {issues.length > 0 ? Math.round((responses.length / issues.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <FaSignOutAlt className="text-sm" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <FaCheckCircle className="text-emerald-600 text-lg" />
                </div>
                <p className="text-emerald-800 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Delivery Issues Support Panel */}
          <DeliveryIssuesSupportPanel />
          {/* Dashboard Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Issues Card */}
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-lg border border-amber-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider">Total Issues</p>
                  <p className="text-3xl font-bold text-amber-600">{issues.length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <p className="text-xs text-amber-800">Plantation concerns</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors shadow-sm">
                  <FaShieldAlt className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Expert Responses Card */}
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider">Expert Responses</p>
                  <p className="text-3xl font-bold text-orange-600">{responses.length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <p className="text-xs text-orange-800">Professional guidance</p>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors shadow-sm">
                  <FaUserMd className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Open Issues Card */}
            <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl shadow-lg border border-rose-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider">Open Issues</p>
                  <p className="text-3xl font-bold text-rose-600">{issues.filter(i => i.status === 'Open').length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                    <p className="text-xs text-rose-800">Require attention</p>
                  </div>
                </div>
                <div className="p-3 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors shadow-sm">
                  <FaReply className="text-rose-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Response Coverage Card */}
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-lg border border-amber-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider">Coverage Rate</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {issues.length > 0 ? Math.round((responses.length / issues.length) * 100) : 0}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <p className="text-xs text-amber-800">Expert coverage</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors shadow-sm">
                  <FaChartLine className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Responses Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-100 p-6 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 -m-6 mb-6 p-6 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                    <FaUserMd className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Expert Consultation Hub</h2>
                    <p className="text-amber-100">Professional guidance and expert recommendations</p>
                  </div>
                </div>
                <div className="bg-amber-400/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{responses.length}</p>
                    <p className="text-xs text-purple-100">Total Responses</p>
                  </div>
                </div>
              </div>
            </div>

            </div>

            {responses.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaReply className="text-purple-500 text-2xl" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Expert Responses Yet</h3>
                <p className="text-slate-600 text-sm">Professional consultation responses will appear here once experts provide guidance</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {responses.slice(0, 6).map((response) => (
                  <div key={response._id} className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl border border-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FaUserMd className="text-purple-600 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            Issue: {response.issueId?.plantIssueid || 'Unknown Issue'}
                          </h4>
                          <span className="text-xs text-slate-500 bg-white/80 px-2 py-1 rounded-lg border border-slate-200">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed mb-4 line-clamp-3">
                          {response.responseText}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">Plot {response.issueId?.plotid || 'N/A'}</span>
                            <span className={`text-xs px-2 py-1 rounded ${getIssueTypeColor(response.issueId?.issueType)}`}>
                              {response.issueId?.issueType || 'Other'}
                            </span>
                            {response.issueId?.reportedBy && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {response.issueId.reportedBy === 1 ? 'Factory Mgr' : `User ${response.issueId.reportedBy}`}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditResponse(response)}
                              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
                              title="Edit Response"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDeleteResponse(response._id)}
                              className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200"
                              title="Delete Response"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {responses.length > 6 && (
              <div className="mt-6 text-center">
                <p className="text-slate-600 text-sm">
                  Showing 6 of {responses.length} responses. View complete details in the issues section below.
                </p>
              </div>
            )}
          </div>

          {/* Modern Controls Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
            <div className="flex flex-col gap-6">
              {/* Search and Report Row */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <div className="relative flex-1 max-w-2xl">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Search & Filter</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-500 bg-indigo-100 p-1.5 rounded-lg">
                      <FaSearch className="text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search plantation issues, responses, consultations..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/80 hover:bg-white transition-all duration-200 text-slate-900 placeholder-slate-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleReport}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200"
                  >
                    <FaFilePdf className="text-white/90" />
                    <span>Export Analytics</span>
                  </button>
                </div>
              </div>

              {/* Advanced Filters Row */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <FaSearch className="text-indigo-500 text-xs" />
                  </div>
                  <span>Advanced Filters:</span>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all duration-200 text-sm bg-white font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="Open">🔴 Open Issues</option>
                  <option value="Closed">✅ Resolved Issues</option>
                </select>

                {/* Issue Type Filter */}
                <select
                  value={issueTypeFilter}
                  onChange={(e) => setIssueTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all duration-200 text-sm bg-white font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="Pest">🐛 Pest Issues</option>
                  <option value="Disease">🦠 Disease Problems</option>
                  <option value="Soil Problem">🌱 Soil Issues</option>
                  <option value="Water Stress">💧 Water Stress</option>
                  <option value="Other">📋 Other</option>
                </select>

                {/* Response Filter */}
                <select
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all duration-200 text-sm bg-white font-medium"
                >
                  <option value="all">All Issues</option>
                  <option value="has-responses">✅ Has Expert Responses</option>
                  <option value="no-responses">⏳ Awaiting Response</option>
                </select>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all duration-200 text-sm bg-white font-medium"
                >
                  <option value="all">All Time</option>
                  <option value="today">📅 Today</option>
                  <option value="week">📊 This Week</option>
                  <option value="month">📈 This Month</option>
                </select>

                {/* Clear Filters Button */}
                {(statusFilter !== "all" || issueTypeFilter !== "all" || responseFilter !== "all" || dateFilter !== "all") && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setIssueTypeFilter("all");
                      setResponseFilter("all");
                      setDateFilter("all");
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-200 text-sm flex items-center gap-2 shadow-sm"
                  >
                    <FaTimes className="text-xs" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Filter Results Summary */}
              <div className="flex items-center justify-between text-sm text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4">
                  <span>Displaying <strong className="text-amber-600">{filteredIssues.length}</strong> of <strong className="text-slate-800">{issues.length}</strong> issues</span>
                  {(statusFilter !== "all" || issueTypeFilter !== "all" || responseFilter !== "all" || dateFilter !== "all") && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-medium">Active filters:</span>
                      <div className="flex flex-wrap gap-1">
                        {statusFilter !== "all" && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-medium">
                            Status: {statusFilter}
                          </span>
                        )}
                        {issueTypeFilter !== "all" && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-medium">
                            Type: {issueTypeFilter}
                          </span>
                        )}
                        {responseFilter !== "all" && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
                            {responseFilter === "has-responses" ? "Has Responses" : "No Responses"}
                          </span>
                        )}
                        {dateFilter !== "all" && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-medium">
                            {dateFilter === "today" ? "Today" :
                             dateFilter === "week" ? "This Week" :
                             "This Month"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modern Issues Grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredIssues.map((issue) => {
              const issueResponses = responses.filter((r) => r.issueId && r.issueId._id === issue._id);
              const isExpanded = expandedIssue === issue._id;

              return (
                <div key={issue._id} className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    {/* Issue Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{issue.plantIssueid}</h3>
                        <p className="text-sm text-slate-600 font-medium">Plot {issue.plotid}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(issue.status)}`}>
                          {issue.status === 'Open' ? '🔴' : '✅'} {issue.status}
                        </span>
                      </div>
                    </div>

                    {/* Issue Type & Reporter */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${getIssueTypeColor(issue.issueType)}`}>
                        {issue.issueType === 'Pest' ? '🐛' : 
                         issue.issueType === 'Disease' ? '🦠' :
                         issue.issueType === 'Soil Problem' ? '🌱' :
                         issue.issueType === 'Water Stress' ? '💧' : '📋'} {issue.issueType}
                      </span>
                      {issue.reportedBy && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold shadow-sm">
                          👤 {issue.reportedBy === 1 ? 'Factory Manager' : `Reporter ${issue.reportedBy}`}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-slate-700 text-sm mb-6 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">{issue.description}</p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Add Response Button */}
                      <button
                        onClick={() => handleAddResponse(issue)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <FaReply className="text-xs" />
                        <span>Add Expert Response</span>
                      </button>

                      {/* View Responses Button */}
                      <button
                        onClick={() => toggleExpanded(issue._id)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 transform hover:scale-105 ${
                          issueResponses.length > 0
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                            : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 border border-slate-300'
                        }`}
                      >
                        <FaEye className="text-xs" />
                        <span>{issueResponses.length} Response{issueResponses.length !== 1 ? 's' : ''}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Responses Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-purple-50/30 px-6 py-4">
                      {issueResponses.length === 0 ? (
                        <div className="py-8 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-purple-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                            <FaReply className="text-slate-500 text-lg" />
                          </div>
                          <p className="text-slate-600 text-sm font-medium">No expert responses yet</p>
                          <p className="text-slate-500 text-xs mt-1">Awaiting professional consultation</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {issueResponses.map((resp) => (
                            <div key={resp._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                  <FaUserMd className="text-purple-600 text-xs" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-700 text-sm leading-relaxed mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100">{resp.responseText}</p>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                                      📅 {new Date(resp.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEditResponse(resp)}
                                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
                                        title="Edit Response"
                                      >
                                        <FaEdit className="text-xs" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteResponse(resp._id)}
                                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                        title="Delete Response"
                                      >
                                        <FaTrash className="text-xs" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredIssues.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaSearch className="text-slate-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Issues Found</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">Try adjusting your search criteria or clear the active filters to see more results</p>
            </div>
          )}
        </div>

        {/* Enhanced Expert Response Modal */}
        {isResponseModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-4xl w-full shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              {/* Modal Header with Gradient Background */}
              <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-t-3xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <FaUserMd className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {responseFormData._id ? "Edit Expert Consultation" : "New Expert Consultation"}
                      </h2>
                      <p className="text-amber-100 font-medium">Professional agricultural guidance & recommendations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResponseModalOpen(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
                  >
                    <FaTimes className="text-white text-lg" />
                  </button>
                </div>
              </div>
              
              <div className="p-8">
                {/* Validation Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Form Completion</h3>
                    <span className="text-sm font-medium text-amber-700">{validationProgress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        validationProgress < 30 ? 'bg-rose-500' :
                        validationProgress < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${validationProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {validationProgress < 30 ? 'More details needed for a professional response' :
                     validationProgress < 70 ? 'Good progress, add more details for better guidance' :
                     'Excellent, your response is comprehensive'}
                  </p>
                </div>
                {/* Issue Details Card */}
                <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <FaExclamationTriangle className="text-amber-600 text-sm" />
                    </div>
                    <span className="text-sm font-bold text-amber-900 uppercase tracking-wider">Issue Details</span>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-indigo-100/50">
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <h3 className="text-xl font-bold text-slate-800">
                        {selectedIssue?.plantIssueid}
                      </h3>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(selectedIssue?.status || 'Open')}`}>
                        {selectedIssue?.status === 'Open' ? '🔴 Open Issue' : '✅ Resolved Issue'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${getIssueTypeColor(selectedIssue?.issueType)}`}>
                        {selectedIssue?.issueType === 'Pest' ? '🐛' : 
                         selectedIssue?.issueType === 'Disease' ? '🦠' :
                         selectedIssue?.issueType === 'Soil Problem' ? '🌱' :
                         selectedIssue?.issueType === 'Water Stress' ? '💧' : '📋'} {selectedIssue?.issueType}
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold shadow-sm">
                        🌾 Plot {selectedIssue?.plotid}
                      </span>
                      {selectedIssue?.reportedBy && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold shadow-sm">
                          👤 Reported by: {selectedIssue?.reportedBy === 1 ? 'Factory Manager' : `User ${selectedIssue?.reportedBy}`}
                        </span>
                      )}
                    </div>
                    
                    {selectedIssue?.description && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-xs uppercase text-slate-500 font-bold mb-2">Description</h4>
                        <p className="text-slate-700 text-sm">{selectedIssue?.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Response Form */}
                <div className="space-y-6">
                  {/* Expert Response Text */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Expert Consultation
                      </label>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                        Required
                      </span>
                    </div>
                    <textarea
                      className={`w-full px-4 py-4 bg-slate-50/80 border-2 ${
                        errors.responseText ? 'border-rose-300 focus:ring-2 focus:ring-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-amber-500'
                      } rounded-2xl focus:border-transparent resize-none transition-all duration-200 text-slate-900 placeholder-slate-500 font-medium`}
                      placeholder="Provide your expert guidance and recommendations for this issue. Include diagnosis, treatment suggestions, preventive measures, and expected outcomes..."
                      value={responseFormData.responseText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setResponseFormData({ ...responseFormData, responseText: newText });
                        updateValidationProgress(newText, responseFormData.responseCategory);
                      }}
                      rows={8}
                    />
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className={`text-slate-500 ${responseFormData.responseText.length >= 100 ? 'text-emerald-600 font-medium' : ''}`}>
                        {responseFormData.responseText.length} characters
                        {responseFormData.responseText.length < 50 ? ' (aim for at least 50)' : 
                         responseFormData.responseText.length >= 100 ? ' (excellent detail!)' : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-1 bg-rose-500"></div>
                          <span>Poor</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-1 bg-amber-500"></div>
                          <span>Good</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-1 bg-emerald-500"></div>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Two-column layout for additional fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Response Category */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Response Category
                        </label>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                          Required
                        </span>
                      </div>
                      <select
                        className={`w-full px-4 py-3 bg-slate-50/80 border-2 ${
                          errors.responseCategory ? 'border-rose-300' : 'border-slate-200'
                        } rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200`}
                        value={responseFormData.responseCategory}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          setResponseFormData({ ...responseFormData, responseCategory: newCategory });
                          updateValidationProgress(responseFormData.responseText, newCategory);
                        }}
                      >
                        <option value="">-- Select Category --</option>
                        <option value="pest-control">🐛 Pest Control</option>
                        <option value="disease-treatment">🦠 Disease Treatment</option>
                        <option value="soil-management">🌱 Soil Management</option>
                        <option value="irrigation">💧 Water Management</option>
                        <option value="fertilization">🌿 Fertilization</option>
                        <option value="harvesting">🌾 Harvesting Techniques</option>
                        <option value="quality-control">✅ Quality Control</option>
                        <option value="general">📋 General Guidance</option>
                      </select>
                      {errors.responseCategory && (
                        <p className="text-rose-600 text-xs mt-1">{errors.responseCategory}</p>
                      )}
                    </div>

                    {/* Expertise Level */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Expertise Level
                      </label>
                      <div className="flex items-center space-x-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, expertiseLevel: "basic" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-center ${
                            responseFormData.expertiseLevel === "basic"
                              ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaSeedling />
                            <span>Basic</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, expertiseLevel: "moderate" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-center ${
                            responseFormData.expertiseLevel === "moderate"
                              ? "bg-amber-100 text-amber-700 border-2 border-amber-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaTools />
                            <span>Moderate</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, expertiseLevel: "high" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-center ${
                            responseFormData.expertiseLevel === "high"
                              ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaCertificate />
                            <span>Expert</span>
                          </div>
                        </button>
                      </div>
                      {errors.expertiseLevel && (
                        <p className="text-rose-600 text-xs mt-1">{errors.expertiseLevel}</p>
                      )}
                    </div>

                    {/* Response Urgency */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Response Urgency
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, responseUrgency: "low" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-center ${
                            responseFormData.responseUrgency === "low"
                              ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Low
                        </button>
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, responseUrgency: "medium" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-center ${
                            responseFormData.responseUrgency === "medium"
                              ? "bg-amber-100 text-amber-700 border-2 border-amber-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Medium
                        </button>
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, responseUrgency: "high" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-center ${
                            responseFormData.responseUrgency === "high"
                              ? "bg-rose-100 text-rose-700 border-2 border-rose-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Urgent
                        </button>
                      </div>
                    </div>

                    {/* Follow Up Required */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Follow-up Required
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, followUpRequired: true })}
                          className={`flex-1 py-3 px-4 rounded-l-xl font-medium text-center ${
                            responseFormData.followUpRequired
                              ? "bg-amber-100 text-amber-700 border-2 border-amber-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaCheckCircle />
                            <span>Yes</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResponseFormData({ ...responseFormData, followUpRequired: false })}
                          className={`flex-1 py-3 px-4 rounded-r-xl font-medium text-center ${
                            !responseFormData.followUpRequired
                              ? "bg-slate-200 text-slate-800 border-2 border-slate-300"
                              : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaTimes />
                            <span>No</span>
                          </div>
                        </button>
                      </div>
                      {errors.followUp && (
                        <p className="text-rose-600 text-xs mt-1">{errors.followUp}</p>
                      )}
                    </div>
                  </div>

                  {/* Recommended Products */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Recommended Products or Materials
                      </label>
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium">
                        Optional
                      </span>
                    </div>
                    <textarea
                      className="w-full px-4 py-3 bg-slate-50/80 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-all duration-200"
                      placeholder="List any recommended products, fertilizers, pesticides, or equipment that may help with this issue..."
                      value={responseFormData.recommendedProducts}
                      onChange={(e) => {
                        const filteredValue = e.target.value.replace(/[^a-zA-Z\s.,!?-]/g, '');
                        setResponseFormData({ ...responseFormData, recommendedProducts: filteredValue });
                        updateValidationProgress(responseFormData.responseText, responseFormData.responseCategory);
                      }}
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Specify dosage, application method, and safety precautions if applicable
                    </p>
                  </div>

                  {/* Error display */}
                  {(errors.responseText || errors.responseCategory || errors.expertiseLevel || errors.followUp || errors.submit) && (
                    <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-rose-100 rounded-lg">
                          <FaExclamationTriangle className="text-rose-600 text-sm" />
                        </div>
                        <h4 className="text-rose-700 font-bold">Please fix the following issues:</h4>
                      </div>
                      <ul className="list-disc list-inside pl-4 text-rose-600 text-sm space-y-1">
                        {errors.responseText && <li>{errors.responseText}</li>}
                        {errors.responseCategory && <li>{errors.responseCategory}</li>}
                        {errors.expertiseLevel && <li>{errors.expertiseLevel}</li>}
                        {errors.followUp && <li>{errors.followUp}</li>}
                        {errors.submit && <li>{errors.submit}</li>}
                      </ul>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setResponseModalOpen(false)}
                      className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FaTimes className="text-slate-600" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveResponse}
                      disabled={validationProgress < 30}
                      className={`flex-1 px-6 py-4 rounded-2xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 ${
                        validationProgress < 30
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-xl hover:from-amber-600 hover:to-orange-700"
                      }`}
                    >
                      {validationProgress >= 70 ? <FaStar className="text-yellow-300" /> : null}
                      {responseFormData._id ? "Update Consultation" : "Submit Consultation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SupportDashboard;
