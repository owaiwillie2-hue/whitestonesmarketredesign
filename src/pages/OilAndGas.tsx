import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Fuel, TrendingUp, Globe, Shield, BarChart, Zap } from "lucide-react";

const OilAndGas = () => {
  const features = [
    {
      icon: Fuel,
      title: "Upstream Projects",
      description: "Invest in exploration and production ventures in proven oil and gas reserves worldwide."
    },
    {
      icon: TrendingUp,
      title: "Strong ROI Potential",
      description: "Energy sector investments historically deliver robust returns during market cycles."
    },
    {
      icon: Globe,
      title: "Global Opportunities",
      description: "Access projects in North America, Middle East, North Sea, and emerging markets."
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Diversified portfolio approach minimizes exposure to individual project risks."
    },
    {
      icon: BarChart,
      title: "Market Analysis",
      description: "Expert insights on commodity prices, geopolitical factors, and industry trends."
    },
    {
      icon: Zap,
      title: "Energy Transition",
      description: "Exposure to renewable energy and sustainable transition opportunities."
    }
  ];

  const investments = [
    {
      project: "Offshore Drilling Operations",
      return: "12-18%",
      region: "Gulf of Mexico",
      investment: "$25,000",
      term: "5-7 years",
      risk: "Medium-High"
    },
    {
      project: "Natural Gas Pipeline",
      return: "9-13%",
      region: "North America",
      investment: "$15,000",
      term: "7-10 years",
      risk: "Medium"
    },
    {
      project: "Shale Oil Extraction",
      return: "14-22%",
      region: "Texas & Dakota",
      investment: "$30,000",
      term: "4-6 years",
      risk: "High"
    },
    {
      project: "Refinery Expansion",
      return: "10-15%",
      region: "Asia-Pacific",
      investment: "$20,000",
      term: "6-9 years",
      risk: "Medium"
    },
    {
      project: "LNG Terminal Operations",
      return: "11-16%",
      region: "Middle East",
      investment: "$35,000",
      term: "8-12 years",
      risk: "Medium-High"
    },
    {
      project: "Renewable Energy Transition",
      return: "8-12%",
      region: "Europe",
      investment: "$10,000",
      term: "5-8 years",
      risk: "Low-Medium"
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
              Oil & Gas <span className="text-primary">Investments</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Power your portfolio with strategic energy sector investments. Access upstream, midstream, 
              and downstream opportunities in the global oil and gas industry with expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/signup">Start Investing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">View Projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Energy Sector Advantages</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Strategic positioning in one of the world's most valuable industries
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

      {/* Investment Projects */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Current Investment Opportunities</h2>
          <p className="text-muted-foreground text-center mb-16">
            Carefully vetted energy projects with strong return potential
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investments.map((project, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-4">{project.project}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Return:</span>
                    <span className="font-semibold text-primary">{project.return}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region:</span>
                    <span className="font-semibold text-sm">{project.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Investment:</span>
                    <span className="font-semibold">{project.investment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Term:</span>
                    <span className="font-semibold">{project.term}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-semibold">{project.risk}</span>
                  </div>
                </div>
                <Button asChild className="w-full mt-6">
                  <Link to="/signup">View Details</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Insights */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Why Invest in Energy Now</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Global Energy Demand</h3>
              <p className="text-muted-foreground leading-relaxed">
                World energy consumption continues to grow, driven by emerging economies and industrialization. 
                Despite renewable energy growth, fossil fuels remain critical for meeting global energy needs 
                through 2050 and beyond.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Energy Transition Opportunities</h3>
              <p className="text-muted-foreground leading-relaxed">
                Major energy companies are investing heavily in clean energy transition projects. 
                Our portfolio includes both traditional and renewable energy investments, positioning 
                you to benefit from this historic shift.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Geopolitical Stability</h3>
              <p className="text-muted-foreground leading-relaxed">
                We focus on politically stable regions with established regulatory frameworks and 
                strong rule of law, minimizing geopolitical risks while maximizing return potential.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Infrastructure Investment</h3>
              <p className="text-muted-foreground leading-relaxed">
                Massive infrastructure investments in pipelines, terminals, and processing facilities 
                create long-term value streams and stable cash flows for investors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Power Your Portfolio with Energy Investments</h2>
          <p className="text-white/90 text-xl mb-8">
            Join institutional investors accessing the global energy sector
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

export default OilAndGas;
