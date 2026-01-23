const {setGlobalOptions} = require("firebase-functions/v2");
const {defineSecret} = require("firebase-functions/params");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onCall} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const AfricasTalking = require("africastalking");

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets for API keys (set via Firebase Console or CLI)
// To set: firebase functions:secrets:set RESEND_API_KEY
// To set: firebase functions:secrets:set PAYSTACK_SECRET_KEY
const resendApiKey = defineSecret("RESEND_API_KEY");
const paystackSecretKey = defineSecret("PAYSTACK_SECRET_KEY");

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  timeoutSeconds: 540,
  memory: "256MiB"
});

// Helper function to get API keys at runtime
function getApiKeys() {
  return {
    resendKey: resendApiKey.value() || process.env.RESEND_API_KEY || "",
    paystackKey: paystackSecretKey.value() || process.env.PAYSTACK_SECRET_KEY || ""
  };
}

// ==========================================
// FIRESTORE TRIGGERS (Background Functions)
// ==========================================

/**
 * Send Team Member Invitation
 * Triggers when a new team member document is created
 */
exports.sendTeamInvitation = onDocumentCreated(
  {
    document: "teamMembers/{memberId}",
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        logger.warn("No data associated with the event");
        return;
      }

      const teamMember = snap.data();
      const memberId = event.params.memberId;

      // Only send if invitation hasn't been sent
      if (teamMember.invitationSent) {
        logger.info("Invitation already sent, skipping");
        return;
      }

      logger.info("Sending invitation to:", teamMember.email);

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      // Get landlord information
      const landlordDoc = await admin.firestore()
        .collection('users')
        .doc(teamMember.landlordId)
        .get();

      const landlordData = landlordDoc.data();
      const landlordName = landlordData?.displayName || 'Your Landlord';

      // Get assigned properties details
      let propertiesHtml = '<p>No properties assigned yet.</p>';
      if (teamMember.assignedProperties && teamMember.assignedProperties.length > 0) {
        const propertiesPromises = teamMember.assignedProperties.map(propId =>
          admin.firestore().collection('properties').doc(propId).get()
        );
        const propertiesDocs = await Promise.allSettled(propertiesPromises);
        const properties = propertiesDocs
          .filter(result => result.status === 'fulfilled' && result.value.exists)
          .map(result => result.value.data());

        if (properties.length > 0) {
          propertiesHtml = `
            <p><strong>Your assigned properties:</strong></p>
            <ul>
              ${properties.map(p => `<li>${p.name} - ${p.location}</li>`).join('')}
            </ul>
          `;
        }
      }

      const roleTitle = teamMember.role === 'property_manager'
        ? 'Property Manager'
        : 'Maintenance Staff';

      const { data, error } = await resendClient.emails.send({
        from: 'Nyumbanii Team <noreply@nyumbanii.org>',
        to: [teamMember.email],
        subject: 'Invitation to Join Nyumbanii Property Management',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 Nyumbanii</h1>
              </div>
              <div class="content">
                <h2>Welcome to Nyumbanii!</h2>
                <p>Hello ${teamMember.name},</p>
                <p>You have been invited by <strong>${landlordName}</strong> to join their property management team as a <strong>${roleTitle}</strong>.</p>
                
                ${propertiesHtml}
                
                <p>Click the button below to create your account and get started:</p>
                <center>
                  <a href="https://nyumbanii.web.app/register?invite=${teamMember.invitationToken}&type=${teamMember.role}" class="button">
                    Accept Invitation
                  </a>
                </center>
                
                <p><strong>Your Details:</strong></p>
                <ul>
                  <li>Name: ${teamMember.name}</li>
                  <li>Email: ${teamMember.email}</li>
                  <li>Phone: ${teamMember.phone}</li>
                  <li>Role: ${roleTitle}</li>
                </ul>
                
                <p>If you have any questions, please contact ${landlordName}.</p>
                
                <p>Best regards,<br>The Nyumbanii Team</p>
              </div>
              <div class="footer">
                <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Error sending invitation email:', {
          error: error,
          message: error.message,
          statusCode: error.statusCode,
          name: error.name
        });
        return;
      }

      logger.info('Invitation email sent successfully:', data);

      // Update team member status
      await snap.ref.update({
        invitationSent: true,
        invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error('Error in sendTeamInvitation function:', error);
      return null;
    }
  }
);

/**
 * Send Tenant Invitation
 * Triggers when a new tenant document is created
 */
exports.sendTenantInvitation = onDocumentCreated(
  {
    document: "tenants/{tenantId}",
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        logger.warn("No data associated with the event");
        return;
      }

      const tenant = snap.data();
      const tenantId = event.params.tenantId;

      // Only send invitation if status is 'pending' and invitation hasn't been sent
      if (tenant.status !== 'pending' || tenant.invitationSent) {
        logger.info('Skipping invitation - already sent or not pending');
        return;
      }

      logger.info('Sending invitation to tenant:', tenant.email);

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      // Get landlord information
      const landlordDoc = await admin.firestore()
        .collection('users')
        .doc(tenant.landlordId)
        .get();

      const landlordData = landlordDoc.data();
      const landlordName = landlordData?.displayName || 'Your Landlord';

      // Get property details
      const propertyDoc = await admin.firestore()
        .collection('properties')
        .doc(tenant.property)
        .get();

      const propertyData = propertyDoc.exists ? propertyDoc.data() : null;
      const propertyName = propertyData?.name || tenant.property;

      const { data, error } = await resendClient.emails.send({
        from: 'Nyumbanii <noreply@nyumbanii.org>',
        to: [tenant.email],
        subject: 'Welcome to Your Tenant Portal - Nyumbanii',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .property-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #003366; }
              .button { display: inline-block; background-color: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 Welcome to Nyumbanii!</h1>
              </div>
              <div class="content">
                <h2>Your Tenant Portal is Ready</h2>
                <p>Hello ${tenant.name},</p>
                <p><strong>${landlordName}</strong> has invited you to access your tenant portal on Nyumbanii.</p>
                
                <div class="property-box">
                  <h3 style="margin-top: 0;">Your Property Details</h3>
                  <p><strong>Property:</strong> ${propertyName}</p>
                  <p><strong>Unit:</strong> ${tenant.unit}</p>
                  <p><strong>Monthly Rent:</strong> KES ${tenant.rent?.toLocaleString()}</p>
                  <p><strong>Lease Start:</strong> ${tenant.leaseStart}</p>
                  <p><strong>Lease End:</strong> ${tenant.leaseEnd}</p>
                </div>
                
                <p><strong>With your tenant portal, you can:</strong></p>
                <ul>
                  <li>View your lease agreement and payment history</li>
                  <li>Submit maintenance requests online</li>
                  <li>Communicate with your property manager</li>
                  <li>Make and track rent payments</li>
                  <li>Access important documents</li>
                </ul>
                
                <p>Click the button below to create your account and access your portal:</p>
                <center>
                  <a href="https://nyumbanii.web.app/register?invite=${tenant.invitationToken}" class="button">
                    Create Your Account
                  </a>
                </center>
                
                <p>If you have any questions, please contact ${landlordName}.</p>
                
                <p>Best regards,<br>The Nyumbanii Team</p>
              </div>
              <div class="footer">
                <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Error sending tenant invitation email:', {
          error: error,
          message: error.message,
          statusCode: error.statusCode,
          name: error.name
        });
        return;
      }

      logger.info('Tenant invitation email sent successfully:', data);

      // Update tenant status
      await snap.ref.update({
        invitationSent: true,
        invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error('Error in sendTenantInvitation function:', error);
      return null;
    }
  }
);

// ==========================================
// CALLABLE FUNCTIONS (HTTPS)
// ==========================================

/**
 * Send Memo to Multiple Tenants
 */
