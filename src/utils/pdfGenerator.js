import { jsPDF } from 'jspdf';

/**
 * Generate a professional legal notice PDF for move-out notices
 * @param {Object} noticeData - The move-out notice data from Firestore
 * @returns {jsPDF} PDF document instance
 */
export const generateLegalNoticePDF = (noticeData) => {
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = 20;

  // Helper function to add text with word wrap
  const addText = (text, fontSize = 11, align = 'left', isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += (lines.length * fontSize * 0.5);
    }
    yPosition += 7;
  };

  // Helper function to add a horizontal line
  const addLine = () => {
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  // Header
  doc.setFillColor(25, 46, 91); // Blue-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTICE TO VACATE PREMISES', pageWidth / 2, 18, { align: 'center' });

  // Reset colors
  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  // Reference and date
  const referenceNumber = `MVN-${noticeData.id.substring(0, 8).toUpperCase()}`;
  const dateIssued = noticeData.noticeSubmittedDate?.toDate
    ? noticeData.noticeSubmittedDate.toDate().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  addText(`Reference No: ${referenceNumber}`, 10, 'left', true);
  addText(`Date Issued: ${dateIssued}`, 10);
  addText(`Notice Period: ${noticeData.noticePeriod || 30} Days`, 10);

  yPosition += 5;
  addLine();

  // TO Section
  addText('TO:', 12, 'left', true);
  addText(`${noticeData.tenantName || 'Tenant'}`, 11);
  if (noticeData.tenantIdNumber) {
    addText(`ID Number: ${noticeData.tenantIdNumber}`, 10);
  }
  addText(`${noticeData.propertyName || 'Property'}${noticeData.unit ? ', Unit ' + noticeData.unit : ''}`, 11);

  yPosition += 5;

  // FROM Section
  addText('FROM:', 12, 'left', true);
  addText(`${noticeData.landlordName || 'Landlord'}`, 11);
  if (noticeData.landlordEmail) {
    addText(`Contact: ${noticeData.landlordEmail}`, 10);
  }

  yPosition += 5;
  addLine();

  // Subject
  addText('SUBJECT: NOTICE TO VACATE', 13, 'center', true);
  yPosition += 3;

  // Legal Notice Body
  const moveOutDate = noticeData.intendedMoveOutDate?.toDate
    ? noticeData.intendedMoveOutDate.toDate().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'the specified date';

  const initiator = noticeData.initiatedBy === 'landlord' ? 'landlord' : 'tenant';

  if (initiator === 'tenant') {
    addText(`This notice is issued by the tenant in accordance with the tenancy agreement and applicable Kenyan laws governing landlord-tenant relationships.`);
    addText(`The tenant hereby notifies the landlord of their intention to vacate the above-mentioned premises on ${moveOutDate}, which is ${noticeData.noticePeriod || 30} days from the date of this notice.`);
  } else {
    addText(`This notice is issued in accordance with the tenancy agreement and applicable Kenyan laws governing landlord-tenant relationships.`);
    addText(`You are hereby notified that your tenancy at the above-mentioned premises will be terminated on ${moveOutDate}, which is ${noticeData.noticePeriod} days from the date of this notice.`);
  }

  yPosition += 5;

  // Reason
  if (noticeData.reason) {
    addText('REASON FOR NOTICE:', 11, 'left', true);
    addText(noticeData.reason, 11);
    yPosition += 3;
  }

  // Legal grounds (for landlord-initiated notices)
  if (noticeData.legalGrounds && initiator === 'landlord') {
    addText('LEGAL GROUNDS:', 11, 'left', true);
    addText(noticeData.legalGrounds, 11);
    yPosition += 3;
  }

  // Additional notes
  if (noticeData.additionalNotes) {
    addText('ADDITIONAL DETAILS:', 11, 'left', true);
    addText(noticeData.additionalNotes, 11);
    yPosition += 3;
  }

  yPosition += 5;

  // Requirements Section
  addText('REQUIREMENTS:', 12, 'left', true);
  const requirements = [
    `• Vacate the premises by ${moveOutDate}`,
    '• Settle all outstanding rent and utility bills',
    '• Property inspection will be scheduled prior to move-out',
    '• Return all keys, access cards, and property items',
    '• Deposit refund (if applicable) subject to property inspection results',
    '• Leave the property in good condition as per the tenancy agreement'
  ];

  requirements.forEach(req => {
    addText(req, 10);
  });

  yPosition += 10;
  addLine();

  // Footer
  addText('This is a legally binding notice. For any inquiries, please contact the parties mentioned above.', 9, 'center');
  yPosition += 5;

  addText(`Issued by: ${initiator === 'landlord' ? noticeData.landlordName : noticeData.tenantName}`, 10);
  addText(`Date: ${dateIssued}`, 10);
  addText(`Reference: ${referenceNumber}`, 10);

  yPosition += 15;

  // Signature line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, margin + 60, yPosition);
  yPosition += 5;
  addText('Authorized Signature', 9);

  // Watermark footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Nyumbanii Property Management System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  doc.text('www.nyumbanii.co.ke', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });

  return doc;
};

