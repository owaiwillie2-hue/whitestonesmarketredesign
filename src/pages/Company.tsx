import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { AboutSection } from "@/components/landing/AboutSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { PartnersSection } from "@/components/landing/PartnersSection";

const Company = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              About <span className="text-primary">Whitestones Markets</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your trusted partner in wealth creation and financial growth for over 15 years
            </p>
          </div>
        </div>
      </section>

      <StatsSection />
      <AboutSection />
      <PartnersSection />

      <Footer />
    </div>
  );
};

export default Company;
