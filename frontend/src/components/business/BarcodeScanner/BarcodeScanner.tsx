import React, { useRef, useEffect, useState } from 'react';
import { Button, Modal, Alert } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import type { BarcodeScannerProps } from './BarcodeScanner.types';

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  visible,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && videoRef.current) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [visible]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      const errorMessage = 'Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualInput = () => {
    Modal.confirm({
      title: 'Nhập mã vạch thủ công',
      content: (
        <input
          type="text"
          placeholder="Nhập mã vạch"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value;
              if (value) {
                onScan?.(value);
                onClose?.();
              }
            }
          }}
        />
      ),
    });
  };

  return (
    <Modal
      title="Quét mã vạch"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="manual" onClick={handleManualInput}>
          Nhập thủ công
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={400}
    >
      {error ? (
        <Alert message={error} type="error" showIcon />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: '300px' }}
          />
          {scanning && (
            <div style={{ marginTop: 16 }}>
              <ScanOutlined style={{ fontSize: 24 }} />
              <p>Đưa mã vạch vào khung hình để quét</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BarcodeScanner;
