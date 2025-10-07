import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

type AuthView = "login" | "register" | "forgotPassword";

interface AuthContainerProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onRequestPasswordReset: (email: string) => Promise<void>;
}

const AuthContainer = ({
  onLogin,
  onRegister,
  onRequestPasswordReset,
}: AuthContainerProps) => {
  const [currentView, setCurrentView] = useState<AuthView>("login");

  const handleSwitchToLogin = () => setCurrentView("login");
  const handleSwitchToRegister = () => setCurrentView("register");
  const handleSwitchToForgotPassword = () => setCurrentView("forgotPassword");

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        {currentView === "login" && (
          <LoginForm
            onLogin={onLogin}
            onSwitchToRegister={handleSwitchToRegister}
            onForgotPassword={handleSwitchToForgotPassword}
          />
        )}

        {currentView === "register" && (
          <RegisterForm
            onRegister={onRegister}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}

        {currentView === "forgotPassword" && (
          <ForgotPasswordForm
            onRequestReset={onRequestPasswordReset}
            onBack={handleSwitchToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default AuthContainer;
