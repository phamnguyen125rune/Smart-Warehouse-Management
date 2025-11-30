export interface MailItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  msg_type: 'SYSTEM' | 'MANAGER' | 'NORMAL';
  sender_name: string;
  sender_avatar: string | null;
  category: string;
  is_pinned: boolean;
  recipient_name: string;
}