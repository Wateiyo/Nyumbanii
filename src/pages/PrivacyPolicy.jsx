import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Bell } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#003366] hover:text-[#004488] transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#003366] to-[#004488] rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600 mt-1">Last updated: January 15, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Nyumbanii ("we", "our", "us"), we are committed to protecting your privacy and ensuring
              the security of your personal information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your data when you use our property management platform and services
              ("Services").
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using Nyumbanii, you agree to the collection and use of information in accordance with
              this Privacy Policy. We comply with the Kenya Data Protection Act, 2019 and follow
              international best practices for data protection.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
            </div>

            <div className="space-y-6">
              {/* 1.1 Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Personal Information You Provide</h3>
                <p className="text-gray-700 mb-3">When you register or use our Services, we collect:</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-700"><strong>Account Information:</strong> Name, email address, phone number, ID number, profile photo</p>
                  <p className="text-gray-700"><strong>Property Information:</strong> Property addresses, descriptions, rental amounts, lease details</p>
                  <p className="text-gray-700"><strong>Tenant Information:</strong> Names, contact details, lease agreements, payment history</p>
                  <p className="text-gray-700"><strong>Payment Information:</strong> Payment records, M-Pesa transaction references (we do NOT store credit card numbers or bank account details)</p>
                  <p className="text-gray-700"><strong>Communications:</strong> Messages sent through our platform, support tickets, feedback</p>
                  <p className="text-gray-700"><strong>Documents:</strong> Lease agreements, receipts, maintenance reports, photos</p>
                </div>
              </div>

              {/* 1.2 Automatically Collected Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Automatically Collected Information</h3>
                <p className="text-gray-700 mb-3">When you access our Services, we automatically collect:</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-700"><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</p>
                  <p className="text-gray-700"><strong>Usage Data:</strong> Pages visited, features used, time spent on platform, clicks, navigation paths</p>
                  <p className="text-gray-700"><strong>Location Data:</strong> General location based on IP address (not precise GPS location)</p>
                  <p className="text-gray-700"><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, analytics data</p>
                </div>
              </div>

              {/* 1.3 Information from Third Parties */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1.3 Information from Third Parties</h3>
                <p className="text-gray-700 mb-3">We may receive information from:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Paystack:</strong> Payment processing data, transaction status</li>
                  <li><strong>Firebase/Google:</strong> Authentication data, cloud storage metadata</li>
                  <li><strong>Analytics Providers:</strong> Aggregated usage statistics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
            </div>

            <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">To Provide and Improve Services</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Create and manage your account</li>
                  <li>Enable property and tenant management features</li>
                  <li>Process and track rent payments</li>
                  <li>Facilitate communication between landlords and tenants</li>
                  <li>Generate reports, receipts, and documents</li>
                  <li>Improve platform functionality and user experience</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">To Communicate With You</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Send rent reminders and notifications</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send important updates about the Services</li>
                  <li>Send marketing communications (with your consent)</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">For Security and Compliance</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Verify identity and prevent fraud</li>
                  <li>Protect against security threats and abuse</li>
                  <li>Comply with legal obligations and regulations</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Resolve disputes and investigate complaints</li>
                </ul>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">For Analytics and Research</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Analyze usage patterns and trends</li>
                  <li>Conduct market research and surveys</li>
                  <li>Develop new features and services</li>
                  <li>Create aggregated, anonymized statistics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Share Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Share Your Information</h2>
            <p className="text-gray-700 mb-4">
              We do NOT sell your personal information. We may share your information only in the following circumstances:
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">With Other Users (As Necessary)</h4>
                <p className="text-gray-700">
                  Landlords and tenants can see each other's contact information and property details as
                  needed to manage their rental relationship. Property managers and maintenance staff can
                  access information relevant to their assigned properties.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">With Service Providers</h4>
                <p className="text-gray-700 mb-2">We share data with trusted third-party service providers who help us operate our Services:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li><strong>Paystack:</strong> Payment processing</li>
                  <li><strong>Firebase/Google Cloud:</strong> Hosting, database, authentication, storage</li>
                  <li><strong>Email Services:</strong> Transactional and marketing emails</li>
                  <li><strong>Analytics Providers:</strong> Usage analytics and performance monitoring</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  These providers are bound by confidentiality agreements and may only use your data to
                  provide services to us.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">For Legal Compliance</h4>
                <p className="text-gray-700">We may disclose your information if required by law or in response to:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                  <li>Court orders, subpoenas, or legal processes</li>
                  <li>Requests from government authorities or law enforcement</li>
                  <li>Protection of our legal rights or the safety of others</li>
                  <li>Investigation of fraud, security issues, or Terms violations</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Business Transfers</h4>
                <p className="text-gray-700">
                  If Nyumbanii is involved in a merger, acquisition, sale of assets, or bankruptcy, your
                  information may be transferred to the successor entity. We will notify you of any such
                  change.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">With Your Consent</h4>
                <p className="text-gray-700">
                  We may share your information with other parties when you explicitly consent or direct
                  us to do so.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">4. Data Security</h2>
            </div>

            <p className="text-gray-700 mb-4">
              We implement robust technical and organizational measures to protect your personal information:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Technical Measures</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>SSL/TLS encryption for data in transit</li>
                  <li>Encryption at rest for sensitive data</li>
                  <li>Secure authentication (Firebase Auth)</li>
                  <li>Regular security audits and updates</li>
                  <li>Firewall protection and intrusion detection</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Organizational Measures</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Access controls and role-based permissions</li>
                  <li>Employee confidentiality agreements</li>
                  <li>Data breach response procedures</li>
                  <li>Regular staff security training</li>
                  <li>Vendor security assessments</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-4">
              <p className="text-gray-800 text-sm">
                <strong>Important:</strong> No method of transmission or storage is 100% secure. While we
                strive to protect your data, we cannot guarantee absolute security. You are responsible
                for maintaining the confidentiality of your account credentials.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information only as long as necessary to fulfill the purposes
              outlined in this Privacy Policy, unless a longer retention period is required or permitted
              by law.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-gray-700">
                <strong>Active Accounts:</strong> We retain your data while your account is active and as
                needed to provide Services.
              </p>
              <p className="text-gray-700">
                <strong>Deleted Accounts:</strong> After account deletion, we retain certain information
                for up to 90 days for backup and recovery purposes, then permanently delete it.
              </p>
              <p className="text-gray-700">
                <strong>Legal Requirements:</strong> We may retain data longer if required by law, for tax
                purposes, or to resolve disputes (typically 7 years for financial records).
              </p>
              <p className="text-gray-700">
                <strong>Anonymized Data:</strong> We may retain anonymized, aggregated data indefinitely
                for analytics and research.
              </p>
            </div>
          </section>

          {/* Your Privacy Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">6. Your Privacy Rights</h2>
            </div>

            <p className="text-gray-700 mb-4">
              Under the Kenya Data Protection Act, 2019, you have the following rights regarding your
              personal information:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Access</h4>
                  <p className="text-gray-700 text-sm">Request a copy of the personal information we hold about you.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Rectification</h4>
                  <p className="text-gray-700 text-sm">Correct inaccurate or incomplete information through your account settings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Deletion</h4>
                  <p className="text-gray-700 text-sm">Request deletion of your personal data, subject to legal retention requirements.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Restriction</h4>
                  <p className="text-gray-700 text-sm">Request restriction of processing in certain circumstances.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">5</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Data Portability</h4>
                  <p className="text-gray-700 text-sm">Receive your data in a structured, commonly used format.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">6</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Object</h4>
                  <p className="text-gray-700 text-sm">Object to processing of your data for marketing or other purposes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">7</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Right to Lodge a Complaint</h4>
                  <p className="text-gray-700 text-sm">File a complaint with the Office of the Data Protection Commissioner of Kenya.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-gray-800 font-medium mb-2">To Exercise Your Rights:</p>
              <p className="text-gray-700 text-sm">
                Contact us at <a href="mailto:privacy@nyumbanii.org" className="text-[#003366] hover:underline font-semibold">privacy@nyumbanii.org</a> with
                your request. We will respond within 30 days. You may need to verify your identity before
                we process your request.
              </p>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to improve your experience, analyze usage,
              and deliver personalized content.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Types of Cookies We Use:</h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-gray-700"><strong>Essential Cookies:</strong> Required for authentication, security, and basic functionality. Cannot be disabled.</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-gray-700"><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform.</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-gray-700"><strong>Preference Cookies:</strong> Remember your settings and preferences (e.g., dark mode, language).</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Managing Cookies:</h4>
                <p className="text-gray-700">
                  You can control cookies through your browser settings. However, disabling certain cookies
                  may affect platform functionality. Most browsers accept cookies by default.
                </p>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed">
                Our Services are NOT intended for individuals under the age of 18. We do not knowingly
                collect personal information from children. If you believe we have inadvertently collected
                data from a child, please contact us immediately, and we will delete such information.
              </p>
            </div>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your data may be transferred to and stored on servers located outside Kenya, including in the
              United States and Europe, where our service providers (Firebase, Google Cloud) operate.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We ensure that such transfers comply with Kenyan data protection laws and that appropriate
              safeguards are in place to protect your data, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
              <li>Standard contractual clauses approved by data protection authorities</li>
              <li>Adequacy decisions recognizing equivalent data protection standards</li>
              <li>Certifications and compliance frameworks (e.g., ISO 27001)</li>
            </ul>
          </section>

          {/* Marketing Communications */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">10. Marketing Communications</h2>
            </div>

            <p className="text-gray-700 mb-4">
              We may send you marketing emails about new features, special offers, and tips for using
              Nyumbanii. You can opt out at any time by:
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">• Clicking the "Unsubscribe" link in any marketing email</p>
              <p className="text-gray-700">• Updating your notification preferences in account settings</p>
              <p className="text-gray-700">• Contacting us at <a href="mailto:privacy@nyumbanii.org" className="text-[#003366] hover:underline">privacy@nyumbanii.org</a></p>
            </div>

            <p className="text-gray-700 mt-4">
              <strong>Note:</strong> Even if you opt out of marketing emails, we will still send you
              transactional emails (e.g., rent reminders, payment confirmations, account notifications)
              necessary for the Services.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third-Party Links and Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services may contain links to third-party websites, services, or applications (e.g.,
              Paystack payment pages). We are not responsible for the privacy practices or content of these
              third parties. We encourage you to review their privacy policies before providing any
              personal information.
            </p>
          </section>

          {/* Data Breach Notification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Data Breach Notification</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In the event of a data breach that affects your personal information, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Notify affected users within 72 hours of becoming aware of the breach</li>
              <li>Report the breach to the Office of the Data Protection Commissioner as required by law</li>
              <li>Provide information about the breach, its impact, and steps we're taking to address it</li>
              <li>Offer guidance on how to protect yourself from potential harm</li>
            </ul>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-3">
              <li>Posting the updated Privacy Policy on our website with a new "Last updated" date</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Displaying a prominent notice on the platform</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Your continued use of the Services after such changes constitutes acceptance of the updated
              Privacy Policy. If you do not agree to the changes, you must stop using our Services and
              delete your account.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                practices, please contact us:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">General Inquiries</h4>
                  <div className="space-y-1 text-gray-800">
                    <p><strong>Email:</strong> privacy@nyumbanii.org</p>
                    <p><strong>Phone:</strong> +254 700 000 000</p>
                    <p><strong>Website:</strong> <a href="https://nyumbanii.org" className="text-[#003366] hover:underline">www.nyumbanii.org</a></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h4>
                  <div className="space-y-1 text-gray-800">
                    <p><strong>Email:</strong> dpo@nyumbanii.org</p>
                    <p><strong>Address:</strong> Nairobi, Kenya</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Office of the Data Protection Commissioner</h4>
                <p className="text-gray-700 text-sm">
                  If you believe your data protection rights have been violated, you may lodge a complaint
                  with the Office of the Data Protection Commissioner of Kenya:
                </p>
                <p className="text-gray-800 mt-2">
                  <strong>Website:</strong> <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-[#003366] hover:underline">www.odpc.go.ke</a>
                </p>
              </div>
            </div>
          </section>

          {/* Consent and Acceptance */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-gray-700 leading-relaxed font-medium">
              By using Nyumbanii, you acknowledge that you have read, understood, and agree to this Privacy
              Policy and consent to our collection, use, and disclosure of your personal information as
              described herein.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm">
          <Link to="/terms-of-service" className="text-[#003366] hover:underline">Terms of Service</Link>
          <span className="text-gray-400">•</span>
          <Link to="/" className="text-[#003366] hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
