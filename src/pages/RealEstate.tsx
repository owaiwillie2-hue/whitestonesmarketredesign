import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, MapPin, DollarSign, Users, Award } from "lucide-react";

const RealEstate = () => {
  const features = [
    {
      icon: Building2,
      title: "Premium Properties",
      description: "Access exclusive real estate opportunities in prime locations across global markets."
    },
    {
      icon: TrendingUp,
      title: "Consistent Returns",
      description: "Enjoy stable, long-term appreciation and rental income from diversified property portfolios."
    },
    {
      icon: MapPin,
      title: "Global Diversification",
      description: "Invest in commercial and residential properties across North America, Europe, and Asia."
    },
    {
      icon: DollarSign,
      title: "Low Entry Point",
      description: "Start investing in real estate with as little as $5,000 through fractional ownership."
    },
    {
      icon: Users,
      title: "Professional Management",
      description: "Our expert property managers handle all aspects of property maintenance and tenant relations."
    },
    {
      icon: Award,
      title: "Proven Track Record",
      description: "15+ years of delivering consistent returns to real estate investors."
    }
  ];

  const propertyTypes = [
    {
      type: "Commercial Office Buildings",
      avgReturn: "8-12%",
      location: "Major City Centers",
      investment: "$10,000",
      term: "5-10 years"
    },
    {
      type: "Luxury Residential Apartments",
      avgReturn: "9-14%",
      location: "High-Demand Urban Areas",
      investment: "$5,000",
      term: "3-7 years"
    },
    {
      type: "Industrial Warehouses",
      avgReturn: "10-15%",
      location: "Strategic Logistics Hubs",
      investment: "$15,000",
      term: "7-12 years"
    },
    {
      type: "Retail Shopping Centers",
      avgReturn: "7-11%",
      location: "Suburban Growth Areas",
      investment: "$8,000",
      term: "5-8 years"
    },
    {
      type: "Mixed-Use Developments",
      avgReturn: "11-16%",
      location: "Emerging Markets",
      investment: "$12,000",
      term: "8-15 years"
    },
    {
      type: "Student Housing",
      avgReturn: "9-13%",
      location: "University Districts",
      investment: "$6,000",
      term: "4-6 years"
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
              Real Estate <span className="text-primary">Investments</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Build lasting wealth through strategic real estate investments. Our curated portfolio offers 
              access to premium properties with professional management and consistent returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/signup">Start Investing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">View Properties</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Real Estate with Whitestones</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Experience the benefits of institutional-quality real estate investing
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

      {/* Property Types */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Investment Opportunities</h2>
          <p className="text-muted-foreground text-center mb-16">
            Diversify across multiple property types and locations
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertyTypes.map((property, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-4">{property.type}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Annual Return:</span>
                    <span className="font-semibold text-primary">{property.avgReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-semibold text-sm text-right">{property.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Investment:</span>
                    <span className="font-semibold">{property.investment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Investment Term:</span>
                    <span className="font-semibold">{property.term}</span>
                  </div>
                </div>
                <Button asChild className="w-full mt-6">
                  <Link to="/signup">Learn More</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">How Real Estate Investing Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Choose Property", desc: "Browse our curated selection of investment properties" },
              { step: "2", title: "Invest Capital", desc: "Start with as little as $5,000 through fractional ownership" },
              { step: "3", title: "Earn Returns", desc: "Receive quarterly dividends from rental income" },
              { step: "4", title: "Grow Wealth", desc: "Benefit from property appreciation over time" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Start Building Your Real Estate Portfolio</h2>
          <p className="text-white/90 text-xl mb-8">
            Join successful investors earning consistent returns from premium properties
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

export default RealEstate;
