import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

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
      // Detect if duration is in hours or days
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
      // Convert duration to days based on unit
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

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold">Investment Plans Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage investment plans</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Investment Plans ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No investment plans found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Min Amount</TableHead>
                  <TableHead>Max Amount</TableHead>
                  <TableHead>ROI %</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>${plan.min_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {plan.max_amount ? `$${plan.max_amount.toLocaleString()}` : 'Unlimited'}
                    </TableCell>
                    <TableCell>{plan.profit_percentage}%</TableCell>
                    <TableCell>
                      {plan.duration_days < 1 
                        ? `${plan.duration_days * 24} hours` 
                        : `${plan.duration_days} days`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={() => toggleActive(plan.id, plan.is_active)}
                        />
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Investment Plan' : 'Create New Investment Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., STARTER PLAN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit_percentage">Total ROI (%) *</Label>
                <Input
                  id="profit_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profit_percentage}
                  onChange={(e) => setFormData({ ...formData, profit_percentage: e.target.value })}
                  required
                  placeholder="e.g., 12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_amount">Minimum Amount ($) *</Label>
                <Input
                  id="min_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  required
                  placeholder="e.g., 200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_amount">Maximum Amount ($)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="duration_value">Duration *</Label>
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
                    className="flex-1"
                  />
                  <Select
                    value={formData.duration_unit}
                    onValueChange={(value) => setFormData({ ...formData, duration_unit: value })}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the duration and unit (e.g., 12 hours or 7 days)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active" className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only active plans are visible to users
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="e.g., 1.00% Hourly Interest - 12 Term Hours"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
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
