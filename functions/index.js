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
        from: "Nyumbanii <onboarding@resend.dev>", // Use resend's test domain initially
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

// Test endpoint to verify functions are working
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Nyumbanii Firebase Functions!");
});