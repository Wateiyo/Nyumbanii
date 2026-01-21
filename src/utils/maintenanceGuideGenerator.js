import { jsPDF } from 'jspdf';

/**
 * Generate a professional Property Maintenance Guide PDF for lead generation
 * This comprehensive guide helps landlords reduce costs and improve tenant satisfaction
 */
export const generateMaintenanceGuidePDF = () => {
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = 20;

  // Brand Colors
  const nyumbaaniBlue = [0, 51, 102]; // #003366
  const accentPurple = [147, 51, 234]; // #9333ea
  const textGray = [75, 85, 99]; // #4b5563

  // Helper function to add text
  const addText = (text, fontSize = 11, align = 'left', isBold = false, color = textGray) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += (lines.length * fontSize * 0.5);
    }
    yPosition += 4;
  };

  // Helper function to add checkbox item
  const addCheckboxItem = (text, isSubItem = false) => {
    const indent = isSubItem ? 35 : 25;
    const boxX = margin + (isSubItem ? 20 : 5);

    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setLineWidth(0.5);
    doc.setDrawColor(150, 150, 150);
    doc.rect(boxX, yPosition - 3, 4, 4);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, yPosition);
    yPosition += (lines.length * 5) + 3;
  };

  // Helper function to add section header
  const addSectionHeader = (title) => {
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    doc.setFillColor(147, 51, 234);
    doc.roundedRect(margin, yPosition - 5, contentWidth, 10, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 5, yPosition + 2);

    yPosition += 12;
  };

  // ============================================
  // PAGE 1: COVER PAGE
  // ============================================

  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Nyumbanii', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Rental Management Platform', pageWidth / 2, 35, { align: 'center' });

  yPosition = 65;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Property Maintenance', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;
  doc.text('Best Practices Guide', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Reduce Costs, Improve Tenant Satisfaction', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 7;
  doc.text('& Protect Your Investment', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 25;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 10, yPosition, contentWidth - 20, 55, 3, 3, 'FD');

  yPosition += 12;
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  const introLines = [
    'This guide provides proven strategies for proactive property maintenance',
    'that saves money, prevents emergencies, and keeps tenants happy. Learn',
    'from industry best practices specifically tailored for Kenyan landlords',
    'managing residential and commercial properties.'
  ];

  introLines.forEach(line => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  yPosition += 25;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('What You\'ll Learn:', margin + 15, yPosition);
  yPosition += 10;

  const benefits = [
    '* Preventive maintenance schedules',
    '* Emergency response protocols',
    '* Vendor management strategies',
    '* Cost-saving maintenance tips',
    '* Tenant communication best practices',
    '* Record-keeping and compliance'
  ];

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  benefits.forEach(benefit => {
    doc.text(benefit, margin + 20, yPosition);
    yPosition += 7;
  });

  yPosition = pageHeight - 30;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('© 2025 Nyumbanii | www.nyumbanii.org | Simplifying Rental Management in Kenya', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 2: PREVENTIVE MAINTENANCE
  // ============================================
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Preventive Maintenance Guide', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  addSectionHeader('Monthly Maintenance Tasks');

  addCheckboxItem('Inspect and clean all common areas (hallways, stairs, parking)');
  addCheckboxItem('Test all outdoor and security lighting');
  addCheckboxItem('Check for water leaks in common plumbing areas');
  addCheckboxItem('Inspect gates, locks, and security systems');
  addCheckboxItem('Clean and service water tanks and pumps');
  addCheckboxItem('Check for pest activity and take preventive measures');
  addCheckboxItem('Test fire extinguishers and smoke detectors');
  addCheckboxItem('Inspect roof for damage or leaks (rainy season)');
  yPosition += 2;

  addSectionHeader('Quarterly Maintenance Tasks (Every 3 Months)');

  addCheckboxItem('Deep clean water tanks and test water quality');
  addCheckboxItem('Service air conditioning units and fans');
  addCheckboxItem('Inspect and clean gutters and drainage systems');
  addCheckboxItem('Check exterior paint and building facade for damage');
  addCheckboxItem('Test backup generators (if applicable)');
  addCheckboxItem('Inspect electrical panels and wiring for safety');
  addCheckboxItem('Lubricate door hinges, locks, and window mechanisms');
  addCheckboxItem('Trim trees and landscaping near buildings');
  yPosition += 2;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 2', pageWidth / 2, pageHeight - 15, { align: 'center' });
  yPosition += 4;
  doc.text('Preventive maintenance saves up to 40% compared to reactive repairs', pageWidth / 2, pageHeight - 11, { align: 'center' });

  // ============================================
  // PAGE 3: ANNUAL & EMERGENCY MAINTENANCE
  // ============================================
  doc.addPage();
  yPosition = 20;

  addSectionHeader('Annual Maintenance Tasks');

  addCheckboxItem('Professional plumbing inspection of all units');
  addCheckboxItem('Electrical safety inspection and certification');
  addCheckboxItem('Structural assessment of building (cracks, foundation)');
  addCheckboxItem('Roof inspection and waterproofing maintenance');
  addCheckboxItem('Repaint common areas and exterior touch-ups');
  addCheckboxItem('Service septic tanks or sewer lines');
  addCheckboxItem('Update fire safety equipment and signage');
  addCheckboxItem('Review and renew maintenance contracts');
  addCheckboxItem('Termite and pest control treatment');
  yPosition += 2;

  addSectionHeader('Emergency Response Protocol');

  addCheckboxItem('Maintain 24/7 emergency contact list (plumber, electrician, security)');
  addCheckboxItem('Keep emergency fund for urgent repairs (recommended: 5% of rental income)');
  addCheckboxItem('Respond to tenant emergency reports within 2 hours');
  addCheckboxItem('Document all emergency incidents with photos and reports');
  addCheckboxItem('Have backup plans: alternative water source, generator, etc.');
  yPosition += 2;

  addSectionHeader('Common Emergency Scenarios & Solutions');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  yPosition += 3;
  doc.text('Water Pipe Burst:', margin + 5, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('- Shut off main water valve immediately', margin + 10, yPosition);
  yPosition += 5;
  doc.text('- Call emergency plumber', margin + 10, yPosition);
  yPosition += 5;
  doc.text('- Document damage with photos for insurance', margin + 10, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Power Outage:', margin + 5, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('- Check if area-wide or building-specific', margin + 10, yPosition);
  yPosition += 5;
  doc.text('- Start backup generator if available', margin + 10, yPosition);
  yPosition += 5;
  doc.text('- Notify tenants of estimated restoration time', margin + 10, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Blocked Sewer/Drainage:', margin + 5, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('- Call professional drainage service immediately', margin + 10, yPosition);
  yPosition += 5;
  doc.text('- Prevent usage of affected facilities', margin + 10, yPosition);
  yPosition += 5;
  doc.text('- Schedule regular cleaning to prevent recurrence', margin + 10, yPosition);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 3', pageWidth / 2, pageHeight - 15, { align: 'center' });
  yPosition += 4;
  doc.text('Fast emergency response improves tenant retention by 30%', pageWidth / 2, pageHeight - 11, { align: 'center' });

  // ============================================
  // PAGE 4: VENDOR MANAGEMENT
  // ============================================
  doc.addPage();
  yPosition = 20;

  addSectionHeader('Building Your Maintenance Team');

  addCheckboxItem('Pre-qualify and vet all contractors (licenses, insurance, references)');
  addCheckboxItem('Maintain relationships with 2-3 vendors per category for backup');
  addCheckboxItem('Negotiate service contracts for regular maintenance (better rates)');
  addCheckboxItem('Keep detailed vendor contact list with specialties and rates');
  addCheckboxItem('Track vendor performance and response times');
  addCheckboxItem('Pay vendors promptly to maintain good relationships');
  yPosition += 2;

  addSectionHeader('Essential Vendor Categories');

  const vendors = [
    'Plumber (24/7 emergency contact)',
    'Electrician (licensed and certified)',
    'Painter (interior and exterior)',
    'Pest control service',
    'Security company',
    'Cleaning service',
    'Landscaping/gardening',
    'Water tank cleaning service',
    'General handyman'
  ];

  vendors.forEach(vendor => {
    addCheckboxItem(vendor);
  });
  yPosition += 2;

  addSectionHeader('Cost-Saving Maintenance Tips');

  doc.setFontSize(10);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);

  const tips = [
    '1. Buy materials in bulk for better pricing',
    '2. Schedule maintenance during off-peak seasons',
    '3. Train tenants on basic maintenance (changing bulbs, etc.)',
    '4. Use quality materials to reduce replacement frequency',
    '5. Negotiate annual contracts for 10-15% discounts',
    '6. Perform minor repairs immediately to prevent major issues',
    '7. Keep spare parts inventory (faucets, light bulbs, locks)'
  ];

  tips.forEach(tip => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(tip, margin + 8, yPosition);
    yPosition += 6;
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 4', pageWidth / 2, pageHeight - 15, { align: 'center' });
  yPosition += 4;
  doc.text('Good vendor relationships can save you 20% on maintenance costs', pageWidth / 2, pageHeight - 11, { align: 'center' });

  // ============================================
  // PAGE 5: TENANT COMMUNICATION & RECORDS
  // ============================================
  doc.addPage();
  yPosition = 20;

  addSectionHeader('Maintenance Request Management');

  addCheckboxItem('Provide multiple channels for requests (phone, email, app)');
  addCheckboxItem('Acknowledge all requests within 24 hours');
  addCheckboxItem('Classify urgency: Emergency (2hrs), Urgent (24hrs), Routine (7 days)');
  addCheckboxItem('Keep tenants updated on repair progress');
  addCheckboxItem('Schedule repairs at tenant-convenient times when possible');
  addCheckboxItem('Follow up after completion to ensure satisfaction');
  addCheckboxItem('Document tenant-caused damage separately for billing');
  yPosition += 2;

  addSectionHeader('Record-Keeping Best Practices');

  addCheckboxItem('Maintain detailed log of all maintenance activities');
  addCheckboxItem('Keep receipts and invoices for all expenses');
  addCheckboxItem('Take before/after photos of all major repairs');
  addCheckboxItem('Track maintenance costs per unit and property');
  addCheckboxItem('Store warranty documents and equipment manuals');
  addCheckboxItem('Review maintenance history before lease renewals');
  addCheckboxItem('Use digital tools for easy tracking (like Nyumbanii!)');
  yPosition += 2;

  addSectionHeader('Tenant Education & Prevention');

  doc.setFontSize(10);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);

  yPosition += 3;
  doc.text('Educate tenants on:', margin + 5, yPosition);
  yPosition += 6;

  const tenantTips = [
    '- Proper waste disposal to prevent blocked drains',
    '- Reporting small issues before they become big problems',
    '- Basic appliance care and maintenance',
    '- Water conservation and leak reporting',
    '- Pest prevention (food storage, cleanliness)',
    '- Respecting common areas and facilities'
  ];

  tenantTips.forEach(tip => {
    doc.text(tip, margin + 10, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, yPosition, contentWidth, 25, 2, 2, 'FD');

  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('TIP: Pro Tip:', margin + 5, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  const proTipText = 'Conduct quarterly property inspections with tenants present. This catches issues early and shows tenants you care about property condition.';
  const proTipLines = doc.splitTextToSize(proTipText, contentWidth - 10);
  doc.text(proTipLines, margin + 5, yPosition);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 5', pageWidth / 2, pageHeight - 15, { align: 'center' });
  yPosition += 4;
  doc.text('Proactive communication reduces tenant complaints by 60%', pageWidth / 2, pageHeight - 11, { align: 'center' });

  // ============================================
  // PAGE 6: SEASONAL MAINTENANCE & CTA
  // ============================================
  doc.addPage();
  yPosition = 20;

  addSectionHeader('Seasonal Maintenance Checklist (Kenya)');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  yPosition += 3;
  doc.text('Long Rains Season (March - May):', margin + 5, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  addCheckboxItem('Inspect and repair roof before rains start', true);
  addCheckboxItem('Clean all gutters and drainage systems', true);
  addCheckboxItem('Check for water seepage in walls and windows', true);
  addCheckboxItem('Service water pumps and tanks', true);
  yPosition += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Short Rains Season (October - December):', margin + 5, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  addCheckboxItem('Repeat drainage and roof inspections', true);
  addCheckboxItem('Check for mold and mildew growth', true);
  addCheckboxItem('Test sump pumps if applicable', true);
  yPosition += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Dry Season (June - September, January - February):', margin + 5, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  addCheckboxItem('Exterior painting and building maintenance', true);
  addCheckboxItem('Repave driveways and walkways', true);
  addCheckboxItem('Deep clean water tanks', true);
  addCheckboxItem('Landscaping and tree trimming', true);
  yPosition += 5;

  // Call to Action
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPosition, contentWidth, 60, 3, 3, 'F');

  yPosition += 12;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Tired of Managing Maintenance Manually?', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Nyumbanii automates your entire maintenance workflow!', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFontSize(10);
  doc.text('* Track requests  * Assign vendors  * Monitor progress  * Auto-reminders', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 191, 0);
  doc.text('Start Your Free Trial: www.nyumbanii.org', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 25;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Contact Us:', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Email: info@nyumbanii.org | Phone: +254 700 000 000', pageWidth / 2, yPosition, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 6', pageWidth / 2, pageHeight - 15, { align: 'center' });
  yPosition += 4;
  doc.text('© 2025 Nyumbanii - Your Partner in Property Excellence', pageWidth / 2, pageHeight - 11, { align: 'center' });

  return doc;
};

/**
 * Download the maintenance guide PDF
 */
export const downloadMaintenanceGuidePDF = () => {
  const doc = generateMaintenanceGuidePDF();
  doc.save('Nyumbanii-Property-Maintenance-Guide.pdf');
};
