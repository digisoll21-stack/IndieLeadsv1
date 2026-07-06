import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GhostStatusProps {
    isVisible: boolean;
}

const GhostStatus: React.FC<GhostStatusProps> = ({ isVisible }) => {
    const [glitch, setGlitch] = useState({ x: 0, y: 0 });
    const fullText = "Created a production-grade React calculator with Lucide icons, Framer Motion animations, and a history drawer.";
    const [displayText, setDisplayText] = useState("");

    useEffect(() => {
        if (!isVisible) return;

        // Random glitch effect interval
        const glitchInterval = setInterval(() => {
            if (Math.random() > 0.9) {
                setGlitch({
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 4
                });
                setTimeout(() => setGlitch({ x: 0, y: 0 }), 50);
            }
        }, 500);

        // Simple typing effect
        let i = 0;
        const typingInterval = setInterval(() => {
            setDisplayText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) clearInterval(typingInterval);
        }, 30);

        return () => {
            clearInterval(glitchInterval);
            clearInterval(typingInterval);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8, filter: 'blur(20px)' }}
            animate={{
                opacity: 1,
                x: glitch.x,
                y: glitch.y,
                scale: 1,
                filter: 'blur(0px)',
                transition: {
                    type: 'spring',
                    damping: 20,
                    stiffness: 120,
                    filter: { duration: 0.8 }
                }
            }}
            exit={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.3 } }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
            <div className="relative group">
                {/* Prismatic Glow Layer */}
                <motion.div
                    animate={{
                        scale: [1, 1.08, 1],
                        opacity: [0.4, 0.7, 0.4],
                        rotate: [0, 1, -1, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-orange-600/20 to-yellow-500/30 rounded-[2.5rem] blur-xl"
                />

                <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-amber-500/20 px-8 py-6 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col gap-4 max-w-md overflow-hidden">
                    {/* Interior Scanning Digital Wave */}
                    <motion.div
                        animate={{
                            top: ['-10%', '110%'],
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent z-0"
                    />

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative">
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 2, repeat: Infinity }
                                }}
                                className="absolute -inset-2 bg-amber-500/20 rounded-full blur-md"
                            />
                            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/40">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Ghost Mode</span>
                                <motion.div
                                    animate={{
                                        backgroundColor: ['#f59e0b', '#d97706', '#f59e0b'],
                                        boxShadow: [
                                            '0 0 8px rgba(245,158,11,0.4)',
                                            '0 0 16px rgba(245,158,11,0.8)',
                                            '0 0 8px rgba(245,158,11,0.4)'
                                        ]
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full"
                                />
                            </div>
                            <span className="text-[14px] text-white font-black tracking-tight mt-0.5">DB SYNCHRONIZING</span>
                        </div>

                        <div className="ml-auto bg-slate-800/50 p-2 rounded-lg border border-white/5">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            >
                                <RefreshCw size={14} className="text-amber-500" />
                            </motion.div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent relative z-10" />

                    <div className="relative z-10 min-h-[40px]">
                        <p className="text-[11px] leading-relaxed text-slate-300 font-medium font-mono">
                            <span className="text-amber-500/60 mr-2">SYS_LOG:</span>
                            {displayText}
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="inline-block w-1.5 h-3.5 bg-amber-500 ml-1 align-middle"
                            />
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default GhostStatus;
