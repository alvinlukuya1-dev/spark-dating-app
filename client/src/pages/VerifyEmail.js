import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const { firebaseUser, sendEmailVerification, emailVerified, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && emailVerified) {
      navigate('/posts', { replace: true });
    }
  }, [loading, emailVerified, navigate]);

  const handleResend = async () => {
    if (!firebaseUser) return;
    await sendEmailVerification();
    alert('Verification email sent! Check your inbox.');
  };

  if (loading) return <div className="auth-page"><div className="loading"><div className="spinner"></div></div></div>;
  if (emailVerified) return null;

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Verify Your Email</h2>
        <p>We sent a verification link to <strong>{firebaseUser?.email}</strong></p>
        <p className="text-muted">Click the link in your email to verify your account, then come back.</p>
        <button onClick={handleResend} className="btn btn-primary" style={{ marginBottom: '12px' }}>
          Resend Verification Email
        </button>
        <button onClick={logout} className="btn btn-outline">
          Log Out
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;