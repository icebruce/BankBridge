import React from "react";

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  return (
    <div className="mt-4 p-2 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
      ⚠️ {message}
    </div>
  );
};

export default ErrorBanner; 