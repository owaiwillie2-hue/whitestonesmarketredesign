import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Investments = () => {
  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Investment Management</h1>
        <p className="text-xs text-slate-500 mt-1">Manage all investment categories and portfolios</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">currency_bitcoin</span>
              Cryptocurrencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Manage crypto investment portfolios and yields</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">real_estate_agent</span>
              Real Estate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Manage real estate listings and fractional investments</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">oil_barrel</span>
              Oil and Gas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Manage energy sector portfolios and distribution yields</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">palette</span>
              NFT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Manage digital art and collectible portfolios</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
              Retirement Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Manage retirement loan products and amortization schedules</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Investments;

