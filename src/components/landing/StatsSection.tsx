import { useEffect, useRef, useState } from "react";
import { TrendingUp, Users, Calendar } from "lucide-react";

interface StatProps {
  icon: React.ReactNode;
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

const StatCounter = ({ icon, end, label, prefix = "", suffix = "", delay = 0 }: StatProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const stepValue = end / steps;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setCount(Math.min(currentStep * stepValue, end));

        if (currentStep >= steps) {
          clearInterval(interval);
          setCount(end);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, end, delay]);

  return (
    <div ref={ref} className="text-center reveal">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-4 text-primary">
        {icon}
      </div>
      <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
        {prefix}
        {count >= 1000 ? (count / 1000).toFixed(1) : count.toFixed(0)}
        {count >= 1000 && "K"}
        {suffix}
      </p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
};

export const StatsSection = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveals = el.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach((reveal) => observer.observe(reveal));
    return () => reveals.forEach((reveal) => observer.unobserve(reveal));
  }, []);

  return (
    <section className="py-20 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          <StatCounter
            icon={<TrendingUp size={32} />}
            end={2.5}
            label="Assets Under Management"
            prefix="$"
            suffix="B+"
            delay={0}
          />
          <StatCounter
            icon={<Users size={32} />}
            end={50}
            label="Active Investors"
            suffix="K+"
            delay={200}
          />
          <StatCounter
            icon={<Calendar size={32} />}
            end={15}
            label="Years Experience"
            suffix="+"
            delay={400}
          />
        </div>
      </div>
    </section>
  );
};