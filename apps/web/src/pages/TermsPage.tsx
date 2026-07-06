import React from 'react';
import { motion } from 'framer-motion';

const TermsPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
            >
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Terms of Service
                </h1>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance & Use</h2>
                        <p>
                            By using IndieLeads, you agree to these Terms. You must be at least 18 years old and have the authority
                            to bind your organization to these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Spam Policy (Zero Tolerance)</h2>
                        <p>
                            You agree NOT to use the Service to send unsolicited bulk emails in violation of the CAN-SPAM Act, GDPR,
                            or other applicable laws. Your outreach must be targeted, professional, and include a clear way to opt-out.
                            Violation of this policy results in immediate termination.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Fees & Subscriptions</h2>
                        <p>
                            The Service is provided on a subscription basis. You agree to pay all fees associated with your selected plan.
                            All fees are non-refundable unless required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Limitation of Liability</h2>
                        <p>
                            IndieLeads provides a platform for outreach but is not responsible for the performance of your campaigns
                            or any blocks/limitations imposed by email providers (Google/Microsoft/etc.) resulting from your usage patterns.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Account Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate accounts that violate our terms, engage in abusive behavior,
                            or fail to pay subscription fees.
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

export default TermsPage;
