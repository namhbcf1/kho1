export interface InventoryData {
  name: string;
  value: number;
}

export interface InventoryChartProps {
  data: InventoryData[];
  title?: string;
  height?: number;
}
