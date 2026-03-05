import { useEffect, useState } from "react";
import logoPath from "@assets/htown-logo_1772190875526.png";

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setTimeout(() => {
        onComplete?.();
      }, 600);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-600 ${
        isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      data-testid="preloader"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo Animation */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-20">
            <div className="w-32 h-32 rounded-2xl bg-primary-red"></div>
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center rounded-2xl bg-accent shadow-2xl p-4">
            <img 
              src={logoPath} 
              alt="ATV Rentals" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            ATV Rentals
          </h2>
          <p className="text-sm text-gray-400">AI Receptionist Dashboard</p>
        </div>

        {/* Spinner */}
        <div className="w-16 h-16 spinner-red"></div>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-accent-gradient animate-pulse" style={{ width: "60%" }}></div>
        </div>
      </div>
    </div>
  );
}
