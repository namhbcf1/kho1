export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface AppHeaderProps {
  title?: string;
  user?: User;
  onMenuClick?: (key: string) => void;
}

export interface UserMenuProps {
  user?: User;
  onMenuClick?: (key: string) => void;
}
