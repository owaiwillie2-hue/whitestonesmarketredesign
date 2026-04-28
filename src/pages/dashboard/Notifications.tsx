import { NotificationsCenter } from '@/components/NotificationsCenter';

const Notifications = () => {
  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-background">Notifications</h1>
        <p className="font-body-md text-on-surface-variant mt-1">Stay updated with your account activities</p>
      </div>

      <NotificationsCenter />
    </div>
  );
};

export default Notifications;
