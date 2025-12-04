import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - Science Olympiad Tests',
  description: 'Terms of Service for Science Olympiad Tests practice platform',
};

export default function TermsPage() {
  const lastUpdated = 'December 4, 2025';
  const contactEmail = 'support@aitrove.ai';
  const dmcaEmail = 'dmca@aitrove.ai';

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
              By accessing or using Science Olympiad Tests, operated by Pathvana LLC (&quot;SciOly Prep&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;),
              you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
            <p>
              We reserve the right to update these Terms at any time. For material changes, we will require you to
              review and re-accept the updated terms before continuing to use the service.
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

            <h4 className="font-semibold mt-4">3.2 Age Requirements</h4>
            <p>
              Users under 13 years of age must have verifiable parental consent before creating an account.
              Parents or guardians must register on behalf of children under 13 and are responsible for
              their child&apos;s use of the Service. See our Privacy Policy for COPPA compliance details.
            </p>

            <h4 className="font-semibold mt-4">3.3 Account Responsibilities</h4>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized account use</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h4 className="font-semibold mt-4">3.4 Account Termination</h4>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these
              Terms or for any other reason at our discretion.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Content Upload and Rights Verification</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">4.1 Upload Consent</h4>
            <p>
              By uploading any content (including PDF tests, documents, or importing from URLs), you represent
              and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You own the content or have explicit permission from the copyright holder to upload it</li>
              <li>The content does not infringe any third-party intellectual property rights</li>
              <li>You have the legal right to use and distribute the content</li>
              <li>The content complies with all applicable laws and regulations</li>
            </ul>

            <h4 className="font-semibold mt-4">4.2 Content Verification</h4>
            <p>
              When you upload content, you will be required to confirm that you have the necessary rights.
              This confirmation serves as your legal attestation that the content is authorized for upload.
            </p>

            <h4 className="font-semibold mt-4">4.3 Our Use of Uploaded Content</h4>
            <p className="font-semibold text-purple-800 bg-purple-50 p-3 rounded-lg">
              Important: We do NOT use user-uploaded copyrighted content to generate public tests,
              train AI models, or create any monetized content. Your uploaded materials remain private
              to your account and are used solely to provide you with personalized practice tests.
            </p>

            <h4 className="font-semibold mt-4">4.4 Liability for Unauthorized Uploads</h4>
            <p>
              If you upload content without proper authorization, you are solely responsible for any
              resulting copyright infringement claims. We reserve the right to remove any content and
              terminate accounts that violate these terms.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Acceptable Use</CardTitle>
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
              <li>Redistribute or resell any content from the Service</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Intellectual Property and Content Ownership</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">6.1 Our Content</h4>
            <p>
              The Service, including its design, features, and AI-generated content, is owned by us and
              protected by intellectual property laws. You may not copy, modify, distribute, or create
              derivative works without our express permission.
            </p>

            <h4 className="font-semibold mt-4">6.2 User-Uploaded Content</h4>
            <p>
              You retain ownership of content you upload to the Service. By uploading content, you grant us
              a non-exclusive, worldwide, royalty-free license to use, process, and display that content
              solely for the purpose of providing the Service to you. This license terminates when you
              delete the content or your account.
            </p>

            <h4 className="font-semibold mt-4">6.3 AI-Generated Content Ownership and Rights</h4>
            <p>Questions and tests generated by our AI are subject to the following terms:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Personal Use:</strong> You may use AI-generated tests for your own personal educational practice</li>
              <li><strong>Team/Coach Sharing:</strong> You may share AI-generated tests with your Science Olympiad team members and coaches for non-commercial educational purposes</li>
              <li><strong>Export Rights:</strong> You may export and print AI-generated tests for personal or team practice</li>
              <li><strong>No Commercial Use:</strong> You may not sell, redistribute commercially, or use AI-generated content for commercial purposes without our written permission</li>
              <li><strong>Attribution:</strong> When sharing, please credit &quot;Generated by SciOly Prep&quot;</li>
              <li><strong>No Warranty:</strong> AI-generated content is provided as-is and should be verified for accuracy</li>
            </ul>

            <h4 className="font-semibold mt-4">6.4 Third-Party Content</h4>
            <p>
              If you upload PDF tests or import content from external sources, you are responsible for
              ensuring you have the right to use that content. We are not responsible for copyright
              violations related to user-uploaded content.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. DMCA and Copyright Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">7.1 DMCA Compliance</h4>
            <p>
              We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA).
              If you believe content on our Service infringes your copyright, you may submit a takedown notice.
            </p>

            <h4 className="font-semibold mt-4">7.2 Submitting a Takedown Notice</h4>
            <p>To file a DMCA takedown notice, send a written communication to our DMCA agent including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A physical or electronic signature of the copyright owner or authorized agent</li>
              <li>Identification of the copyrighted work claimed to be infringed</li>
              <li>Identification of the material to be removed and its location on our Service</li>
              <li>Your contact information (address, phone number, email)</li>
              <li>A statement that you have a good faith belief the use is not authorized</li>
              <li>A statement under penalty of perjury that the information is accurate</li>
            </ul>
            <p className="mt-4">
              Send DMCA notices to: <a href={`mailto:${dmcaEmail}`} className="text-purple-600 hover:underline">{dmcaEmail}</a>
            </p>

            <h4 className="font-semibold mt-4">7.3 Counter-Notification</h4>
            <p>
              If your content was removed and you believe it was done in error, you may submit a counter-notification
              including your contact information, identification of the removed content, a statement under penalty
              of perjury that removal was a mistake, and consent to jurisdiction.
            </p>

            <h4 className="font-semibold mt-4">7.4 Repeat Infringers</h4>
            <p>
              We will terminate accounts of users who repeatedly infringe copyrights. Multiple valid DMCA
              complaints will result in permanent account termination.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Disclaimer of Warranties</CardTitle>
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
            <CardTitle>9. Limitation of Liability</CardTitle>
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
            <CardTitle>10. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              You agree to indemnify, defend, and hold harmless Pathvana LLC, Science Olympiad Tests and its operators,
              directors, employees, and agents from any claims, damages, losses, liabilities, and expenses
              (including attorney fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights, including copyright</li>
              <li>Content you upload to the Service</li>
              <li>Any copyright infringement claims related to your uploaded content</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>11. Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">11.1 Informal Resolution</h4>
            <p>
              Before filing any legal claim, you agree to first contact us and attempt to resolve the dispute
              informally. We will work in good faith to address your concerns within 30 days.
            </p>

            <h4 className="font-semibold mt-4">11.2 Binding Arbitration</h4>
            <p>
              If informal resolution fails, any disputes shall be resolved through binding arbitration
              administered by a mutually agreed-upon arbitrator. The arbitration shall be conducted in
              English and the decision shall be final and binding.
            </p>

            <h4 className="font-semibold mt-4">11.3 Class Action Waiver</h4>
            <p>
              You agree that any dispute resolution will be conducted only on an individual basis and not
              in a class, consolidated, or representative action.
            </p>

            <h4 className="font-semibold mt-4">11.4 Exceptions</h4>
            <p>
              Either party may seek injunctive relief in court for intellectual property infringement or
              unauthorized access to the Service.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12. Third-Party Services</CardTitle>
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
            <CardTitle>13. Terms Updates and Re-Consent</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4 className="font-semibold mt-2">13.1 Regular Review</h4>
            <p>
              We review and update these Terms at least annually, or more frequently when required by
              changes in law, our practices, or service features.
            </p>

            <h4 className="font-semibold mt-4">13.2 Notification of Changes</h4>
            <p>
              We will notify you of any material changes by posting the updated Terms on this page,
              updating the &quot;Last updated&quot; date, and sending an email notification to registered users.
            </p>

            <h4 className="font-semibold mt-4">13.3 Re-Consent for Material Changes</h4>
            <p>
              For material changes that significantly affect your rights or obligations, we will require
              you to review and re-accept the updated Terms before continuing to use the service.
              You will be prompted to agree to the new terms upon your next login.
            </p>

            <h4 className="font-semibold mt-4">13.4 Right to Decline</h4>
            <p>
              If you do not agree with updated terms, you may request deletion of your account and data.
              Continued use of the service after being notified of changes constitutes acceptance.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>14. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles. Subject to the arbitration provision above,
              any disputes shall be resolved in the courts of competent jurisdiction.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>15. Severability</CardTitle>
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
            <CardTitle>16. Entire Agreement</CardTitle>
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
            <CardTitle>17. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-600">
                <Mail className="h-5 w-5" />
                <span>General: </span>
                <a href={`mailto:${contactEmail}`} className="hover:underline">
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <Mail className="h-5 w-5" />
                <span>DMCA/Copyright: </span>
                <a href={`mailto:${dmcaEmail}`} className="hover:underline">
                  {dmcaEmail}
                </a>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Pathvana LLC<br />
              Response time: Within 30 days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
