import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Palette, TrendingUp, Shield, Zap, Users, Award } from "lucide-react";

const NFT = () => {
  const features = [
    {
      icon: Palette,
      title: "Blue-Chip NFT Collections",
      description: "Access premium NFT collections from established artists and projects with proven value."
    },
    {
      icon: TrendingUp,
      title: "Fractional Ownership",
      description: "Invest in high-value NFTs through fractional shares, starting from as little as $100."
    },
    {
      icon: Shield,
      title: "Secure Custody",
      description: "Your digital assets are protected in institutional-grade cold storage wallets."
    },
    {
      icon: Zap,
      title: "Instant Liquidity",
      description: "Trade your NFT positions quickly on our integrated marketplace."
    },
    {
      icon: Users,
      title: "Expert Curation",
      description: "Our team selects NFTs based on artist reputation, rarity, and market potential."
    },
    {
      icon: Award,
      title: "Proven Track Record",
      description: "Portfolio of NFTs with consistent appreciation and strong community support."
    }
  ];

  const collections = [
    {
      name: "Blue-Chip Art Collection",
      avgReturn: "180%",
      examples: "CryptoPunks, BAYC equivalents",
      investment: "$500",
      risk: "Medium-High"
    },
    {
      name: "Metaverse Real Estate",
      avgReturn: "245%",
      examples: "Prime virtual land parcels",
      investment: "$1,000",
      risk: "High"
    },
    {
      name: "Gaming NFT Assets",
      avgReturn: "156%",
      examples: "Play-to-earn game items",
      investment: "$250",
      risk: "High"
    },
    {
      name: "Digital Art Masters",
      avgReturn: "198%",
      examples: "Established digital artists",
      investment: "$750",
      risk: "Medium"
    },
    {
      name: "Utility NFT Projects",
      avgReturn: "134%",
      examples: "Membership & access tokens",
      investment: "$300",
      risk: "Medium-High"
    },
    {
      name: "Sports & Collectibles",
      avgReturn: "167%",
      examples: "Licensed sports moments",
      investment: "$400",
      risk: "Medium"
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
              NFT <span className="text-primary">Investments</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Enter the world of digital asset ownership with curated NFT investments. Access premium 
              collections, metaverse properties, and rare digital art through our expert-managed platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/signup">Start NFT Investing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Browse Collections</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Invest in NFTs with Whitestones</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Professional NFT investment made accessible to everyone
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

      {/* NFT Collections */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Curated NFT Collections</h2>
          <p className="text-muted-foreground text-center mb-16">
            Hand-picked digital assets with strong appreciation potential (Historical returns)
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-4">{collection.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Return:</span>
                    <span className="font-semibold text-primary">{collection.avgReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Examples:</span>
                    <span className="font-semibold text-sm text-right">{collection.examples}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Investment:</span>
                    <span className="font-semibold">{collection.investment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-semibold">{collection.risk}</span>
                  </div>
                </div>
                <Button asChild className="w-full mt-6">
                  <Link to="/signup">Invest Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">How NFT Investing Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Select Collection", desc: "Browse our curated NFT investment opportunities" },
              { step: "2", title: "Fractional Shares", desc: "Buy fractional ownership in high-value NFTs" },
              { step: "3", title: "Professional Management", desc: "We handle custody, security, and marketplace listings" },
              { step: "4", title: "Realize Gains", desc: "Sell your shares when NFT values appreciate" }
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

      {/* Market Education */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Understanding NFT Investments</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">What Are NFTs?</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Non-Fungible Tokens (NFTs) are unique digital assets verified on blockchain technology. 
                Each NFT has distinct properties that make it one-of-a-kind and verifiably scarce.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                NFTs represent ownership of digital art, virtual real estate, gaming items, collectibles, 
                membership rights, and more. The blockchain ensures authenticity and ownership history.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Investment Potential</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The NFT market has shown explosive growth, with blue-chip collections appreciating 
                significantly. Early investors in projects like CryptoPunks saw returns exceeding 10,000%.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                While past performance doesn't guarantee future results, the growing adoption of digital 
                ownership and metaverse development creates ongoing opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Warning */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              NFT Investment Disclaimer
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              NFT investments carry significant risk and extreme volatility. The NFT market is nascent and 
              speculative. Asset values can fluctuate wildly, and there's no guarantee of liquidity. You may 
              lose your entire investment. NFTs are not regulated as securities in most jurisdictions. 
              Only invest capital you can afford to lose completely. This is not financial advice - conduct 
              thorough research and consult with financial advisors before investing.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Own the Digital Future?</h2>
          <p className="text-white/90 text-xl mb-8">
            Start building your NFT portfolio with expert guidance and secure custody
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

export default NFT;
