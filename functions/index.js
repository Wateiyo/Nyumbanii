const {setGlobalOptions} = require("firebase-functions/v2");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onCall} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { Resend } = require("resend");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  timeoutSeconds: 540,
  memory: "256MiB"
});

// Initialize Resend with API key from environment
// For v2 functions, use process.env with defineString
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_W3AongKC_F2RkznoNFPjDxafD4D3qLXCD";
const resend = new Resend(RESEND_API_KEY);

// Log initialization
logger.info("✅ Resend initialized with API key");

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
    region: "us-central1"
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

      const { data, error } = await resend.emails.send({
        from: 'delivered@resend.dev',
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
                  <a href="https://nyumbanii.co.ke/signup?invite=${memberId}" class="button">
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
        logger.error('Error sending invitation email:', error);
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
    region: "us-central1"
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

      const { data, error } = await resend.emails.send({
        from: 'Nyumbanii <onboarding@resend.dev>',
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
                  <a href="https://nyumbanii.co.ke/tenant-signup?invite=${tenantId}" class="button">
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
        logger.error('Error sending tenant invitation email:', error);
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
    region: "us-central1"
  },
  async (request) => {
    try {
      const { memo, landlord, tenants } = request.data;

      if (!memo || !tenants || tenants.length === 0) {
        throw new Error('Memo content and tenant list are required');
      }

      logger.info('Sending memo to', tenants.length, 'tenants');

      // Send email to each tenant
      const emailPromises = tenants.map(tenant => 
        resend.emails.send({
          from: 'Nyumbanii <onboarding@resend.dev>',
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
    region: "us-central1"
  },
  async (request) => {
    try {
      const { email, name, code } = request.data;

      if (!email || !code) {
        throw new Error('Email and code are required');
      }

      logger.info('Sending verification code to:', email);

      const { data, error } = await resend.emails.send({
        from: 'Nyumbanii <onboarding@resend.dev>',
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
    region: "us-central1"
  },
  async (request) => {
    try {
      const { viewing, landlordEmail } = request.data;

      if (!viewing || !landlordEmail) {
        throw new Error('Viewing data and landlord email are required');
      }

      logger.info('Sending viewing request to:', landlordEmail);

      const { data, error } = await resend.emails.send({
        from: 'Nyumbanii <onboarding@resend.dev>',
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
    region: "us-central1"
  },
  async (request) => {
    try {
      const { viewing, landlord } = request.data;

      if (!viewing || !landlord) {
        throw new Error('Viewing and landlord data are required');
      }

      logger.info('Sending confirmation to:', viewing.email);

      const { data, error } = await resend.emails.send({
        from: 'Nyumbanii <onboarding@resend.dev>',
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
