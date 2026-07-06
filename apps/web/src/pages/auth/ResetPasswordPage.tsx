import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../utils/api-client';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await apiClient.post(`/auth/reset-password?token=${token}`, { password });
            setIsSuccess(true);
        } catch (err) {
            setError('Link invalid or expired. Please request a new code.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Invalid Link</div>;
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Password reset</h1>
                    <p className="text-slate-500">Your password has been successfully reset. You can now log in with your new password.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        Log in to your account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Set new password</h1>
                    <p className="text-slate-500">Your new password must be different from previous passwords.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">New password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Confirm password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
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

export default ResetPasswordPage;
