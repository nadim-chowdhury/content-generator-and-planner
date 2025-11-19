import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Terms of Service
            </h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                By accessing and using GenPlan ("the Service"), you accept and
                agree to be bound by the terms and provision of this agreement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Use License</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Permission is granted to temporarily use the Service for
                personal and commercial purposes. This is the grant of a
                license, not a transfer of title, and under this license you may
                not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Modify or copy the materials</li>
                <li>
                  Use the materials for any commercial purpose or for any public
                  display
                </li>
                <li>
                  Attempt to reverse engineer any software contained in the
                  Service
                </li>
                <li>
                  Remove any copyright or other proprietary notations from the
                  materials
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                You are responsible for maintaining the confidentiality of your
                account and password. You agree to accept responsibility for all
                activities that occur under your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Subscription and Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Subscriptions are billed in advance on a monthly or annual
                basis. You may cancel your subscription at any time, and
                cancellation will take effect at the end of the current billing
                period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                All content generated through the Service is owned by you.
                However, the Service itself, including its original content,
                features, and functionality, is owned by us and protected by
                international copyright, trademark, and other intellectual
                property laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You may not use the Service:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  In any way that violates any applicable law or regulation
                </li>
                <li>To transmit any malicious code or viruses</li>
                <li>To spam or harass other users</li>
                <li>To impersonate any person or entity</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                In no event shall we be liable for any indirect, incidental,
                special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other
                intangible losses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We reserve the right to modify these terms at any time. We will
                notify users of any material changes via email or through the
                Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If you have any questions about these Terms of Service, please
                contact us at support@genplan.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
