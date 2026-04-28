import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link to="/login">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and follow the instructions.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
