import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number | null;
  profit_percentage: number;
  duration_days: number;
  is_active: boolean;
}

export const AdminInvestmentPlans = () => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_amount: '',
    max_amount: '',
    profit_percentage: '',
    duration_value: '',
    duration_unit: 'days',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await supabase
        .from('investment_plans')
        .select('*')
        .order('min_amount');
      
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load investment plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      const isHours = plan.duration_days < 1;
      setFormData({
        name: plan.name,
        description: plan.description,
        min_amount: plan.min_amount.toString(),
        max_amount: plan.max_amount?.toString() || '',
        profit_percentage: plan.profit_percentage.toString(),
        duration_value: isHours ? (plan.duration_days * 24).toString() : plan.duration_days.toString(),
        duration_unit: isHours ? 'hours' : 'days',
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        min_amount: '',
        max_amount: '',
        profit_percentage: '',
        duration_value: '',
        duration_unit: 'days',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const durationValue = parseFloat(formData.duration_value);
      const duration_days = formData.duration_unit === 'hours' 
        ? durationValue / 24 
        : durationValue;

      const planData = {
        name: formData.name,
        description: formData.description,
        min_amount: parseFloat(formData.min_amount),
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        profit_percentage: parseFloat(formData.profit_percentage),
        duration_days: duration_days,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('investment_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Investment plan updated successfully');
      } else {
        const { error } = await supabase
          .from('investment_plans')
          .insert(planData);

        if (error) throw error;
        toast.success('Investment plan created successfully');
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast.error(error.message || 'Failed to save investment plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment plan?')) return;

    try {
      const { error } = await supabase
        .from('investment_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Investment plan deleted successfully');
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error(error.message || 'Failed to delete investment plan');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('investment_plans')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
    } catch (error: any) {
      console.error('Error toggling plan status:', error);
      toast.error(error.message || 'Failed to update plan status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">Investment Plans</h1>
          <p className="text-xs text-slate-500 mt-1">Configure and manage investment tiers, interest terms, and limits</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="rounded-xl h-10 text-xs font-bold bg-primary text-white">
          <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
          Add New Plan
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">All Active Tiers ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-xs font-medium mb-3">No investment plans found</p>
              <Button onClick={() => handleOpenDialog()} className="h-9 text-xs rounded-xl bg-primary text-white">
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Min Amount</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Max Amount</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">ROI %</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Duration</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{plan.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{plan.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">${parseFloat(plan.min_amount.toString()).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 px-6 py-4">
                        {plan.max_amount ? `$${parseFloat(plan.max_amount.toString()).toLocaleString()}` : 'Unlimited'}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">{plan.profit_percentage}%</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 px-6 py-4">
                        {plan.duration_days < 1 
                          ? `${plan.duration_days * 24} hours` 
                          : `${plan.duration_days} days`}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active || false}
                            onCheckedChange={() => toggleActive(plan.id, plan.is_active || false)}
                          />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            plan.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 p-0"
                            onClick={() => handleOpenDialog(plan)}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 rounded-lg bg-red-600 hover:bg-red-700 text-white p-0"
                            onClick={() => handleDelete(plan.id)}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 gap-0">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
              {editingPlan ? 'Edit Investment Plan' : 'Create New Investment Plan'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., STARTER PLAN"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit_percentage" className="text-xs font-bold">Total ROI (%) *</Label>
                <Input
                  id="profit_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profit_percentage}
                  onChange={(e) => setFormData({ ...formData, profit_percentage: e.target.value })}
                  required
                  placeholder="e.g., 12"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_amount" className="text-xs font-bold">Minimum Amount ($) *</Label>
                <Input
                  id="min_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  required
                  placeholder="e.g., 100.00"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_amount" className="text-xs font-bold">Maximum Amount ($)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="duration_value" className="text-xs font-bold">Duration *</Label>
                <div className="flex gap-2">
                  <Input
                    id="duration_value"
                    type="number"
                    step="1"
                    min="1"
                    value={formData.duration_value}
                    onChange={(e) => setFormData({ ...formData, duration_value: e.target.value })}
                    required
                    placeholder="e.g., 12 or 7"
                    className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                  />
                  <Select
                    value={formData.duration_unit}
                    onValueChange={(value) => setFormData({ ...formData, duration_unit: value })}
                  >
                    <SelectTrigger className="w-[120px] rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-slate-400">
                  Select the duration magnitude and unit (e.g. 12 hours, or 7 days)
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer space-y-0.5 flex-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Active Status</span>
                    <p className="text-[10px] text-slate-400 font-medium">Only active plans are visible to users on the platform</p>
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-xs font-bold">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="e.g., 1.00% Hourly Interest - 12 Term Hours"
                rows={3}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-10 text-xs border-slate-200 dark:border-slate-850">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl h-10 text-xs font-bold bg-primary text-white">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvestmentPlans;
