# Maintenance Cost Tracking System - Complete Implementation Guide

## Overview
A comprehensive system for tracking maintenance costs from initial request through completion, including estimates, quotes, approvals, and budget management.

---

## Complete User Flow

### 1. **Tenant Submits Request**
```
Tenant Dashboard → Submit maintenance request
- Issue description
- Priority (low, medium, high, emergency)
- Photos/attachments
- Property/Unit information
```

**Status**: `pending` → Goes to Landlord/PM/Maintenance Staff

---

### 2. **Initial Review & Assessment**
**Landlord/Property Manager reviews the request**

**Options:**
- ✅ **Approve** → Assign to maintenance staff
- ❌ **Reject** → Add reason, notify tenant
- 💬 **Request more info** → Message tenant

**Status**: `pending` → `assigned`

---

### 3. **Maintenance Staff Provides Estimate**

**Staff Dashboard → View assigned request → Add Estimate**

**Estimate Form:**
```javascript
{
  estimatedCost: 5000,
  estimateNotes: "Replace leaking pipe section, labor + materials",
  costBreakdown: [
    { item: "Pipe materials", quantity: 2, unitCost: 1500, total: 3000 },
    { item: "Labor (2 hours)", quantity: 2, unitCost: 1000, total: 2000 }
  ],
  estimatedDuration: "2 hours",
  requiresQuote: false, // if cost > threshold (e.g., 10,000 KES)
}
```

**Auto-determination:**
- If `estimatedCost <= 10,000 KES` → Status: `estimated` (can proceed)
- If `estimatedCost > 10,000 KES` → Status: `quote_required` → Requires formal quote

**Notification:** Landlord/PM gets notified of estimate

---

### 4A. **Low Cost Path (≤10,000 KES) - Landlord Approves Estimate**

**Landlord Dashboard → Review estimate**

**Options:**
- ✅ **Approve** → Work can begin
  ```javascript
  {
    estimateApproved: true,
    approvedBy: landlordId,
    approvedAt: timestamp,
    approvedBudget: 5000
  }
  ```
  **Status**: `estimated` → `approved`

- ❌ **Reject** → Request new estimate or clarification
- 💬 **Negotiate** → Message maintenance staff

**Notification:** Maintenance staff notified to begin work

---

### 4B. **High Cost Path (>10,000 KES) - Quote Required**

**Maintenance Staff Dashboard → Add Quote**

**Quote Submission:**
```javascript
// New subcollection: maintenanceRequests/{requestId}/quotes/{quoteId}
{
  quoteNumber: "Q-2025-001",
  vendorName: "ABC Plumbing Services",
  vendorContact: "+254712345678",
  amount: 25000,
  description: "Complete pipe replacement and waterproofing",
  itemizedCosts: [
    { item: "Materials", cost: 15000 },
    { item: "Labor", cost: 8000 },
    { item: "Transport", cost: 2000 }
  ],
  validUntil: timestamp, // Quote expiry date
  attachments: [
    { name: "quote.pdf", url: "storage_url" }
  ],
  submittedBy: maintenanceStaffId,
  submittedAt: timestamp,
  status: "pending" // pending, approved, rejected, expired
}
```

**Multiple Quotes:**
- Staff can submit multiple quotes from different vendors
- Landlord can compare side-by-side
- Best value selection

**Status**: `quote_required` → `quotes_submitted`

---

### 5. **Quote Review & Approval**

**Landlord Dashboard → Review Quotes**

**Quote Comparison View:**
```
┌─────────────────────────────────────────────────────┐
│ Quote 1: ABC Plumbing    │ Quote 2: XYZ Services  │
│ KES 25,000               │ KES 22,000             │
│ ⭐⭐⭐⭐⭐ (4.8)            │ ⭐⭐⭐⭐☆ (4.2)           │
│ [View Details] [Approve] │ [View Details] [Approve]│
└─────────────────────────────────────────────────────┘
```

**Approval Actions:**
```javascript
{
  selectedQuoteId: "quote_abc_123",
  quoteApproved: true,
  approvedBy: landlordId,
  approvedAt: timestamp,
  approvedBudget: 25000,
  approvalNotes: "Proceed with ABC Plumbing"
}
```

**Status**: `quotes_submitted` → `approved`

**Notification:** Maintenance staff + selected vendor notified

---

### 6. **Work In Progress**

**Maintenance Staff marks work started**

```javascript
{
  workStartedAt: timestamp,
  workStartedBy: staffId,
  expectedCompletionDate: timestamp
}
```

**Status**: `approved` → `in_progress`

**Progress Updates (Optional):**
- Staff can add progress notes
- Upload photos during work
- Notify of any issues/changes

