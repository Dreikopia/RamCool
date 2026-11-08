<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class ActivateAccountNotification extends Notification
{
    use Queueable;

    public const EXPIRES_IN_HOURS = 48;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'account.activate.show',
            now()->addHours(self::EXPIRES_IN_HOURS),
            ['user' => $notifiable->getKey()],
        );

        return (new MailMessage)
            ->subject('Activate your account')
            ->greeting("Hello {$notifiable->name},")
            ->line('An administrator created an account for you.')
            ->action('Set your password and activate', $url)
            ->line('This link expires in '.self::EXPIRES_IN_HOURS.' hours.')
            ->line('If you were not expecting this, you can ignore this email.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
