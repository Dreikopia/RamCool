import { useForm } from '@inertiajs/react';
import { useEffect, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const ROLE_LABELS = { staff: 'Staff', admin: 'Admin' };

const UserFormModal = ({ open, onOpenChange }) => {
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        name: '',
        email: '',
        role: 'staff',
    });

    useLayoutEffect(() => {
        reset();
    }, [open]);

    useEffect(() => {
        if (recentlySuccessful) {
            onOpenChange(false);
        }
    }, [recentlySuccessful]);

    const submit = (e) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>New user</DialogTitle>
                        <DialogDescription>
                            They will receive an email with a link to set their password.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-1.5">
                        <Label htmlFor="user-name">Name</Label>
                        <Input
                            id="user-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            aria-invalid={Boolean(errors.name)}
                            disabled={processing}
                            autoFocus
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                            id="user-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            aria-invalid={Boolean(errors.email)}
                            disabled={processing}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="user-role">Role</Label>
                        <Select
                            value={data.role}
                            onValueChange={(value) => setData('role', String(value))}
                            items={ROLE_LABELS}
                        >
                            <SelectTrigger
                                id="user-role"
                                className="w-full"
                                aria-invalid={Boolean(errors.role)}
                                disabled={processing}
                            >
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                    </div>

                    <DialogFooter>
                        <DialogClose
                            render={
                                <Button type="button" variant="outline" disabled={processing}>
                                    Cancel
                                </Button>
                            }
                        />
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating.' : 'Create user'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UserFormModal;
