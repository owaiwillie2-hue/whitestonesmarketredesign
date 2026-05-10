import { UserPlus, ListChecks, Wallet, TrendingUp } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    number: "01",
    icon: <UserPlus className="w-7 h-7" />,
    title: "Open Account",
    description: "Create your free account in minutes with our simple registration process",
  },
  {
    number: "02",
    icon: <ListChecks className="w-7 h-7" />,
    title: "Select Plan",
    description: "Choose an investment plan that matches your financial goals and risk appetite",
  },
  {
    number: "03",
    icon: <Wallet className="w-7 h-7" />,
    title: "Fund Account",
    description: "Securely deposit funds using your preferred payment method",
  },
  {
    number: "04",
    icon: <TrendingUp className="w-7 h-7" />,
    title: "Start Earning",
    description: "Watch your investment grow with guaranteed returns",
  },
];

export const HowToJoin = () => {
  const sectionRef = useScrollReveal();

  return (
    <section className="py-20 bg-muted" ref={sectionRef as any}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 reveal">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How To <span className="text-primary">Get Started</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of successful investors in just four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className={`relative reveal reveal-delay-${index + 1}`}>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-soft card-hover-lift text-center h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
                  {step.number}
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-4 text-primary">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};