import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Shield, BarChart3, Zap, Bitcoin, Wallet, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const Cryptocurrencies = () => {
  const [isMuted, setIsMuted] = useState(true);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      // @ts-ignore
      playerRef.current = new YT.Player('crypto-video-player', {
        events: {
          onReady: (event: any) => {
            event.target.mute();
          }
        }
      });
    };
  }, []);

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const cryptoFeatures = [
    {
      icon: Bitcoin,
      title: "Diverse Crypto Portfolio",
      description: "Access Bitcoin, Ethereum, and 50+ major cryptocurrencies through our secure platform."
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "Your crypto assets are protected with multi-signature wallets and cold storage solutions."
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Advanced charting tools and market indicators to track your cryptocurrency investments."
    },
    {
      icon: Zap,
      title: "Lightning-Fast Trades",
      description: "Execute trades instantly with our high-performance trading infrastructure."
    },
    {
      icon: TrendingUp,
      title: "Expert Market Insights",
      description: "Weekly analysis and forecasts from our team of blockchain specialists."
    },
    {
      icon: Wallet,
      title: "Integrated Wallet",
      description: "Manage all your digital assets in one secure, user-friendly wallet."
    }
  ];

  const popularCryptos = [
    { name: "Bitcoin (BTC)", return: "145%", risk: "Medium", minInvest: "$500" },
    { name: "Ethereum (ETH)", return: "238%", risk: "Medium", minInvest: "$250" },
    { name: "Binance Coin (BNB)", return: "312%", risk: "High", minInvest: "$100" },
    { name: "Cardano (ADA)", return: "189%", risk: "Medium-High", minInvest: "$100" },
    { name: "Solana (SOL)", return: "456%", risk: "High", minInvest: "$150" },
    { name: "Polkadot (DOT)", return: "167%", risk: "Medium", minInvest: "$100" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Cryptocurrency <span className="text-primary">Investment</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Invest in the future of finance with our comprehensive cryptocurrency trading platform. 
              Access the world's leading digital assets with institutional-grade security and support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/signup">Start Crypto Investing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/markets">View Markets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Choose Our Crypto Platform</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Industry-leading features designed for both beginners and experienced traders
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cryptoFeatures.map((feature, index) => (
              <div key={index} className="card-premium p-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Understanding Bitcoin Video Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-6">Understanding Bitcoin</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-3xl mx-auto">
            Bitcoin is the world's first cryptocurrency and remains the most valuable digital asset. 
            Understanding how Bitcoin works is essential for navigating crypto trading, deposits, and withdrawals on our platform. 
            Watch this comprehensive video to learn about Bitcoin's fundamentals, how blockchain technology powers it, 
            and why it's revolutionizing the financial industry.
          </p>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              id="crypto-video-player"
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-elegant"
              src="https://www.youtube.com/embed/Gc2en3nHxA4?si=suoZ9sxqaRM8zpMg&autoplay=1&mute=1&enablejsapi=1"
              title="Understanding Bitcoin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 bg-background/80 hover:bg-background border border-border rounded-full p-3 transition-smooth z-10 shadow-lg"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-foreground" />
              ) : (
                <Volume2 className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Popular Cryptocurrencies */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Popular Cryptocurrencies</h2>
          <p className="text-muted-foreground text-center mb-16">
            Top performing digital assets on our platform (Annual returns)
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCryptos.map((crypto, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-elegant transition-smooth">
                <h3 className="text-xl font-bold mb-4">{crypto.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Return:</span>
                    <span className="font-semibold text-primary">{crypto.return}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-semibold">{crypto.risk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Investment:</span>
                    <span className="font-semibold">{crypto.minInvest}</span>
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

      {/* Risk Disclaimer */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Important Investment Disclaimer
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Cryptocurrency investments carry significant risk and volatility. Past performance does not guarantee future results. 
              The value of digital assets can fluctuate dramatically and you may lose your entire investment. 
              Only invest what you can afford to lose. Whitestones Markets provides the platform and tools, 
              but all investment decisions are your own responsibility. Consult with a financial advisor before making any investment decisions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Crypto Journey?</h2>
          <p className="text-white/90 text-xl mb-8">
            Join thousands of investors already trading cryptocurrencies on our platform
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

export default Cryptocurrencies;
