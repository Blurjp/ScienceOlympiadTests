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
              <li>Generate AI-powered practice tests based on Science Olympiad topics</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Communicate with you about service updates or changes</li>
              <li>Ensure the security and integrity of our platform</li>
              <li>Comply with legal obligations</li>
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
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              We retain your personal information for as long as your account is active or as needed to provide
              you services. You may request deletion of your account and associated data at any time by
              contacting us. We may retain certain information as required by law or for legitimate business purposes.
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
              To exercise these rights, please contact us at the email address below.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Our service is designed for educational purposes and may be used by students of various ages.
              We do not knowingly collect personal information from children under 13 without parental consent.
              If you are a parent or guardian and believe your child has provided us with personal information
              without your consent, please contact us immediately.
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
            <CardTitle>11. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              Your continued use of the service after any changes constitutes acceptance of the new policy.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <Mail className="h-5 w-5" />
              <a href={`mailto:${contactEmail}`} className="hover:underline">
                {contactEmail}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
