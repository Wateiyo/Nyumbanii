import { jsPDF } from 'jspdf';

/**
 * Generate a professional Rent Collection Checklist PDF for lead generation
 * This comprehensive checklist helps landlords streamline their rent collection process
 * and positions Nyumbanii as a solution to automate these tasks
 */
export const generateRentCollectionChecklist = () => {
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = 20;

  // Brand Colors
  const nyumbaaniBlue = [0, 51, 102]; // #003366
  const accentOrange = [255, 122, 0]; // #FF7A00
  const textGray = [75, 85, 99]; // #4b5563
  const checkGreen = [34, 197, 94]; // #22c55e

  // Helper function to add text
  const addText = (text, fontSize = 11, align = 'left', isBold = false, color = textGray) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    // Check if we need a new page
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

    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    // Draw checkbox
    doc.setLineWidth(0.5);
    doc.setDrawColor(150, 150, 150);
    doc.rect(boxX, yPosition - 3, 4, 4);

    // Add text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, yPosition);
    yPosition += (lines.length * 5) + 3;
  };

  // Helper function to add section header
  const addSectionHeader = (title, icon = '') => {
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 5;

    // Background rectangle
    doc.setFillColor(0, 51, 102);
    doc.roundedRect(margin, yPosition - 5, contentWidth, 10, 2, 2, 'F');

    // Section title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(icon + title, margin + 5, yPosition + 2);

    yPosition += 12;
  };

  // Helper function to add a horizontal line
  const addLine = () => {
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };

  // ============================================
  // PAGE 1: COVER PAGE & INTRODUCTION
  // ============================================

  // Header with branding
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Logo area (text-based)
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Nyumbanii', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Rental Management Platform', pageWidth / 2, 35, { align: 'center' });

  yPosition = 65;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Ultimate Rent Collection', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;
  doc.text('Checklist for Landlords', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Subtitle
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('A Complete Month-by-Month Guide to Streamline', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 7;
  doc.text('Your Rent Collection Process', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 25;

  // Info box
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 10, yPosition, contentWidth - 20, 50, 3, 3, 'FD');

  yPosition += 12;
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  const introLines = [
    'This comprehensive checklist helps Kenyan landlords optimize their',
    'rent collection process, reduce late payments, and maintain positive',
    'tenant relationships. Follow these best practices monthly to ensure',
    'consistent cash flow and professional property management.'
  ];

  introLines.forEach(line => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  yPosition += 30;

  // Key benefits
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('What You\'ll Learn:', margin + 15, yPosition);
  yPosition += 10;

  const benefits = [
    '✓ Pre-collection preparation and tenant communication',
    '✓ M-Pesa payment tracking and reconciliation',
    '✓ Late payment management strategies',
    '✓ Record-keeping and financial reporting',
    '✓ Legal compliance for Kenyan landlords',
    '✓ Automation opportunities to save time'
  ];

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  benefits.forEach(benefit => {
    doc.text(benefit, margin + 20, yPosition);
    yPosition += 7;
  });

  // Footer
  yPosition = pageHeight - 30;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('© 2025 Nyumbanii | www.nyumbanii.org | Simplifying Rental Management in Kenya', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 2: PREPARATION PHASE
  // ============================================
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Rent Collection Checklist', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Section 1: Pre-Collection Preparation
  addSectionHeader('📋 Pre-Collection Preparation (5-7 Days Before Due Date)');

  addCheckboxItem('Review all tenant records and update contact information');
  addCheckboxItem('Verify current rent amounts and any pending adjustments');
  addCheckboxItem('Check for outstanding balances from previous months');
  addCheckboxItem('Review lease agreements for payment terms and due dates');
  addCheckboxItem('Ensure all utility bills and service charges are calculated');
  yPosition += 2;

  // Section 2: Tenant Communication
  addSectionHeader('💬 Tenant Communication (3-5 Days Before Due Date)');

  addCheckboxItem('Send friendly rent reminder notices to all tenants');
  addCheckboxItem('Include payment amount, due date, and payment methods');
  addCheckboxItem('Provide M-Pesa Paybill/Till number and account details');
  addCheckboxItem('Attach or reference invoice/statement if applicable');
  addCheckboxItem('Follow up with tenants who have history of late payments');
  addCheckboxItem('Respond to tenant queries about payments promptly');
  yPosition += 2;

  // Section 3: Payment Methods Setup
  addSectionHeader('💳 Payment Methods & Channels');

  addCheckboxItem('Confirm M-Pesa Paybill/Till number is active and working');
  addCheckboxItem('Verify bank account details for direct deposits');
  addCheckboxItem('Test all payment channels to ensure they\'re functional');
  addCheckboxItem('Update payment instructions if any details changed');
  addCheckboxItem('Provide multiple payment options for tenant convenience');
  yPosition += 2;

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 2', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('Nyumbanii - Your Partner in Professional Property Management', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 3: COLLECTION DAY & TRACKING
  // ============================================
  doc.addPage();
  yPosition = 20;

  // Section 4: On Collection Day
  addSectionHeader('📅 On Rent Due Day (Day 1-5 of Month)');

  addCheckboxItem('Monitor M-Pesa notifications and bank deposits in real-time');
  addCheckboxItem('Log all payments received immediately in your records');
  addCheckboxItem('Match M-Pesa transaction codes with tenant names');
  addCheckboxItem('Send payment confirmation receipts to tenants');
  addCheckboxItem('Update tenant payment status (Paid/Partial/Pending)');
  addCheckboxItem('Note any discrepancies or partial payments for follow-up');
  yPosition += 2;

  // Section 5: M-Pesa Reconciliation
  addSectionHeader('🔄 M-Pesa Payment Reconciliation');

  addCheckboxItem('Download M-Pesa statement from Safaricom portal');
  addCheckboxItem('Cross-check transaction codes with tenant records');
  addCheckboxItem('Identify and resolve unmatched or duplicate payments');
  addCheckboxItem('Contact tenants for missing account/reference numbers');
  addCheckboxItem('Update payment records with correct tenant attributions');
  addCheckboxItem('Flag suspicious or fraudulent transaction attempts');
  yPosition += 2;

  // Section 6: Late Payment Management
  addSectionHeader('⏰ Late Payment Management (After Due Date)');

  addCheckboxItem('Identify all tenants with outstanding rent by Day 6');
  addCheckboxItem('Send first polite reminder via SMS, email, or in-app message');
  addCheckboxItem('Make phone calls to tenants with large outstanding balances');
  addCheckboxItem('Understand reasons for late payment (financial hardship, etc.)');
  addCheckboxItem('Negotiate payment plans if necessary (document in writing)');
  addCheckboxItem('Issue formal late payment notice if no response by Day 10');
  addCheckboxItem('Calculate and communicate late fees (if in lease agreement)');
  addCheckboxItem('Consider legal action only after exhausting all options');
  yPosition += 2;

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 3', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('Automate your rent collection with Nyumbanii - Save hours every month!', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 4: RECORD KEEPING & REPORTING
  // ============================================
  doc.addPage();
  yPosition = 20;

  // Section 7: Record Keeping
  addSectionHeader('📊 Record Keeping & Documentation');

  addCheckboxItem('Update master rent collection spreadsheet or software');
  addCheckboxItem('File all payment receipts and transaction confirmations');
  addCheckboxItem('Maintain separate folder for each property/tenant');
  addCheckboxItem('Record payment method used (M-Pesa, bank, cash, cheque)');
  addCheckboxItem('Document all tenant communications regarding payments');
  addCheckboxItem('Keep backup copies (cloud storage recommended)');
  addCheckboxItem('Ensure all records comply with tax requirements (KRA)');
  yPosition += 2;

  // Section 8: Financial Reporting
  addSectionHeader('💰 Monthly Financial Reporting');

  addCheckboxItem('Calculate total rent collected vs. expected for the month');
  addCheckboxItem('Generate collection rate percentage (Target: 95%+ on time)');
  addCheckboxItem('Identify trends: chronic late payers, improving tenants');
  addCheckboxItem('Reconcile all accounts and resolve discrepancies');
  addCheckboxItem('Update profit & loss statement for the month');
  addCheckboxItem('Prepare reports for accountant or tax filing (quarterly)');
  addCheckboxItem('Review cash flow and plan for upcoming expenses');
  yPosition += 2;

  // Section 9: Tenant Relations
  addSectionHeader('🤝 Maintaining Positive Tenant Relationships');

  addCheckboxItem('Thank tenants who pay on time (build goodwill)');
  addCheckboxItem('Address payment-related complaints professionally');
  addCheckboxItem('Be flexible with hardship cases (while protecting your business)');
  addCheckboxItem('Provide clear receipts and payment confirmations always');
  addCheckboxItem('Maintain open communication channels (phone, email, in-app)');
  addCheckboxItem('Avoid aggressive or threatening language in reminders');
  yPosition += 2;

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 4', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('Track every payment effortlessly with Nyumbanii\'s automated reconciliation', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 5: LEGAL COMPLIANCE & OPTIMIZATION
  // ============================================
  doc.addPage();
  yPosition = 20;

  // Section 10: Legal Compliance (Kenya)
  addSectionHeader('⚖️ Legal Compliance for Kenyan Landlords');

  addCheckboxItem('Issue official receipts for all rent payments (legal requirement)');
  addCheckboxItem('Maintain proper books of accounts for KRA tax purposes');
  addCheckboxItem('Deduct and remit Rental Income Tax (10% withholding if applicable)');
  addCheckboxItem('Comply with Rent Restriction Act for controlled properties');
  addCheckboxItem('Follow proper notice periods (30/60 days) for evictions');
  addCheckboxItem('Respect tenant rights per Landlord & Tenant Act (Cap. 301)');
  addCheckboxItem('Keep records for minimum 7 years for audit purposes');
  addCheckboxItem('Register rental income with KRA and file annual returns');
  yPosition += 2;

  // Section 11: Process Optimization
  addSectionHeader('🚀 Continuous Improvement & Automation');

  addCheckboxItem('Review collection process monthly - identify pain points');
  addCheckboxItem('Survey tenants on payment experience and preferences');
  addCheckboxItem('Explore automation tools to reduce manual work');
  addCheckboxItem('Consider property management software (like Nyumbanii!)');
  addCheckboxItem('Set up automatic reminders and notifications');
  addCheckboxItem('Automate M-Pesa reconciliation with software integration');
  addCheckboxItem('Use digital receipts and statements to save time');
  addCheckboxItem('Train staff or property managers on best practices');
  yPosition += 2;

  // Section 12: End of Month Review
  addSectionHeader('📝 End-of-Month Review & Planning');

  addCheckboxItem('Calculate final collection rate for the month');
  addCheckboxItem('Review performance vs. previous months (improving trend?)');
  addCheckboxItem('Identify problematic tenants requiring action next month');
  addCheckboxItem('Plan improvements for next month\'s collection cycle');
  addCheckboxItem('Update tenant risk profiles based on payment history');
  addCheckboxItem('Prepare notices for non-paying tenants (if necessary)');
  addCheckboxItem('Celebrate wins and learn from challenges!');
  yPosition += 5;

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 5', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('Simplify legal compliance with Nyumbanii\'s automated reporting tools', pageWidth / 2, yPosition, { align: 'center' });

  // ============================================
  // PAGE 6: TIPS & CALL TO ACTION
  // ============================================
  doc.addPage();
  yPosition = 20;

  // Pro Tips Section
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPosition, contentWidth, 70, 3, 3, 'FD');

  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 122, 0);
  doc.text('💡 Pro Tips for 95%+ On-Time Collection Rate', margin + 10, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  const proTips = [
    '1. Consistency is Key: Send reminders at the same time every month',
    '2. Make it Easy: Offer multiple payment channels (M-Pesa, bank, etc.)',
    '3. Be Proactive: Communicate before problems arise',
    '4. Use Technology: Automate reminders, tracking, and receipts',
    '5. Build Relationships: Good tenants are your business partners',
    '6. Stay Professional: Firm but respectful in all communications',
    '7. Track Metrics: What gets measured gets improved'
  ];

  proTips.forEach(tip => {
    doc.text(tip, margin + 12, yPosition);
    yPosition += 6;
  });

  yPosition += 15;

  // Common Challenges Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Common Challenges & Solutions', margin, yPosition);
  yPosition += 10;

  const challenges = [
    {
      problem: 'Challenge: M-Pesa reconciliation takes hours',
      solution: 'Solution: Use automated software to match payments instantly'
    },
    {
      problem: 'Challenge: Tenants forget to pay on time',
      solution: 'Solution: Set up automated SMS/email reminders 3-5 days before'
    },
    {
      problem: 'Challenge: Hard to track multiple properties',
      solution: 'Solution: Centralize all data in one property management platform'
    },
    {
      problem: 'Challenge: Manual receipt generation is tedious',
      solution: 'Solution: Auto-generate digital receipts instantly upon payment'
    }
  ];

  doc.setFontSize(9);
  challenges.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(item.problem, margin + 5, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text(item.solution, margin + 5, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Call to Action Box
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPosition, contentWidth, 55, 3, 3, 'F');

  yPosition += 12;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Ready to Automate Your Rent Collection?', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Nyumbanii does all of this automatically - saving you 10+ hours monthly!', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFontSize(10);
  doc.text('✓ Automated M-Pesa Reconciliation  ✓ Digital Receipts  ✓ Smart Reminders', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 6;
  doc.text('✓ Financial Reports  ✓ Legal Compliance  ✓ Tenant Portal', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 122, 0);
  doc.text('Start Your Free Trial Today: www.nyumbanii.org', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 25;

  // Contact Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Contact Us:', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Email: info@nyumbanii.org | Phone: +254 700 000 000', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Web: www.nyumbanii.org', pageWidth / 2, yPosition, { align: 'center' });

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 6', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('© 2025 Nyumbanii - Simplifying Rental Management Across Kenya', pageWidth / 2, yPosition, { align: 'center' });

  return doc;
};

/**
 * Download the rent collection checklist PDF
 */
export const downloadRentCollectionChecklist = () => {
  const doc = generateRentCollectionChecklist();
  doc.save('Nyumbanii-Rent-Collection-Checklist.pdf');
};
