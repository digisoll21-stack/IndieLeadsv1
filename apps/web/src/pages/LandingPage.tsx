import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Rocket,
    Shield,
    Zap,
    Mail,
    BarChart3,
    Users,
    CheckCircle2,
    ChevronRight,
    Globe
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#030711] text-white selection:bg-blue-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030711]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">IndieLeads</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Now in Private Beta
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                            Elite Outreach <br />
                            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
                                Built for Solopreneurs.
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-gray-400 text-lg lg:text-xl mb-12 leading-relaxed">
                            Automate your cold email outreach with professional-grade sending, AI-driven reply detection,
                            and world-class deliverability. The power of a 10-person sales team, in your hands.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                            >
                                Start Your Solo Campaign
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95">
                                View Live Demo
                            </button>
                        </div>
                    </motion.div>

                    {/* Dashboard Preview Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-24 relative"
                    >
                        <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0a0f1d] p-4 shadow-2xl overflow-hidden group">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="aspect-[16/9] bg-[#030711] rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden">
                                {/* Abstract UI representation */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                                <div className="grid grid-cols-4 gap-6 p-8 w-full h-full opacity-40">
                                    <div className="h-full border-r border-white/5" />
                                    <div className="h-full border-r border-white/5" />
                                    <div className="h-full border-r border-white/5" />
                                </div>
                                <div className="z-10 text-center px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                        <BarChart3 className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">Dashboard Preview</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">Scale without the overhead.</h2>
                        <p className="text-gray-400">The same tools used by agencies, simplified for independent founders.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                                title: "High-Throughput",
                                desc: "Scale to 50k+ emails per month effortlessly. Our architecture handles the heavy lifting while you focus on closing."
                            },
                            {
                                icon: <Shield className="w-6 h-6 text-emerald-400" />,
                                title: "Smart Warmup",
                                desc: "Automated reputation management that builds your sender score naturally across major providers."
                            },
                            {
                                icon: <Mail className="w-6 h-6 text-blue-400" />,
                                title: "Inbox Sync",
                                desc: "Real-time sync for Google and Outlook. Manage all your outreach inboxes from a single unified view."
                            },
                            {
                                icon: <Globe className="w-6 h-6 text-purple-400" />,
                                title: "Custom Tracking",
                                desc: "White-labeled tracking domains to ensure your open rates stay high and your emails stay out of spam."
                            },
                            {
                                icon: <Users className="w-6 h-6 text-pink-400" />,
                                title: "Lead Intelligence",
                                desc: "Enrich leads and track interactions automatically. See exactly who's engaging with your content."
                            },
                            {
                                icon: <CheckCircle2 className="w-6 h-6 text-orange-400" />,
                                title: "AI Detection",
                                desc: "Sentiment analysis on every reply. Know instantly if a response is a booking, a question, or a bounce."
                            }
                        ].map((f, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/5 hover:border-blue-500/20 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-32">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-16">The Outreach Infrastructure <br /> built for the next generation.</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-50 grayscale">
                        {/* Placeholder for logos */}
                        <div className="font-black text-2xl tracking-tighter">TRUSTCO.</div>
                        <div className="font-black text-2xl tracking-tighter">ALPHA</div>
                        <div className="font-black text-2xl tracking-tighter">GROWTH</div>
                        <div className="font-black text-2xl tracking-tighter">OMEGA.</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-bold text-gray-400">IndieLeads © 2026</span>
                    </div>

                    <div className="flex items-center gap-8 text-sm text-gray-500 font-medium">
                        <a href="/#/terms" className="hover:text-white transition-colors">Terms</a>
                        <a href="/#/privacy" className="hover:text-white transition-colors">Privacy</a>
                        <a href="mailto:support@indieleads.io" className="hover:text-white transition-colors">Support</a>
                        <a href="https://twitter.com" className="hover:text-white transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
