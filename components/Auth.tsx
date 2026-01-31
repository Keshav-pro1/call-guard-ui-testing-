
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';


const Auth: React.FC = () => {

    const [isLogin, setIsLogin] = useState(true);
    const [isCompletingProfile, setIsCompletingProfile] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [branches, setBranches] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, googleLogin, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    // Need these for direct Firestore check in handleGoogleLogin
    // Importing dynamically or just using what's available?
    // We can assume imported 'db' and 'doc/getDoc' from firestore would be needed here, 
    // but better to rely on AuthContext if possible, OR just import them here.
    // Ideally we'd import them at the top of the file, but replace_file_content is just swapping the component body.
    // Let's assume we need to add imports if they aren't there. 
    // Wait, the previous tool view showed imports at lines 1-3. 
    // "import React, { useState } from 'react';"
    // "import { useAuth } from './AuthContext';"
    // "import { useNavigate } from 'react-router-dom';"
    // I need to add firestore imports. Since I can't easily add imports with this replace block without replacing the whole file,
    // I will replace the WHOLE file to include imports.

    // ... wait, I'll return the whole file content.
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                <h2 className="text-3xl font-extrabold text-center mb-6 tracking-tight">
                    {isCompletingProfile ? 'Complete Profile' : (isLogin ? 'Welcome Back' : 'Create Account')}
                </h2>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Completion or Signup Fields */}
                    {(!isLogin || isCompletingProfile) && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">Branches (comma separated)</label>
                                <textarea
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors h-24 resize-none"
                                    value={branches}
                                    onChange={(e) => setBranches(e.target.value)}
                                    placeholder="New York, Los Angeles, Chicago"
                                />
                            </div>
                        </>
                    )}

                    {/* Email/Password only for standard login/signup */}
                    {!isCompletingProfile && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 bg-white text-black font-extrabold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : (isCompletingProfile ? 'Save & Continue' : (isLogin ? 'Log In' : 'Sign Up'))}
                    </button>
                </form>

                {/* Google Login - Only show if not completing profile */}
                {!isCompletingProfile && (
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full py-4 bg-white text-black font-extrabold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign in with Google
                        </button>
                    </div>
                )}

                {/* Switch between Login/Signup - Hide when completing profile */}
                {!isCompletingProfile && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-gray-400 hover:text-white transition-colors underline decoration-white/20 hover:decoration-white"
                        >
                            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            const user = await googleLogin();

            // Check if user has a profile with branches
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().branches && docSnap.data().branches.length > 0) {
                navigate('/');
            } else {
                // Profile missing or incomplete
                setIsCompletingProfile(true);
                setName(user.displayName || '');
                // Stay on page to let user fill details
            }
        } catch (err: any) {
            setError('Failed to sign in with Google: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isCompletingProfile) {
                // This mode is triggered after Google Sign-In, so currentUser is already set in Auth (or will be shortly)
                // But relying on currentUser from useAuth() might be racy if the effect hasn't run.
                // However, we are in the same component. 
                // Let's use auth.currentUser directly since we know we just logged in.

                const user = auth.currentUser;
                if (!user) throw new Error("No authenticated user found.");

                const branchList = branches.split(',').map(b => b.trim()).filter(b => b);
                await updateUserProfile(user.uid, {
                    name,
                    phone,
                    branches: branchList,
                    email: user.email || ''
                });
                navigate('/');

            } else if (isLogin) {
                await login(email, password);
                navigate('/');
            } else {
                const branchList = branches.split(',').map(b => b.trim()).filter(b => b);
                await signup(email, password, name, phone, branchList);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
};

export default Auth;
