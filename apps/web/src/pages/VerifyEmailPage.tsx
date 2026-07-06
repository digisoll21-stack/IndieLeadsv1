import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import apiClient from '../utils/api-client';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                await apiClient.post(`/auth/verify-email?token=${token}`);
                setStatus('success');
            } catch (err) {
                setStatus('error');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                {status === 'loading' ? (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Verifying your email</h1>
                        <p className="text-slate-500">Please wait a moment while we confirm your email address...</p>
                    </div>
                ) : status === 'success' ? (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Email Verified!</h1>
                        <p className="text-slate-500">Your account is now fully secured. You can now access all features of IndieLeads.</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center"
                        >
                            Go to Dashboard <ArrowRight size={18} className="ml-2" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                                <XCircle className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Verification Failed</h1>
                        <p className="text-slate-500">The verification link is invalid or has expired. Please log in and request a new one.</p>
                        <Link
                            to="/login"
                            className="block w-full text-center py-4 text-emerald-600 font-bold hover:text-emerald-700 underline transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
