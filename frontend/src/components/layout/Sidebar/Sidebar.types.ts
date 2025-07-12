export interface AppSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  selectedKey?: string;
  onMenuSelect?: (key: string) => void;
}
