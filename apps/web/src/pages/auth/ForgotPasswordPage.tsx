import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import apiClient from '../../utils/api-client';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await apiClient.post('/auth/forgot-password', { email });
            setIsSent(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
                    <p className="text-slate-500">
                        If an account exists for <span className="font-semibold text-slate-900">{email}</span>, you will receive a password reset link shortly.
                    </p>
                    <Link to="/login" className="flex items-center justify-center text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Forgot password?</h1>
                    <p className="text-slate-500">No worries, we'll send you reset instructions.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-200 flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset password'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