/**
 * Generate a professional payment receipt PDF
 * @param {Object} paymentData - The payment data from Firestore
 * @param {Object} tenantData - Additional tenant information
 * @param {Object} landlordData - Landlord information
 * @returns {jsPDF} PDF document instance
 */
export const generatePaymentReceiptPDF = (paymentData, tenantData = {}, landlordData = {}) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  // Helper function
  const addText = (text, fontSize = 11, align = 'left', isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);

    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, pageWidth - margin, yPosition, { align: 'right' });
    } else {
      doc.text(text, margin, yPosition);
    }
    yPosition += fontSize * 0.5 + 5;
  };

  const addLine = () => {
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };

  // Header
  doc.setFillColor(25, 46, 91); // Blue-900
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth / 2, 22, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // Receipt details
  const receiptNumber = paymentData.receiptNumber || `RCP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${paymentData.id?.substring(0, 5).toUpperCase() || '00000'}`;
  const dateIssued = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  addText(`Receipt No: ${receiptNumber}`, 11, 'left', true);
  addText(`Date Issued: ${dateIssued}`, 11);

  yPosition += 5;
  addLine();

  // Landlord Details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 35, 'F');
  yPosition += 8;

  addText('LANDLORD DETAILS:', 11, 'left', true);
  addText(`Name: ${landlordData.name || 'Landlord'}`, 10);
  if (landlordData.email || landlordData.phone) {
    addText(`Contact: ${landlordData.email || ''} ${landlordData.phone ? '| ' + landlordData.phone : ''}`, 10);
  }

  yPosition += 8;

  // Tenant Details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 40, 'F');
  yPosition += 8;

  addText('TENANT DETAILS:', 11, 'left', true);
  addText(`Name: ${tenantData.name || paymentData.tenantName || 'Tenant'}`, 10);
  if (tenantData.idNumber) {
    addText(`ID Number: ${tenantData.idNumber}`, 10);
  }
  addText(`Property: ${paymentData.propertyName || 'Property'}${paymentData.unit ? ', Unit ' + paymentData.unit : ''}`, 10);

  yPosition += 8;
  addLine();

  // Payment Details Header
  doc.setFillColor(25, 46, 91);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', pageWidth / 2, yPosition + 7, { align: 'center' });
  yPosition += 18;
  doc.setTextColor(0, 0, 0);

  // Payment information
  const paymentDate = paymentData.datePaid?.toDate
    ? paymentData.datePaid.toDate().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
    : dateIssued;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 10;

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Paid:', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`KES ${paymentData.amount?.toLocaleString() || '0'}`, leftCol + 35, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(paymentData.method || 'N/A', leftCol + 35, yPosition);
  yPosition += 8;

  // Right column
  yPosition = yPosition - 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Date:', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(paymentDate, rightCol + 32, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Reference No:', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(paymentData.referenceNumber || 'N/A', rightCol + 32, yPosition);
  yPosition += 8;

  // Period
  yPosition += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Period:', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(paymentData.month || 'N/A', leftCol + 35, yPosition);

  yPosition += 12;
  addLine();

  // Status Badge
  doc.setFillColor(34, 197, 94); // Green
  doc.roundedRect(margin, yPosition, 50, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID ✓', margin + 25, yPosition + 7, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  yPosition += 20;
  addLine();

  // Notes section
  if (paymentData.notes) {
    yPosition += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const notes = doc.splitTextToSize(paymentData.notes, pageWidth - (2 * margin));
    doc.text(notes, margin, yPosition);
    yPosition += notes.length * 5 + 10;
  }

  // Footer
  yPosition = doc.internal.pageSize.getHeight() - 30;
  addLine();

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and does not require a physical signature.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('For any inquiries, please contact the landlord using the details above.', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Nyumbanii Property Management System', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('www.nyumbanii.co.ke', pageWidth / 2, yPosition, { align: 'center' });

  return doc;
};

/**
 * Download a PDF document
 * @param {jsPDF} doc - The PDF document
 * @param {string} filename - The filename for download
 */
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Convert PDF to blob for Firebase Storage upload
 * @param {jsPDF} doc - The PDF document
 * @returns {Blob} PDF as blob
 */
export const pdfToBlob = (doc) => {
  return doc.output('blob');
};

/**
 * Generate a late payment notice PDF
 * @param {Object} noticeData - Late payment notice data
 * @returns {jsPDF} PDF document instance
 */
export const generateLatePaymentNoticePDF = (noticeData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  const addText = (text, fontSize = 11, align = 'left', isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
      doc.text(lines, margin, yPosition);
      yPosition += (lines.length * fontSize * 0.5);
    }
    yPosition += 7;
  };

  const addLine = () => {
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  // Header
  doc.setFillColor(220, 38, 38); // Red
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LATE PAYMENT NOTICE', pageWidth / 2, 18, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  const noticeNumber = `LPN-${noticeData.id?.substring(0, 8).toUpperCase() || Date.now().toString().slice(-8)}`;
  const dateIssued = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  addText(`Notice No: ${noticeNumber}`, 10, 'left', true);
  addText(`Date Issued: ${dateIssued}`, 10);
  yPosition += 5;
  addLine();

  // TO Section
  addText('TO:', 12, 'left', true);
  addText(`${noticeData.tenantName || 'Tenant'}`, 11);
  addText(`${noticeData.propertyName || 'Property'}${noticeData.unit ? ', Unit ' + noticeData.unit : ''}`, 11);
  yPosition += 5;

  // FROM Section
  addText('FROM:', 12, 'left', true);
  addText(`${noticeData.landlordName || 'Landlord'}`, 11);
  if (noticeData.landlordEmail) {
    addText(`Contact: ${noticeData.landlordEmail}`, 10);
  }
  yPosition += 5;
  addLine();

  // Subject
  addText('SUBJECT: OVERDUE RENT PAYMENT', 13, 'center', true);
  yPosition += 3;

  // Notice Body
  addText(`This is to notify you that your rent payment for ${noticeData.period || 'the specified period'} is overdue.`);
  yPosition += 5;

  // Payment Details
  doc.setFillColor(250, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 60, 'F');
  yPosition += 10;

  addText('PAYMENT DETAILS:', 11, 'left', true);
  addText(`Original Amount Due: KES ${noticeData.originalAmount?.toLocaleString() || '0'}`, 10);
  addText(`Due Date: ${noticeData.dueDate || 'N/A'}`, 10);
  addText(`Days Overdue: ${noticeData.daysOverdue || '0'} days`, 10);
  addText(`Late Fee: KES ${noticeData.lateFee?.toLocaleString() || '0'}`, 10);
  addText(`Total Amount Due: KES ${noticeData.totalAmountDue?.toLocaleString() || '0'}`, 11, 'left', true);

  yPosition += 10;

  // Payment Instructions
  addText('PAYMENT INSTRUCTIONS:', 12, 'left', true);
  addText(`Please make payment within ${noticeData.gracePeriodDays || 7} days to avoid further action.`);

  if (noticeData.paymentInstructions) {
    addText(noticeData.paymentInstructions, 10);
  }

  yPosition += 5;

  // Consequences
  doc.setFillColor(254, 226, 226);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 30, 'F');
  yPosition += 10;

  addText('IMPORTANT:', 11, 'left', true);
  addText('Failure to pay within the grace period may result in additional late fees, legal action, or eviction proceedings as per your tenancy agreement and Kenyan law.', 10);

  yPosition += 15;
  addLine();

  // Footer
  addText('Please contact us immediately if you are experiencing financial difficulties so we can discuss payment arrangements.', 9, 'center');

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Nyumbanii Property Management System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
};

