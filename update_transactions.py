import sys

file_path = 'src/pages/dashboard/Transactions.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_content = """  return (
    <div className="space-y-4 md:space-y-6 max-w-md mx-auto pb-28">
      {/* Header & Export Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-headline-lg text-3xl text-on-surface">Transactions</h2>
          <p className="font-label-md text-label-md text-on-surface-variant opacity-70">Review your capital flow</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-secondary-container text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
          <span className="font-label-md hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <p className="font-label-md text-on-surface-variant mb-1">Total Deposits</p>
          <p className="font-display-lg text-[28px] text-primary">${stats.totalDeposited.toFixed(2)}</p>
          <div className="mt-3 flex items-center text-on-tertiary-container gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-semibold">{stats.transactionCount} total transactions</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="font-label-md text-on-surface-variant mb-1">Profit</p>
          <p className="font-headline-md text-on-tertiary-container">${stats.totalProfit.toFixed(0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="font-label-md text-on-surface-variant mb-1">Invested</p>
          <p className="font-headline-md text-primary">${stats.totalInvested.toFixed(0)}</p>
        </div>
      </div>

      {/* Filters & Navigation */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap transition-colors ${dateFilter === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
          >
            All Time
          </button>
          <button 
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap transition-colors ${dateFilter === 'month' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
          >
            This Month
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap flex items-center gap-1 transition-colors ${dateFilter === 'custom' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                {dateFilter === 'custom' && dateRange.from ? format(dateRange.from, "MMM dd") + (dateRange.to ? ` - ${format(dateRange.to, "MMM dd")}` : '') : 'Custom Range'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  if (range?.from) setDateFilter('custom');
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 pb-3 px-2 font-label-md whitespace-nowrap transition-colors ${activeTab === 'general' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 pb-3 px-2 font-label-md whitespace-nowrap transition-colors ${activeTab === 'deposits' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}
          >
            Deposits
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 pb-3 px-2 font-label-md whitespace-nowrap transition-colors ${activeTab === 'withdrawals' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}
          >
            Withdrawals
          </button>
          <button 
            onClick={() => setActiveTab('investments')}
            className={`flex-1 pb-3 px-2 font-label-md whitespace-nowrap transition-colors ${activeTab === 'investments' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}
          >
            Investments
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {activeTab === 'general' && combinedTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No transactions found.</p>
          </div>
        )}
        
        {activeTab === 'general' && combinedTransactions.map((transaction) => {
          let icon = 'swap_horiz';
          let iconBg = 'bg-slate-50';
          let iconColor = 'text-slate-600';
          let amountColor = 'text-primary';
          
          if (transaction.type === 'deposit' || transaction.amount > 0) {
            icon = 'south_west';
            iconBg = 'bg-blue-50';
            iconColor = 'text-blue-600';
            amountColor = 'text-on-tertiary-container';
          } else if (transaction.type === 'withdrawal') {
            icon = 'north_east';
            iconBg = 'bg-error-container/20';
            iconColor = 'text-error';
            amountColor = 'text-error';
          } else if (transaction.type === 'investment') {
            icon = 'trending_up';
            iconBg = 'bg-slate-50';
            iconColor = 'text-slate-600';
            amountColor = 'text-primary';
          }

          let statusBg = 'bg-slate-100';
          let statusText = 'text-slate-600';
          if (transaction.status === 'completed' || transaction.status === 'active') {
            statusBg = 'bg-tertiary-fixed-dim/20';
            statusText = 'text-on-tertiary-fixed-variant';
          } else if (transaction.status === 'pending' || transaction.status === 'processing') {
            statusBg = 'bg-amber-50';
            statusText = 'text-amber-600';
          } else if (transaction.status === 'rejected' || transaction.status === 'cancelled') {
            statusBg = 'bg-error-container';
            statusText = 'text-on-error-container';
          }

          return (
            <div key={`${transaction.source}-${transaction.id}`} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-headline-md text-[16px] text-on-surface truncate capitalize">{transaction.type === 'investment' ? 'Investment' : transaction.type}</h4>
                  <span className={`font-data-mono shrink-0 ${amountColor}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-label-md text-on-surface-variant text-xs opacity-60 truncate mr-2">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy • HH:mm')}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusBg} ${statusText}`}>
                    {transaction.status}
                  </span>
                </div>
                {transaction.source === 'deposit' && (
                  <button 
                    onClick={() => viewProof(deposits.find(d => d.id === transaction.id) as Deposit)}
                    className="mt-2 inline-flex items-center gap-1 text-secondary text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                    View Payment Proof
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {activeTab === 'deposits' && filteredDeposits.length === 0 && (
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No deposits found.</p>
          </div>
        )}
        
        {activeTab === 'deposits' && filteredDeposits.map((deposit) => {
          let statusBg = 'bg-slate-100';
          let statusText = 'text-slate-600';
          if (deposit.status === 'completed') {
            statusBg = 'bg-tertiary-fixed-dim/20';
            statusText = 'text-on-tertiary-fixed-variant';
          } else if (deposit.status === 'pending' || deposit.status === 'processing') {
            statusBg = 'bg-amber-50';
            statusText = 'text-amber-600';
          } else if (deposit.status === 'rejected') {
            statusBg = 'bg-error-container';
            statusText = 'text-on-error-container';
          }

          return (
            <div key={deposit.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                <span className="material-symbols-outlined">south_west</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-headline-md text-[16px] text-on-surface truncate">Deposit</h4>
                  <span className="font-data-mono shrink-0 text-on-tertiary-container">
                    +${deposit.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-label-md text-on-surface-variant text-xs opacity-60 truncate mr-2">
                    {format(new Date(deposit.created_at), 'MMM dd, yyyy • HH:mm')}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusBg} ${statusText}`}>
                    {deposit.status}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1 capitalize">Method: {deposit.payment_method}</p>
                {deposit.proof_url && (
                  <button 
                    onClick={() => viewProof(deposit)}
                    className="mt-2 inline-flex items-center gap-1 text-secondary text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                    View Payment Proof
                  </button>
                )}
                {deposit.status === 'rejected' && deposit.notes && (
                  <p className="mt-2 text-[10px] text-error bg-error-container/20 p-2 rounded">{deposit.notes}</p>
                )}
              </div>
            </div>
          );
        })}

        {activeTab === 'withdrawals' && filteredWithdrawals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No withdrawals found.</p>
          </div>
        )}
        
        {activeTab === 'withdrawals' && filteredWithdrawals.map((withdrawal) => {
          let statusBg = 'bg-slate-100';
          let statusText = 'text-slate-600';
          if (withdrawal.status === 'completed') {
            statusBg = 'bg-tertiary-fixed-dim/20';
            statusText = 'text-on-tertiary-fixed-variant';
          } else if (withdrawal.status === 'pending' || withdrawal.status === 'processing') {
            statusBg = 'bg-amber-50';
            statusText = 'text-amber-600';
          } else if (withdrawal.status === 'rejected') {
            statusBg = 'bg-error-container';
            statusText = 'text-on-error-container';
          }

          return (
            <div key={withdrawal.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
              <div className="w-12 h-12 rounded-xl bg-error-container/20 flex items-center justify-center shrink-0 text-error">
                <span className="material-symbols-outlined">north_east</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-headline-md text-[16px] text-on-surface truncate">Withdrawal</h4>
                  <span className="font-data-mono shrink-0 text-error">
                    -${withdrawal.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-label-md text-on-surface-variant text-xs opacity-60 truncate mr-2">
                    {format(new Date(withdrawal.created_at), 'MMM dd, yyyy • HH:mm')}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusBg} ${statusText}`}>
                    {withdrawal.status}
                  </span>
                </div>
                {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                  <p className="mt-2 text-[10px] text-error bg-error-container/20 p-2 rounded">{withdrawal.rejection_reason}</p>
                )}
              </div>
            </div>
          );
        })}

        {activeTab === 'investments' && filteredInvestments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No investments found.</p>
          </div>
        )}
        
        {activeTab === 'investments' && filteredInvestments.map((investment) => {
          let statusBg = 'bg-slate-100';
          let statusText = 'text-slate-600';
          if (investment.status === 'completed' || investment.status === 'active') {
            statusBg = 'bg-blue-50';
            statusText = 'text-blue-600';
          } else if (investment.status === 'cancelled') {
            statusBg = 'bg-error-container';
            statusText = 'text-on-error-container';
          }

          return (
            <div key={investment.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-600">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-headline-md text-[16px] text-on-surface truncate">Investment</h4>
                  <span className="font-data-mono shrink-0 text-primary">
                    -${investment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-label-md text-on-surface-variant text-xs opacity-60 truncate mr-2">
                    {format(new Date(investment.start_date), 'MMM dd, yyyy • HH:mm')}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusBg} ${statusText}`}>
                    {investment.status === 'active' ? 'Running' : investment.status}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">Expected Profit: ${investment.expected_profit.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State / Load More */}
      {(activeTab === 'general' ? combinedTransactions.length : activeTab === 'deposits' ? filteredDeposits.length : activeTab === 'withdrawals' ? filteredWithdrawals.length : filteredInvestments.length) > 0 && (
        <div className="mt-8 text-center pb-8">
          <button className="font-label-md text-secondary border border-secondary px-6 py-2 rounded-full active:scale-95 transition-all">
            End of History
          </button>
        </div>
      )}

      {/* Proof Image Modal */}
      <Dialog open={!!selectedDeposit} onOpenChange={closeModal}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline-md text-xl text-primary">Payment Proof</DialogTitle>
          </DialogHeader>
          
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-on-surface-variant font-label-md text-xs uppercase mb-1">Amount</p>
                  <p className="font-display-lg text-primary text-xl">
                    ${selectedDeposit.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-md text-xs uppercase mb-1">Status</p>
                  <div className="mt-1">
                    <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {selectedDeposit.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-surface-container-lowest">
                {loadingImage ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : proofImageUrl ? (
                  <img
                    src={proofImageUrl}
                    alt="Payment Proof"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-on-surface-variant">
                    <p>Unable to load image</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
"""

lines = lines[:405]
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    f.write(new_content)
