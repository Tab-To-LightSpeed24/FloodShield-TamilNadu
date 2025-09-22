import { Shield, Menu, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";

const Header = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

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
            FloodShield Chennai
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
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {session ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
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
                <nav className="flex flex-col space-y-4 mt-8 text-lg">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.label}>
                      <Link
                        to={link.to}
                        className="transition-colors hover:text-foreground/80"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                   <div className="pt-4 border-t">
                    {session ? (
                      <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="h-5 w-5 mr-2" />
                        Logout
                      </Button>
                    ) : (
                      <SheetClose asChild>
                        <Link to="/login" className="flex items-center w-full p-2 rounded-md transition-colors hover:bg-muted">
                          <LogIn className="h-5 w-5 mr-2" />
                          Login
                        </Link>
                      </SheetClose>
                    )}
                  </div>
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