import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  const updated = 'March 22, 2026'

  return (
    <div>
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        <div className="page-eyebrow">Legal</div>
        <h1 className="page-title">Privacy Policy</h1>
        <div className="title-rule" />
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#6B8F3A', marginBottom: 36 }}>
          Last updated: {updated}
        </p>

        {[
          {
            title: '1. Who We Are',
            body: `Obaa Yaa's Kitchen is a home-style Ghanaian food delivery service operating in the United States, serving members of the US military and their families. We are committed to protecting your personal information and being transparent about how we use it.`,
          },
          {
            title: '2. Information We Collect',
            body: `When you place an order, we collect the following information:\n\n• Your full name\n• Branch of service and unit/battalion\n• Phone number (optional)\n• Payment handle (Zelle or Cash App username)\n• Order details including items and total amount\n\nWe do not collect payment card numbers, banking information, or any sensitive financial data. All payments are made directly between you and Obaa Yaa outside of this website.`,
          },
          {
            title: '3. How We Use Your Information',
            body: `We use the information you provide solely to:\n\n• Process and fulfil your food order\n• Contact you regarding your order if necessary\n• Send order notifications to our kitchen via WhatsApp\n• Allow you to track your order status on this website\n\nWe do not use your information for marketing, advertising, or any purpose beyond fulfilling your order.`,
          },
          {
            title: '4. How We Store Your Information',
            body: `Your order information is stored securely in a cloud database (MongoDB Atlas) hosted in the United States. We retain order records for operational and accounting purposes. Your browser may also save your name, branch, and payment handle locally on your device (using localStorage) to make future orders faster — this data never leaves your device unless you place an order.`,
          },
          {
            title: '5. Who We Share Your Information With',
            body: `We do not sell, rent, or share your personal information with any third parties for commercial purposes. Your order details are shared only with:\n\n• Obaa Yaa's Kitchen (the business owner) via WhatsApp notification\n• Our hosting providers (Netlify and MongoDB Atlas) solely for the purpose of operating this service`,
          },
          {
            title: '6. WhatsApp Notifications',
            body: `When you place an order, a notification is sent to the business owner via the Meta WhatsApp Business API. This notification includes your name, branch, order details, and payment handle so the order can be confirmed. No message is sent to you via WhatsApp unless you initiate contact with us.`,
          },
          {
            title: '7. Your Rights',
            body: `You have the right to:\n\n• Request a copy of the personal data we hold about you\n• Request that we correct or delete your personal data\n• Opt out of any future data collection by not using our service\n\nTo exercise any of these rights, please contact us at the details below.`,
          },
          {
            title: '8. Cookies',
            body: `This website does not use tracking cookies or advertising cookies. We use only essential browser storage (localStorage and sessionStorage) to improve your experience, such as remembering your details between orders and maintaining your admin session.`,
          },
          {
            title: '9. Children\'s Privacy',
            body: `Our service is not directed at children under the age of 13. We do not knowingly collect personal information from children.`,
          },
          {
            title: '10. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated date. Continued use of our service after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: '11. Contact Us',
            body: `If you have any questions about this Privacy Policy or how we handle your data, please contact us:\n\nObaa Yaa's Kitchen\nEmail: obaayaaskitchen@gmail.com\nWebsite: obaayaakitchen.netlify.app`,
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900,
              fontSize: 16, color: '#3A5A14', marginBottom: 10,
            }}>{section.title}</h2>
            {section.body.split('\n').map((line, i) => (
              line.trim() === '' ? <br key={i} /> :
              <p key={i} style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 14,
                color: '#456D1B', lineHeight: 1.8, marginBottom: 4,
              }}>{line}</p>
            ))}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  )
}