exports.sendMemoToTenants = onCall(
  {
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (request) => {
    try {
      const { memo, landlord, tenants } = request.data;

      if (!memo || !tenants || tenants.length === 0) {
        throw new Error('Memo content and tenant list are required');
      }

      logger.info('Sending memo to', tenants.length, 'tenants');

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      // Send email to each tenant
      const emailPromises = tenants.map(tenant =>
        resendClient.emails.send({
          from: 'Nyumbanii <noreply@nyumbanii.org>',
          to: [tenant.email],
          subject: memo.subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .memo-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #003366; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📢 Important Notice</h1>
                </div>
                <div class="content">
                  <p>Dear ${tenant.name},</p>
                  
                  <div class="memo-box">
                    <h2 style="margin-top: 0;">${memo.subject}</h2>
                    <p style="white-space: pre-wrap;">${memo.content}</p>
                  </div>
                  
                  <p>This message was sent by <strong>${landlord.name}</strong>.</p>
                  
                  <p>Best regards,<br>The Nyumbanii Team</p>
                </div>
                <div class="footer">
                  <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Memo sent: ${successful} successful, ${failed} failed`);

      return { 
        success: true, 
        sent: successful,
        failed: failed,
        total: tenants.length
      };
    } catch (error) {
      logger.error('Error in sendMemoToTenants:', error);
      throw new Error(error.message);
    }
  }
);

/**
 * Send Email Verification Code
 */
exports.sendEmailVerificationCode = onCall(
  {
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (request) => {
    try {
      const { email, name, code } = request.data;

      if (!email || !code) {
        throw new Error('Email and code are required');
      }

      logger.info('Sending verification code to:', email);

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      const { data, error } = await resendClient.emails.send({
        from: 'Nyumbanii <noreply@nyumbanii.org>',
        to: [email],
        subject: 'Verify Your Email - Nyumbanii',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #003366; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
              .code-box { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .code { font-size: 42px; font-weight: bold; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 Nyumbanii</h1>
              </div>
              <div class="content">
                <h2 style="color: #003366;">Email Verification</h2>
                
                <p>Dear ${name || 'User'},</p>
                <p>Please use the following code to verify your email address:</p>

                <div class="code-box">
                  <p style="margin: 0; font-size: 14px;">Your Verification Code</p>
                  <div class="code">${code}</div>
                  <p style="margin: 0; font-size: 14px;">Enter this code in the verification field</p>
                </div>

                <p><strong>Important:</strong> This code will expire in 10 minutes.</p>
                
                <p>Best regards,<br>The Nyumbanii Team</p>
              </div>
              <div class="footer">
                <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Error sending verification email:', error);
        throw new Error(error.message);
      }

      logger.info('Verification email sent successfully');
      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error('Error in sendEmailVerificationCode:', error);
      throw new Error(error.message);
    }
  }
);

/**
 * Send Viewing Request Email to Landlord
 */
exports.sendViewingRequestEmail = onCall(
  {
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (request) => {
    try {
      const { viewing, landlordEmail } = request.data;

      if (!viewing || !landlordEmail) {
        throw new Error('Viewing data and landlord email are required');
      }

      logger.info('Sending viewing request to:', landlordEmail);

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      const { data, error } = await resendClient.emails.send({
        from: 'Nyumbanii <noreply@nyumbanii.org>',
        to: [landlordEmail],
        subject: `New Viewing Request - ${viewing.property}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #003366;">New Viewing Request</h2>
              <p><strong>Property:</strong> ${viewing.property}</p>
              <p><strong>From:</strong> ${viewing.prospectName}</p>
              <p><strong>Email:</strong> ${viewing.email}</p>
              <p><strong>Phone:</strong> ${viewing.phone}</p>
              <p><strong>Date:</strong> ${viewing.date} at ${viewing.time}</p>
              ${viewing.credibilityScore ? `<p><strong>Credibility Score:</strong> ${viewing.credibilityScore}/100</p>` : ''}
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error('Error in sendViewingRequestEmail:', error);
      throw new Error(error.message);
    }
  }
);

/**
 * Send Viewing Confirmation Email to Prospect
 */
exports.sendViewingConfirmationEmail = onCall(
  {
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (request) => {
    try {
      const { viewing, landlord } = request.data;

      if (!viewing || !landlord) {
        throw new Error('Viewing and landlord data are required');
      }

      logger.info('Sending confirmation to:', viewing.email);

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      const { data, error } = await resendClient.emails.send({
        from: 'Nyumbanii <noreply@nyumbanii.org>',
        to: [viewing.email],
        subject: `Viewing Confirmed - ${viewing.property}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #16a34a;">✓ Viewing Confirmed!</h2>
              <p>Dear ${viewing.prospectName},</p>
              <p>Your viewing request has been <strong>APPROVED</strong>.</p>
              <p><strong>Property:</strong> ${viewing.property}</p>
              <p><strong>Date:</strong> ${viewing.date} at ${viewing.time}</p>
              <p><strong>Landlord Contact:</strong> ${landlord.name} - ${landlord.phone}</p>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error('Error in sendViewingConfirmationEmail:', error);
      throw new Error(error.message);
    }
  }
);

// ==========================================
// SCHEDULED FUNCTIONS (Automated Workflows)
// ==========================================

/**
 * Send Automated Rent Reminders
 * Runs daily at 9:00 AM EAT (East Africa Time)
 * Sends reminders X days before rent is due based on landlord settings
 */
exports.sendRentReminders = onSchedule(
  {
    schedule: "0 9 * * *", // Daily at 9 AM
    timeZone: "Africa/Nairobi",
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (event) => {
    try {
      logger.info("🔔 Starting automated rent reminders job...");

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      const db = admin.firestore();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all landlords with auto rent reminders enabled
      const settingsSnapshot = await db.collection('landlordSettings')
        .where('automatedWorkflows.autoRentReminders', '==', true)
        .get();

      let totalReminders = 0;
      let totalErrors = 0;

      for (const settingsDoc of settingsSnapshot.docs) {
        try {
          const settings = settingsDoc.data();
          const landlordId = settingsDoc.id;
          const reminderDays = settings.automatedWorkflows?.rentReminderDays || 3;

          logger.info(`Processing landlord ${landlordId}, reminder days: ${reminderDays}`);

          // Calculate target due date (today + reminderDays)
          const targetDueDate = new Date(today);
          targetDueDate.setDate(targetDueDate.getDate() + reminderDays);
          const targetDateStr = targetDueDate.toISOString().split('T')[0];

          // Get all unpaid payments for this landlord due on target date
          const paymentsSnapshot = await db.collection('payments')
            .where('landlordId', '==', landlordId)
            .where('status', '==', 'pending')
            .where('dueDate', '==', targetDateStr)
            .get();

          logger.info(`Found ${paymentsSnapshot.size} payments due on ${targetDateStr}`);

          for (const paymentDoc of paymentsSnapshot.docs) {
            try {
              const payment = paymentDoc.data();

              // Get tenant details
              const tenantsSnapshot = await db.collection('tenants')
                .where('landlordId', '==', landlordId)
                .where('name', '==', payment.tenant)
                .limit(1)
                .get();

              if (tenantsSnapshot.empty) {
                logger.warn(`Tenant not found: ${payment.tenant}`);
                continue;
              }

              const tenant = tenantsSnapshot.docs[0].data();

              if (!tenant.email) {
                logger.warn(`No email for tenant: ${payment.tenant}`);
                continue;
              }

              // Format currency
              const currency = settings.businessPreferences?.currency || 'KSH';
              const currencySymbol = currency === 'KSH' ? 'KSH ' : '$';
              const formattedAmount = `${currencySymbol}${payment.amount.toLocaleString()}`;

              // Send reminder email
              const emailResult = await resendClient.emails.send({
                from: 'Nyumbanii <noreply@nyumbanii.org>',
                to: tenant.email,
                subject: `Rent Reminder: Payment Due in ${reminderDays} Days`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #003366;">Rent Payment Reminder</h2>
                    <p>Dear ${tenant.name},</p>
                    <p>This is a friendly reminder that your rent payment is due in <strong>${reminderDays} days</strong>.</p>

                    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Property:</strong> ${payment.property}</p>
                      <p style="margin: 5px 0;"><strong>Unit:</strong> ${payment.unit}</p>
                      <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${formattedAmount}</p>
                      <p style="margin: 5px 0;"><strong>Due Date:</strong> ${payment.dueDate}</p>
                    </div>

                    <p>Please ensure payment is made on or before the due date to avoid any late fees.</p>

                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                      This is an automated reminder from Karibu Nyumbanii.
                    </p>
                  </div>
                `
              });

              logger.info(`Reminder sent to ${tenant.email}: ${emailResult.id}`);
              totalReminders++;

              // Log notification in Firestore
              await db.collection('notifications').add({
                userId: tenant.userId || null,
                landlordId: landlordId,
                type: 'rent_reminder',
                title: 'Rent Reminder',
                message: `Your rent of ${formattedAmount} is due in ${reminderDays} days`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                  paymentId: paymentDoc.id,
                  dueDate: payment.dueDate,
                  amount: payment.amount
                }
              });

            } catch (error) {
              logger.error(`Error sending reminder for payment ${paymentDoc.id}:`, error);
              totalErrors++;
            }
          }
        } catch (error) {
          logger.error(`Error processing landlord ${settingsDoc.id}:`, error);
          totalErrors++;
        }
      }

      logger.info(`✅ Rent reminders completed. Sent: ${totalReminders}, Errors: ${totalErrors}`);
      return {success: true, sent: totalReminders, errors: totalErrors};

    } catch (error) {
      logger.error("❌ Error in sendRentReminders:", error);
      throw error;
    }
  }
);

