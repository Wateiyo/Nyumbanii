import { jsPDF } from 'jspdf';

/**
 * Generate a comprehensive Property Management eBook PDF
 * Tailored for landlords and property managers in Kenya
 */
export const generatePropertyManagementEbook = () => {
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = 20;
  let currentPage = 1;

  // Brand Colors
  const nyumbaaniBlue = [0, 51, 102]; // #003366
  const accentGold = [212, 175, 55]; // #D4AF37
  const textGray = [55, 65, 81]; // #374151
  const lightGray = [107, 114, 128]; // #6B7280
  const successGreen = [22, 163, 74]; // #16A34A

  // Helper function to add new page with header
  const addNewPage = () => {
    doc.addPage();
    currentPage++;
    yPosition = 25;

    // Header line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, 15, pageWidth - margin, 15);

    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Nyumbanii Property Management eBook', margin, 12);
    doc.text(`Page ${currentPage}`, pageWidth - margin, 12, { align: 'right' });
  };

  // Helper function to check page break
  const checkPageBreak = (requiredSpace = 40) => {
    if (yPosition > pageHeight - requiredSpace) {
      addNewPage();
    }
  };

  // Helper function for section title
  const addSectionTitle = (title, isChapter = false) => {
    checkPageBreak(50);

    if (isChapter) {
      yPosition += 10;
      doc.setFillColor(0, 51, 102);
      doc.rect(0, yPosition - 5, pageWidth, 20, 'F');

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(title, pageWidth / 2, yPosition + 7, { align: 'center' });
      yPosition += 25;
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(nyumbaaniBlue[0], nyumbaaniBlue[1], nyumbaaniBlue[2]);
      doc.text(title, margin, yPosition);
      yPosition += 8;

      // Underline
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(1);
      doc.line(margin, yPosition - 2, margin + 50, yPosition - 2);
      yPosition += 6;
    }
  };

  // Helper function for subsection
  const addSubsection = (title) => {
    checkPageBreak(30);
    yPosition += 4;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(title, margin, yPosition);
    yPosition += 8;
  };

  // Helper function for paragraph
  const addParagraph = (text, indent = 0) => {
    checkPageBreak(25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);

    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach(line => {
      checkPageBreak(15);
      doc.text(line, margin + indent, yPosition);
      yPosition += 5;
    });
    yPosition += 3;
  };

  // Helper function for bullet point
  const addBulletPoint = (text, level = 0) => {
    checkPageBreak(15);
    const indent = 8 + (level * 8);
    const bulletX = margin + indent - 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);

    // Bullet
    doc.setFillColor(0, 51, 102);
    doc.circle(bulletX, yPosition - 1.5, 1, 'F');

    const lines = doc.splitTextToSize(text, contentWidth - indent - 5);
    lines.forEach((line, idx) => {
      checkPageBreak(15);
      doc.text(line, margin + indent, yPosition);
      yPosition += 5;
    });
    yPosition += 1;
  };

  // Helper function for numbered list
  const addNumberedItem = (number, text) => {
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(nyumbaaniBlue[0], nyumbaaniBlue[1], nyumbaaniBlue[2]);
    doc.text(`${number}.`, margin + 5, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const lines = doc.splitTextToSize(text, contentWidth - 15);
    lines.forEach((line, idx) => {
      checkPageBreak(15);
      doc.text(line, margin + 15, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  };

  // Helper function for tip box
  const addTipBox = (title, content) => {
    checkPageBreak(40);
    yPosition += 5;

    const boxHeight = 25 + (doc.splitTextToSize(content, contentWidth - 20).length * 5);

    doc.setFillColor(254, 243, 199); // Yellow background
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'FD');

    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(`TIP: ${title}`, margin + 5, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const lines = doc.splitTextToSize(content, contentWidth - 15);
    lines.forEach(line => {
      doc.text(line, margin + 5, yPosition);
      yPosition += 5;
    });

    yPosition += 8;
  };

  // Helper function for key point box
  const addKeyPointBox = (points) => {
    checkPageBreak(50);
    yPosition += 5;

    const boxHeight = 15 + (points.length * 8);

    doc.setFillColor(239, 246, 255); // Light blue
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'FD');

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('Key Takeaways:', margin + 5, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    points.forEach(point => {
      doc.text(`* ${point}`, margin + 8, yPosition);
      yPosition += 6;
    });

    yPosition += 8;
  };

  // Helper for table
  const addSimpleTable = (headers, rows) => {
    checkPageBreak(50);
    const colWidth = contentWidth / headers.length;
    const startY = yPosition;

    // Header row
    doc.setFillColor(0, 51, 102);
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    headers.forEach((header, i) => {
      doc.text(header, margin + (i * colWidth) + 3, yPosition);
    });
    yPosition += 8;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    rows.forEach((row, rowIdx) => {
      checkPageBreak(15);
      if (rowIdx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition - 4, contentWidth, 8, 'F');
      }
      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 25), margin + (i * colWidth) + 3, yPosition);
      });
      yPosition += 8;
    });
    yPosition += 5;
  };

  // ============================================
  // COVER PAGE
  // ============================================

  // Background
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative elements
  doc.setFillColor(0, 70, 140);
  doc.circle(pageWidth + 20, -20, 80, 'F');
  doc.circle(-30, pageHeight + 10, 60, 'F');

  // Logo area
  yPosition = 40;
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('NYUMBANII', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text('Professional Rental Management Platform', pageWidth / 2, yPosition, { align: 'center' });

  // Gold line
  yPosition += 15;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);

  // Main title
  yPosition += 25;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('The Complete', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text('Property Management', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text('Guide', pageWidth / 2, yPosition, { align: 'center' });

  // Subtitle
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text('For Landlords & Property Managers in Kenya', pageWidth / 2, yPosition, { align: 'center' });

  // Feature box
  yPosition += 20;
  doc.setFillColor(0, 40, 80);
  doc.roundedRect(margin + 15, yPosition, contentWidth - 30, 65, 3, 3, 'F');

  yPosition += 12;
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  const coverFeatures = [
    'Tenant Screening & Selection',
    'Lease Agreements & Legal Compliance',
    'Rent Collection Strategies',
    'Property Maintenance Systems',
    'Financial Management & Reporting',
    'Scaling Your Property Portfolio'
  ];

  coverFeatures.forEach(feature => {
    doc.text('- ' + feature, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  });

  // Edition info
  yPosition = pageHeight - 40;
  doc.setFontSize(10);
  doc.setTextColor(200, 220, 255);
  doc.text('2025 Edition', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  doc.text('Expert Insights for Kenyan Landlords', pageWidth / 2, yPosition, { align: 'center' });

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(9);
  doc.text('www.nyumbanii.org', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 2: COPYRIGHT & DISCLAIMER
  // ============================================
  addNewPage();
  yPosition = 60;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Copyright Notice', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const copyrightText = [
    '© 2025 Nyumbanii. All rights reserved.',
    '',
    'This publication is protected by copyright law. No part of this eBook may be',
    'reproduced, distributed, or transmitted in any form without the prior written',
    'permission of Nyumbanii, except for brief quotations in reviews.',
    '',
    'Disclaimer:',
    '',
    'The information in this eBook is provided for general informational purposes only.',
    'While we strive to provide accurate and up-to-date information, we make no',
    'warranties about the completeness, reliability, or accuracy of this content.',
    '',
    'This guide does not constitute legal, financial, or professional advice. Laws and',
    'regulations vary and change over time. Please consult with qualified professionals',
    'for specific advice related to your situation.',
    '',
    'Nyumbanii shall not be liable for any loss or damage arising from the use of',
    'information in this publication.',
    '',
    'For the latest updates and additional resources, visit:',
    'www.nyumbanii.org'
  ];

  copyrightText.forEach(line => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  // ============================================
  // PAGE 3: TABLE OF CONTENTS
  // ============================================
  addNewPage();
  yPosition = 30;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(nyumbaaniBlue[0], nyumbaaniBlue[1], nyumbaaniBlue[2]);
  doc.text('Table of Contents', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 20;

  const tocItems = [
    { title: 'Introduction to Property Management', page: 5 },
    { title: 'Chapter 1: Understanding the Kenyan Rental Market', page: 7 },
    { title: 'Chapter 2: Property Acquisition & Setup', page: 11 },
    { title: 'Chapter 3: Tenant Screening & Selection', page: 15 },
    { title: 'Chapter 4: Lease Agreements & Legal Framework', page: 20 },
    { title: 'Chapter 5: Rent Collection Strategies', page: 25 },
    { title: 'Chapter 6: Property Maintenance Management', page: 30 },
    { title: 'Chapter 7: Financial Management & Reporting', page: 35 },
    { title: 'Chapter 8: Tenant Relations & Communication', page: 40 },
    { title: 'Chapter 9: Technology in Property Management', page: 44 },
    { title: 'Chapter 10: Scaling Your Property Portfolio', page: 47 },
    { title: 'Conclusion & Resources', page: 50 }
  ];

  tocItems.forEach((item, idx) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', idx === 0 || item.title.startsWith('Chapter') ? 'bold' : 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);

    // Title
    const titleX = item.title.startsWith('Chapter') ? margin : margin + 10;
    doc.text(item.title, titleX, yPosition);

    // Dots
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    const titleWidth = doc.getTextWidth(item.title);
    const dotsStart = titleX + titleWidth + 3;
    const dotsEnd = pageWidth - margin - 15;
    for (let x = dotsStart; x < dotsEnd; x += 3) {
      doc.text('.', x, yPosition);
    }

    // Page number
    doc.setTextColor(nyumbaaniBlue[0], nyumbaaniBlue[1], nyumbaaniBlue[2]);
    doc.text(String(item.page), pageWidth - margin, yPosition, { align: 'right' });

    yPosition += 10;
  });

  // ============================================
  // PAGE 4-5: INTRODUCTION
  // ============================================
  addNewPage();
  addSectionTitle('Introduction to Property Management', true);

  addParagraph('Welcome to The Complete Property Management Guide, specifically designed for landlords and property managers operating in Kenya. Whether you are managing a single rental unit or overseeing a large property portfolio, this comprehensive guide will equip you with the knowledge, strategies, and best practices needed to succeed in the dynamic Kenyan real estate market.');

  addParagraph('Property management is both an art and a science. It requires a unique blend of business acumen, interpersonal skills, legal knowledge, and practical maintenance expertise. In the Kenyan context, successful property management also demands an understanding of local customs, tenant expectations, and the regulatory environment.');

  addSubsection('Why This Guide Matters');

  addParagraph('The Kenyan real estate market has experienced tremendous growth over the past decade. With urbanization rates exceeding 4% annually and a growing middle class seeking quality rental accommodations, the opportunities for property investors have never been greater. However, with opportunity comes challenge.');

  addBulletPoint('Tenant default rates can exceed 15% without proper screening');
  addBulletPoint('Maintenance costs can spiral without proactive management');
  addBulletPoint('Legal disputes consume time and resources when avoidable');
  addBulletPoint('Poor communication leads to tenant turnover and vacancy losses');

  addParagraph('This guide addresses each of these challenges and more, providing you with actionable strategies that have been proven effective in the Kenyan market.');

  addSubsection('What You Will Learn');

  addNumberedItem(1, 'How to evaluate and acquire properties with strong rental potential');
  addNumberedItem(2, 'Proven tenant screening methods that reduce default risk by up to 80%');
  addNumberedItem(3, 'Legal requirements and best practices for lease agreements');
  addNumberedItem(4, 'Strategies to achieve 95%+ on-time rent collection');
  addNumberedItem(5, 'Maintenance systems that reduce costs and improve tenant satisfaction');
  addNumberedItem(6, 'Financial tracking and reporting for maximum profitability');
  addNumberedItem(7, 'Technology solutions that automate and streamline operations');
  addNumberedItem(8, 'How to scale your portfolio while maintaining quality');

  addTipBox('Getting the Most from This Guide', 'Read through the entire guide first to get an overview, then return to specific chapters as you implement changes. Use the checklists and templates provided to take immediate action.');

  // ============================================
  // CHAPTER 1: KENYAN RENTAL MARKET
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 1: Understanding the Kenyan Rental Market', true);

  addParagraph('Before diving into the mechanics of property management, it is essential to understand the market in which you operate. Kenya\'s rental market is diverse, dynamic, and presents unique opportunities and challenges.');

  addSubsection('Market Overview');

  addParagraph('Kenya\'s rental market is characterized by significant regional variations. Nairobi, as the capital and economic hub, commands premium rents and has the most sophisticated tenant base. Other major urban centers like Mombasa, Kisumu, Nakuru, and Eldoret have their own market dynamics.');

  addSimpleTable(
    ['Location', 'Avg. Rent (2BR)', 'Demand Level', 'Tenant Type'],
    [
      ['Westlands', 'KES 80,000+', 'High', 'Expats/Professionals'],
      ['Kilimani', 'KES 60,000+', 'Very High', 'Young Professionals'],
      ['South B/C', 'KES 25,000-40,000', 'High', 'Middle Class'],
      ['Eastlands', 'KES 15,000-25,000', 'Very High', 'Working Class'],
      ['Mombasa', 'KES 20,000-50,000', 'Medium', 'Mixed'],
      ['Kisumu', 'KES 15,000-35,000', 'Medium', 'Mixed']
    ]
  );

  addSubsection('Tenant Demographics');

  addParagraph('Understanding your target tenant is crucial for successful property management. In Kenya, tenant demographics vary significantly by location and property type:');

  addBulletPoint('Young Professionals (25-35): Seek modern amenities, proximity to work, and flexible lease terms');
  addBulletPoint('Families: Prioritize space, security, schools nearby, and stability');
  addBulletPoint('Students: Price-sensitive, prefer furnished units near institutions');
  addBulletPoint('Expatriates: Willing to pay premium for quality, security, and service');
  addBulletPoint('Corporate Tenants: Companies housing staff, seek reliability and professional service');

  addSubsection('Market Trends to Watch');

  addNumberedItem(1, 'Rise of Affordable Housing: Government initiatives are creating new supply in the lower-middle segment');
  addNumberedItem(2, 'Technology Adoption: Tenants increasingly expect online payments and digital communication');
  addNumberedItem(3, 'Security Premium: Properties with robust security command 15-25% higher rents');
  addNumberedItem(4, 'Green Buildings: Energy-efficient properties are gaining tenant preference');
  addNumberedItem(5, 'Satellite Towns: Emerging areas like Kitengela, Ruiru, and Syokimau offer growth opportunities');

  addKeyPointBox([
    'Research your specific market before investing',
    'Match your property to your target tenant demographic',
    'Stay informed about regulatory changes affecting rentals',
    'Monitor emerging areas for investment opportunities'
  ]);

  // ============================================
  // CHAPTER 2: PROPERTY ACQUISITION & SETUP
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 2: Property Acquisition & Setup', true);

  addParagraph('Whether you are purchasing your first rental property or adding to an existing portfolio, the acquisition phase sets the foundation for your success. Poor property selection can haunt you for years, while strategic acquisition creates lasting value.');

  addSubsection('Property Selection Criteria');

  addParagraph('When evaluating potential rental properties, consider these key factors:');

  addNumberedItem(1, 'Location Analysis: Proximity to amenities, transport links, employment centers, and schools directly impacts rentability and rental rates.');
  addNumberedItem(2, 'Property Condition: Assess structural integrity, age of major systems (plumbing, electrical), and immediate repair needs.');
  addNumberedItem(3, 'Unit Mix: For apartment buildings, evaluate the demand for different unit sizes in that area.');
  addNumberedItem(4, 'Rental Yield: Calculate potential gross and net yields based on realistic rental estimates.');
  addNumberedItem(5, 'Appreciation Potential: Consider infrastructure developments and area trajectory.');

  addSubsection('Due Diligence Checklist');

  addParagraph('Before committing to any property purchase, complete thorough due diligence:');

  addBulletPoint('Title Search: Verify ownership at the Land Registry');
  addBulletPoint('Land Rent & Rates: Confirm no outstanding payments to county government');
  addBulletPoint('Building Approvals: Ensure all necessary permits were obtained');
  addBulletPoint('Encumbrances: Check for any charges, caveats, or disputes');
  addBulletPoint('Physical Inspection: Engage a qualified surveyor or engineer');
  addBulletPoint('Tenant Audit: If buying occupied property, review existing lease terms and tenant history');

  addSubsection('Setting Up Your Property');

  addParagraph('Once acquired, proper setup is essential before tenant placement:');

  addNumberedItem(1, 'Safety Compliance: Install fire extinguishers, smoke detectors, and ensure electrical safety');
  addNumberedItem(2, 'Security Features: Perimeter wall, gate, CCTV, and secure entry points');
  addNumberedItem(3, 'Utility Connections: Ensure reliable water, electricity, and (if applicable) gas connections');
  addNumberedItem(4, 'Finishing Standards: Paint, fixtures, and fittings appropriate for your target market');
  addNumberedItem(5, 'Documentation: Prepare inventory lists, meter readings, and condition reports');

  addTipBox('First Impressions Matter', 'Invest in quality finishes for high-visibility areas like the entrance, living room, and kitchen. Tenants often make decisions within minutes of viewing a property.');

  // ============================================
  // CHAPTER 3: TENANT SCREENING & SELECTION
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 3: Tenant Screening & Selection', true);

  addParagraph('Tenant selection is arguably the most critical decision in property management. A good tenant pays on time, maintains your property, and stays long-term. A problem tenant costs you money, time, and stress. This chapter provides a comprehensive framework for identifying quality tenants.');

  addSubsection('The True Cost of a Bad Tenant');

  addParagraph('Before we discuss screening, let us understand what is at stake:');

  addBulletPoint('Lost Rent: Average default before eviction is 3-6 months');
  addBulletPoint('Legal Costs: Eviction proceedings can cost KES 50,000-200,000');
  addBulletPoint('Property Damage: Repairs can exceed security deposits significantly');
  addBulletPoint('Vacancy Period: Finding new tenant adds 1-2 months of lost income');
  addBulletPoint('Emotional Toll: Stress and time spent on difficult tenants');

  addParagraph('A single bad tenant can cost you 12+ months of rental income. Proper screening is an investment that pays for itself many times over.');

  addSubsection('The Screening Process');

  addNumberedItem(1, 'Application Form: Collect comprehensive information upfront');
  addNumberedItem(2, 'Employment Verification: Confirm job, position, and income');
  addNumberedItem(3, 'Previous Landlord References: Speak to at least two past landlords');
  addNumberedItem(4, 'Credit Check: Review payment history where possible');
  addNumberedItem(5, 'Personal Interview: Meet the prospective tenant face-to-face');
  addNumberedItem(6, 'Background Verification: Confirm identity documents');

  addSubsection('Key Questions to Ask');

  addParagraph('During the screening process, gather information on:');

  addBulletPoint('Why are you moving from your current residence?');
  addBulletPoint('How long have you been at your current job?');
  addBulletPoint('How many people will be living in the unit?');
  addBulletPoint('Do you have any pets? (if applicable)');
  addBulletPoint('Have you ever been evicted or had a dispute with a landlord?');
  addBulletPoint('Can you provide emergency contact information?');

  addSubsection('Red Flags to Watch For');

  addBulletPoint('Reluctance to provide references or verification');
  addBulletPoint('Gaps in rental history without explanation');
  addBulletPoint('Income less than 3x the monthly rent');
  addBulletPoint('Negative comments from previous landlords');
  addBulletPoint('Pressure to skip screening steps or move in immediately');
  addBulletPoint('Inconsistencies in application information');

  addSubsection('Income Verification');

  addParagraph('A reliable tenant should have a stable income that comfortably covers rent. The general guideline is:');

  addTipBox('The 30% Rule', 'Rent should not exceed 30% of gross monthly income. A tenant earning KES 100,000 should pay maximum rent of KES 30,000. This ensures they can afford rent even when other expenses arise.');

  addSimpleTable(
    ['Document Type', 'What to Verify', 'Red Flags'],
    [
      ['Pay Slips', '3 months, consistent income', 'Irregular amounts'],
      ['Employment Letter', 'Position, tenure, salary', 'Recent start date'],
      ['Bank Statements', 'Regular deposits', 'Frequent overdrafts'],
      ['Business Docs', 'Registration, revenue', 'No formal records']
    ]
  );

  addKeyPointBox([
    'Never skip screening to fill a vacancy quickly',
    'Trust your instincts if something feels wrong',
    'Document all screening steps taken',
    'Treat all applicants fairly and consistently'
  ]);

  // ============================================
  // CHAPTER 4: LEASE AGREEMENTS & LEGAL FRAMEWORK
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 4: Lease Agreements & Legal Framework', true);

  addParagraph('A well-drafted lease agreement is your primary protection as a landlord. It defines the rights and obligations of both parties and provides the foundation for dispute resolution. In Kenya, residential tenancies are governed by various laws that you must understand.');

  addSubsection('Legal Framework in Kenya');

  addParagraph('Several laws govern landlord-tenant relationships in Kenya:');

  addBulletPoint('The Rent Restriction Act (Cap 296): Applies to controlled tenancies');
  addBulletPoint('The Landlord and Tenant (Shops, Hotels and Catering Establishments) Act (Cap 301): For commercial properties');
  addBulletPoint('The Law of Contract Act: Governs contractual relationships');
  addBulletPoint('The Distress for Rent Act (Cap 293): Governs rent recovery');
  addBulletPoint('County-specific regulations: Some counties have additional requirements');

  addSubsection('Essential Lease Clauses');

  addParagraph('Every residential lease should include:');

  addNumberedItem(1, 'Parties: Full legal names of landlord and tenant(s)');
  addNumberedItem(2, 'Property Description: Complete address and description of the rented premises');
  addNumberedItem(3, 'Term: Start date, end date, and renewal provisions');
  addNumberedItem(4, 'Rent: Amount, due date, payment method, and late fee provisions');
  addNumberedItem(5, 'Security Deposit: Amount, conditions for deductions, and return timeline');
  addNumberedItem(6, 'Utilities: Which utilities are included and tenant responsibilities');
  addNumberedItem(7, 'Maintenance: Division of maintenance responsibilities');
  addNumberedItem(8, 'Use Restrictions: Residential only, subletting prohibition, etc.');
  addNumberedItem(9, 'Termination: Notice periods and grounds for termination');
  addNumberedItem(10, 'Dispute Resolution: How disputes will be handled');

  addSubsection('Security Deposits');

  addParagraph('Security deposits are standard practice in Kenya. Best practices include:');

  addBulletPoint('Amount: Typically 1-3 months rent depending on market');
  addBulletPoint('Documentation: Issue a receipt and record in the lease');
  addBulletPoint('Separate Holding: Keep deposits separate from operating funds');
  addBulletPoint('Condition Report: Document property condition at move-in and move-out');
  addBulletPoint('Return Timeline: Specify when and how the deposit will be returned');
  addBulletPoint('Allowed Deductions: Clearly define what can be deducted');

  addSubsection('Rent Increase Provisions');

  addParagraph('Plan for rent increases in your lease:');

  addBulletPoint('Fixed Increase: Specify annual percentage increase (e.g., 5%)');
  addBulletPoint('Market Rate: Allow for adjustment to market rates with notice');
  addBulletPoint('Notice Period: Minimum 30 days notice, preferably 60-90 days');
  addBulletPoint('Documentation: Any increases should be in writing');

  addTipBox('Get Legal Review', 'Have your lease agreement reviewed by a qualified advocate. The small cost upfront can save significant legal fees later. Update your template as laws change.');

  addSubsection('Common Lease Mistakes to Avoid');

  addBulletPoint('Vague language that can be interpreted multiple ways');
  addBulletPoint('Missing clauses for common scenarios');
  addBulletPoint('Inconsistency between verbal promises and written terms');
  addBulletPoint('Failing to have witnesses or proper execution');
  addBulletPoint('Not providing the tenant with a signed copy');

  // ============================================
  // CHAPTER 5: RENT COLLECTION STRATEGIES
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 5: Rent Collection Strategies', true);

  addParagraph('Consistent, timely rent collection is the lifeblood of property investment. Yet many landlords struggle with late payments, partial payments, and defaults. This chapter provides a comprehensive system for achieving 95%+ on-time collection rates.');

  addSubsection('Setting Up for Success');

  addParagraph('Effective rent collection starts before the tenant moves in:');

  addNumberedItem(1, 'Clear Payment Terms: Document rent amount, due date, and payment methods in the lease');
  addNumberedItem(2, 'Multiple Payment Options: Accept M-Pesa, bank transfer, and other convenient methods');
  addNumberedItem(3, 'Grace Period: Define any grace period and late fees clearly');
  addNumberedItem(4, 'Automated Reminders: Set up systems for automatic payment reminders');
  addNumberedItem(5, 'Receipt System: Issue receipts for all payments');

  addSubsection('The Rent Collection Timeline');

  addSimpleTable(
    ['Timing', 'Action', 'Method'],
    [
      ['5 days before', 'Send reminder', 'SMS/Email'],
      ['Due date', 'Confirm receipt or follow up', 'SMS/Call'],
      ['1 day late', 'First reminder', 'SMS'],
      ['3 days late', 'Phone call', 'Personal call'],
      ['7 days late', 'Written notice', 'Letter/Email'],
      ['14 days late', 'Demand letter', 'Formal letter'],
      ['30 days late', 'Begin legal process', 'Advocate letter']
    ]
  );

  addSubsection('Communication Templates');

  addParagraph('Sample reminder message (5 days before due date):');

  yPosition += 3;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, yPosition, contentWidth, 35, 2, 2, 'FD');
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('"Dear [Tenant Name], This is a friendly reminder that your rent of KES [Amount]', margin + 5, yPosition);
  yPosition += 5;
  doc.text('is due on [Date]. Please ensure payment via [Method]. For any questions,', margin + 5, yPosition);
  yPosition += 5;
  doc.text('contact us at [Number]. Thank you! - [Your Name/Company]"', margin + 5, yPosition);
  yPosition += 20;

  addSubsection('Handling Late Payments');

  addParagraph('When rent is late, take a structured approach:');

  addBulletPoint('Stay Professional: Never let emotions drive your actions');
  addBulletPoint('Document Everything: Keep records of all communication');
  addBulletPoint('Understand the Situation: Is this a one-time issue or pattern?');
  addBulletPoint('Offer Solutions: Payment plans for temporary difficulties');
  addBulletPoint('Enforce Consequences: Apply late fees consistently');
  addBulletPoint('Know When to Escalate: Do not let arrears accumulate');

  addSubsection('Digital Payment Solutions');

  addParagraph('Embrace technology for easier collection:');

  addBulletPoint('M-Pesa Paybill: Set up a business number for easy tenant payments');
  addBulletPoint('Bank Standing Orders: Encourage tenants to automate payments');
  addBulletPoint('Property Management Platforms: Tools like Nyumbanii automate tracking and reminders');
  addBulletPoint('Online Receipts: Automatic receipt generation and record-keeping');

  addTipBox('The Psychology of Payment', 'Make paying rent the path of least resistance. The easier you make it to pay, the more likely tenants will pay on time. Reduce friction at every step.');

  addKeyPointBox([
    'Set clear expectations from day one',
    'Use multiple payment channels',
    'Send reminders before rent is due',
    'Be consistent with late fees',
    'Act quickly when payments are missed'
  ]);

  // ============================================
  // CHAPTER 6: PROPERTY MAINTENANCE MANAGEMENT
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 6: Property Maintenance Management', true);

  addParagraph('Effective maintenance management protects your investment, keeps tenants satisfied, and prevents costly emergency repairs. A proactive approach to maintenance can reduce costs by 40% compared to reactive management.');

  addSubsection('The Maintenance Mindset');

  addParagraph('Shift your thinking from "fixing things when they break" to "preventing things from breaking." This mindset transformation is the foundation of cost-effective property management.');

  addSubsection('Preventive Maintenance Schedule');

  addSimpleTable(
    ['Frequency', 'Tasks', 'Why It Matters'],
    [
      ['Monthly', 'Common area cleaning, lighting check', 'Tenant satisfaction'],
      ['Quarterly', 'Gutter cleaning, pest control', 'Prevent damage'],
      ['Bi-annually', 'HVAC service, water tank cleaning', 'System longevity'],
      ['Annually', 'Roof inspection, electrical check', 'Safety & compliance'],
      ['As needed', 'Painting, waterproofing', 'Property value']
    ]
  );

  addSubsection('Building Your Maintenance Team');

  addParagraph('Reliable vendors are essential. Build relationships with:');

  addBulletPoint('Plumber: Water issues are the most common emergency');
  addBulletPoint('Electrician: Licensed professional for safety');
  addBulletPoint('Painter: For turnover and touch-ups');
  addBulletPoint('Handyman: General repairs and minor fixes');
  addBulletPoint('Security Company: Gate repairs, CCTV maintenance');
  addBulletPoint('Cleaning Service: Common areas and turnovers');
  addBulletPoint('Pest Control: Quarterly treatments');

  addSubsection('Vendor Management Best Practices');

  addNumberedItem(1, 'Vet Before Hiring: Check references, licenses, and insurance');
  addNumberedItem(2, 'Get Multiple Quotes: For any job over KES 20,000');
  addNumberedItem(3, 'Written Agreements: Document scope, price, and timeline');
  addNumberedItem(4, 'Quality Control: Inspect completed work before payment');
  addNumberedItem(5, 'Prompt Payment: Maintain good relationships');
  addNumberedItem(6, 'Performance Tracking: Document quality and reliability');

  addSubsection('Handling Maintenance Requests');

  addParagraph('Create a system for tenant maintenance requests:');

  addBulletPoint('Multiple Channels: Phone, SMS, email, or app-based');
  addBulletPoint('Response Time Standards: Emergency (2 hours), Urgent (24 hours), Routine (7 days)');
  addBulletPoint('Documentation: Record all requests and actions taken');
  addBulletPoint('Follow-up: Confirm issue is resolved to tenant satisfaction');

  addSubsection('Emergency Preparedness');

  addParagraph('Be prepared for common emergencies:');

  addBulletPoint('Water Pipe Burst: Know main shut-off location, have emergency plumber contact');
  addBulletPoint('Power Issues: Generator backup if applicable, electrician on call');
  addBulletPoint('Security Breach: Security company response, police contacts');
  addBulletPoint('Fire: Extinguishers, evacuation plan, insurance details handy');

  addTipBox('Maintenance Fund', 'Set aside 5-10% of gross rental income for maintenance. This fund covers routine maintenance and builds reserves for major repairs. Never skip maintenance to save money short-term.');

  // ============================================
  // CHAPTER 7: FINANCIAL MANAGEMENT & REPORTING
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 7: Financial Management & Reporting', true);

  addParagraph('Successful property investment requires disciplined financial management. Many landlords focus only on rental income without understanding their true profitability. This chapter provides frameworks for comprehensive financial tracking.');

  addSubsection('Understanding Your Numbers');

  addParagraph('Key financial metrics every property investor should track:');

  addSimpleTable(
    ['Metric', 'Formula', 'Target'],
    [
      ['Gross Yield', '(Annual Rent / Property Value) x 100', '8-12%'],
      ['Net Yield', '(Annual Net Income / Value) x 100', '5-8%'],
      ['Occupancy Rate', '(Occupied Days / Total Days) x 100', '95%+'],
      ['Collection Rate', '(Rent Collected / Rent Due) x 100', '98%+'],
      ['Operating Expense Ratio', '(Expenses / Gross Income) x 100', '<40%']
    ]
  );

  addSubsection('Income Tracking');

  addParagraph('Track all income sources:');

  addBulletPoint('Base Rent: Monthly rental payments');
  addBulletPoint('Late Fees: Charges for delayed payments');
  addBulletPoint('Service Charges: For common area maintenance');
  addBulletPoint('Parking Fees: If applicable');
  addBulletPoint('Utility Reimbursements: If you pay and bill back');
  addBulletPoint('Other Income: Laundry, storage, advertising, etc.');

  addSubsection('Expense Categories');

  addParagraph('Comprehensive expense tracking includes:');

  addNumberedItem(1, 'Fixed Costs: Mortgage/loan payments, insurance, property taxes, land rates');
  addNumberedItem(2, 'Variable Costs: Utilities (if landlord-paid), repairs, maintenance');
  addNumberedItem(3, 'Management Costs: Property manager fees, accounting, legal');
  addNumberedItem(4, 'Reserves: Vacancy allowance, capital expenditure fund');
  addNumberedItem(5, 'Marketing: Advertising for vacant units');

  addSubsection('Monthly Reporting');

  addParagraph('Generate monthly reports covering:');

  addBulletPoint('Income Statement: Revenue vs. expenses for the period');
  addBulletPoint('Cash Flow Statement: Actual cash in and out');
  addBulletPoint('Rent Roll: Status of each unit and tenant');
  addBulletPoint('Aged Receivables: Outstanding rent by tenant and duration');
  addBulletPoint('Maintenance Log: Work completed and pending');

  addSubsection('Tax Considerations');

  addParagraph('Understand your tax obligations:');

  addBulletPoint('Rental Income Tax: Rental income is taxable in Kenya');
  addBulletPoint('Allowable Deductions: Mortgage interest, repairs, management fees');
  addBulletPoint('Withholding Tax: Applies to some rental payments');
  addBulletPoint('Capital Gains: Taxable on property sale');
  addBulletPoint('Professional Advice: Consult a tax advisor for optimization');

  addTipBox('Separate Accounts', 'Keep a dedicated bank account for your rental business. This simplifies tracking, makes tax time easier, and provides clean records if ever needed for legal purposes.');

  addKeyPointBox([
    'Track all income and expenses meticulously',
    'Generate monthly financial reports',
    'Monitor key performance metrics',
    'Plan for taxes and maintain reserves',
    'Use accounting software or property management platforms'
  ]);

  // ============================================
  // CHAPTER 8: TENANT RELATIONS & COMMUNICATION
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 8: Tenant Relations & Communication', true);

  addParagraph('Good tenant relations reduce turnover, encourage on-time payments, and create a positive living environment. The best landlords treat their tenants as valued customers while maintaining professional boundaries.');

  addSubsection('The Business Case for Good Relations');

  addParagraph('Tenant turnover is expensive. Consider:');

  addBulletPoint('Vacancy Costs: 1-2 months lost rent per turnover');
  addBulletPoint('Turnover Repairs: Painting, cleaning, minor repairs');
  addBulletPoint('Marketing Costs: Advertising, showing the property');
  addBulletPoint('Screening Costs: Time and resources for new tenant');
  addBulletPoint('Risk: New tenants are unknown quantities');

  addParagraph('Keeping a good tenant an extra year can save KES 100,000+ in turnover costs.');

  addSubsection('Communication Best Practices');

  addNumberedItem(1, 'Be Responsive: Aim to respond to all communications within 24 hours');
  addNumberedItem(2, 'Be Professional: Maintain respectful, business-like communication');
  addNumberedItem(3, 'Be Consistent: Apply rules and policies uniformly');
  addNumberedItem(4, 'Be Proactive: Share important information before tenants ask');
  addNumberedItem(5, 'Document Everything: Keep records of all significant communications');

  addSubsection('Building Positive Relationships');

  addBulletPoint('Welcome Package: Provide useful information at move-in');
  addBulletPoint('Regular Check-ins: Brief contact every few months (not intrusive)');
  addBulletPoint('Quick Maintenance Response: Show you care about their comfort');
  addBulletPoint('Fair Treatment: Be consistent and reasonable');
  addBulletPoint('Renewal Appreciation: Thank tenants who renew, consider incentives');

  addSubsection('Handling Difficult Situations');

  addParagraph('Conflicts will arise. Handle them professionally:');

  addBulletPoint('Stay Calm: Never respond in anger');
  addBulletPoint('Listen First: Understand the tenant\'s perspective');
  addBulletPoint('Focus on Solutions: What can be done to resolve the issue?');
  addBulletPoint('Document: Keep records of disputes and resolutions');
  addBulletPoint('Know When to Escalate: Some situations require legal help');

  addSubsection('Tenant Communication Channels');

  addParagraph('Use appropriate channels for different communications:');

  addSimpleTable(
    ['Type of Message', 'Channel', 'Keep Record?'],
    [
      ['Payment Reminder', 'SMS/Email', 'Yes'],
      ['Maintenance Update', 'SMS/Call', 'Yes'],
      ['Policy Change', 'Written Letter/Email', 'Yes'],
      ['Emergency', 'Phone Call + SMS', 'Yes'],
      ['Lease Renewal', 'Email + Physical Letter', 'Yes'],
      ['General Notice', 'Notice Board + SMS', 'Yes']
    ]
  );

  addTipBox('The Human Touch', 'Remember your tenants are people, not just rent checks. A little consideration goes a long way. Know their names, remember if they mentioned a family event, and treat them with respect.');

  // ============================================
  // CHAPTER 9: TECHNOLOGY IN PROPERTY MANAGEMENT
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 9: Technology in Property Management', true);

  addParagraph('Technology has transformed property management worldwide, and Kenya is no exception. From digital payments to automated systems, technology can dramatically improve efficiency and tenant satisfaction.');

  addSubsection('The Digital Transformation');

  addParagraph('Modern property management leverages technology for:');

  addBulletPoint('Payment Processing: M-Pesa, bank transfers, card payments');
  addBulletPoint('Communication: Automated reminders, bulk messaging');
  addBulletPoint('Record Keeping: Digital documentation, cloud storage');
  addBulletPoint('Marketing: Online listings, virtual tours');
  addBulletPoint('Reporting: Automated financial reports');
  addBulletPoint('Maintenance: Work order tracking, vendor management');

  addSubsection('Property Management Software');

  addParagraph('Consider dedicated property management platforms like Nyumbanii that offer:');

  addNumberedItem(1, 'Tenant Portal: Self-service for payments, requests, documents');
  addNumberedItem(2, 'Automated Reminders: For rent due dates, lease renewals');
  addNumberedItem(3, 'Financial Tracking: Income, expenses, reports');
  addNumberedItem(4, 'Maintenance Management: Request tracking, vendor assignment');
  addNumberedItem(5, 'Document Storage: Leases, receipts, communications');
  addNumberedItem(6, 'Analytics: Performance dashboards and insights');

  addSubsection('Digital Payment Solutions');

  addParagraph('Make paying rent convenient:');

  addBulletPoint('M-Pesa Paybill: Kenya\'s most popular mobile money platform');
  addBulletPoint('Bank Transfers: Direct deposits or EFT');
  addBulletPoint('Card Payments: For tech-savvy tenants');
  addBulletPoint('Standing Orders: Automated monthly payments');

  addSubsection('Marketing Your Properties Online');

  addParagraph('Leverage digital channels:');

  addBulletPoint('Property Listing Sites: BuyRentKenya, Jiji, Property24');
  addBulletPoint('Social Media: Facebook, Instagram for visibility');
  addBulletPoint('WhatsApp Business: Quick responses to inquiries');
  addBulletPoint('Virtual Tours: Video walkthroughs for remote viewers');
  addBulletPoint('Professional Photos: Quality images increase interest');

  addSubsection('Data Security');

  addParagraph('As you digitize, protect sensitive data:');

  addBulletPoint('Strong Passwords: Unique, complex passwords for all accounts');
  addBulletPoint('Two-Factor Authentication: Extra security layer');
  addBulletPoint('Data Backups: Regular backups of critical information');
  addBulletPoint('Access Controls: Limit who can access tenant data');
  addBulletPoint('Compliance: Follow data protection regulations');

  addTipBox('Start Simple', 'You do not need every tool at once. Start with the basics - digital payments and a simple tracking system. Add complexity as you grow comfortable and your portfolio expands.');

  // ============================================
  // CHAPTER 10: SCALING YOUR PORTFOLIO
  // ============================================
  addNewPage();
  addSectionTitle('Chapter 10: Scaling Your Property Portfolio', true);

  addParagraph('Once you have mastered managing your initial properties, you may want to grow. Scaling a property portfolio requires different skills than managing a single property. This chapter provides strategies for sustainable growth.');

  addSubsection('When to Scale');

  addParagraph('Consider expansion when:');

  addBulletPoint('Current Properties Stable: High occupancy, consistent collection');
  addBulletPoint('Systems in Place: Documented processes that work');
  addBulletPoint('Financial Capacity: Access to capital for new acquisitions');
  addBulletPoint('Market Opportunity: Good properties available at fair prices');
  addBulletPoint('Management Capacity: You can handle more, or can hire help');

  addSubsection('Growth Strategies');

  addNumberedItem(1, 'Buy and Hold: Acquire properties for long-term rental income');
  addNumberedItem(2, 'Value Add: Buy underperforming properties, improve and stabilize');
  addNumberedItem(3, 'Development: Build new properties from the ground up');
  addNumberedItem(4, 'Partnership: Joint ventures with other investors');
  addNumberedItem(5, 'Management Contracts: Manage properties for other owners');

  addSubsection('Financing Growth');

  addParagraph('Options for funding new acquisitions:');

  addBulletPoint('Retained Earnings: Reinvest rental profits');
  addBulletPoint('Bank Mortgages: Traditional property financing');
  addBulletPoint('Saccos: Cooperative savings and loans');
  addBulletPoint('Private Lenders: Individuals or groups lending at interest');
  addBulletPoint('Equity Partners: Share ownership for capital');
  addBulletPoint('Refinancing: Extract equity from existing properties');

  addSubsection('Building Your Team');

  addParagraph('As you scale, you need help:');

  addBulletPoint('Property Manager: Day-to-day operations');
  addBulletPoint('Accountant: Financial management and tax optimization');
  addBulletPoint('Advocate: Legal matters and documentation');
  addBulletPoint('Insurance Agent: Comprehensive coverage');
  addBulletPoint('Reliable Contractors: Maintenance and repairs');

  addSubsection('Common Scaling Mistakes');

  addBulletPoint('Growing Too Fast: Outpacing your systems and capacity');
  addBulletPoint('Poor Property Selection: Buying anything available');
  addBulletPoint('Undercapitalization: Running out of reserves');
  addBulletPoint('Neglecting Existing Properties: Focusing only on new acquisitions');
  addBulletPoint('Skipping Due Diligence: Taking shortcuts on research');

  addTipBox('Quality Over Quantity', 'Ten well-managed properties outperform twenty poorly managed ones. Focus on quality acquisitions and excellent management. Growth should enhance your returns, not dilute them.');

  addKeyPointBox([
    'Scale only when current properties are stable',
    'Build systems before you build portfolio',
    'Diversify by location and property type',
    'Build a reliable team as you grow',
    'Maintain financial reserves at all times'
  ]);

  // ============================================
  // CONCLUSION & RESOURCES
  // ============================================
  addNewPage();
  addSectionTitle('Conclusion & Next Steps', true);

  addParagraph('Congratulations on completing The Complete Property Management Guide! You now have a comprehensive understanding of what it takes to succeed as a landlord or property manager in Kenya.');

  addSubsection('Key Takeaways');

  addNumberedItem(1, 'Success starts with proper tenant screening - never skip this step');
  addNumberedItem(2, 'Clear lease agreements prevent disputes and protect your interests');
  addNumberedItem(3, 'Systematic rent collection is essential for consistent cash flow');
  addNumberedItem(4, 'Proactive maintenance saves money and keeps tenants happy');
  addNumberedItem(5, 'Good tenant relations reduce turnover and increase profitability');
  addNumberedItem(6, 'Technology streamlines operations and improves efficiency');
  addNumberedItem(7, 'Financial tracking enables informed decision-making');
  addNumberedItem(8, 'Scale strategically when systems and capacity allow');

  addSubsection('Your Action Plan');

  addParagraph('Start implementing what you have learned:');

  addBulletPoint('Week 1: Audit your current screening process and lease agreements');
  addBulletPoint('Week 2: Set up or improve your rent collection system');
  addBulletPoint('Week 3: Create a preventive maintenance schedule');
  addBulletPoint('Week 4: Implement a financial tracking system');
  addBulletPoint('Ongoing: Continuously improve and adapt your processes');

  addSubsection('Additional Resources');

  addParagraph('Continue your education with these resources:');

  addBulletPoint('Nyumbanii Platform: www.nyumbanii.org - Automate your property management');
  addBulletPoint('Kenya Property Developers Association: Industry updates and networking');
  addBulletPoint('Legal Resources: Consult qualified advocates for specific legal advice');
  addBulletPoint('Professional Networks: Connect with other landlords and property managers');

  // CTA Box
  yPosition += 10;
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPosition, contentWidth, 60, 5, 5, 'F');

  yPosition += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Ready to Transform Your Property Management?', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Nyumbanii automates rent collection, maintenance tracking, tenant', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('communication, and financial reporting - all in one platform.', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text('Start Your 14-Day Free Trial at www.nyumbanii.org', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 25;

  // Final page footer
  addParagraph('Thank you for reading! We wish you success in your property management journey.');

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Questions? Contact us at info@nyumbanii.org', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('Follow us on social media: @nyumbanii', pageWidth / 2, yPosition, { align: 'center' });

  // Final page number
  doc.setFontSize(8);
  doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  doc.text('© 2025 Nyumbanii - All Rights Reserved', margin, pageHeight - 10);

  return doc;
};

/**
 * Download the Property Management eBook PDF
 */
export const downloadPropertyManagementEbook = () => {
  const doc = generatePropertyManagementEbook();
  doc.save('Nyumbanii-Property-Management-Guide.pdf');
};
