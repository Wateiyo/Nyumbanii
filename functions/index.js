const {setGlobalOptions} = require("firebase-functions");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { Resend } = require("resend");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Initialize Resend with API key from environment config
const RESEND_API_KEY = process.env.RESEND_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Send invitation email when team member is added
exports.sendTeamInvitation = onDocumentCreated(
  "teamMembers/{memberId}",
  async (event) => {
    try {
      if (!resend) {
        logger.error("Resend API key not configured");
        return { success: false, error: "Email service not configured" };
      }

      const teamMember = event.data.data();
      const memberId = event.params.memberId;

      logger.info("Sending invitation to:", teamMember.email);

      // Get landlord information
      const landlordDoc = await admin.firestore()
        .collection("users")
        .doc(teamMember.landlordId)
        .get();
      
      const landlordData = landlordDoc.data();
      const landlordName = landlordData?.displayName || "Your Landlord";

      // Get assigned properties details
      let propertiesHtml = "<p>No properties assigned yet.</p>";
      if (teamMember.assignedProperties && teamMember.assignedProperties.length > 0) {
        const propertiesPromises = teamMember.assignedProperties.map(propId =>
          admin.firestore().collection("properties").doc(propId).get()
        );
        const propertiesDocs = await Promise.all(propertiesPromises);
        const properties = propertiesDocs
          .filter(doc => doc.exists)
          .map(doc => doc.data());
        
        propertiesHtml = `
          <p><strong>Your assigned properties:</strong></p>
          <ul>
            ${properties.map(p => `<li>${p.name} - ${p.location}</li>`).join("")}
          </ul>
        `;
      }

      const roleTitle = teamMember.role === "property_manager" 
        ? "Property Manager" 
        : "Maintenance Staff";

      const { data, error } = await resend.emails.send({
        from: "Nyumbanii <onboarding@resend.dev>",
        to: [teamMember.email],
        subject: "Invitation to Join Nyumbanii Property Management",
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
        logger.error("Error sending invitation email:", error);
        return { success: false, error: error.message };
      }

      logger.info("Invitation email sent successfully:", data);

      // Update team member status
      await admin.firestore()
        .collection("teamMembers")
        .doc(memberId)
        .update({
          invitationSent: true,
          invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true, emailId: data.id };
    } catch (error) {
      logger.error("Error in sendTeamInvitation function:", error);
      return { success: false, error: error.message };
    }
  }
);

// Send memo emails to tenants when memo is created
exports.sendMemoToTenants = onDocumentCreated(
  "memos/{memoId}",
  async (event) => {
    try {
      if (!resend) {
        logger.error("Resend API key not configured");
        return { success: false, error: "Email service not configured" };
      }

      const memo = event.data.data();
      const memoId = event.params.memoId;

      logger.info("Processing memo:", memo.title);

      // Get landlord information
      const landlordDoc = await admin.firestore()
        .collection("users")
        .doc(memo.landlordId)
        .get();
      
      const landlordData = landlordDoc.data();
      const landlordName = landlordData?.displayName || "Your Landlord";

      // Get tenants based on target audience
      let tenantsQuery = admin.firestore().collection("tenants")
        .where("landlordId", "==", memo.landlordId);

      // If targeting specific property, filter by property name
      if (memo.targetAudience !== "all") {
        tenantsQuery = tenantsQuery.where("property", "==", memo.targetAudience);
      }

      const tenantsSnapshot = await tenantsQuery.get();
      const tenants = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info(`Sending memo to ${tenants.length} tenants`);

      // Determine priority styling
      const priorityColors = {
        urgent: { bg: "#dc2626", border: "#991b1b" },
        high: { bg: "#ea580c", border: "#c2410c" },
        normal: { bg: "#2563eb", border: "#1d4ed8" }
      };
      const priorityColor = priorityColors[memo.priority] || priorityColors.normal;

      // Send email to each tenant
      const emailPromises = tenants.map(async (tenant) => {
        try {
          const { data, error } = await resend.emails.send({
            from: "Nyumbanii <onboarding@resend.dev>",
            to: [tenant.email],
            subject: `${memo.priority === "urgent" ? "🚨 URGENT: " : ""}${memo.title}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                  .priority-badge { display: inline-block; background-color: ${priorityColor.bg}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
                  .message-box { background-color: white; padding: 20px; border-left: 4px solid ${priorityColor.border}; border-radius: 4px; margin: 20px 0; }
                  .tenant-info { background-color: #e5e7eb; padding: 15px; border-radius: 4px; margin: 15px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🏠 Nyumbanii</h1>
                  </div>
                  <div class="content">
                    <span class="priority-badge">${memo.priority} Priority</span>
                    <h2>${memo.title}</h2>
                    
                    <div class="message-box">
                      <p style="margin: 0; white-space: pre-wrap;">${memo.message}</p>
                    </div>
                    
                    <div class="tenant-info">
                      <p style="margin: 5px 0;"><strong>To:</strong> ${tenant.name}</p>
                      <p style="margin: 5px 0;"><strong>Property:</strong> ${tenant.property}</p>
                      <p style="margin: 5px 0;"><strong>Unit:</strong> ${tenant.unit}</p>
                    </div>
                    
                    <p style="margin-top: 20px;"><strong>From:</strong> ${landlordName}</p>
                    <p style="font-size: 12px; color: #666;">Sent on ${new Date(memo.sentAt).toLocaleString()}</p>
                    
                    <p style="margin-top: 30px;">If you have any questions or concerns, please contact your landlord.</p>
                    
                    <p>Best regards,<br>The Nyumbanii Team</p>
                  </div>
                  <div class="footer">
                    <p>© 2025 Nyumbanii Property Management. All rights reserved.</p>
                    <p>This is an automated message from your property management.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          if (error) {
            logger.error(`Error sending memo email to ${tenant.email}:`, error);
            return { success: false, tenantId: tenant.id, error: error.message };
          }

          // Create notification for tenant in their dashboard
          await admin.firestore().collection("notifications").add({
            userId: tenant.id,
            userType: "tenant",
            type: "memo",
            title: memo.title,
            message: memo.message,
            priority: memo.priority,
            memoId: memoId,
            landlordId: memo.landlordId,
            read: false,
            time: new Date().toISOString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          logger.info(`Memo email sent to ${tenant.email}`);
          return { success: true, tenantId: tenant.id, emailId: data.id };
        } catch (err) {
          logger.error(`Error processing tenant ${tenant.id}:`, err);
          return { success: false, tenantId: tenant.id, error: err.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      
      logger.info(`Memo sent to ${successCount}/${tenants.length} tenants`);

      // Update memo with sent status
      await admin.firestore()
        .collection("memos")
        .doc(memoId)
        .update({
          emailsSent: true,
          emailsSentAt: admin.firestore.FieldValue.serverTimestamp(),
          emailsSentCount: successCount,
          totalRecipients: tenants.length
        });

      return { 
        success: true, 
        totalSent: successCount, 
        totalRecipients: tenants.length,
        results: results
      };
    } catch (error) {
      logger.error("Error in sendMemoToTenants function:", error);
      return { success: false, error: error.message };
    }
  }
);

// Test endpoint to verify functions are working
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Nyumbanii Firebase Functions!");
});