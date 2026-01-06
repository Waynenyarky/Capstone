import React from 'react';

export default function VerificationConfirmForm({ email, onSubmit, title } = {}) {
  const [verificationCode, setVerificationCode] = React.useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRefs = React.useRef([]);
  
  const cardTitle = title || 'Verify Current Email';
  
  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleSubmit = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Verification code:', code);
    if (onSubmit) onSubmit({ verificationCode: code });
    setIsSubmitting(false);
  };
  
  const handleResend = () => {
    console.log('Resend code');
    setVerificationCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center">
        <div className="flex-1 text-white space-y-6">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px)',
          }}>
            VERIFICATION
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            SECURE YOUR ACCOUNT WITH EMAIL VERIFICATION
          </h1>
          
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            To ensure the security of your account, we need to verify your email address. 
            Enter the verification code sent to your email to complete the process.
          </p>
          
          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-white"></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Check your inbox for the verification code</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-white"></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Code expires in 10 minutes for security</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-white"></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Request a new code if needed</p>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-[450px]">
          <div className="rounded-lg shadow-2xl p-8" style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{cardTitle}</h2>
              {email && (
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  We sent a code to <span className="font-medium" style={{ color: '#60a5fa' }}>{email}</span>
                </p>
              )}
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-medium mb-3" style={{ color: '#d1d5db' }}>
                Verification Code
              </label>
              <div className="flex gap-2 justify-between">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderColor: error ? '#ef4444' : digit ? '#60a5fa' : 'rgba(148, 163, 184, 0.3)',
                      color: '#fff',
                    }}
                  />
                ))}
              </div>
              {error && (
                <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{error}</p>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handleResend}
                className="text-sm font-medium hover:underline"
                style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Resend Code
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(75, 85, 99, 1)' }}>
              <p className="text-sm text-center" style={{ color: '#9ca3af' }}>
                By verifying, you agree to our{' '}
                <a href="#" className="hover:underline" style={{ color: '#60a5fa' }}>Privacy Policy</a>
                {' '}and{' '}
                <a href="#" className="hover:underline" style={{ color: '#60a5fa' }}>Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}