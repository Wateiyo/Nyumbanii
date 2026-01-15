import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, Shield, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
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
              <Scale className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-gray-600 mt-1">Last updated: January 15, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">1. Agreement to Terms</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Welcome to Nyumbanii ("Company", "we", "our", "us"). These Terms of Service ("Terms")
                govern your access to and use of the Nyumbanii platform, website, and services
                (collectively, the "Services").
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                By accessing or using our Services, you agree to be bound by these Terms and our Privacy
                Policy. If you do not agree to these Terms, please do not use our Services.
              </p>
            </div>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>"Platform"</strong> refers to the Nyumbanii property management software and all related services.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>"User"</strong> means any individual or entity that accesses or uses our Services, including landlords, tenants, property managers, and maintenance staff.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>"Account"</strong> means the account you create to access and use our Services.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>"Content"</strong> means any information, data, text, photos, or other materials uploaded or transmitted through the Services.</p>
              </div>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use our Services, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Comply with all applicable laws and regulations in Kenya</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration and Security</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>4.1 Account Creation:</strong> You must create an account to access certain
                features of our Services. You agree to provide accurate, current, and complete information
                during registration and to update such information as necessary.
              </p>
              <p>
                <strong>4.2 Account Security:</strong> You are responsible for maintaining the
                confidentiality of your account credentials and for all activities that occur under your
                account. You must immediately notify us of any unauthorized use of your account.
              </p>
              <p>
                <strong>4.3 Account Suspension:</strong> We reserve the right to suspend or terminate
                your account if we reasonably believe you have violated these Terms or engaged in
                fraudulent, illegal, or harmful activities.
              </p>
            </div>
          </section>

          {/* Subscription and Payment */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription and Payment Terms</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>5.1 Free Trial:</strong> We offer a 14-day free trial for new landlord accounts.
                No payment information is required during the trial period. At the end of the trial, you
                must subscribe to a paid plan to continue using landlord features.
              </p>
              <p>
                <strong>5.2 Subscription Plans:</strong> We offer multiple subscription tiers (Basic,
                Professional, Enterprise, Custom) with varying features and pricing. All prices are listed
                in Kenyan Shillings (KES) and are subject to change with 30 days' notice.
              </p>
              <p>
                <strong>5.3 Billing:</strong> Subscriptions are billed monthly or annually in advance.
                Payment is processed through Paystack, our secure payment provider. All fees are
                non-refundable except as required by law.
              </p>
              <p>
                <strong>5.4 Auto-Renewal:</strong> Subscriptions automatically renew at the end of each
                billing period unless you cancel before the renewal date. You can cancel your subscription
                at any time through your account settings.
              </p>
              <p>
                <strong>5.5 Taxes:</strong> All prices exclude applicable taxes, including VAT. You are
                responsible for paying all taxes associated with your subscription.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-[#003366]" />
              <h2 className="text-2xl font-bold text-gray-900">6. User Responsibilities and Conduct</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Upload or transmit viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use the Services for fraudulent, illegal, or harmful purposes</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Scrape, data mine, or use automated tools to access the Services</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Upload false, misleading, or inaccurate information</li>
            </ul>
          </section>

          {/* Landlord-Tenant Relationships */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Landlord-Tenant Relationships</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>7.1 Platform Role:</strong> Nyumbanii is a software platform that facilitates
                property management. We are NOT a party to any rental agreements, lease contracts, or
                other arrangements between landlords and tenants.
              </p>
              <p>
                <strong>7.2 Legal Compliance:</strong> All rental agreements, evictions, rent collection,
                and property management activities must comply with Kenyan law, including the Landlord and
                Tenant (Shops, Hotels and Catering Establishments) Act and the Rent Restriction Act.
              </p>
              <p>
                <strong>7.3 Dispute Resolution:</strong> We do not mediate, arbitrate, or resolve disputes
                between landlords and tenants. Any disputes must be resolved directly between the parties
                or through appropriate legal channels.
              </p>
              <p>
                <strong>7.4 Payment Processing:</strong> We provide tools to track rent payments but do
                not process rent payments between landlords and tenants. All rent payments are made
                directly between parties using M-Pesa, bank transfers, or other agreed methods.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property Rights</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>8.1 Our IP:</strong> The Platform, including all software, code, designs, logos,
                trademarks, and content, is owned by Nyumbanii and protected by Kenyan and international
                intellectual property laws. You may not copy, modify, distribute, or create derivative
                works without our written permission.
              </p>
              <p>
                <strong>8.2 Your Content:</strong> You retain ownership of all Content you upload to the
                Platform. By uploading Content, you grant us a non-exclusive, worldwide, royalty-free
                license to use, store, and display such Content solely to provide the Services.
              </p>
              <p>
                <strong>8.3 Feedback:</strong> Any feedback, suggestions, or ideas you provide to us
                become our property, and we may use them without any obligation to you.
              </p>
            </div>
          </section>

          {/* Data and Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Protection and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Our collection, use, and protection of your personal data
              is governed by our <Link to="/privacy-policy" className="text-[#003366] hover:underline font-semibold">Privacy Policy</Link>,
              which is incorporated into these Terms by reference. By using our Services, you consent to
              our data practices as described in the Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We comply with the Kenya Data Protection Act, 2019 and implement appropriate technical and
              organizational measures to protect your data.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Service Availability and Modifications</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>10.1 Availability:</strong> We strive to provide reliable and uninterrupted
                access to our Services. However, we do not guarantee that the Services will be available
                at all times or free from errors, bugs, or interruptions.
              </p>
              <p>
                <strong>10.2 Maintenance:</strong> We may temporarily suspend access to the Services for
                maintenance, updates, or emergency repairs. We will provide advance notice when possible.
              </p>
              <p>
                <strong>10.3 Modifications:</strong> We reserve the right to modify, suspend, or
                discontinue any feature or aspect of the Services at any time without liability to you.
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">11. Disclaimers and Limitations</h2>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg space-y-4">
              <p className="text-gray-800 leading-relaxed">
                <strong>11.1 AS-IS BASIS:</strong> THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE"
                WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="text-gray-800 leading-relaxed">
                <strong>11.2 NO LEGAL ADVICE:</strong> We are a technology platform, not a law firm.
                Nothing in our Services constitutes legal advice. You should consult qualified legal
                professionals regarding landlord-tenant law, evictions, contracts, or other legal matters.
              </p>
              <p className="text-gray-800 leading-relaxed">
                <strong>11.3 NO FINANCIAL ADVICE:</strong> We do not provide financial, tax, or
                accounting advice. Consult qualified professionals for such matters.
              </p>
              <p className="text-gray-800 leading-relaxed">
                <strong>11.4 THIRD-PARTY SERVICES:</strong> We integrate with third-party services
                (Paystack, Firebase, etc.). We are not responsible for the availability, accuracy, or
                reliability of third-party services.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Limitation of Liability</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
              <p className="text-gray-800 leading-relaxed font-semibold mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <p className="text-gray-800 leading-relaxed mb-3">
                NYUMBANII SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR
                OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-800 ml-4">
                <li>Your access to or use of (or inability to access or use) the Services</li>
                <li>Any conduct or content of third parties on the Services</li>
                <li>Unauthorized access, use, or alteration of your Content</li>
                <li>Loss of rent payments, tenant disputes, or property damage</li>
              </ul>
              <p className="text-gray-800 leading-relaxed mt-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS
                PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR KES 10,000, WHICHEVER IS GREATER.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Nyumbanii, its officers, directors,
              employees, agents, and affiliates from and against any claims, liabilities, damages, losses,
              costs, or expenses (including reasonable attorneys' fees) arising out of or related to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or regulations</li>
              <li>Your violation of any third-party rights</li>
              <li>Your use of the Services</li>
              <li>Your Content</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Termination</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>14.1 By You:</strong> You may cancel your subscription or delete your account at
                any time through your account settings. Cancellation will take effect at the end of your
                current billing period.
              </p>
              <p>
                <strong>14.2 By Us:</strong> We may suspend or terminate your account immediately if you
                violate these Terms, engage in fraudulent activity, or for any other reason at our sole
                discretion.
              </p>
              <p>
                <strong>14.3 Effect of Termination:</strong> Upon termination, your right to access and
                use the Services will immediately cease. We may delete your account and Content after a
                reasonable grace period. We are not liable for any loss resulting from termination.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Governing Law and Dispute Resolution</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>15.1 Governing Law:</strong> These Terms shall be governed by and construed in
                accordance with the laws of the Republic of Kenya, without regard to conflict of law
                principles.
              </p>
              <p>
                <strong>15.2 Jurisdiction:</strong> Any disputes arising out of or related to these Terms
                or the Services shall be subject to the exclusive jurisdiction of the courts of Kenya.
              </p>
              <p>
                <strong>15.3 Dispute Resolution:</strong> Before filing any legal action, you agree to
                attempt to resolve disputes through good-faith negotiation. If a resolution cannot be
                reached within 30 days, either party may pursue legal remedies.
              </p>
            </div>
          </section>

          {/* General Provisions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. General Provisions</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>16.1 Entire Agreement:</strong> These Terms, together with our Privacy Policy,
                constitute the entire agreement between you and Nyumbanii regarding the Services.
              </p>
              <p>
                <strong>16.2 Severability:</strong> If any provision of these Terms is found to be
                invalid or unenforceable, the remaining provisions shall remain in full force and effect.
              </p>
              <p>
                <strong>16.3 Waiver:</strong> Our failure to enforce any right or provision of these
                Terms shall not constitute a waiver of such right or provision.
              </p>
              <p>
                <strong>16.4 Assignment:</strong> You may not assign or transfer these Terms without our
                prior written consent. We may assign these Terms without restriction.
              </p>
              <p>
                <strong>16.5 Force Majeure:</strong> We shall not be liable for any delay or failure to
                perform resulting from causes beyond our reasonable control, including natural disasters,
                war, terrorism, riots, embargoes, acts of government, or power outages.
              </p>
            </div>
          </section>

          {/* Updates to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of material
              changes by posting the updated Terms on our website and updating the "Last updated" date.
              Your continued use of the Services after such changes constitutes your acceptance of the new
              Terms. If you do not agree to the updated Terms, you must stop using the Services and cancel
              your account.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Contact Us</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-800">
                <p><strong>Email:</strong> legal@nyumbanii.org</p>
                <p><strong>Phone:</strong> +254 700 000 000</p>
                <p><strong>Website:</strong> <a href="https://nyumbanii.org" className="text-[#003366] hover:underline">www.nyumbanii.org</a></p>
                <p><strong>Address:</strong> Nairobi, Kenya</p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-gray-700 leading-relaxed font-medium">
              By using Nyumbanii, you acknowledge that you have read, understood, and agree to be bound
              by these Terms of Service.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm">
          <Link to="/privacy-policy" className="text-[#003366] hover:underline">Privacy Policy</Link>
          <span className="text-gray-400">•</span>
          <Link to="/" className="text-[#003366] hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
