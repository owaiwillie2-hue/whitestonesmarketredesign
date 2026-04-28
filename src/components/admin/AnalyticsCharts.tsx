import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
  depositsOverTime: any[];
  withdrawalsOverTime: any[];
  investmentsByPlan: any[];
  userGrowth: any[];
  kycCompletion: { completed: number; pending: number; rejected: number };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const AnalyticsCharts = ({
  depositsOverTime,
  withdrawalsOverTime,
  investmentsByPlan,
  userGrowth,
  kycCompletion,
}: AnalyticsChartsProps) => {
  const kycData = [
    { name: 'Approved', value: kycCompletion.completed, color: 'hsl(var(--primary))' },
    { name: 'Pending', value: kycCompletion.pending, color: 'hsl(var(--secondary))' },
    { name: 'Rejected', value: kycCompletion.rejected, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Deposits Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Deposits Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={depositsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Deposit Amount ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Withdrawals Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawals Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={withdrawalsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Withdrawal Amount ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Investments by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Investments by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={investmentsByPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="plan" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Amount ($)" />
              <Bar dataKey="count" fill="hsl(var(--secondary))" name="Number of Investments" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* KYC Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={kycData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {kycData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>User Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