**Notification:** Tenant and Landlord get progress updates

---

### 7. **Work Completion & Final Cost**

**Maintenance Staff completes work**

**Completion Form:**
```javascript
{
  actualCost: 24500, // Final cost (may differ from estimate/quote)
  costVarianceReason: "Saved 500 on materials",
  finalCostBreakdown: [
    { item: "Materials", planned: 15000, actual: 14500 },
    { item: "Labor", planned: 8000, actual: 8000 },
    { item: "Transport", planned: 2000, actual: 2000 }
  ],
  workCompletedAt: timestamp,
  completionNotes: "All pipes replaced, tested for leaks",
  completionPhotos: ["url1", "url2"],

  // Receipt/Invoice
  receiptNumber: "INV-2025-001",
  receiptAttachment: "storage_url",

  // Payment tracking
  paymentStatus: "pending", // pending, paid
  paidAt: null,
  paidBy: null,
  paymentMethod: null
}
```

**Cost Variance Analysis:**
- If `actualCost > approvedBudget * 1.1` (10% over) → Requires explanation
- If `actualCost < approvedBudget * 0.9` (10% under) → Document savings

**Status**: `in_progress` → `completed`

**Notification:** Tenant + Landlord notified of completion

---

### 8. **Tenant Verification (Optional)**

**Tenant Dashboard → Verify completion**

```javascript
{
  tenantVerified: true,
  tenantVerifiedAt: timestamp,
  tenantRating: 5, // 1-5 stars
  tenantFeedback: "Great work, issue fully resolved"
}
```

**Status**: `completed` → `verified`

---

### 9. **Payment Recording**

**Landlord Dashboard → Record Payment**

```javascript
{
  paymentStatus: "paid",
  paidAt: timestamp,
  paidBy: landlordId,
  paymentMethod: "M-PESA", // M-PESA, Bank Transfer, Cash, Cheque
  paymentReference: "ABC123XYZ",

  // Link to payments collection (expense tracking)
  paymentRecordId: "payment_doc_id"
}

// Create corresponding payment record
payments collection:
{
  type: "maintenance_expense",
  maintenanceRequestId: "request_id",
  amount: 24500,
  property: "property_name",
  unit: "unit_number",
  category: "plumbing",
  paidTo: "ABC Plumbing Services",
  date: timestamp,
  landlordId: landlordId
}
```

**Status**: `verified` → `closed`

---

## Data Structure

### Enhanced MaintenanceRequests Collection

```javascript
maintenanceRequests/{requestId}
{
  // Existing fields
  id: string,
  tenantId: string,
  tenantName: string,
  landlordId: string,
  propertyId: string,
  property: string,
  unit: string,
  issue: string,
  description: string,
  priority: "low" | "medium" | "high" | "emergency",
  status: string, // see status flow below
  createdAt: timestamp,
  images: string[],

  // NEW: Assignment
  assignedTo: string, // maintenance staff ID
  assignedToName: string,
  assignedAt: timestamp,

  // NEW: Cost Estimation
  estimatedCost: number,
  estimateNotes: string,
  costBreakdown: [
    { item: string, quantity: number, unitCost: number, total: number }
  ],
  estimatedDuration: string,
  estimatedBy: string,
  estimatedAt: timestamp,

  // NEW: Approval
  requiresApproval: boolean, // auto-set if cost > threshold
  approvalThreshold: number, // e.g., 10000
  estimateApproved: boolean,
  approvedBy: string,
  approvedAt: timestamp,
  approvedBudget: number,
  approvalNotes: string,

  // NEW: Quote Management
  requiresQuote: boolean,
  quotesSubmitted: number, // count of quotes
  selectedQuoteId: string,

  // NEW: Work Progress
  workStartedAt: timestamp,
  workStartedBy: string,
  expectedCompletionDate: timestamp,
  progressUpdates: [
    { note: string, timestamp: timestamp, photos: string[] }
  ],

  // NEW: Completion
  actualCost: number,
  finalCostBreakdown: [
    { item: string, planned: number, actual: number }
  ],
  costVariance: number, // actualCost - approvedBudget
  costVarianceReason: string,
  workCompletedAt: timestamp,
  completionNotes: string,
  completionPhotos: string[],

  // NEW: Receipt/Invoice
  receiptNumber: string,
  receiptAttachment: string,

  // NEW: Payment
  paymentStatus: "pending" | "paid",
  paidAt: timestamp,
  paidBy: string,
  paymentMethod: string,
  paymentReference: string,
  paymentRecordId: string, // link to payments collection

  // NEW: Tenant Verification
  tenantVerified: boolean,
  tenantVerifiedAt: timestamp,
  tenantRating: number, // 1-5
  tenantFeedback: string,

  // Status tracking
  statusHistory: [
    { status: string, timestamp: timestamp, changedBy: string }
  ]
}
```

