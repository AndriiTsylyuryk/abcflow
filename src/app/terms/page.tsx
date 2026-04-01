import Link from "next/link";
import { APP_NAME } from "@/config/constants";

export const metadata = {
  title: "Terms & Conditions — ABCflow",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-brand-600">
              {APP_NAME}
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By registering for or using ABCflow (&quot;the Service&quot;), you agree to be bound by
              these Terms &amp; Conditions. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Service Description</h2>
            <p>
              ABCflow provides an AI-powered video generation platform accessible via a monthly
              subscription. Credits are allocated on a monthly basis according to your chosen plan
              and do not roll over to the following billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Subscriptions &amp; Payments</h2>
            <p>
              Subscriptions are billed monthly in advance. Payments are processed securely by
              Stripe. You may cancel your subscription at any time; access continues until the end
              of the current billing period. No refunds are issued for unused credits or partial
              months.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
            <p>You agree not to use the Service to generate content that:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Violates any applicable law or regulation.</li>
              <li>Is defamatory, harassing, or threatening to any person or group.</li>
              <li>Infringes the intellectual property rights of others.</li>
              <li>Contains explicit, adult, or harmful material not permitted by the platform.</li>
              <li>Is used to deceive, defraud, or harm third parties.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these rules
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Intellectual Property</h2>
            <p>
              You retain ownership of the prompts and reference images you submit. ABCflow does
              not claim ownership over generated videos. However, you grant us a limited licence
              to process your inputs solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Privacy</h2>
            <p>
              We collect only the information necessary to operate the Service (email address,
              billing details, and usage data). We do not sell your personal data to third parties.
              Data is stored securely using Firebase and processed in accordance with applicable
              data protection regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. ABCflow shall not
              be liable for any indirect, incidental, or consequential damages arising from the
              use of, or inability to use, the Service. Our total liability shall not exceed the
              amount you paid in the 30 days preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Service after changes
              are posted constitutes acceptance of the revised Terms. We will notify you by email
              of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Contact</h2>
            <p>
              For any questions regarding these Terms, please contact us at{" "}
              <a
                href="mailto:andrii@abcflow.online"
                className="text-brand-600 hover:text-brand-700"
              >
                andrii@abcflow.online
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-4 mt-12">
        <div className="max-w-3xl mx-auto text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ABCflow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
