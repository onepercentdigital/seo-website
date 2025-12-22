import { Menu01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from '@tanstack/react-router';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { navigation } from '@/config/brand';

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigation.main.map((item) =>
              item.type === 'dropdown' ? (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {item.items.map((subItem) => (
                      <NavigationMenuLink
                        key={subItem.href}
                        render={<Link to={subItem.href} />}
                      >
                        {subItem.label}
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={item.label}>
                  <Link to={item.href} className={navigationMenuTriggerStyle()}>
                    {item.label}
                  </Link>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side - CTA and Theme Toggle */}
        <div className="hidden items-center gap-3 md:flex">
          <Button render={<Link to={navigation.cta.href} />}>
            {navigation.cta.label}
          </Button>
          <ThemeToggle />
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger
              nativeButton={true}
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu" />
              }
            >
              <HugeiconsIcon icon={Menu01Icon} size={24} strokeWidth={2} />
            </SheetTrigger>
            <SheetContent side="right" showCloseButton>
              <nav className="flex flex-col gap-4 pt-8">
                <Accordion className="rounded-none border-0">
                  {navigation.main
                    .filter((item) => item.type === 'dropdown')
                    .map((item) => (
                      <AccordionItem
                        key={item.label}
                        value={item.label}
                        className="border-b-0"
                      >
                        <AccordionTrigger className="py-2">
                          {item.label}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-1">
                            {item.items.map((subItem) => (
                              <SheetClose
                                key={subItem.href}
                                render={
                                  <Link
                                    to={subItem.href}
                                    className="rounded-lg px-3 py-2 text-foreground text-sm transition-colors hover:bg-muted"
                                  />
                                }
                              >
                                {subItem.label}
                              </SheetClose>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>

                {/* Plain links */}
                {navigation.main
                  .filter((item) => item.type === 'link')
                  .map((item) => (
                    <SheetClose
                      key={item.label}
                      render={
                        <Link
                          to={item.href}
                          className="rounded-lg px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted"
                        />
                      }
                    >
                      {item.label}
                    </SheetClose>
                  ))}

                {/* CTA */}
                <SheetClose
                  render={
                    <Button
                      render={<Link to={navigation.cta.href} />}
                      className="mt-4 w-full"
                    />
                  }
                >
                  {navigation.cta.label}
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
