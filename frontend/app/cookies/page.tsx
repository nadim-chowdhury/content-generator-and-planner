export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
      <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
        <p className="text-gray-700 mb-4">
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
        <p className="text-gray-700 mb-4">
          We use cookies for the following purposes:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li><strong>Essential Cookies:</strong> Required for the Service to function properly (authentication, security)</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Service</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          <li><strong>Marketing Cookies:</strong> Used to track visitors across websites for marketing purposes</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
        
        <h3 className="text-xl font-semibold mb-3">3.1 Essential Cookies</h3>
        <p className="text-gray-700 mb-4">
          These cookies are necessary for the Service to function and cannot be switched off. They include:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>Authentication tokens (JWT)</li>
          <li>Session management cookies</li>
          <li>Security and CSRF protection cookies</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">3.2 Analytics Cookies</h3>
        <p className="text-gray-700 mb-4">
          We use analytics cookies to understand how users interact with our Service:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>PostHog analytics cookies</li>
          <li>Usage tracking and performance monitoring</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">3.3 Preference Cookies</h3>
        <p className="text-gray-700 mb-4">
          These cookies remember your preferences:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>Theme preferences (light/dark mode)</li>
          <li>Language settings</li>
          <li>Workspace preferences</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
        <p className="text-gray-700 mb-4">
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics and deliver advertisements:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li><strong>PostHog:</strong> Analytics and user behavior tracking</li>
          <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
          <li><strong>Stripe:</strong> Payment processing (if applicable)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
        <p className="text-gray-700 mb-4">
          You can control and manage cookies in various ways:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>Browser settings: Most browsers allow you to refuse or accept cookies</li>
          <li>Cookie preferences: Manage cookie preferences in your account settings</li>
          <li>Opt-out tools: Use browser extensions or opt-out tools for specific services</li>
        </ul>
        <p className="text-gray-700 mb-4">
          <strong>Note:</strong> Disabling essential cookies may affect the functionality of the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Cookie Duration</h2>
        <p className="text-gray-700 mb-4">
          Cookies may be either "persistent" or "session" cookies:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
          <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Updates to This Cookie Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this Cookie Policy from time to time to reflect changes in technology or legal requirements. We will notify you of any material changes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
        <p className="text-gray-700 mb-4">
          If you have any questions about our use of cookies, please contact us at privacy@contentgenerator.com
        </p>
      </section>
    </div>
  );
}

