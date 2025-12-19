import {
  ArrowDown01Icon,
  Cancel01Icon,
  Menu01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { navigation } from '@/config/brand';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navigation.main.map((item) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: Dropdown menu wrapper requires mouse events for hover behavior
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() =>
                item.type === 'dropdown' && setActiveDropdown(item.label)
              }
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {item.type === 'dropdown' ? (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted"
                  >
                    {item.label}
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdown === item.label && (
                    <>
                      {/* Invisible bridge to prevent dropdown from closing when mouse moves through gap */}
                      <div className="absolute top-full left-0 h-4 w-full" />

                      {/* Dropdown menu with visual spacing */}
                      <div className="absolute top-[calc(100%+1rem)] left-0 min-w-[200px]">
                        <div className="rounded-xl border border-border bg-background py-2 shadow-lg">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              className="block px-4 py-2 text-foreground text-sm transition-colors hover:bg-muted"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link
                  to={item.href}
                  className="rounded-lg px-3 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Right Side - CTA and Theme Toggle */}
        <div className="hidden items-center gap-3 md:flex">
          <Button render={<Link to={navigation.cta.href} />}>
            {navigation.cta.label}
          </Button>
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={2} />
            ) : (
              <HugeiconsIcon icon={Menu01Icon} size={24} strokeWidth={2} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-border border-t bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navigation.main.map((item) => (
              <div key={item.label}>
                {item.type === 'dropdown' ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === item.label ? null : item.label,
                        )
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted"
                    >
                      {item.label}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                        strokeWidth={2}
                        className={`transition-transform ${
                          activeDropdown === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {activeDropdown === item.label && (
                      <div className="mt-1 ml-4 flex flex-col gap-1">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="rounded-lg px-3 py-2 text-foreground text-sm transition-colors hover:bg-muted"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <Button
              render={
                <Link
                  to={navigation.cta.href}
                  onClick={() => setMobileMenuOpen(false)}
                />
              }
              className="mt-4 w-full"
            >
              {navigation.cta.label}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
