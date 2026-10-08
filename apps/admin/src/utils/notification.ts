import { notifications } from "@mantine/notifications";

interface NotificationContent {
  title: string;
  message: string;
}

export function showSuccessNotification({ title, message }: NotificationContent) {
  notifications.show({ color: "green", title, message });
}

export function showErrorNotification({ title, message }: NotificationContent) {
  notifications.show({ color: "red", title, message });
}
