import { Shield, Award, Users2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const AboutSection = () => {
  const { t } = useLanguage();
  const sectionRef = useScrollReveal();

  return (
    <section id="about" className="py-20 bg-background" ref={sectionRef as any}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16 reveal">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('about.title')} <span className="text-primary">{t('about.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('about.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft card-hover-lift reveal reveal-delay-1">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('about.secure.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('about.secure.desc')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft card-hover-lift reveal reveal-delay-2">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('about.award.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('about.award.desc')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft card-hover-lift reveal reveal-delay-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Users2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('about.expert.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('about.expert.desc')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft card-hover-lift reveal reveal-delay-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('about.results.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('about.results.desc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};