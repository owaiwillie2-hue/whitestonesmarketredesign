import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { InvestmentOptions } from "@/components/landing/InvestmentOptions";
import { InvestmentPlans } from "@/components/landing/InvestmentPlans";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Investments = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Investment <span className="text-primary">Opportunities</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore diverse investment options across multiple asset classes. From cryptocurrencies 
              to real estate, oil & gas to NFTs - build a portfolio that works for your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/signup">Start Investing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">View All Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Options */}
      <InvestmentOptions />

      {/* Investment Plans */}
      <InvestmentPlans />

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Why Invest with Whitestones Markets</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "15+ Years Experience",
                description: "Proven track record of delivering consistent returns to our investors across market cycles."
              },
              {
                title: "Diversified Portfolio",
                description: "Access to multiple asset classes helps minimize risk while maximizing growth potential."
              },
              {
                title: "Expert Management",
                description: "Professional portfolio managers actively monitor and optimize your investments."
              },
              {
                title: "Transparent Reporting",
                description: "Real-time performance tracking and detailed monthly statements for complete visibility."
              },
              {
                title: "Secure Platform",
                description: "Bank-level security protocols protect your investments and personal information."
              },
              {
                title: "24/7 Support",
                description: "Dedicated customer service team available around the clock to assist you."
              }
            ].map((item, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Build Your Investment Portfolio?</h2>
          <p className="text-white/90 text-xl mb-8">
            Join thousands of investors achieving their financial goals with Whitestones Markets
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Link to="/signup">Open Free Account</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Investments;