/**
 * Generate an eviction notice PDF
 * @param {Object} noticeData - Eviction notice data
 * @returns {jsPDF} PDF document instance
 */
export const generateEvictionNoticePDF = (noticeData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  const addText = (text, fontSize = 11, align = 'left', isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
      doc.text(lines, margin, yPosition);
      yPosition += (lines.length * fontSize * 0.5);
    }
    yPosition += 7;
  };

  const addLine = () => {
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  // Header - Red background for urgency
  doc.setFillColor(153, 27, 27);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EVICTION NOTICE', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text('NOTICE TO VACATE PREMISES', pageWidth / 2, 25, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  const noticeNumber = `EVN-${noticeData.id?.substring(0, 8).toUpperCase() || Date.now().toString().slice(-8)}`;
  const dateIssued = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  addText(`Notice No: ${noticeNumber}`, 10, 'left', true);
  addText(`Date Issued: ${dateIssued}`, 10);
  addText(`Notice Period: ${noticeData.noticePeriod || 30} Days`, 10, 'left', true);
  yPosition += 5;
  addLine();

  // TO Section
  addText('TO:', 12, 'left', true);
  addText(`${noticeData.tenantName || 'Tenant'}`, 11, 'left', true);
  if (noticeData.tenantIdNumber) {
    addText(`ID Number: ${noticeData.tenantIdNumber}`, 10);
  }
  addText(`${noticeData.propertyName || 'Property'}${noticeData.unit ? ', Unit ' + noticeData.unit : ''}`, 11);
  yPosition += 5;

  // FROM Section
  addText('FROM:', 12, 'left', true);
  addText(`${noticeData.landlordName || 'Landlord'}`, 11, 'left', true);
  if (noticeData.landlordContact) {
    addText(`Contact: ${noticeData.landlordContact}`, 10);
  }
  yPosition += 5;
  addLine();

  // Legal Notice
  doc.setFillColor(254, 226, 226);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 15, 'F');
  yPosition += 10;
  addText('THIS IS A LEGAL NOTICE - IMMEDIATE ACTION REQUIRED', 12, 'center', true);
  yPosition += 5;

  // Notice Body
  addText(`You are hereby given ${noticeData.noticePeriod || 30} days' notice to vacate the above-mentioned premises.`);
  addText(`Eviction Date: ${noticeData.evictionDate || 'To be determined'}`, 11, 'left', true);
  yPosition += 5;

  // Grounds for Eviction
  addText('GROUNDS FOR EVICTION:', 12, 'left', true);
  addText(noticeData.grounds || 'Non-payment of rent and breach of tenancy agreement', 11);

  if (noticeData.details) {
    yPosition += 3;
    addText('DETAILS:', 11, 'left', true);
    addText(noticeData.details, 10);
  }

  yPosition += 10;

  // Legal Requirements
  addText('LEGAL REQUIREMENTS:', 12, 'left', true);
  const requirements = [
    '• You must vacate the premises by the specified eviction date',
    '• All outstanding rent and charges must be settled',
    '• The premises must be returned in good condition',
    '• All keys and property items must be returned',
    '• Failure to comply will result in legal eviction proceedings',
    '• Court orders may be obtained for forceful eviction if necessary'
  ];

  requirements.forEach(req => {
    addText(req, 10);
  });

  yPosition += 10;

  // Legal References
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 20, 'F');
  yPosition += 8;
  addText('This notice is issued in accordance with the Landlord and Tenant (Shops, Hotels and Catering Establishments) Act and other relevant Kenyan laws governing tenancy.', 9);

  yPosition += 15;
  addLine();

  // Signature
  addText(`Issued by: ${noticeData.landlordName || 'Landlord'}`, 10);
  addText(`Date: ${dateIssued}`, 10);
  addText(`Reference: ${noticeNumber}`, 10);

  yPosition += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, margin + 60, yPosition);
  yPosition += 5;
  addText('Landlord Signature', 9);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Nyumbanii Property Management System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
};

