export interface BarcodeScannerProps {
  onScan?: (code: string) => void;
  onError?: (error: string) => void;
  visible: boolean;
  onClose?: () => void;
  scanFormats?: string[];
  autoStart?: boolean;
  continuous?: boolean;
  beep?: boolean;
  timeout?: number;
}

export interface BarcodeDisplayProps {
  code: string;
  format?: 'text' | 'monospace';
  style?: React.CSSProperties;
}

export interface BarcodeScanResult {
  text: string;
  format: string;
  timestamp: number;
  confidence?: number;
}

export interface CameraConstraints {
  facingMode: 'user' | 'environment';
  width?: { ideal: number; min: number };
  height?: { ideal: number; min: number };
  aspectRatio?: { ideal: number };
  frameRate?: { ideal: number; min: number };
}
