import React, { useState } from 'react';
import { SignupPage } from './signup/SignupPage';
import { LoginPage } from './login/LoginPage';
import { useCRM } from '../../context/CRMContext';

interface AuthPageProps {
  onSuccess?: () => void;
  initialMode?: 'signup' | 'login';
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, initialMode }) => {
  const { activeNav, setActiveNav } = useCRM();
  const [registeredEmail, setRegisteredEmail] = useState('');

  const currentMode = activeNav === 'login' ? 'login' : (initialMode || (activeNav === 'signup' ? 'signup' : 'signup'));

  if (currentMode === 'login') {
    return (
      <LoginPage
        onSuccess={onSuccess}
        onSwitchToSignup={() => setActiveNav('signup')}
        defaultEmail={registeredEmail}
      />
    );
  }

  return (
    <SignupPage
      onSuccess={onSuccess}
      onSwitchToLogin={() => setActiveNav('login')}
    />
  );
};

export default AuthPage;