### New Subcollection: Quotes

```javascript
maintenanceRequests/{requestId}/quotes/{quoteId}
{
  quoteNumber: string,
  vendorName: string,
  vendorContact: string,
  vendorEmail: string,
  amount: number,
  description: string,
  itemizedCosts: [
    { item: string, cost: number }
  ],
  validUntil: timestamp,
  attachments: [
    { name: string, url: string, uploadedAt: timestamp }
  ],
  submittedBy: string, // staff ID
  submittedAt: timestamp,
  status: "pending" | "approved" | "rejected" | "expired",

  // If approved
  approvedBy: string,
  approvedAt: timestamp,
  approvalNotes: string,

  // If rejected
  rejectedBy: string,
  rejectedAt: timestamp,
  rejectionReason: string,

  // Vendor rating (after work completion)
  vendorRating: number,
  vendorFeedback: string
}
```

### Enhanced Payments Collection (for expense tracking)

```javascript
payments/{paymentId}
{
  // Existing fields for rent payments
  // ...

  // NEW: For maintenance expenses
  type: "rent" | "maintenance_expense" | "other",
  maintenanceRequestId: string, // if type = maintenance_expense
  category: "plumbing" | "electrical" | "painting" | "carpentry" | "other",
  paidTo: string, // vendor name
  receiptUrl: string,

  // Common fields
  amount: number,
  date: timestamp,
  landlordId: string,
  propertyId: string,
  property: string,
  unit: string
}
```

---

## Status Flow

```
pending → assigned → estimated → approved → in_progress → completed → verified → closed

Alternative paths:
- pending → rejected (landlord rejects request)
- estimated → quote_required (if cost > threshold)
- quote_required → quotes_submitted → approved
- approved → cancelled (work cancelled before start)
- in_progress → on_hold (work paused)
- completed → reopened (issue not resolved)
```

**Status Definitions:**
- `pending`: Awaiting landlord/PM review
- `assigned`: Assigned to maintenance staff
- `estimated`: Estimate provided, awaiting approval
- `quote_required`: Formal quote needed
- `quotes_submitted`: Quotes uploaded, awaiting selection
- `approved`: Approved to proceed with work
- `in_progress`: Work is being done
- `on_hold`: Work temporarily paused
- `completed`: Work finished, awaiting verification
- `verified`: Tenant confirmed completion
- `closed`: Fully completed and paid
- `rejected`: Request denied
- `cancelled`: Work cancelled
- `reopened`: Issue persists, needs more work

---

## Cost Threshold Settings

**Landlord Settings → Maintenance Budget**

```javascript
landlordSettings/{userId}
{
  maintenanceBudget: {
    autoApprovalThreshold: 10000, // Auto-approve estimates ≤ this amount
    quoteRequiredThreshold: 10000, // Require quotes for amounts > this
    monthlyBudget: 50000, // Total maintenance budget per month
    budgetAlerts: true, // Alert when approaching budget limit
    alertThreshold: 0.8, // Alert at 80% of budget
  }
}
```

---

## Budget Tracking Dashboard

### Monthly Maintenance Budget View

```
┌─────────────────────────────────────────────────────┐
│            January 2025 Maintenance Budget          │
├─────────────────────────────────────────────────────┤
│ Budget: KES 50,000                                  │
│ Spent: KES 38,500                                   │
│ Remaining: KES 11,500                               │
│ [████████████████░░░░] 77%                          │
├─────────────────────────────────────────────────────┤
│ Breakdown by Category:                              │
│ • Plumbing: KES 24,500 (64%)                       │
│ • Electrical: KES 8,000 (21%)                      │
│ • Painting: KES 6,000 (15%)                        │
├─────────────────────────────────────────────────────┤
│ Active Requests: 3                                  │
│ Pending Approvals: 2 (Est. KES 15,000)            │
│ ⚠️ Warning: Approving pending will exceed budget   │
└─────────────────────────────────────────────────────┘
```

### Analytics & Reports

**Maintenance Cost Analytics:**
1. **Monthly Trends**: Graph of spending over time
2. **Category Breakdown**: Pie chart by issue type
3. **Cost per Property**: Compare maintenance costs across properties
4. **Vendor Performance**: Rating, avg cost, completion time
5. **Estimate Accuracy**: Compare estimates vs actual costs
6. **Budget Utilization**: % of budget used each month

---