/**
 * Generate a rent increase letter PDF
 * @param {Object} letterData - Rent increase letter data
 * @returns {jsPDF} PDF document instance
 */
export const generateRentIncreaseLetterPDF = (letterData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  const addText = (text, fontSize = 11, align = 'left', isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
      doc.text(lines, margin, yPosition);
      yPosition += (lines.length * fontSize * 0.5);
    }
    yPosition += 7;
  };

  const addLine = () => {
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  // Header
  doc.setFillColor(25, 46, 91);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RENT INCREASE NOTIFICATION', pageWidth / 2, 18, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  const letterNumber = `RIN-${letterData.id?.substring(0, 8).toUpperCase() || Date.now().toString().slice(-8)}`;
  const dateIssued = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  addText(`Letter No: ${letterNumber}`, 10, 'left', true);
  addText(`Date: ${dateIssued}`, 10);
  yPosition += 5;
  addLine();

  // TO Section
  addText('TO:', 12, 'left', true);
  addText(`${letterData.tenantName || 'Tenant'}`, 11);
  addText(`${letterData.propertyName || 'Property'}${letterData.unit ? ', Unit ' + letterData.unit : ''}`, 11);
  yPosition += 5;

  // FROM Section
  addText('FROM:', 12, 'left', true);
  addText(`${letterData.landlordName || 'Landlord'}`, 11);
  if (letterData.landlordContact) {
    addText(`Contact: ${letterData.landlordContact}`, 10);
  }
  yPosition += 5;
  addLine();

  // Subject
  addText('SUBJECT: NOTICE OF RENT INCREASE', 13, 'center', true);
  yPosition += 3;

  // Letter Body
  addText(`Dear ${letterData.tenantName || 'Tenant'},`);
  yPosition += 3;

  addText('We hope this letter finds you well. We are writing to inform you of an upcoming adjustment to your monthly rent.');
  yPosition += 5;

  // Rent Details
  doc.setFillColor(240, 249, 255);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 50, 'F');
  yPosition += 10;

  addText('RENT ADJUSTMENT DETAILS:', 11, 'left', true);
  addText(`Current Monthly Rent: KES ${letterData.currentRent?.toLocaleString() || '0'}`, 10);
  addText(`New Monthly Rent: KES ${letterData.newRent?.toLocaleString() || '0'}`, 10);
  addText(`Increase Amount: KES ${letterData.increaseAmount?.toLocaleString() || '0'} (${letterData.increasePercentage || '0'}%)`, 10);
  addText(`Effective Date: ${letterData.effectiveDate || 'To be determined'}`, 10, 'left', true);

  yPosition += 10;

  // Reason for Increase
  if (letterData.reason) {
    addText('REASON FOR INCREASE:', 12, 'left', true);
    addText(letterData.reason, 10);
    yPosition += 5;
  }

  // Legal Notice Period
  addText(`This notice is provided ${letterData.noticePeriod || 90} days in advance as required by law. The new rent amount will take effect from ${letterData.effectiveDate || 'the specified date'}.`);
  yPosition += 5;

  // Additional Information
  if (letterData.additionalNotes) {
    addText('ADDITIONAL INFORMATION:', 11, 'left', true);
    addText(letterData.additionalNotes, 10);
    yPosition += 5;
  }

  // Closing
  addText('We appreciate your tenancy and value you as a tenant. If you have any questions or concerns regarding this rent increase, please do not hesitate to contact us.');
  yPosition += 5;

  addText('Sincerely,');
  yPosition += 10;

  addText(`${letterData.landlordName || 'Landlord'}`, 10, 'left', true);
  addText(`Date: ${dateIssued}`, 10);

  yPosition += 10;
  addLine();

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  addText('This rent increase notice complies with Kenyan tenancy laws requiring adequate notice period.', 9, 'center');

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Nyumbanii Property Management System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
};

