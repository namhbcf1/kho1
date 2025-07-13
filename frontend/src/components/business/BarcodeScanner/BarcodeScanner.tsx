// Production Barcode Scanner with Real Camera Integration
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Modal, Alert, Input, Space, Typography, Progress } from 'antd';
import { ScanOutlined, CameraOutlined, EditOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import type { BarcodeScannerProps } from './BarcodeScanner.types';

const { Text } = Typography;

// Import ZXing library for barcode detection
declare global {
  interface Window {
    ZXing: any;
  }
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  visible,
  onClose,
  scanFormats = ['CODE_128', 'EAN_13', 'EAN_8', 'QR_CODE'],
  autoStart = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScanAttempt, setLastScanAttempt] = useState<number>(0);

  // Load ZXing library
  useEffect(() => {
    if (!window.ZXing) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js';
      script.onload = () => {
        console.log('ZXing library loaded successfully');
      };
      script.onerror = () => {
        setError('Không thể tải thư viện quét mã vạch');
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (visible && autoStart) {
      initializeScanner();
    } else {
      cleanup();
    }

    return cleanup;
  }, [visible, autoStart]);

  const initializeScanner = useCallback(async () => {
    if (!visible) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await startCamera();
      if (window.ZXing) {
        startScanning();
      } else {
        setError('Thư viện quét mã vạch chưa được tải');
      }
    } catch (err) {
      handleCameraError(err);
    } finally {
      setLoading(false);
    }
  }, [visible]);

  const startCamera = async (): Promise<void> => {
    try {
      // Request camera permissions with specific constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          
          const onLoadedData = () => {
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            reject(new Error('Video loading failed'));
          };
          
          video.addEventListener('loadeddata', onLoadedData);
          video.addEventListener('error', onError);
        });

        // Check for flash support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setFlashSupported('torch' in capabilities);
        
        setScanning(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const startScanning = useCallback(() => {
    if (!window.ZXing || !videoRef.current || !canvasRef.current) {
      setError('Máy quét chưa sẵn sàng');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Không thể khởi tạo canvas');
      return;
    }

    // Initialize ZXing scanner
    const codeReader = new window.ZXing.BrowserMultiFormatReader();
    
    // Set up scanning interval
    const scanFrame = () => {
      if (!scanning || !video.readyState) return;

      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for scanning
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Attempt to decode barcode
        codeReader.decodeFromImageData(imageData)
          .then((result: any) => {
            if (result && result.text) {
              handleSuccessfulScan(result.text);
            } else {
              // Update scan progress
              const now = Date.now();
              if (now - lastScanAttempt > 100) { // Throttle progress updates
                setScanProgress(prev => Math.min(prev + 2, 100));
                setLastScanAttempt(now);
              }
            }
          })
          .catch(() => {
            // Silent failure for continuous scanning
            const now = Date.now();
            if (now - lastScanAttempt > 100) {
              setScanProgress(prev => Math.min(prev + 1, 100));
              setLastScanAttempt(now);
            }
          });
      } catch (err) {
        console.error('Scan frame error:', err);
      }
    };

    // Start scanning loop
    scanIntervalRef.current = setInterval(scanFrame, 100); // 10 FPS
    setScanProgress(0);
  }, [scanning, lastScanAttempt]);

  const handleSuccessfulScan = useCallback((barcode: string) => {
    // Validate barcode format
    if (!barcode || barcode.length < 3) {
      setError('Mã vạch không hợp lệ');
      return;
    }

    // Stop scanning
    cleanup();
    
    // Notify parent component
    onScan?.(barcode);
    
    // Auto-close modal after successful scan
    setTimeout(() => {
      onClose?.();
    }, 100);
  }, [onScan, onClose]);

  const handleCameraError = (err: any) => {
    let errorMessage = 'Không thể truy cập camera';
    
    if (err.name === 'NotAllowedError') {
      errorMessage = 'Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập camera.';
    } else if (err.name === 'NotFoundError') {
      errorMessage = 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị.';
    } else if (err.name === 'NotSupportedError') {
      errorMessage = 'Trình duyệt không hỗ trợ camera.';
    } else if (err.name === 'NotReadableError') {
      errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác.';
    }
    
    setError(errorMessage);
    onError?.(errorMessage);
  };

  const toggleFlash = async () => {
    if (!streamRef.current || !flashSupported) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const newFlashState = !flashEnabled;
      
      await track.applyConstraints({
        advanced: [{ torch: newFlashState } as any]
      });
      
      setFlashEnabled(newFlashState);
    } catch (err) {
      setError('Không thể điều khiển đèn flash');
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      handleSuccessfulScan(manualInput.trim());
      setManualInput('');
    }
  };

  const cleanup = () => {
    // Stop scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
    setScanProgress(0);
    setFlashEnabled(false);
  };

  const retryCamera = () => {
    cleanup();
    initializeScanner();
  };

  return (
    <Modal
      title="Quét mã vạch sản phẩm"
      open={visible}
      onCancel={onClose}
      width={500}
      footer={[
        <Button key="manual" icon={<EditOutlined />} onClick={() => setManualInput('')}>
          Nhập thủ công
        </Button>,
        <Button key="retry" onClick={retryCamera} disabled={loading}>
          Thử lại
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div style={{ textAlign: 'center' }}>
        {loading && (
          <div style={{ padding: 20 }}>
            <Progress type="circle" percent={50} size={60} />
            <p style={{ marginTop: 10 }}>Đang khởi động camera...</p>
          </div>
        )}
        
        {error && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={retryCamera}>
                Thử lại
              </Button>
            }
          />
        )}
        
        {!loading && !error && (
          <>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  maxWidth: '400px',
                  height: '300px',
                  objectFit: 'cover',
                  border: '2px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              />
              
              {/* Scanning overlay */}
              {scanning && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '120px',
                  border: '2px solid #1890ff',
                  borderRadius: '8px',
                  background: 'rgba(24, 144, 255, 0.1)',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    height: '2px',
                    background: '#1890ff',
                    animation: 'scan-line 2s linear infinite'
                  }} />
                </div>
              )}
              
              {/* Flash toggle button */}
              {flashSupported && (
                <Button
                  type="text"
                  size="large"
                  icon={flashEnabled ? <BulbFilled /> : <BulbOutlined />}
                  onClick={toggleFlash}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    border: 'none'
                  }}
                />
              )}
            </div>
            
            {/* Hidden canvas for image processing */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            
            {scanning && (
              <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary">
                    <CameraOutlined /> Đưa mã vạch vào khung quét
                  </Text>
                  <Progress 
                    percent={scanProgress} 
                    size="small" 
                    status={scanProgress === 100 ? "exception" : "active"}
                    format={(percent) => `${percent}%`}
                  />
                </Space>
              </div>
            )}
          </>
        )}
        
        {/* Manual input section */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Nhập mã vạch thủ công"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onPressEnter={handleManualSubmit}
              prefix={<EditOutlined />}
            />
            <Button 
              type="primary" 
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
            >
              Xác nhận
            </Button>
          </Space.Compact>
        </div>
      </div>
      
      <style>{`
        @keyframes scan-line {
          0% { top: -2px; }
          100% { top: calc(100% - 2px); }
        }
      `}</style>
    </Modal>
  );
};

export default BarcodeScanner;
