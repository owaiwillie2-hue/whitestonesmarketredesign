import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PiggyBank, Shield, TrendingUp, Heart, Home, Wallet } from "lucide-react";

const RetirementLoan = () => {
  const features = [
    {
      icon: PiggyBank,
      title: "Retirement Planning",
      description: "Build a comprehensive retirement portfolio with tax-advantaged investment strategies."
    },
    {
      icon: Shield,
      title: "Capital Preservation",
      description: "Conservative investment approach focused on protecting your retirement nest egg."
    },
    {
      icon: TrendingUp,
      title: "Growth & Income",
      description: "Balanced strategies that provide both capital appreciation and regular income streams."
    },
    {
      icon: Home,
      title: "Retirement Loans",
      description: "Access flexible loan options against your retirement savings when you need it most."
    },
    {
      icon: Heart,
      title: "Legacy Planning",
      description: "Ensure your wealth is protected and passed on to future generations efficiently."
    },
    {
      icon: Wallet,
      title: "Tax Optimization",
      description: "Strategies to minimize tax burden and maximize your retirement income."
    }
  ];

  const retirementPlans = [
    {
      plan: "Conservative Growth",
      return: "6-8%",
      risk: "Low",
      investment: "$5,000",
      term: "10-30 years",
      features: "Bond-heavy, stable returns"
    },
    {
      plan: "Balanced Retirement",
      return: "8-12%",
      risk: "Medium",
      investment: "$10,000",
      term: "10-25 years",
      features: "60/40 stocks/bonds mix"
    },
    {
      plan: "Growth-Focused IRA",
      return: "10-15%",
      risk: "Medium-High",
      investment: "$7,500",
      term: "15-40 years",
      features: "Equity-focused, tax-deferred"
    },
    {
      plan: "Income Generation",
      return: "7-10%",
      risk: "Low-Medium",
      investment: "$15,000",
      term: "5-15 years",
      features: "Dividend & interest income"
    },
    {
      plan: "Target-Date Fund",
      return: "8-13%",
      risk: "Medium",
      investment: "$5,000",
      term: "5-40 years",
      features: "Auto-adjusting allocation"
    },
    {
      plan: "Roth Conversion Strategy",
      return: "9-14%",
      risk: "Medium",
      investment: "$20,000",
      term: "10-30 years",
      features: "Tax-free growth potential"
    }
  ];

  const loanOptions = [
    {
      type: "Retirement Savings Loan",
      rate: "4.5-7%",
      amount: "Up to $50,000",
      term: "5-15 years",
      purpose: "Emergency expenses, debt consolidation"
    },
    {
      type: "IRA-Backed Loan",
      rate: "5-8%",
      amount: "Up to $100,000",
      term: "10-20 years",
      purpose: "Home purchase, education"
    },
    {
      type: "401(k) Loan",
      rate: "Prime + 1-2%",
      amount: "Up to 50% of vested balance",
      term: "1-5 years",
      purpose: "Short-term financing needs"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Retirement <span className="text-primary">& Loan Solutions</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Secure your financial future with expert retirement planning and access flexible loan 
              options when life requires it. Build wealth, preserve capital, and maintain financial flexibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/signup">Start Planning</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Explore Options</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Comprehensive Retirement Solutions</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Everything you need for a secure and comfortable retirement
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-premium p-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Retirement Plans */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Retirement Investment Plans</h2>
          <p className="text-muted-foreground text-center mb-16">
            Choose the strategy that matches your retirement timeline and risk tolerance
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {retirementPlans.map((plan, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-4">{plan.plan}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Return:</span>
                    <span className="font-semibold text-primary">{plan.return}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-semibold">{plan.risk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Investment:</span>
                    <span className="font-semibold">{plan.investment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Horizon:</span>
                    <span className="font-semibold text-sm">{plan.term}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">{plan.features}</p>
                  </div>
                </div>
                <Button asChild className="w-full mt-6">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Options */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Retirement Loan Options</h2>
          <p className="text-muted-foreground text-center mb-16">
            Access your retirement savings when you need it with flexible loan programs
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {loanOptions.map((loan, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-4">{loan.type}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-semibold text-primary">{loan.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Amount:</span>
                    <span className="font-semibold text-sm">{loan.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Repayment Term:</span>
                    <span className="font-semibold">{loan.term}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground"><strong>Use:</strong> {loan.purpose}</p>
                  </div>
                </div>
                <Button asChild className="w-full mt-6" variant="outline">
                  <Link to="/signup">Apply Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Why Plan Your Retirement with Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Expert Financial Planning</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our certified financial planners work with you to create a personalized retirement strategy 
                that considers your age, risk tolerance, retirement goals, and current financial situation. 
                We help you navigate complex decisions about asset allocation, tax optimization, and income planning.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Flexible Loan Access</h3>
              <p className="text-muted-foreground leading-relaxed">
                Life is unpredictable. When unexpected expenses arise or opportunities present themselves, 
                our retirement loan programs let you access your savings without penalties or excessive fees. 
                Competitive rates and flexible terms ensure you can handle life's challenges while keeping your 
                retirement plan on track.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Start Your Retirement Journey Today</h2>
          <p className="text-white/90 text-xl mb-8">
            Take control of your financial future with expert guidance and flexible solutions
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

export default RetirementLoan;
