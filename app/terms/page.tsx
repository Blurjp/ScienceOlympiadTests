import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - Science Olympiad Tests',
  description: 'Terms of Service for Science Olympiad Tests practice platform',
};

export default function TermsPage() {
  const lastUpdated = 'December 4, 2025';
  const contactEmail = 'support@sciolyprep.com';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-purple-100 p-3 mb-4">
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              By accessing or using Science Olympiad Tests (&quot;SciOly Prep&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;),
              you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Service after changes
              constitutes acceptance of the modified Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Science Olympiad Tests is an educational platform that provides:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Practice tests for Science Olympiad competition preparation</li>
              <li>AI-generated test questions across various Science Olympiad events</li>
              <li>PDF parsing tools to extract questions from uploaded documents</li>
              <li>Test result tracking and progress monitoring</li>
              <li>User account management and authentication</li>
            </ul>
            <p className="mt-4">
              The Service is provided for educational and practice purposes only. We are not affiliated with
              Science Olympiad, Inc. or any official Science Olympiad organization.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">3.1 Account Creation</h4>
            <p>
              To access certain features, you must create an account using Google OAuth authentication.
              You are responsible for maintaining the confidentiality of your account and for all activities
              that occur under your account.
            </p>

            <h4 className="font-semibold mt-4">3.2 Account Responsibilities</h4>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized account use</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h4 className="font-semibold mt-4">3.3 Account Termination</h4>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these
              Terms or for any other reason at our discretion.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Upload malicious files, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Scrape, crawl, or use automated tools to access the Service without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Service to cheat in actual Science Olympiad competitions</li>
              <li>Share account credentials with others</li>
              <li>Upload copyrighted content without proper authorization</li>
              <li>Use the AI-generated content for commercial purposes without permission</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">5.1 Our Content</h4>
            <p>
              The Service, including its design, features, and AI-generated content, is owned by us and
              protected by intellectual property laws. You may not copy, modify, distribute, or create
              derivative works without our express permission.
            </p>

            <h4 className="font-semibold mt-4">5.2 User Content</h4>
            <p>
              You retain ownership of content you upload to the Service. By uploading content, you grant us
              a non-exclusive, worldwide, royalty-free license to use, process, and display that content
              solely for the purpose of providing the Service.
            </p>

            <h4 className="font-semibold mt-4">5.3 AI-Generated Content</h4>
            <p>
              Questions and tests generated by our AI are provided for personal educational use. While you
              may use AI-generated content for your own practice, you may not redistribute or commercialize
              this content without permission.
            </p>

            <h4 className="font-semibold mt-4">5.4 Third-Party Content</h4>
            <p>
              If you upload PDF tests or import content from external sources, you are responsible for
              ensuring you have the right to use that content. We are not responsible for copyright
              violations related to user-uploaded content.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="font-semibold">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.
            </p>
            <p className="mt-4">We do not warrant that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>AI-generated questions are 100% accurate or error-free</li>
              <li>Results from practice tests will predict actual competition performance</li>
              <li>The Service will meet your specific requirements</li>
              <li>Any defects will be corrected</li>
            </ul>
            <p className="mt-4">
              <strong>Important:</strong> AI-generated questions are created by artificial intelligence and
              may contain errors or inaccuracies. Users should verify answers independently before relying
              on them for serious practice.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Loss of profits, data, or goodwill</li>
              <li>Service interruption or computer damage</li>
              <li>Cost of substitute services</li>
              <li>Any damages related to your use of the Service</li>
            </ul>
            <p className="mt-4">
              Our total liability for any claims arising from your use of the Service shall not exceed
              the amount you paid us, if any, during the twelve months prior to the claim.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              You agree to indemnify, defend, and hold harmless Science Olympiad Tests and its operators,
              directors, employees, and agents from any claims, damages, losses, liabilities, and expenses
              (including attorney fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you upload to the Service</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              The Service uses third-party services including Google (authentication), OpenAI (AI generation),
              and others. Your use of these services is subject to their respective terms and privacy policies.
              We are not responsible for the actions or content of third-party services.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>10. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles. Any disputes arising from these Terms or the
              Service shall be resolved in the courts of competent jurisdiction.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>11. Severability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall
              be limited or eliminated to the minimum extent necessary, and the remaining provisions shall
              remain in full force and effect.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12. Entire Agreement</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and
              Science Olympiad Tests regarding your use of the Service, superseding any prior agreements.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>13. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 flex items-center gap-2 text-purple-600">
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
