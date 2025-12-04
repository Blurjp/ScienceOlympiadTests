import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Science Olympiad Tests',
  description: 'Privacy Policy for Science Olympiad Tests practice platform',
};

export default function PrivacyPage() {
  const lastUpdated = 'December 4, 2025';
  const contactEmail = 'support@aitrove.ai';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Welcome to Science Olympiad Tests, operated by Pathvana LLC (&quot;SciOly Prep&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
              We are committed to protecting your privacy and personal information. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p>
              By using our service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-4">2.1 Personal Information</h4>
            <p>When you create an account or use our services, we may collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name and email address (from Google OAuth authentication)</li>
              <li>Profile picture (if provided through Google account)</li>
              <li>Account preferences and settings</li>
              <li>Age verification or parental consent status (for users under 13)</li>
            </ul>

            <h4 className="font-semibold mt-4">2.2 Usage Information</h4>
            <p>We automatically collect certain information when you use our service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Test results and scores</li>
              <li>Time spent on tests</li>
              <li>Practice history and progress</li>
              <li>Browser type and device information</li>
              <li>IP address and general location data</li>
            </ul>

            <h4 className="font-semibold mt-4">2.3 Uploaded Content</h4>
            <p>
              If you upload PDF tests or import tests from URLs, we process this content to extract
              questions and answers. Uploaded content is stored securely and associated with your account.
            </p>
            <p className="mt-2 font-semibold text-blue-800 bg-blue-50 p-3 rounded-lg">
              Important: We do NOT use user-uploaded content to generate public tests, train AI models,
              or create any monetized content. Your uploaded materials remain private to your account
              and are used solely to provide you with personalized practice tests.
            </p>

            <h4 className="font-semibold mt-4">2.4 Data Minimization</h4>
            <p>
              We only collect and store information that is necessary to provide our services. We regularly
              review our data collection practices to ensure we are not retaining unnecessary information.
              Internal logs and metadata are kept to the minimum required for service operation and security.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Track your test results and progress over time</li>
              <li>Generate AI-powered practice tests based on Science Olympiad topics (using only our own content, not user uploads)</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Communicate with you about service updates or changes</li>
              <li>Ensure the security and integrity of our platform</li>
              <li>Comply with legal obligations</li>
              <li>Respond to copyright or legal complaints</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Information Sharing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service Providers:</strong> We use third-party services (such as OpenAI for AI test generation, Google for authentication, and database hosting providers) that may process your data to provide our services.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental authority.</li>
              <li><strong>Protection of Rights:</strong> We may disclose information to protect our rights, privacy, safety, or property.</li>
              <li><strong>Copyright Claims:</strong> We may share limited information with copyright holders in response to valid DMCA or similar takedown requests.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              We implement appropriate technical and organizational security measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However, no
              method of transmission over the Internet or electronic storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
            <p className="mt-4">Our security measures include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>HTTPS encryption for all data transmission</li>
              <li>Secure authentication through Google OAuth</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data by authorized personnel only</li>
              <li>Minimal data retention practices to reduce breach risk</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Data Retention and Deletion</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">6.1 Active Accounts</h4>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide
              you services.
            </p>

            <h4 className="font-semibold mt-4">6.2 Account Deletion</h4>
            <p>You may request deletion of your account at any time by contacting us. Upon deletion request:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Immediate:</strong> Your account access is terminated and profile data is removed from active systems</li>
              <li><strong>Within 30 days:</strong> All personal data, test results, and uploaded content are permanently deleted from our primary databases</li>
              <li><strong>Within 90 days:</strong> Data is removed from backup systems</li>
              <li><strong>Exceptions:</strong> We may retain anonymized, aggregated data for analytics, and certain records as required by law</li>
            </ul>

            <h4 className="font-semibold mt-4">6.3 Inactive Accounts</h4>
            <p>
              Accounts that have been inactive for more than 24 months may be flagged for deletion. We will
              attempt to notify you via email before any deletion occurs.
            </p>

            <h4 className="font-semibold mt-4">6.4 Logs and Metadata</h4>
            <p>
              Server logs containing IP addresses and access records are automatically deleted after 90 days.
              We only retain the minimum metadata necessary for security and service operation.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at the email address below. We will respond to
              requests within 30 days.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Children&apos;s Privacy and COPPA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Our service is designed for educational purposes and may be used by students of various ages.
              We are committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA).
            </p>

            <h4 className="font-semibold mt-4">8.1 Users Under 13</h4>
            <p>
              We do not knowingly collect personal information from children under 13 without verifiable
              parental consent. If you are under 13, you must have your parent or guardian create an account
              on your behalf or provide consent before using our service.
            </p>

            <h4 className="font-semibold mt-4">8.2 Parental Consent Process</h4>
            <p>For users under 13, we require:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A parent or guardian must register the account</li>
              <li>Verification of parental consent via email confirmation</li>
              <li>Parents may review, modify, or delete their child&apos;s information at any time</li>
              <li>Parents may revoke consent and request deletion of their child&apos;s data</li>
            </ul>

            <h4 className="font-semibold mt-4">8.3 Information Collected from Children</h4>
            <p>
              For accounts with verified parental consent, we collect only the minimum information necessary
              to provide educational services: name (or username), test results, and progress data. We do not
              collect phone numbers, addresses, or other sensitive information from children.
            </p>

            <h4 className="font-semibold mt-4">8.4 Parental Rights</h4>
            <p>
              Parents may contact us at any time to review their child&apos;s personal information, request
              deletion, or withdraw consent. Contact us at {contactEmail}.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Advertising and Cookies</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">9.1 Google AdSense</h4>
            <p>
              We use Google AdSense to display advertisements on our website. Google AdSense uses cookies
              to serve ads based on your prior visits to our website and other websites. You can opt out
              of personalized advertising by visiting{' '}
              <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Google Ads Settings
              </a>.
            </p>
            <p className="mt-2">
              <strong>Note:</strong> For users under 13 with verified parental consent, we disable personalized
              advertising and show only contextual, non-targeted ads.
            </p>

            <h4 className="font-semibold mt-4">9.2 Cookies We Use</h4>
            <p>Our website uses the following types of cookies:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for authentication and basic site functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
              <li><strong>Advertising Cookies:</strong> Used by Google AdSense to display relevant ads</li>
            </ul>

            <h4 className="font-semibold mt-4">9.3 Managing Cookies</h4>
            <p>
              You can control and manage cookies through your browser settings. Please note that disabling
              cookies may affect the functionality of our website. For more information about how Google
              uses data from partner sites, visit{' '}
              <a href="https://policies.google.com/technologies/partner-sites" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy & Terms
              </a>.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>10. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>Our service integrates with or uses the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Google OAuth:</strong> For user authentication</li>
              <li><strong>Google AdSense:</strong> For displaying advertisements</li>
              <li><strong>OpenAI:</strong> For AI-generated test content</li>
              <li><strong>Netlify:</strong> For hosting and infrastructure</li>
              <li><strong>Turso:</strong> For database services</li>
            </ul>
            <p className="mt-4">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>11. Policy Updates and Re-Consent</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">11.1 Regular Review</h4>
            <p>
              We review and update this Privacy Policy at least annually, or more frequently when required
              by changes in law, our practices, or service features.
            </p>

            <h4 className="font-semibold mt-4">11.2 Notification of Changes</h4>
            <p>
              We will notify you of any material changes by posting the new Privacy Policy on this page,
              updating the &quot;Last updated&quot; date, and sending an email notification to registered users.
            </p>

            <h4 className="font-semibold mt-4">11.3 Re-Consent for Material Changes</h4>
            <p>
              For material changes that significantly affect how we collect, use, or share your personal
              information, we will require you to review and re-accept the updated policy before continuing
              to use the service. You will be prompted to agree to the new terms upon your next login.
            </p>

            <h4 className="font-semibold mt-4">11.4 Right to Decline</h4>
            <p>
              If you do not agree with updated terms, you may request deletion of your account and data.
              Continued use of the service after being notified of changes constitutes acceptance.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              If you have any questions about this Privacy Policy, our data practices, or wish to exercise
              your rights, please contact us:
            </p>
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <Mail className="h-5 w-5" />
              <a href={`mailto:${contactEmail}`} className="hover:underline">
                {contactEmail}
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Pathvana LLC<br />
              Privacy Inquiries<br />
              Response time: Within 30 days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
