import { useState, useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

const Markets = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false'
        );
        const data = await response.json();
        setCryptoData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Live Crypto Market Prices
            </h1>
            <p className="text-xl text-muted-foreground">
              Real-time cryptocurrency market data powered by CoinGecko
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Loading market data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Rank</th>
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Name</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Price</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">24h Change</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Market Cap</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Volume (24h)</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">High (24h)</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Low (24h)</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoData.map((crypto, index) => (
                    <tr key={crypto.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 text-foreground font-medium">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{crypto.name}</span>
                          <span className="text-muted-foreground text-sm uppercase">{crypto.symbol}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold text-foreground">
                        ${crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`flex items-center justify-end gap-1 ${
                          crypto.price_change_percentage_24h >= 0 ? "text-success" : "text-destructive"
                        }`}>
                          {crypto.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-semibold">
                            {crypto.price_change_percentage_24h >= 0 ? "+" : ""}
                            {crypto.price_change_percentage_24h.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-muted-foreground">
                        ${crypto.market_cap.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-muted-foreground">
                        ${crypto.total_volume.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-muted-foreground">
                        ${crypto.high_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-right text-muted-foreground">
                        ${crypto.low_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Markets;
