export interface BarcodeScannerProps {
  onScan?: (code: string) => void;
  onError?: (error: string) => void;
  visible: boolean;
  onClose?: () => void;
}

export interface BarcodeDisplayProps {
  code: string;
  format?: 'text' | 'monospace';
  style?: React.CSSProperties;
}
