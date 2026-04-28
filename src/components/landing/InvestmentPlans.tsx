import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export const InvestmentPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .order('min_amount');

    if (data) {
      setPlans(data);
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('investmentPlans.title')} <span className="text-primary">{t('investmentPlans.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('investmentPlans.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">{t('investmentPlans.loading')}</p>
            </div>
          ) : (
            plans.map((plan) => (
              <Card
                key={plan.id}
                className="relative shadow-soft hover:shadow-large transition-smooth"
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <p className="text-4xl font-bold text-primary">{plan.profit_percentage}%</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('investmentPlans.totalROI')}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      ${plan.min_amount.toLocaleString()} - {plan.max_amount ? `$${plan.max_amount.toLocaleString()}` : t('investmentPlans.unlimited')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('investmentPlans.duration')}: {plan.duration_days < 1 ? `${plan.duration_days * 24} hours` : `${plan.duration_days} days`}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full mt-4">
                    <Link to="/signup">{t('investmentPlans.getStarted')}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};