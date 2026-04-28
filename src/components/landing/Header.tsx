import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun } from "lucide-react";
import logo from "@/assets/logo.png";
import { useTheme } from "@/contexts/ThemeContext";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Investments", href: "/investments" },
    { name: "Cryptocurrencies", href: "/cryptocurrencies" },
    { name: "Real Estate", href: "/real-estate" },
    { name: "Oil and Gas", href: "/oil-and-gas" },
    { name: "NFT", href: "/nft" },
    { name: "Retirement", href: "/retirement" },
    { name: "Loan", href: "/loan" },
    { name: "Company", href: "/company" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-smooth ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-medium"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Whitestones Markets" className="h-10" />
          </Link>

          {/* Theme toggle and Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 hover:text-primary transition-smooth"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

      </div>

      {/* Full Screen Overlay Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center space-x-3" onClick={() => setIsMobileMenuOpen(false)}>
                <img src={logo} alt="Whitestones Markets" className="h-10" />
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-foreground text-lg font-medium py-2 hover:text-primary transition-smooth hover:translate-x-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ 
                    animation: `fade-in 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-6" style={{ 
                animation: `fade-in 0.3s ease-out ${navLinks.length * 0.05 + 0.1}s both`
              }}>
                <Button asChild variant="outline" className="w-full h-12 text-base transition-smooth hover:scale-105">
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>Open a Free Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};