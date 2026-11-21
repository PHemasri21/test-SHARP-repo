import notifee, { AndroidImportance } from '@notifee/react-native';

export const PushNotificationService = {
  async displayNotification(title, body) {
    try {
      const channelId = await notifee.createChannel({
        id: 'sharp_crm_channel',
        name: 'SHARP CRM Notifications',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: title,
        body: body,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      });
    } catch (e) {
      console.log('Notification error:', e);
    }
  }
};