## Notifications

### Notification Triggers:

1. **Tenant submits request** → Landlord/PM
2. **Request assigned** → Maintenance staff
3. **Estimate provided** → Landlord/PM
4. **Estimate approved** → Maintenance staff
5. **Quote submitted** → Landlord/PM
6. **Quote approved** → Maintenance staff
7. **Work started** → Tenant, Landlord
8. **Work completed** → Tenant, Landlord
9. **Tenant verified** → Landlord
10. **Payment recorded** → Maintenance staff (if vendor)
11. **Budget alert** → Landlord (approaching limit)
12. **Cost overrun** → Landlord (actual > approved)

---

## UI Components to Build

### 1. Maintenance Staff Dashboard
- [ ] Add Estimate modal
- [ ] Add Quote modal (with file upload)
- [ ] Start Work button
- [ ] Add Progress Update modal
- [ ] Complete Work modal (with final cost)
- [ ] Upload Receipt/Invoice

### 2. Landlord/PM Dashboard
- [ ] Review Estimate modal
- [ ] Approve/Reject buttons
- [ ] Compare Quotes view (side-by-side)
- [ ] Budget Overview card
- [ ] Cost Analytics dashboard
- [ ] Record Payment modal

### 3. Tenant Dashboard
- [ ] View Estimate (read-only)
- [ ] Verify Completion modal
- [ ] Rate Service modal

### 4. Settings
- [ ] Budget configuration
- [ ] Approval thresholds
- [ ] Notification preferences

---

## Implementation Phases

### Phase 1: Basic Cost Tracking (Week 1-2)
✅ Add cost fields to maintenance requests
✅ Estimate submission by maintenance staff
✅ Approval workflow for landlord/PM
✅ Record actual costs on completion
✅ Cost variance tracking

### Phase 2: Quote System (Week 3-4)
✅ Create quotes subcollection
✅ Quote submission UI
✅ Multiple quotes comparison
✅ Quote approval workflow
✅ File upload for quotes

### Phase 3: Budget & Analytics (Week 5-6)
✅ Budget settings configuration
✅ Monthly budget tracking
✅ Expense categorization
✅ Analytics dashboard
✅ Reports generation

### Phase 4: Advanced Features (Week 7-8)
✅ Vendor management
✅ Cost templates for common repairs
✅ Predictive budgeting
✅ Export to Excel/PDF
✅ Integration with accounting

---

## Security Rules

```javascript
// Firestore rules additions
match /maintenanceRequests/{requestId} {
  // Existing rules...

  match /quotes/{quoteId} {
    // Only maintenance staff can create quotes
    allow create: if isAuthenticated() &&
                     getUserData().role in ['maintenance', 'property_manager'];

    // Landlord and maintenance staff can read quotes
    allow read: if isAuthenticated();

    // Only landlord can update quote status (approve/reject)
    allow update: if isAuthenticated() &&
                     getUserData().role in ['landlord', 'property_manager'];

    allow delete: if false; // No deletion, only status updates
  }
}

// Payment records for maintenance expenses
match /payments/{paymentId} {
  allow read, write: if isAuthenticated();
}
```

---

## Benefits of This System

### For Landlords:
✅ Full cost visibility before work begins
✅ Compare multiple quotes
✅ Budget control and tracking
✅ Cost history for tax purposes
✅ Vendor performance tracking
✅ Prevent cost overruns

### For Maintenance Staff:
✅ Clear scope and budget
✅ Professional quote submission
✅ Track work progress
✅ Document completion with photos
✅ Payment tracking

### For Tenants:
✅ Transparency on repair costs
✅ See estimate before work starts
✅ Track progress
✅ Verify quality before closure
✅ Rate service quality

### For Property Managers:
✅ Manage multiple properties' budgets
✅ Track maintenance costs per property
✅ Compare vendor pricing
✅ Generate expense reports
✅ Budget forecasting

---

## Future Enhancements

1. **AI Cost Prediction**: ML model predicts repair costs based on historical data
2. **Vendor Marketplace**: Connect with verified vendors
3. **Warranty Tracking**: Track warranties on repairs
4. **Preventive Maintenance**: Schedule regular maintenance
5. **Integration with Accounting**: Export to QuickBooks, Xero
6. **Mobile App**: Field technician app for on-site updates
7. **Photo Comparison**: Before/after photo comparison
8. **Video Updates**: Staff can upload video progress updates

---

## Next Steps

Ready to implement! Should I start with:
1. ✅ Phase 1: Basic cost tracking fields
2. ✅ Phase 2: Quote system
3. ✅ Phase 3: Budget tracking

Or implement all phases sequentially?
