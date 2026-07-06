import React from 'react';
import { MessageSquare, Book, FileText, ExternalLink } from 'lucide-react';

export const SupportPage: React.FC = () => {
    const openChat = () => {
        if (window.$crisp) {
            window.$crisp.push(['do', 'chat:open']);
        } else {
            alert("Chat widget not loaded yet.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
                <p className="text-slate-400">We are here to help you get the best out of IndieLeads.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Chat Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Live Chat Support</h2>
                    <p className="text-slate-400 mb-6">
                        Talk directly to our support team. We usually reply in under 5 minutes.
                    </p>
                    <button
                        onClick={openChat}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors w-full"
                    >
                        Start Chat
                    </button>
                </div>

                {/* Documentation Card (Placeholder) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                        <Book className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Documentation</h2>
                    <p className="text-slate-400 mb-6">
                        Read our detailed guides on setting up campaigns, DNS, and deliverability.
                    </p>
                    <a
                        href="#"
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors w-full flex items-center justify-center gap-2"
                    >
                        View Docs <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <FAQItem
                        question="How do I connect my email account?"
                        answer="Go to the 'Email Accounts' tab and click 'Connect New Account'. We support Google and Microsoft out of the box."
                    />
                    <FAQItem
                        question="What are the daily sending limits?"
                        answer="We recommend starting with 20 emails/day for new accounts and ramping up to 50/day. You can configure this in the 'Warmup' tab."
                    />
                    <FAQItem
                        question="How does billing work?"
                        answer="We bill monthly based on your plan. You can upgrade or cancel at any time from the Settings page."
                    />
                </div>
            </div>
        </div>
    );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <div className="border-b border-slate-800 last:border-0 pb-6 last:pb-0">
        <h3 className="text-lg font-medium text-white mb-2">{question}</h3>
        <p className="text-slate-400">{answer}</p>
    </div>
);
