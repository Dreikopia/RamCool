import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';

const ActivateAccount = ({ email, actionUrl }) => {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(actionUrl);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <form onSubmit={submit} className="w-full max-w-sm space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Activate your account</h1>
                    <p className="text-sm text-muted-foreground">
                        Set a password for {email} to finish setting up your account.
                    </p>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password)}
                    />
                    {errors.password && (
                        <p role="alert" className="min-h-5 text-sm text-destructive">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="password_confirmation">Confirm password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? 'Activating...' : 'Activate account'}
                </Button>
            </form>
        </div>
    );
};

export default ActivateAccount;
