import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
            >
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Privacy Policy
                </h1>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Data Collection & Usage</h2>
                        <p>
                            IndieLeads collects personal information (name, email) and professional data (company, outreach targets)
                            necessary to provide the Service. We process this data to facilitate your email campaigns,
                            manage reputation, and ensure high deliverability.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Inbox Security & Credentials</h2>
                        <p>
                            Your connection to Google, Outlook, or SMTP providers is secured via industry-standard encryption.
                            Credentials are encrypted at rest (AES-256) and never shared. We only access the data required
                            to send emails and monitor replies as authorized by you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Data Retention</h2>
                        <p>
                            We retain your data for as long as your account is active. Transactional logs and audit results
                            may be archived for up to 12 months for troubleshooting and performance optimization purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Cookies & Tracking</h2>
                        <p>
                            We use functional cookies to manage sessions and analytics to improve the platform experience.
                            Outreach emails sent through the platform may contain tracking pixels to monitor engagement (opens/clicks)
                            for your campaigns.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Compliance</h2>
                        <p>
                            IndieLeads complies with CCPA/GDPR principles regarding data access and deletion requests.
                            Users are responsible for ensuring their outreach practices comply with CAN-SPAM and local regulations.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-400">
                    Last updated: March 1, 2026
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyPage;
