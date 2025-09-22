import { Shield, Menu, LogOut, LogIn, User as UserIcon, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useProfile } from "@/hooks/useProfile";
import { Separator } from "@/components/ui/separator";

const Header = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess("You have been logged out.");
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/map", label: "Live Map" },
    { to: "/report", label: "Report Issue" },
    { to: "/alerts", label: "Alerts" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-blue-600" />
          <Link to="/" className="font-bold text-lg">
            FloodShield Tamil Nadu
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {link.label}
            </Link>
          ))}
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60"
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Admin
            </Link>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name || "User"} />
                    <AvatarFallback>
                      {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.first_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-reports">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>My Reports</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
          )}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex items-center mb-6">
                  <Shield className="h-6 w-6 mr-2 text-blue-600" />
                  <span className="font-bold text-lg">FloodShield</span>
                </div>
                <Separator />
                <nav className="flex flex-col space-y-1 mt-6 text-base">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.label}>
                      <Link
                        to={link.to}
                        className="transition-colors hover:bg-accent p-3 rounded-md"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                   {profile?.role === 'admin' && (
                    <SheetClose asChild>
                      <Link to="/admin" className="transition-colors hover:bg-accent p-3 rounded-md flex items-center">
                        <ShieldCheck className="h-5 w-5 mr-2" />
                        Admin
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;