/**
 * Send Automated Overdue Notices
 * Runs daily at 10:00 AM EAT
 * Sends notices for payments that are overdue
 */
exports.sendOverdueNotices = onSchedule(
  {
    schedule: "0 10 * * *", // Daily at 10 AM
    timeZone: "Africa/Nairobi",
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (event) => {
    try {
      logger.info("⚠️ Starting automated overdue notices job...");

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      const db = admin.firestore();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all landlords with auto overdue notices enabled
      const settingsSnapshot = await db.collection('landlordSettings')
        .where('automatedWorkflows.autoOverdueNotices', '==', true)
        .get();

      let totalNotices = 0;
      let totalErrors = 0;

      for (const settingsDoc of settingsSnapshot.docs) {
        try {
          const settings = settingsDoc.data();
          const landlordId = settingsDoc.id;
          const overdueDays = settings.automatedWorkflows?.overdueNoticeDays || 1;

          // Calculate target overdue date (today - overdueDays)
          const targetOverdueDate = new Date(today);
          targetOverdueDate.setDate(targetOverdueDate.getDate() - overdueDays);
          const targetDateStr = targetOverdueDate.toISOString().split('T')[0];

          logger.info(`Processing landlord ${landlordId}, checking for payments overdue since ${targetDateStr}`);

          // Get all overdue payments for this landlord
          const paymentsSnapshot = await db.collection('payments')
            .where('landlordId', '==', landlordId)
            .where('status', 'in', ['pending', 'overdue'])
            .where('dueDate', '<=', targetDateStr)
            .get();

          logger.info(`Found ${paymentsSnapshot.size} overdue payments`);

          for (const paymentDoc of paymentsSnapshot.docs) {
            try {
              const payment = paymentDoc.data();

              // Calculate days overdue
              const dueDate = new Date(payment.dueDate);
              const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

              // Get tenant details
              const tenantsSnapshot = await db.collection('tenants')
                .where('landlordId', '==', landlordId)
                .where('name', '==', payment.tenant)
                .limit(1)
                .get();

              if (tenantsSnapshot.empty) continue;

              const tenant = tenantsSnapshot.docs[0].data();
              if (!tenant.email) continue;

              // Calculate late fee if applicable
              const lateFeeEnabled = settings.financialSettings?.lateFeeEnabled || false;
              const lateFeePercentage = settings.financialSettings?.lateFeePercentage || 5;
              const gracePeriodDays = settings.financialSettings?.gracePeriodDays || 3;

              let lateFee = 0;
              let totalAmount = payment.amount;

              if (lateFeeEnabled && daysOverdue > gracePeriodDays) {
                lateFee = payment.amount * (lateFeePercentage / 100);
                totalAmount = payment.amount + lateFee;
              }

              // Format currency
              const currency = settings.businessPreferences?.currency || 'KSH';
              const currencySymbol = currency === 'KSH' ? 'KSH ' : '$';
              const formattedAmount = `${currencySymbol}${payment.amount.toLocaleString()}`;
              const formattedTotal = `${currencySymbol}${totalAmount.toLocaleString()}`;
              const formattedLateFee = `${currencySymbol}${lateFee.toLocaleString()}`;

              // Send overdue notice email
              const emailResult = await resendClient.emails.send({
                from: 'Nyumbanii <noreply@nyumbanii.org>',
                to: tenant.email,
                subject: `⚠️ Overdue Payment Notice - ${daysOverdue} Days Late`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Overdue Payment Notice</h2>
                    <p>Dear ${tenant.name},</p>
                    <p>This is to notify you that your rent payment is now <strong>${daysOverdue} days overdue</strong>.</p>

                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                      <p style="margin: 5px 0;"><strong>Property:</strong> ${payment.property}</p>
                      <p style="margin: 5px 0;"><strong>Unit:</strong> ${payment.unit}</p>
                      <p style="margin: 5px 0;"><strong>Original Amount:</strong> ${formattedAmount}</p>
                      ${lateFee > 0 ? `<p style="margin: 5px 0;"><strong>Late Fee (${lateFeePercentage}%):</strong> ${formattedLateFee}</p>` : ''}
                      ${lateFee > 0 ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Total Amount Due:</strong> ${formattedTotal}</p>` : ''}
                      <p style="margin: 5px 0;"><strong>Original Due Date:</strong> ${payment.dueDate}</p>
                      <p style="margin: 5px 0; color: #dc2626;"><strong>Days Overdue:</strong> ${daysOverdue} days</p>
                    </div>

                    <p><strong>Please make payment immediately to avoid further late fees and potential action.</strong></p>

                    <p>If you have already made this payment, please disregard this notice and contact your property manager.</p>

                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                      This is an automated notice from Karibu Nyumbanii.
                    </p>
                  </div>
                `
              });

              logger.info(`Overdue notice sent to ${tenant.email}: ${emailResult.id}`);
              totalNotices++;

              // Update payment status to overdue if it's still pending
              if (payment.status === 'pending') {
                await db.collection('payments').doc(paymentDoc.id).update({
                  status: 'overdue'
                });
              }

              // Log notification in Firestore
              await db.collection('notifications').add({
                userId: tenant.userId || null,
                landlordId: landlordId,
                type: 'overdue_notice',
                title: 'Overdue Payment',
                message: `Your rent payment is ${daysOverdue} days overdue`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                metadata: {
                  paymentId: paymentDoc.id,
                  dueDate: payment.dueDate,
                  amount: payment.amount,
                  daysOverdue: daysOverdue,
                  lateFee: lateFee
                }
              });

            } catch (error) {
              logger.error(`Error sending overdue notice for payment ${paymentDoc.id}:`, error);
              totalErrors++;
            }
          }
        } catch (error) {
          logger.error(`Error processing landlord ${settingsDoc.id}:`, error);
          totalErrors++;
        }
      }

      logger.info(`✅ Overdue notices completed. Sent: ${totalNotices}, Errors: ${totalErrors}`);
      return {success: true, sent: totalNotices, errors: totalErrors};

    } catch (error) {
      logger.error("❌ Error in sendOverdueNotices:", error);
      throw error;
    }
  }
);

/**
 * Generate Monthly Reports
 * Runs on the 1st of each month at 8:00 AM EAT
 * Generates and emails monthly financial reports to landlords
 */
exports.generateMonthlyReports = onSchedule(
  {
    schedule: "0 8 1 * *", // 1st of month at 8 AM
    timeZone: "Africa/Nairobi",
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (event) => {
    try {
      logger.info("📊 Starting monthly reports generation...");

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      const db = admin.firestore();

      // Calculate previous month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthName = lastMonth.toLocaleString('default', { month: 'long' });
      const year = lastMonth.getFullYear();

      // Get all landlords with auto monthly reports enabled
      const settingsSnapshot = await db.collection('landlordSettings')
        .where('automatedWorkflows.autoMonthlyReports', '==', true)
        .get();

      let totalReports = 0;
      let totalErrors = 0;

      for (const settingsDoc of settingsSnapshot.docs) {
        try {
          const settings = settingsDoc.data();
          const landlordId = settingsDoc.id;

          logger.info(`Generating report for landlord ${landlordId}`);

          // Get landlord profile
          const landlordDoc = await db.collection('users').doc(landlordId).get();
          const landlord = landlordDoc.data();

          if (!landlord || !landlord.email) {
            logger.warn(`No email found for landlord ${landlordId}`);
            continue;
          }

          // Get payments for last month
          const paymentsSnapshot = await db.collection('payments')
            .where('landlordId', '==', landlordId)
            .get();

          const lastMonthPayments = paymentsSnapshot.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(payment => {
              if (payment.paidDate) {
                const paidDate = new Date(payment.paidDate);
                return paidDate.getMonth() === lastMonth.getMonth() &&
                       paidDate.getFullYear() === lastMonth.getFullYear();
              }
              return false;
            });

          // Calculate statistics
          const totalIncome = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const totalLateFees = lastMonthPayments.reduce((sum, p) => sum + (p.lateFee || 0), 0);
          const totalCollected = totalIncome + totalLateFees;
          const paymentsReceived = lastMonthPayments.length;

          // Get total expected (all payments due in that month)
          const allPayments = paymentsSnapshot.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(payment => {
              const dueDate = new Date(payment.dueDate);
              return dueDate.getMonth() === lastMonth.getMonth() &&
                     dueDate.getFullYear() === lastMonth.getFullYear();
            });

          const totalExpected = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const collectionRate = totalExpected > 0 ? ((totalIncome / totalExpected) * 100).toFixed(1) : 0;

          // Format currency
          const currency = settings.businessPreferences?.currency || 'KSH';
          const currencySymbol = currency === 'KSH' ? 'KSH ' : '$';

          // Send report email
          const emailResult = await resendClient.emails.send({
            from: 'Nyumbanii <noreply@nyumbanii.org>',
            to: landlord.email,
            subject: `Monthly Report: ${monthName} ${year}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366;">Monthly Financial Report</h2>
                <h3 style="color: #666;">${monthName} ${year}</h3>

                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Summary</h3>
                  <p style="margin: 10px 0;"><strong>Total Expected:</strong> ${currencySymbol}${totalExpected.toLocaleString()}</p>
                  <p style="margin: 10px 0;"><strong>Total Collected:</strong> ${currencySymbol}${totalCollected.toLocaleString()}</p>
                  <p style="margin: 10px 0;"><strong>Rental Income:</strong> ${currencySymbol}${totalIncome.toLocaleString()}</p>
                  <p style="margin: 10px 0;"><strong>Late Fees:</strong> ${currencySymbol}${totalLateFees.toLocaleString()}</p>
                  <p style="margin: 10px 0;"><strong>Collection Rate:</strong> ${collectionRate}%</p>
                  <p style="margin: 10px 0;"><strong>Payments Received:</strong> ${paymentsReceived}</p>
                </div>

                <p>You can view detailed reports and analytics in your dashboard.</p>

                <a href="https://nyumbanii.org/landlord/dashboard"
                   style="display: inline-block; background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                  View Dashboard
                </a>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  This is an automated monthly report from Karibu Nyumbanii.
                </p>
              </div>
            `
          });

          logger.info(`Monthly report sent to ${landlord.email}: ${emailResult.id}`);
          totalReports++;

        } catch (error) {
          logger.error(`Error generating report for landlord ${settingsDoc.id}:`, error);
          totalErrors++;
        }
      }

      logger.info(`✅ Monthly reports completed. Sent: ${totalReports}, Errors: ${totalErrors}`);
      return {success: true, sent: totalReports, errors: totalErrors};

    } catch (error) {
      logger.error("❌ Error in generateMonthlyReports:", error);
      throw error;
    }
  }
);

/**
 * Simple test function
 */
exports.helloWorld = onRequest(
  {
    region: "us-central1"
  },
  (request, response) => {
    logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase Functions v2!");
  }
);

// ==========================================
// KENYA POWER INTERRUPTION SCRAPER
// ==========================================

/**
 * Scrape Kenya Power website for planned power interruptions
 * Runs every 6 hours to check for new interruptions
 */
exports.scrapeKenyaPowerInterruptions = onSchedule(
  {
    schedule: "every 6 hours",
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "512MiB"
  },
  async (event) => {
    try {
      logger.info("🔌 Starting Kenya Power interruption scrape...");

      const db = admin.firestore();
      const KENYA_POWER_URL = "https://www.kplc.co.ke/customer-support#powerschedule";

      // Fetch the Kenya Power page
      const response = await axios.get(KENYA_POWER_URL, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const interruptions = [];

      // Find PDF links on the power schedule page
      const pdfLinks = [];
      $('a[href*=".pdf"]').each((index, element) => {
        const href = $(element).attr('href');
        const title = $(element).text().trim();
        const dateMatch = title.match(/(\d{2}\.\d{2}\.\d{4})/);

        if (href && title.toLowerCase().includes('power') && title.toLowerCase().includes('maintenance')) {
          pdfLinks.push({
            url: href.startsWith('http') ? href : `https://www.kplc.co.ke${href}`,
            title: title,
            date: dateMatch ? dateMatch[1] : null
          });
        }
      });

      logger.info(`📄 Found ${pdfLinks.length} PDF notices`);

      // Download and parse up to 3 most recent PDFs
      for (const pdfLink of pdfLinks.slice(0, 3)) {
        try {
          logger.info(`📥 Downloading PDF: ${pdfLink.title}`);

          const pdfResponse = await axios.get(pdfLink.url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const pdfBuffer = Buffer.from(pdfResponse.data);
          const pdfData = await pdf(pdfBuffer);
          const pdfText = pdfData.text;

          logger.info(`📖 Extracted ${pdfText.length} characters from PDF`);

          // Extract interruption details from PDF text
          const locations = extractLocationsFromPDF(pdfText);
          const dateInfo = pdfLink.date || extractDateFromPDF(pdfText);

          // Create an interruption entry for each location found
          for (const location of locations) {
            interruptions.push({
              title: `⚡ Power Interruption - ${location}`,
              content: `Scheduled power maintenance in ${location}. Check the full notice for specific times and affected areas.`,
              dateText: dateInfo || 'Check notice for dates',
              location: location,
              source: 'Kenya Power',
              sourceUrl: pdfLink.url,
              pdfTitle: pdfLink.title,
              scrapedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } catch (pdfError) {
          logger.error(`Error processing PDF ${pdfLink.title}:`, pdfError.message);
        }
      }

      logger.info(`📊 Found ${interruptions.length} interruption notices from PDFs`);

      // Write to powerOutages collection for the PowerOutagesList component
      for (const interruption of interruptions) {
        try {
          // Check if this outage already exists (avoid duplicates)
          const existingOutage = await db.collection('powerOutages')
            .where('sourceUrl', '==', interruption.sourceUrl)
            .where('location', '==', interruption.location)
            .limit(1)
            .get();

          if (existingOutage.empty) {
            await db.collection('powerOutages').add({
              status: 'scheduled', // Default to scheduled, can be updated to 'active' manually
              affectedAreas: [interruption.location], // Array format expected by frontend
              scheduledDate: interruption.dateText || '',
              startTime: '', // Extract from PDF if available
              endTime: '', // Extract from PDF if available
              description: interruption.content,
              tweetUrl: interruption.sourceUrl, // Using sourceUrl as the reference link
              source: 'Kenya Power',
              pdfTitle: interruption.pdfTitle,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              scrapedAt: interruption.scrapedAt
            });
            logger.info(`✅ Added power outage for ${interruption.location}`);
          } else {
            logger.info(`⏭️  Skipping duplicate outage for ${interruption.location}`);
          }
        } catch (outageError) {
          logger.error(`Error writing to powerOutages collection:`, outageError);
        }
      }

      // Get all landlord settings to distribute updates
      const settingsSnapshot = await db.collection('landlordSettings').get();
      let updateCount = 0;
      let notificationCount = 0;

      for (const settingsDoc of settingsSnapshot.docs) {
        const landlordId = settingsDoc.id;

        // Get landlord's properties to determine relevant locations
        const propertiesSnapshot = await db.collection('properties')
          .where('landlordId', '==', landlordId)
          .get();

        const landlordLocations = propertiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return (data.location || '').toLowerCase();
        });

        // Filter interruptions relevant to this landlord's locations
        for (const interruption of interruptions) {
          const isRelevant = landlordLocations.some(location => {
            const interruptionLoc = (interruption.location || '').toLowerCase();
            return location.includes(interruptionLoc) ||
                   interruptionLoc.includes(location) ||
                   location.split(',')[0].trim() === interruptionLoc.split(',')[0].trim();
          });

          if (isRelevant || interruptions.length <= 3) {
            // Check if this interruption already exists
            const existingUpdate = await db.collection('updates')
              .where('landlordId', '==', landlordId)
              .where('title', '==', interruption.title)
              .where('category', '==', 'power_interruption')
              .limit(1)
              .get();

            if (existingUpdate.empty) {
              // Create new update
              await db.collection('updates').add({
                landlordId: landlordId,
                title: `⚡ ${interruption.title}`,
                content: interruption.content,
                category: 'power_interruption',
                type: 'automated',
                location: interruption.location,
                source: interruption.source,
                sourceUrl: interruption.sourceUrl,
                dateText: interruption.dateText,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                scrapedAt: interruption.scrapedAt
              });

              updateCount++;

              // Notify all tenants of this landlord
              const tenantsSnapshot = await db.collection('tenants')
                .where('landlordId', '==', landlordId)
                .get();

              for (const tenantDoc of tenantsSnapshot.docs) {
                const tenant = tenantDoc.data();

                // Check if tenant's property location matches
                const tenantLocation = (tenant.property || '').toLowerCase();
                const interruptionLoc = (interruption.location || '').toLowerCase();

                if (tenantLocation.includes(interruptionLoc) ||
                    interruptionLoc.includes(tenantLocation) ||
                    !interruption.location) {

                  await db.collection('notifications').add({
                    userId: tenant.userId,
                    type: 'power_interruption',
                    title: '⚡ Power Interruption Alert',
                    message: `${interruption.title}`,
                    read: false,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    updateId: interruption.title,
                    location: interruption.location
                  });

                  notificationCount++;
                }
              }
            }
          }
        }
      }

      logger.info(`✅ Created ${updateCount} updates and ${notificationCount} notifications`);
      return {
        success: true,
        interruptions: interruptions.length,
        updates: updateCount,
        notifications: notificationCount
      };

    } catch (error) {
      logger.error("❌ Error scraping Kenya Power:", error);

      // Create a manual fallback notification for admins
      try {
        const db = admin.firestore();
        const settingsSnapshot = await db.collection('landlordSettings').limit(1).get();

        if (!settingsSnapshot.empty) {
          const landlordId = settingsSnapshot.docs[0].id;
          await db.collection('updates').add({
            landlordId: landlordId,
            title: '⚠️ Kenya Power Scraper Alert',
            content: `Unable to fetch power interruption updates automatically. Please check Kenya Power website manually: https://kplc.co.ke/category/view/50/planned-power-interruptions. Error: ${error.message}`,
            category: 'system_alert',
            type: 'automated',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (notifyError) {
        logger.error("Failed to create error notification:", notifyError);
      }

      throw error;
    }
  }
);

/**
 * Helper function to extract locations from PDF text
 */
function extractLocationsFromPDF(text) {
  const locations = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kitale',
    'Malindi', 'Garissa', 'Nyeri', 'Machakos', 'Meru', 'Kakamega', 'Kisii',
    'Kiambu', 'Kajiado', 'Kilifi', 'Ruiru', 'Naivasha', 'Kitui', 'Kericho',
    'Karen', 'Westlands', 'Kasarani', 'Embakasi', 'Dagoretti', 'Langata',
    'Parklands', 'Industrial Area', 'CBD', 'Ngong', 'Rongai', 'Kikuyu',
    'Lavington', 'Muthaiga', 'Runda', 'Kileleshwa', 'Kilimani', 'Upperhill',
    'South B', 'South C', 'Kahawa', 'Zimmerman', 'Roysambu', 'Githurai',
    'Juja', 'Mlolongo', 'Syokimau', 'Kitengela', 'Athi River'
  ];

  const foundLocations = new Set();
  const textLower = text.toLowerCase();

  for (const location of locations) {
    if (textLower.includes(location.toLowerCase())) {
      foundLocations.add(location);
    }
  }

  // If no specific locations found, try to extract from "AREA:" patterns
  const areaMatches = text.match(/AREA[:\s]+([A-Z\s,]+)/gi);
  if (areaMatches) {
    areaMatches.forEach(match => {
      const area = match.replace(/AREA[:\s]+/i, '').trim();
      locations.forEach(loc => {
        if (area.toLowerCase().includes(loc.toLowerCase())) {
          foundLocations.add(loc);
        }
      });
    });
  }

  return foundLocations.size > 0 ? Array.from(foundLocations) : ['Multiple Areas'];
}

/**
 * Helper function to extract date from PDF text
 */
function extractDateFromPDF(text) {
  // Try multiple date patterns
  const patterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i, // 15 January 2024
    /(?:DATE|ON)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Manual trigger for Kenya Power scraping (for testing)
 */
exports.manualScrapeKenyaPower = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 300
  },
  async (request) => {
    logger.info("🔌 Manual Kenya Power scrape triggered by:", request.auth?.uid);

    // Call the scheduled function logic
    try {
      // We'll simulate the scheduled event
      await exports.scrapeKenyaPowerInterruptions.run({});
      return { success: true, message: "Scrape completed successfully" };
    } catch (error) {
      logger.error("Error in manual scrape:", error);
      throw new Error(`Failed to scrape: ${error.message}`);
    }
  }
);

// ==========================================
// PAYSTACK WEBHOOK HANDLER
// ==========================================

/**
 * Paystack Webhook Handler
 * Processes payment notifications from Paystack
 */
exports.paystackWebhook = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [paystackSecretKey, resendApiKey]
  },
  async (req, res) => {
    try {
      // Verify the webhook is from Paystack
      const { paystackKey } = getApiKeys();
      const hash = require("crypto")
        .createHmac("sha512", paystackKey)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        logger.warn("⚠️ Invalid Paystack webhook signature");
        return res.status(401).send("Invalid signature");
      }

      const event = req.body;
      logger.info("📧 Paystack webhook received:", event.event);

      // Handle charge.success event
      if (event.event === "charge.success") {
        const { data } = event;
        const { reference, customer, metadata, amount, channel, paid_at } = data;

        logger.info("💰 Processing successful payment:", reference);

        // Extract metadata
        const userId = metadata?.custom_fields?.find(
          (field) => field.variable_name === "user_id"
        )?.value || metadata?.userId;

        const plan = metadata?.custom_fields?.find(
          (field) => field.variable_name === "subscription_plan"
        )?.value || metadata?.plan;

        if (!userId) {
          logger.error("❌ No user ID found in payment metadata");
          return res.status(400).send("No user ID in metadata");
        }

        // Calculate subscription end date (1 month from now)
        const startDate = admin.firestore.Timestamp.now();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        // Update landlord settings with subscription
        const settingsRef = admin.firestore().collection("landlordSettings").doc(userId);
        const settingsDoc = await settingsRef.get();

        const subscriptionData = {
          subscriptionStatus: "active",
          subscriptionTier: plan || "basic",
          subscriptionStartDate: startDate,
          subscriptionEndDate: admin.firestore.Timestamp.fromDate(endDate),
          paystackReference: reference,
          paystackCustomerId: customer?.customer_code,
          amount: amount,
          currency: "KES",
          interval: "monthly",
          autoRenew: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (settingsDoc.exists()) {
          await settingsRef.update(subscriptionData);
        } else {
          await settingsRef.set({
            userId: userId,
            ...subscriptionData,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Save payment history
        await admin.firestore().collection("paymentHistory").doc(reference).set({
          landlordId: userId,
          paystackReference: reference,
          paystackCustomerId: customer?.customer_code,
          amount: amount,
          currency: "KES",
          status: "success",
          plan: plan || "basic",
          paymentMethod: channel || "card",
          paidAt: paid_at,
          transactionDate: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Get user details
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const userData = userDoc.data();

        // Send confirmation email
        if (userData?.email) {
          try {
            // Get the actual API key at runtime
            const { resendKey } = getApiKeys();
            const resendClient = new Resend(resendKey);

            await resendClient.emails.send({
              from: "Nyumbanii <noreply@nyumbanii.org>",
              to: userData.email,
              subject: "Payment Successful - Subscription Activated",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #ea580c;">Payment Successful!</h2>
                  <p>Dear ${userData.displayName || "Valued Customer"},</p>
                  <p>Thank you for your payment. Your subscription has been activated successfully.</p>

                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Payment Details</h3>
                    <p><strong>Plan:</strong> ${plan?.toUpperCase() || "BASIC"}</p>
                    <p><strong>Amount:</strong> KES ${(amount / 100).toLocaleString()}</p>
                    <p><strong>Reference:</strong> ${reference}</p>
                    <p><strong>Valid Until:</strong> ${endDate.toLocaleDateString()}</p>
                  </div>

                  <p>You now have full access to all features of your ${plan || "basic"} plan.</p>

                  <p>If you have any questions, please don't hesitate to contact our support team.</p>

                  <p>Best regards,<br>The Nyumbanii Team</p>
                </div>
              `
            });
            logger.info("✅ Confirmation email sent to:", userData.email);
          } catch (emailError) {
            logger.error("❌ Error sending confirmation email:", emailError);
          }
        }

        logger.info("✅ Subscription activated for user:", userId);
      }

      res.status(200).send("Webhook processed");
    } catch (error) {
      logger.error("❌ Error processing Paystack webhook:", error);
      res.status(500).send("Internal server error");
    }
  }
);

/**
 * Verify Paystack Payment (Callable Function)
 * Allows frontend to verify payment status
 */
exports.verifyPaystackPayment = onCall(
  {
    region: "us-central1",
    secrets: [paystackSecretKey]
  },
  async (request) => {
    try {
      const { reference } = request.data;

      if (!reference) {
        throw new Error("Payment reference is required");
      }

      logger.info("🔍 Verifying payment:", reference);

      // Get API keys
      const { paystackKey } = getApiKeys();

      // Verify with Paystack API
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${paystackKey}`
          }
        }
      );

      const { data } = response.data;

      logger.info("✅ Payment verification result:", data.status);

      return {
        success: true,
        status: data.status,
        amount: data.amount,
        reference: data.reference,
        paidAt: data.paid_at
      };
    } catch (error) {
      logger.error("❌ Error verifying payment:", error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }
);

/**
 * Check Subscription Status (Callable Function)
 * Allows frontend to check if user's subscription is active
 */
exports.checkSubscriptionStatus = onCall(
  {
    region: "us-central1"
  },
  async (request) => {
    try {
      const userId = request.auth?.uid;

      if (!userId) {
        throw new Error("User must be authenticated");
      }

      logger.info("🔍 Checking subscription for user:", userId);

      const settingsRef = admin.firestore().collection("landlordSettings").doc(userId);
      const settingsDoc = await settingsRef.get();

      if (!settingsDoc.exists()) {
        return {
          hasSubscription: false,
          status: "inactive",
          tier: "free"
        };
      }

      const settings = settingsDoc.data();
      const now = new Date();
      const endDate = settings.subscriptionEndDate?.toDate();

      const isActive = settings.subscriptionStatus === "active" && endDate > now;

      return {
        hasSubscription: true,
        status: isActive ? "active" : "expired",
        tier: settings.subscriptionTier || "free",
        endDate: endDate?.toISOString(),
        daysRemaining: isActive ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : 0
      };
    } catch (error) {
      logger.error("❌ Error checking subscription:", error);
      throw new Error(`Failed to check subscription: ${error.message}`);
    }
  }
);

// ==========================================
// TENANT APPLICATION EMAIL NOTIFICATIONS
// ==========================================

/**
 * Send email notification when tenant application status changes
 * Triggers when tenantApplications document is updated
 */
exports.sendApplicationStatusEmail = onDocumentUpdated(
  {
    document: "tenantApplications/{applicationId}",
    region: "us-central1",
    secrets: [resendApiKey]
  },
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Only send if status changed
      if (before.status === after.status) {
        logger.info("Status unchanged, skipping email");
        return;
      }

      const applicationId = event.params.applicationId;
      logger.info(`📧 Application status changed: ${before.status} → ${after.status}`);

      // Prepare email content based on status
      let subject, htmlContent;

      if (after.status === 'approved') {
        subject = `✅ Application Approved - ${after.propertyName}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #16a34a; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
              .success-box { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
              .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <h2 style="color: #16a34a;">Your Application Has Been Approved</h2>

                <p>Dear ${after.fullName},</p>

                <p>Great news! Your tenant application for <strong>${after.propertyName}</strong> has been <strong>approved</strong>.</p>

                <div class="success-box">
                  <h3 style="margin-top: 0;">Application Details</h3>
                  <p><strong>Property:</strong> ${after.propertyName}</p>
                  <p><strong>Application ID:</strong> ${after.applicationId}</p>
                  <p><strong>Date Submitted:</strong> ${after.createdAt?.toDate ? new Date(after.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                </div>

                <h3>Next Steps:</h3>
                <ol>
                  <li>The landlord will contact you within 24-48 hours to discuss lease terms</li>
                  <li>Prepare necessary documents for lease signing</li>
                  <li>Arrange for security deposit and first month's rent payment</li>
                  <li>Schedule move-in date and property inspection</li>
                </ol>

                <p>If you have any questions, please contact the landlord directly.</p>

                <p>Best regards,<br>The Nyumbanii Team</p>
              </div>
              <div class="footer">
                <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (after.status === 'rejected') {
        subject = `Application Update - ${after.propertyName}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
              .info-box { background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Application Update</h1>
              </div>
              <div class="content">
                <h2>Application Status Update</h2>

                <p>Dear ${after.fullName},</p>

                <p>Thank you for your interest in <strong>${after.propertyName}</strong> and for taking the time to submit your application.</p>

                <div class="info-box">
                  <p>After careful review, we regret to inform you that we are unable to move forward with your application at this time.</p>
                  ${after.reviewNotes ? `<p><strong>Additional Information:</strong> ${after.reviewNotes}</p>` : ''}
                </div>

                <p>We encourage you to continue your search and wish you the best in finding your ideal home.</p>

                <p>If you have any questions about this decision, please feel free to contact us.</p>

                <p>Best regards,<br>The Nyumbanii Team</p>
              </div>
              <div class="footer">
                <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (after.status === 'under_review') {
        subject = `Application Under Review - ${after.propertyName}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
              .info-box { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔍 Application Under Review</h1>
              </div>
              <div class="content">
                <h2>Your Application is Being Reviewed</h2>

                <p>Dear ${after.fullName},</p>

                <p>Your tenant application for <strong>${after.propertyName}</strong> is now under review by the landlord.</p>

                <div class="info-box">
                  <h3 style="margin-top: 0;">What Happens Next?</h3>
                  <ul>
                    <li>The landlord is reviewing your application and documents</li>
                    <li>Background and credit checks may be conducted (if applicable)</li>
                    <li>You will be notified of the decision within 3-5 business days</li>
                  </ul>
                </div>

                <p><strong>Application ID:</strong> ${after.applicationId}</p>

                <p>If additional information is needed, the landlord will contact you directly using the information provided in your application.</p>

                <p>Thank you for your patience!</p>

                <p>Best regards,<br>The Nyumbanii Team</p>
              </div>
              <div class="footer">
                <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        // Skip email for other status changes
        logger.info(`No email template for status: ${after.status}`);
        return;
      }

      // Get the actual API key at runtime
      const { resendKey } = getApiKeys();
      const resendClient = new Resend(resendKey);

      // Send email
      const { data, error } = await resendClient.emails.send({
        from: 'Nyumbanii <noreply@nyumbanii.org>',
        to: [after.email],
        subject: subject,
        html: htmlContent,
      });

      if (error) {
        logger.error('Error sending application status email:', {
          error: error,
          message: error.message,
          applicationId: applicationId
        });
        return;
      }

      logger.info(`✅ Application status email sent to ${after.email}: ${data.id}`);

      // Update application with email sent timestamp
      await event.data.after.ref.update({
        statusEmailSent: true,
        statusEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEmailSentFor: after.status
      });

      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error('Error in sendApplicationStatusEmail function:', error);
      return null;
    }
  }
);

// ==========================================
// SMS/WHATSAPP REMINDERS - AFRICA'S TALKING
// ==========================================

// Get Africa's Talking credentials
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY || "placeholder";
const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || "sandbox";

// Initialize Africa's Talking SDK (lazy initialization)
function getAfricasTalking() {
  const config = functions.config();
  const credentials = {
    apiKey: config.africastalking?.api_key || AFRICASTALKING_API_KEY,
    username: config.africastalking?.username || AFRICASTALKING_USERNAME
  };
  return AfricasTalking(credentials);
}

/**
 * Scheduled function to send rent reminders
 * Runs daily at 9:00 AM EAT
 *
 * ⚠️ DISABLED: SMS reminders have been disabled to reduce costs.
 * Use WhatsApp reminders instead via sendWhatsAppMessage function.
 */
/* DISABLED - SMS TOO EXPENSIVE
exports.sendRentReminders = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "Africa/Nairobi",
    region: "us-central1"
  },
  async (event) => {
    try {
      const db = admin.firestore();
      const now = new Date();
      const currentDay = now.getDate();

      logger.info(`🔔 Running rent reminders job at ${now.toISOString()}`);

      // Get all active tenants
      const tenantsSnapshot = await db.collection('tenants')
        .where('status', '==', 'active')
        .get();

      const remindersToSend = [];

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenant = tenantDoc.data();
        const tenantId = tenantDoc.id;

        // Skip if tenant has no phone number
        if (!tenant.phone) {
          logger.info(`⏭️ Skipping tenant ${tenantId}: No phone number`);
          continue;
        }

        // Get landlord's reminder settings
        const landlordDoc = await db.collection('landlordSettings').doc(tenant.landlordId).get();
        const landlord = landlordDoc.exists ? landlordDoc.data() : null;

        if (!landlord || !landlord.reminderSettings?.enabled) {
          logger.info(`⏭️ Skipping tenant ${tenantId}: Landlord reminders disabled`);
          continue;
        }

        const settings = landlord.reminderSettings;
        const rentDueDay = parseInt(tenant.rentDueDay || settings.defaultRentDueDay || 5);
        const reminderDays = settings.reminderDays || [7, 3, 1]; // Days before rent is due

        // Calculate if today is a reminder day
        let daysUntilDue = rentDueDay - currentDay;
        if (daysUntilDue < 0) {
          // Handle month rollover
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          daysUntilDue = daysInMonth - currentDay + rentDueDay;
        }

        // Check if today is a reminder day
        if (reminderDays.includes(daysUntilDue)) {
          const landlordUserDoc = await db.collection('users').doc(tenant.landlordId).get();
          const landlordUserData = landlordUserDoc.data();

          const message = generateReminderMessage(tenant, landlordUserData, daysUntilDue, settings.messageType);

          remindersToSend.push({
            tenantId,
            tenantName: tenant.name,
            phone: formatPhoneNumber(tenant.phone),
            message,
            daysUntilDue,
            landlordId: tenant.landlordId
          });
        }

        // Check for overdue reminders (after due date)
        const overdueInterval = settings.overdueReminderInterval || 3;
        if (daysUntilDue < 0 && Math.abs(daysUntilDue) % overdueInterval === 0) {
          const landlordUserDoc = await db.collection('users').doc(tenant.landlordId).get();
          const landlordUserData = landlordUserDoc.data();

          const overdueMessage = generateOverdueMessage(tenant, landlordUserData, Math.abs(daysUntilDue));

          remindersToSend.push({
            tenantId,
            tenantName: tenant.name,
            phone: formatPhoneNumber(tenant.phone),
            message: overdueMessage,
            daysOverdue: Math.abs(daysUntilDue),
            landlordId: tenant.landlordId,
            isOverdue: true
          });
        }
      }

      logger.info(`📊 Found ${remindersToSend.length} reminders to send`);

      if (remindersToSend.length === 0) {
        return { success: true, sent: 0 };
      }

      // Send SMS in batches
      const results = await sendSMSBatch(remindersToSend);

      // Log results to Firestore
      const batch = db.batch();
      results.forEach(result => {
        const logRef = db.collection('smsLog').doc();
        batch.set(logRef, {
          ...result,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          type: result.isOverdue ? 'overdue_reminder' : 'rent_reminder'
        });
      });
      await batch.commit();

      logger.info(`✅ Sent ${results.filter(r => r.success).length} reminders successfully`);
      return { success: true, sent: results.length };

    } catch (error) {
      logger.error("❌ Error in sendRentReminders:", error);
      throw error;
    }
  }
);
*/ // END DISABLED sendRentReminders

/**
 * HTTP callable function to manually send a reminder to a specific tenant
 *
 * ⚠️ DISABLED: SMS reminders have been disabled to reduce costs.
 * Use WhatsApp reminders instead via sendWhatsAppMessage function.
 */
/* DISABLED - SMS TOO EXPENSIVE
exports.sendManualReminder = onCall(
  {
    region: "us-central1"
  },
  async (request) => {
    try {
      const userId = request.auth?.uid;
      if (!userId) {
        throw new Error("User must be authenticated");
      }

      const { tenantId, message } = request.data;

      if (!tenantId || !message) {
        throw new Error("tenantId and message are required");
      }

      const db = admin.firestore();
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();

      if (!tenantDoc.exists) {
        throw new Error("Tenant not found");
      }

      const tenant = tenantDoc.data();

      // Verify the caller is the landlord
      if (tenant.landlordId !== userId) {
        throw new Error("Not authorized to send reminder to this tenant");
      }

      if (!tenant.phone) {
        throw new Error("Tenant has no phone number");
      }

      const phone = formatPhoneNumber(tenant.phone);
      const result = await sendSMS(phone, message);

      // Log to Firestore
      await db.collection('smsLog').add({
        tenantId,
        tenantName: tenant.name,
        phone,
        message,
        success: result.success,
        response: result.response,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: userId,
        type: 'manual'
      });

      logger.info(`✅ Manual reminder sent to ${tenant.name}`);
      return { success: true, result };

    } catch (error) {
      logger.error("❌ Error in sendManualReminder:", error);
      throw new Error(error.message);
    }
  }
);
*/ // END DISABLED sendManualReminder

/**
 * Send Rent Reminder with Channel Selection and SMS Quota Management
 * Supports Email, WhatsApp, and SMS channels
 * Automatically manages SMS quotas (3 per tenant per month)
 */
exports.sendRentReminder = onCall(
  {
    region: "us-central1"
  },
  async (request) => {
    try {
      const userId = request.auth?.uid;
      if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const {
        landlordId,
        tenantId,
        tenantName,
        tenantEmail,
        tenantPhone,
        channel, // 'email', 'whatsapp', or 'sms'
        message,
        rentAmount,
        dueDate
      } = request.data;

      // Validation
      if (!landlordId || !tenantId || !channel || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
      }

      // Verify caller is the landlord
      if (landlordId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized');
      }

      const db = admin.firestore();
      const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"
      let success = false;
      let finalChannel = channel;
      let quotaDeducted = false;

      // Channel-specific sending logic
      if (channel === 'email') {
        // Send via Email
        if (!tenantEmail) {
          throw new functions.https.HttpsError('failed-precondition', 'Tenant has no email address');
        }

        try {
          const { resendKey } = getApiKeys();
          const resendClient = new Resend(resendKey);

          await resendClient.emails.send({
            from: 'Nyumbanii <noreply@nyumbanii.org>',
            to: [tenantEmail],
            subject: 'Rent Payment Reminder',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366;">Rent Payment Reminder</h2>
                <p>${message}</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Amount:</strong> KES ${rentAmount.toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Due Date:</strong> Day ${dueDate} of the month</p>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                  This is an automated reminder from Nyumbanii Property Management.
                </p>
              </div>
            `
          });

          success = true;
          logger.info(`✅ Email sent to ${tenantName}`);
        } catch (error) {
          logger.error('Email sending failed:', error);
          throw new functions.https.HttpsError('internal', 'Failed to send email');
        }

      } else if (channel === 'whatsapp') {
        // Send via WhatsApp
        if (!tenantPhone) {
          throw new functions.https.HttpsError('failed-precondition', 'Tenant has no phone number');
        }

        try {
          const phone = formatPhoneNumber(tenantPhone);
          const africastalking = getAfricasTalking();

          // For now, send via SMS as WhatsApp requires Business API setup
          // TODO: Integrate WhatsApp Business API when available
          await africastalking.SMS.send({
            to: [phone],
            message: message,
            from: 'Nyumbanii'
          });

          success = true;
          logger.info(`✅ WhatsApp (SMS fallback) sent to ${tenantName}`);

          // Log to whatsappLog
          await db.collection('whatsappLog').add({
            landlordId,
            tenantId,
            tenantName,
            phone,
            message,
            status: 'sent',
            fallbackUsed: true,
            originalChannel: 'whatsapp',
            finalChannel: 'sms',
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });

        } catch (error) {
          logger.error('WhatsApp sending failed, falling back to email:', error);

          // Fallback to email
          if (tenantEmail) {
            try {
              const { resendKey } = getApiKeys();
              const resendClient = new Resend(resendKey);

              await resendClient.emails.send({
                from: 'Nyumbanii <noreply@nyumbanii.org>',
                to: [tenantEmail],
                subject: 'Rent Payment Reminder',
                html: `<p>${message}</p>`
              });

              success = true;
              finalChannel = 'email';
              logger.info(`✅ Fallback email sent to ${tenantName}`);
            } catch (emailError) {
              throw new functions.https.HttpsError('internal', 'All channels failed');
            }
          } else {
            throw new functions.https.HttpsError('internal', 'WhatsApp failed and no email available');
          }
        }

      } else if (channel === 'sms') {
        // Send via SMS with Quota Management
        if (!tenantPhone) {
          throw new functions.https.HttpsError('failed-precondition', 'Tenant has no phone number');
        }

        // Check SMS Quota
        const quotaRef = db.collection('smsQuota').doc(tenantId);
        const quotaSnap = await quotaRef.get();
        let quotaData = quotaSnap.exists ? quotaSnap.data() : null;

        // Initialize or reset quota if needed
        if (!quotaData || quotaData.month !== currentMonth) {
          quotaData = {
            tenantId,
            landlordId,
            month: currentMonth,
            creditsUsed: 0,
            creditsRemaining: 3,
            lastResetDate: admin.firestore.FieldValue.serverTimestamp()
          };
          await quotaRef.set(quotaData);
        }

        // Check if credits available
        if (quotaData.creditsRemaining <= 0) {
          throw new functions.https.HttpsError('resource-exhausted', 'SMS quota exceeded for this tenant');
        }

        try {
          const phone = formatPhoneNumber(tenantPhone);
          const africastalking = getAfricasTalking();

          await africastalking.SMS.send({
            to: [phone],
            message: message,
            from: 'Nyumbanii'
          });

          // Deduct credit atomically
          await quotaRef.update({
            creditsUsed: admin.firestore.FieldValue.increment(1),
            creditsRemaining: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          success = true;
          quotaDeducted = true;
          logger.info(`✅ SMS sent to ${tenantName} (${quotaData.creditsRemaining - 1} credits remaining)`);

          // Log to smsLog
          await db.collection('smsLog').add({
            landlordId,
            tenantId,
            tenantName,
            phone,
            message,
            status: 'sent',
            quotaDeducted: true,
            type: 'rent_reminder',
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });

        } catch (error) {
          logger.error('SMS sending failed:', error);
          throw new functions.https.HttpsError('internal', 'Failed to send SMS');
        }
      } else {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid channel specified');
      }

      return {
        success: true,
        channel: finalChannel,
        quotaDeducted
      };

    } catch (error) {
      logger.error('❌ Error in sendRentReminder:', error);
      throw error;
    }
  }
);

/**
 * HTTP callable function to send WhatsApp message
 */
exports.sendWhatsAppMessage = onCall(
  {
    region: "us-central1"
  },
  async (request) => {
    try {
      const userId = request.auth?.uid;
      if (!userId) {
        throw new Error("User must be authenticated");
      }

      const { tenantId, message } = request.data;

      if (!tenantId || !message) {
        throw new Error("tenantId and message are required");
      }

      const db = admin.firestore();
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();

      if (!tenantDoc.exists) {
        throw new Error("Tenant not found");
      }

      const tenant = tenantDoc.data();

      if (tenant.landlordId !== userId) {
        throw new Error("Not authorized");
      }

      if (!tenant.phone) {
        throw new Error("Tenant has no phone number");
      }

      // Send WhatsApp via Africa's Talking
      const phone = formatPhoneNumber(tenant.phone);
      const result = await sendWhatsApp(phone, message);

      // Log to Firestore
      await db.collection('whatsappLog').add({
        tenantId,
        tenantName: tenant.name,
        phone,
        message,
        success: result.success,
        response: result.response,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: userId,
        type: 'manual'
      });

      logger.info(`✅ WhatsApp message sent to ${tenant.name}`);
      return { success: true, result };

    } catch (error) {
      logger.error("❌ Error in sendWhatsAppMessage:", error);
      throw new Error(error.message);
    }
  }
);

/**
 * Firestore trigger: Send payment confirmation when payment is verified
 *
 * ⚠️ DISABLED: SMS notifications have been disabled to reduce costs.
 * Email notifications are still sent for payment confirmations.
 */
/* DISABLED - SMS TOO EXPENSIVE
exports.sendPaymentConfirmation = onDocumentUpdated(
  {
    document: "payments/{paymentId}",
    region: "us-central1"
  },
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Only send if payment was just verified
      if (before.status !== 'verified' && after.status === 'verified') {
        const db = admin.firestore();
        const tenantDoc = await db.collection('tenants').doc(after.tenantId).get();

        if (!tenantDoc.exists || !tenantDoc.data().phone) {
          logger.info("⏭️ Skipping payment confirmation: No tenant or phone");
          return;
        }

        const tenant = tenantDoc.data();
        const landlordDoc = await db.collection('users').doc(tenant.landlordId).get();
        const landlord = landlordDoc.data();

        const message = `Dear ${tenant.name}, your payment of KES ${after.amount.toLocaleString()} for ${after.month} has been confirmed. Thank you! - ${landlord?.businessName || landlord?.displayName || 'Your Landlord'}`;

        const phone = formatPhoneNumber(tenant.phone);
        const result = await sendSMS(phone, message);

        // Log
        await db.collection('smsLog').add({
          tenantId: after.tenantId,
          tenantName: tenant.name,
          phone,
          message,
          success: result.success,
          response: result.response,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          type: 'payment_confirmation',
          paymentId: event.params.paymentId
        });

        logger.info(`✅ Payment confirmation sent to ${tenant.name}`);
      }
    } catch (error) {
      logger.error("❌ Error sending payment confirmation:", error);
    }
  }
);
*/ // END DISABLED sendPaymentConfirmation

/**
 * Firestore trigger: Send notification when maintenance request is updated
 *
 * ⚠️ DISABLED: SMS notifications have been disabled to reduce costs.
 * In-app notifications are still sent for maintenance updates.
 */
/* DISABLED - SMS TOO EXPENSIVE
exports.sendMaintenanceUpdate = onDocumentUpdated(
  {
    document: "maintenance/{requestId}",
    region: "us-central1"
  },
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Only send if status changed
      if (before.status !== after.status) {
        const db = admin.firestore();
        const tenantDoc = await db.collection('tenants').doc(after.tenantId).get();

        if (!tenantDoc.exists || !tenantDoc.data().phone) {
          logger.info("⏭️ Skipping maintenance update: No tenant or phone");
          return;
        }

        const tenant = tenantDoc.data();
        const statusMessages = {
          'in-progress': `Your maintenance request for "${after.issue}" is now being worked on.`,
          'completed': `Your maintenance request for "${after.issue}" has been completed.`,
          'rejected': `Your maintenance request for "${after.issue}" could not be processed.${after.rejectionReason ? ' Reason: ' + after.rejectionReason : ''}`
        };

        const message = statusMessages[after.status];
        if (!message) {
          return;
        }

        const phone = formatPhoneNumber(tenant.phone);
        const result = await sendSMS(phone, message);

        // Log
        await db.collection('smsLog').add({
          tenantId: after.tenantId,
          tenantName: tenant.name,
          phone,
          message,
          success: result.success,
          response: result.response,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          type: 'maintenance_update',
          requestId: event.params.requestId
        });

        logger.info(`✅ Maintenance update sent to ${tenant.name}`);
      }
    } catch (error) {
      logger.error("❌ Error sending maintenance update:", error);
    }
  }
);
*/ // END DISABLED sendMaintenanceUpdate

// ==========================================
// HELPER FUNCTIONS FOR SMS/WHATSAPP
// ⚠️ These SMS-related functions are disabled to reduce costs
// ==========================================

/* DISABLED - SMS TOO EXPENSIVE
function generateReminderMessage(tenant, landlord, daysUntilDue, messageType = 'friendly') {
  const propertyName = tenant.propertyName || 'your property';
  const landlordName = landlord?.businessName || landlord?.displayName || 'Your Landlord';
  const amount = tenant.rentAmount ? `KES ${tenant.rentAmount.toLocaleString()}` : 'rent';

  if (messageType === 'formal') {
    return `Dear ${tenant.name}, this is a reminder that your rent of ${amount} for ${propertyName} is due in ${daysUntilDue} day(s). Please ensure timely payment. - ${landlordName}`;
  } else {
    return `Hi ${tenant.name}! Just a friendly reminder that your rent of ${amount} is due in ${daysUntilDue} day(s). Thank you! - ${landlordName}`;
  }
}

function generateOverdueMessage(tenant, landlord, daysOverdue) {
  const propertyName = tenant.propertyName || 'your property';
  const landlordName = landlord?.businessName || landlord?.displayName || 'Your Landlord';
  const amount = tenant.rentAmount ? `KES ${tenant.rentAmount.toLocaleString()}` : 'rent';

  return `URGENT: Dear ${tenant.name}, your rent of ${amount} for ${propertyName} is ${daysOverdue} day(s) overdue. Please contact us immediately to avoid penalties. - ${landlordName}`;
}

function formatPhoneNumber(phone) {
  // Remove spaces, dashes, and ensure Kenya format (+254)
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // If starts with 0, replace with +254
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.substring(1);
  }

  // If doesn't start with +, add +254
  if (!cleaned.startsWith('+')) {
    cleaned = '+254' + cleaned;
  }

  return cleaned;
}

async function sendSMS(phone, message) {
  try {
    const africastalking = getAfricasTalking();
    const sms = africastalking.SMS;

    const result = await sms.send({
      to: [phone],
      message: message,
      from: null // Africa's Talking will use default shortcode
    });

    logger.info("📱 SMS sent:", result);

    const recipient = result.SMSMessageData.Recipients[0];
    return {
      success: recipient.status === 'Success',
      response: recipient
    };

  } catch (error) {
    logger.error("❌ Error sending SMS:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendSMSBatch(reminders) {
  const results = [];

  // Send in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < reminders.length; i += batchSize) {
    const batch = reminders.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (reminder) => {
        const result = await sendSMS(reminder.phone, reminder.message);
        return {
          ...reminder,
          success: result.success,
          response: result.response || result.error
        };
      })
    );

    results.push(...batchResults);

    // Wait 1 second between batches
    if (i + batchSize < reminders.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
*/ // END DISABLED SMS helper functions

// Keep sendWhatsApp active since WhatsApp is being used instead of SMS
async function sendWhatsApp(phone, message) {
  try {
    const africastalking = getAfricasTalking();

    // Africa's Talking WhatsApp Business API
    // Note: Requires WhatsApp Business API setup and approved templates
    logger.info("📲 Sending WhatsApp message to:", phone);

    // TODO: Implement proper WhatsApp API integration
    // For now, this is a placeholder that needs Africa's Talking WhatsApp Business API credentials
    // Reference: https://africastalking.com/whatsapp

    // Example implementation (uncomment when WhatsApp is configured):
    /*
    const result = await africastalking.WHATSAPP.send({
      phoneNumber: phone,
      message: message
    });

    logger.info("✅ WhatsApp sent:", result);
    return {
      success: true,
      response: result
    };
    */

    // Temporary: Log only (no actual sending until WhatsApp is configured)
    logger.warn("⚠️ WhatsApp not yet configured. Message logged but not sent.");
    return {
      success: false,
      error: "WhatsApp API not yet configured. Please set up Africa's Talking WhatsApp Business API."
    };

  } catch (error) {
    logger.error("❌ Error sending WhatsApp:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
