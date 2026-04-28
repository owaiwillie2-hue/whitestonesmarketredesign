import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export const CryptoTicker = () => {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false'
        );
        const data = await response.json();
        
        const formattedData = data.map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change: coin.price_change_percentage_24h,
        }));
        
        setCryptoPrices(formattedData);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-muted py-4 border-y border-border">
      <div className="container mx-auto px-4 overflow-hidden">
        <div className="flex animate-scroll">
          {[...cryptoPrices, ...cryptoPrices].map((crypto, index) => (
            <div
              key={`${crypto.symbol}-${index}`}
              className="flex items-center space-x-4 px-6 border-r border-border/50 min-w-max"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {crypto.symbol}
                  <span className="text-muted-foreground text-sm ml-1">{crypto.name}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-mono font-semibold">
                  ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div
                  className={`flex items-center space-x-1 ${
                    crypto.change >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {crypto.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {crypto.change >= 0 ? "+" : ""}
                    {crypto.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};