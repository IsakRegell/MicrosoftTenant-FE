import { Heart, Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-xl mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">JD</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">JSON Diff</span>
                <span className="text-xs text-muted-foreground">Manager</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              En modern lösning för att hantera och jämföra JSON-data med precision och elegans.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
              >
                <Github className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
              >
                <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
              >
                <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Snabblänkar</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Dokumentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Resurser</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Kom igång
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Best Practices
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <a href="mailto:info@jsondiff.se" className="hover:text-primary transition-colors">
                  info@jsondiff.se
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <a href="tel:+46812345678" className="hover:text-primary transition-colors">
                  +46 8 123 456 78
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Storgatan 1<br />
                  111 22 Stockholm
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            © {currentYear} JSON Diff Manager. Skapad med <Heart className="h-4 w-4 text-destructive inline animate-pulse" /> i Stockholm.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Integritetspolicy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Villkor
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
