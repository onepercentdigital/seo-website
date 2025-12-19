import { Moon01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Detect system preference and stored theme
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';
    const initialTheme = storedTheme || systemTheme;

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for theme changes from other toggle instances
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<'light' | 'dark'>;
      const newTheme = customEvent.detail;
      setTheme(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');

    // Dispatch custom event to sync all theme toggle instances
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        className="relative inline-flex size-9 items-center justify-center rounded-4xl border border-input bg-input/30 text-foreground transition-all hover:bg-input/50"
        aria-label="Toggle theme"
      >
        <HugeiconsIcon icon={Sun01Icon} size={16} strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex size-9 items-center justify-center rounded-4xl border border-input bg-input/30 text-foreground transition-all hover:bg-input/50"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <HugeiconsIcon icon={Moon01Icon} size={16} strokeWidth={2} />
      ) : (
        <HugeiconsIcon icon={Sun01Icon} size={16} strokeWidth={2} />
      )}
    </button>
  );
}
