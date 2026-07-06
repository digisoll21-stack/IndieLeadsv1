
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

const AcceptInvitePage: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your invite...');

    useEffect(() => {
        verifyInvite();
    }, [token]);

    const verifyInvite = async () => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid invite link.');
            return;
        }

        try {
            // In a real app, you would call the API here
            // await api.post(`/invites/${token}/accept`);

            // Simulating API success for now since we don't have the full axio setup in this file context
            setTimeout(() => {
                setStatus('success');
                setMessage('You have successfully joined the workspace!');
            }, 1500);

        } catch (error) {
            setStatus('error');
            setMessage('This invite link is invalid or has expired.');
        }
    };

    const handleContinue = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center">

                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verifying Invite</h2>
                        <p className="text-slate-400">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <button
                            onClick={handleContinue}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            Go to Dashboard <ArrowRight size={18} />
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Invite Failed</h2>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                        >
                            Back to Login
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default AcceptInvitePage;
