import { useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/use-theme';

const FieldError = ({ message }) => (
    <p role="alert" className="min-h-5 text-sm text-destructive">
        {message}
    </p>
);

const PasswordField = ({ id, label, value, onChange, error, autoComplete, disabled }) => {
    // Each PasswordField now has its OWN show/hide state
    const [show, setShow] = useState(false);

    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    disabled={disabled}
                    className="pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={show ? 'Hide password' : 'Show password'}
                    onClick={() => setShow((current) => !current)}
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                >
                    {show ? <EyeOff /> : <Eye />}
                </Button>
            </div>
            <FieldError message={error} />
        </div>
    );
};

const Index = ({ account }) => {
    const { resolvedTheme, setTheme } = useTheme();

    const profileForm = useForm({
        name: account.name,
        email: account.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (event) => {
        event.preventDefault();

        profileForm.patch('/settings/profile', { preserveScroll: true });
    };

    const submitPassword = (event) => {
        event.preventDefault();

        passwordForm.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };



    return (
        <div className="mx-auto w-full max-w-3xl space-y-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your account preferences and application experience.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="dark-mode" className="mb-0">
                                Dark Mode
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Switch between light and dark appearance.
                            </p>
                        </div>

                        <Switch
                            id="dark-mode"
                            checked={resolvedTheme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <form onSubmit={submitProfile}>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription className='mb-2'>Update the details tied to your account.</CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="profile-name">Name</Label>
                            <Input
                                id="profile-name"
                                value={profileForm.data.name}
                                onChange={(event) => profileForm.setData('name', event.target.value)}
                                aria-invalid={Boolean(profileForm.errors.name)}
                                disabled={profileForm.processing}
                            />
                            <FieldError message={profileForm.errors.name} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="profile-email">Email</Label>
                            <Input
                                id="profile-email"
                                type="email"
                                value={profileForm.data.email}
                                onChange={(event) => profileForm.setData('email', event.target.value)}
                                aria-invalid={Boolean(profileForm.errors.email)}
                                disabled={profileForm.processing}
                            />
                            <FieldError message={profileForm.errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="profile-role">Role</Label>
                            <Input
                                id="profile-role"
                                value={account.role}
                                readOnly
                                className="capitalize"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="profile-status">Account Status</Label>
                            <Input
                                id="profile-status"
                                value={account.status}
                                readOnly
                                className="capitalize"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="mt-4 justify-end">
                        <Button type="submit" disabled={profileForm.processing}>
                            {profileForm.processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <form onSubmit={submitPassword}>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription className='mb-2'>Change the password used to sign in.</CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <PasswordField
                                id="current-password"
                                label="Current Password"
                                value={passwordForm.data.current_password}
                                onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                                error={passwordForm.errors.current_password}
                                autoComplete="current-password"
                                disabled={passwordForm.processing}
                            />
                        </div>

                        <PasswordField
                            id="new-password"
                            label="New Password"
                            value={passwordForm.data.password}
                            onChange={(event) => passwordForm.setData('password', event.target.value)}
                            error={passwordForm.errors.password}
                            autoComplete="new-password"
                            disabled={passwordForm.processing}
                        />

                        <PasswordField
                            id="confirm-password"
                            label="Confirm Password"
                            value={passwordForm.data.password_confirmation}
                            onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)}
                            error={passwordForm.errors.password_confirmation}
                            autoComplete="new-password"
                            disabled={passwordForm.processing}
                        />
                    </CardContent>

                    <CardFooter className="mt-4 justify-end">
                        <Button type="submit" disabled={passwordForm.processing}>
                            {passwordForm.processing ? 'Updating…' : 'Update Password'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Settings">{page}</AppLayout>;

export default Index;
