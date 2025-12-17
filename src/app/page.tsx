"use client";

import { useState } from 'react';
import ConsultantWidget from "@/components/sections/consultant-widget";
import { Sun, Moon } from 'lucide-react';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#1A2332]' : 'bg-gray-100'} transition-colors duration-300`}>
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-40 p-3 rounded-full ${theme === 'dark' ? 'bg-[#2D3F52] text-white' : 'bg-white text-gray-800'} shadow-lg hover:scale-110 transition-all duration-300`}
        aria-label="Переключить тему"
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
      <ConsultantWidget theme={theme} />
    </div>
  );
}