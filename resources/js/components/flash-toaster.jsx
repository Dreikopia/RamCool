import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useToast } from '@/components/ui/toast';

/**
 * Bridges Inertia shared flash props (session `success` / `error`) to toasts.
 *
 * Keyed on the flash object identity: every full visit or redirect produces a
 * fresh object (so the same message repeated twice still toasts), while
 * partial reloads that skip the flash prop keep the old reference (so a toast
 * is never shown twice for one message).
 */
const FlashToaster = () => {
    const { flash } = usePage().props;
    const { push } = useToast();
    const lastFlashRef = useRef(null);

    useEffect(() => {
        if (!flash || flash === lastFlashRef.current) {
            return;
        }

        lastFlashRef.current = flash;

        if (flash.success) {
            push(flash.success, 'success');
        }

        if (flash.error) {
            push(flash.error, 'error');
        }
    }, [flash, push]);

    return null;
};

export default FlashToaster;