/**
 * Generate a maintenance receipt PDF
 * @param {Object} receiptData - Maintenance receipt data
 * @returns {jsPDF} PDF document instance
 */
export const generateMaintenanceReceiptPDF = (receiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  const addText = (text, fontSize = 11, align = 'left', isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      doc.text(text, margin, yPosition);
    }
    yPosition += fontSize * 0.5 + 5;
  };

  const addLine = () => {
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };

  // Header
  doc.setFillColor(34, 197, 94); // Green
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MAINTENANCE RECEIPT', pageWidth / 2, 22, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  const receiptNumber = `MNT-${receiptData.id?.substring(0, 8).toUpperCase() || Date.now().toString().slice(-8)}`;
  const dateIssued = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  addText(`Receipt No: ${receiptNumber}`, 11, 'left', true);
  addText(`Date Issued: ${dateIssued}`, 11);
  yPosition += 5;
  addLine();

  // Property Details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 35, 'F');
  yPosition += 8;

  addText('PROPERTY DETAILS:', 11, 'left', true);
  addText(`Property: ${receiptData.propertyName || 'N/A'}`, 10);
  addText(`Unit: ${receiptData.unit || 'N/A'}`, 10);
  addText(`Tenant: ${receiptData.tenantName || 'N/A'}`, 10);

  yPosition += 8;

  // Maintenance Details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 45, 'F');
  yPosition += 8;

  addText('MAINTENANCE DETAILS:', 11, 'left', true);
  addText(`Issue: ${receiptData.issue || 'N/A'}`, 10);
  addText(`Description: ${receiptData.description || 'N/A'}`, 10);
  addText(`Date Reported: ${receiptData.dateReported || 'N/A'}`, 10);
  addText(`Date Completed: ${receiptData.dateCompleted || dateIssued}`, 10);
  addText(`Priority: ${receiptData.priority || 'Medium'}`, 10);

  yPosition += 8;

  // Cost Breakdown
  doc.setFillColor(25, 46, 91);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COST BREAKDOWN', pageWidth / 2, yPosition + 7, { align: 'center' });
  yPosition += 18;
  doc.setTextColor(0, 0, 0);

  if (receiptData.costBreakdown && receiptData.costBreakdown.length > 0) {
    receiptData.costBreakdown.forEach(item => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(item.description || 'Item', margin + 5, yPosition);
      doc.text(`KES ${item.amount?.toLocaleString() || '0'}`, pageWidth - margin - 5, yPosition, { align: 'right' });
      yPosition += 7;
    });
  } else {
    doc.setFontSize(10);
    doc.text('Labor Cost', margin + 5, yPosition);
    doc.text(`KES ${receiptData.laborCost?.toLocaleString() || '0'}`, pageWidth - margin - 5, yPosition, { align: 'right' });
    yPosition += 7;
    doc.text('Materials Cost', margin + 5, yPosition);
    doc.text(`KES ${receiptData.materialsCost?.toLocaleString() || '0'}`, pageWidth - margin - 5, yPosition, { align: 'right' });
    yPosition += 7;
  }

  yPosition += 5;
  addLine();

  // Total
  doc.setFillColor(34, 197, 94);
  doc.rect(margin, yPosition, pageWidth - (2 * margin), 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COST', margin + 5, yPosition + 8);
  doc.text(`KES ${receiptData.totalCost?.toLocaleString() || '0'}`, pageWidth - margin - 5, yPosition + 8, { align: 'right' });
  yPosition += 20;
  doc.setTextColor(0, 0, 0);

  // Payment Status
  if (receiptData.paymentStatus) {
    doc.setFillColor(receiptData.paymentStatus === 'Paid' ? 34 : 234, receiptData.paymentStatus === 'Paid' ? 197 : 179, receiptData.paymentStatus === 'Paid' ? 94 : 8);
    doc.roundedRect(margin, yPosition, 40, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(receiptData.paymentStatus.toUpperCase(), margin + 20, yPosition + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPosition += 15;
  }

  yPosition += 5;

  // Service Provider
  if (receiptData.serviceProvider) {
    addText(`Service Provider: ${receiptData.serviceProvider}`, 10);
    if (receiptData.serviceProviderContact) {
      addText(`Contact: ${receiptData.serviceProviderContact}`, 9);
    }
  }

  // Footer
  yPosition = doc.internal.pageSize.getHeight() - 25;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a computer-generated receipt for maintenance services rendered.', pageWidth / 2, yPosition, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Nyumbanii Property Management System', pageWidth / 2, yPosition + 6, { align: 'center' });

  return doc;
};
