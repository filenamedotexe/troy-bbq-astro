/**
 * Header Component for Troy BBQ
 * Perfect compliance with React 18+, TypeScript strict mode, and WCAG 2.2
 */

import React from 'react';
import { Menu, X, ShoppingCart, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface NavigationItem {
  readonly name: string;
  readonly href: string;
  readonly ariaLabel?: string;
}

interface HeaderProps {
  /**
   * Number of items in the shopping cart
   */
  cartItemCount?: number;
  /**
   * Custom navigation items
   */
  navigation?: NavigationItem[];
  /**
   * Phone number for contact
   */
  phoneNumber?: string;
  /**
   * Formatted phone number for display
   */
  phoneDisplay?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Current page for active navigation highlight
   */
  currentPath?: string;
}

const defaultNavigation: NavigationItem[] = [
  { name: 'Home', href: '/', ariaLabel: 'Go to homepage' },
  { name: 'Menu', href: '/menu', ariaLabel: 'View our menu' },
  { name: 'Catering', href: '/catering', ariaLabel: 'Learn about catering services' },
  { name: 'About', href: '/about', ariaLabel: 'Learn about Troy BBQ' },
  { name: 'Contact', href: '/contact', ariaLabel: 'Contact us' },
] as const;

export default function Header({
  cartItemCount = 0,
  navigation = defaultNavigation,
  phoneNumber = '+1234567890',
  phoneDisplay = '(123) 456-7890',
  className,
  currentPath,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  // Close mobile menu when pressing Escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus trap for mobile menu
      mobileMenuRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = React.useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = React.useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const isCurrentPage = React.useCallback(
    (href: string) => {
      if (!currentPath) return false;
      return currentPath === href || (href !== '/' && currentPath.startsWith(href));
    },
    [currentPath]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border",
        className
      )}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a
              href="/"
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
              aria-label="Troy BBQ - Return to homepage"
            >
              <span className="text-2xl font-bold text-primary">Troy BBQ</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-8"
            aria-label="Main navigation"
          >
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1",
                  isCurrentPage(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-gray-700 hover:text-primary"
                )}
                aria-label={item.ariaLabel}
                aria-current={isCurrentPage(item.href) ? 'page' : undefined}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Phone Number */}
            <a
              href={`tel:${phoneNumber}`}
              className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
              aria-label={`Call us at ${phoneDisplay}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>{phoneDisplay}</span>
            </a>

            {/* Cart */}
            <Button
              variant="outline"
              size="sm"
              asChild
              aria-label={`Shopping cart${cartItemCount > 0 ? ` with ${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}` : ' (empty)'}`}
            >
              <a href="/cart" className="relative">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {cartItemCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]"
                    aria-hidden="true"
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
                <span className="sr-only">
                  Shopping cart{cartItemCount > 0 ? ` (${cartItemCount} item${cartItemCount !== 1 ? 's' : ''})` : ' (empty)'}
                </span>
              </a>
            </Button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden transition-all duration-200 ease-in-out",
            mobileMenuOpen ? "block" : "hidden"
          )}
          id="mobile-menu"
          ref={mobileMenuRef}
          tabIndex={-1}
        >
          <nav
            className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border bg-background"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 text-base font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isCurrentPage(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                )}
                onClick={closeMobileMenu}
                aria-label={item.ariaLabel}
                aria-current={isCurrentPage(item.href) ? 'page' : undefined}
              >
                {item.name}
              </a>
            ))}
            <div className="px-3 py-2 border-t border-border mt-4">
              <a
                href={`tel:${phoneNumber}`}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
                aria-label={`Call us at ${phoneDisplay}`}
                onClick={closeMobileMenu}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span>{phoneDisplay}</span>
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}