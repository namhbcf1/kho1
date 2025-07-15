// Vietnamese Accessibility Components for POS System
import React, { useState, useEffect, useRef } from 'react';
import { Button, message, Modal, Switch, Select, Slider } from 'antd';
import {
  SoundOutlined,
  EyeOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  KeyboardOutlined,
  AccessibilityOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  VolumeUpOutlined,
  BoldOutlined,
  HighlightOutlined,
} from '@ant-design/icons';

const { Option } = Select;

// Vietnamese Screen Reader Support
export const VietnameseScreenReader: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      // Prefer Vietnamese voices
      const vietnameseVoices = availableVoices.filter(voice => 
        voice.lang.includes('vi') || voice.name.includes('Vietnamese')
      );
      setVoices(vietnameseVoices.length > 0 ? vietnameseVoices : availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (speechRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!text) return;

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.volume = speechVolume;
    utterance.lang = 'vi-VN';
    
    if (voices[voiceIndex]) {
      utterance.voice = voices[voiceIndex];
    }

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsReading(false);
  };

  const speakPageContent = () => {
    const content = document.body.innerText;
    speakText(content);
  };

  return (
    <div className="vietnamese-screen-reader">
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
        <Button
          type="primary"
          icon={isReading ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={isReading ? stopSpeaking : speakPageContent}
          className="vietnamese-text"
        >
          {isReading ? 'Dừng đọc' : 'Đọc nội dung'}
        </Button>

        <div className="flex items-center gap-2">
          <VolumeUpOutlined />
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={speechVolume}
            onChange={setSpeechVolume}
            style={{ width: 100 }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm vietnamese-text">Tốc độ:</span>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={speechRate}
            onChange={setSpeechRate}
            style={{ width: 100 }}
          />
        </div>

        {voices.length > 0 && (
          <Select
            value={voiceIndex}
            onChange={setVoiceIndex}
            style={{ width: 200 }}
            placeholder="Chọn giọng đọc"
          >
            {voices.map((voice, index) => (
              <Option key={index} value={index}>
                {voice.name} ({voice.lang})
              </Option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
};

// Vietnamese Keyboard Navigation
export const VietnameseKeyboardNav: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey } = event;

      // Vietnamese keyboard shortcuts
      if (ctrlKey && altKey) {
        switch (key) {
          case 'b': // Bán hàng
            event.preventDefault();
            document.getElementById('pos-button')?.click();
            break;
          case 's': // Sản phẩm
            event.preventDefault();
            document.getElementById('products-button')?.click();
            break;
          case 'k': // Khách hàng
            event.preventDefault();
            document.getElementById('customers-button')?.click();
            break;
          case 'r': // Báo cáo
            event.preventDefault();
            document.getElementById('reports-button')?.click();
            break;
          case 'h': // Hướng dẫn
            event.preventDefault();
            showKeyboardHelp();
            break;
        }
      }

      // Arrow key navigation
      if (key === 'Tab' || key === 'ArrowUp' || key === 'ArrowDown') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
        
        if (key === 'ArrowDown' && currentIndex < focusableElements.length - 1) {
          event.preventDefault();
          (focusableElements[currentIndex + 1] as HTMLElement).focus();
        } else if (key === 'ArrowUp' && currentIndex > 0) {
          event.preventDefault();
          (focusableElements[currentIndex - 1] as HTMLElement).focus();
        }
      }

      // Vietnamese input assistance
      if (key === 'F1') {
        event.preventDefault();
        showVietnameseInputHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  const showKeyboardHelp = () => {
    Modal.info({
      title: 'Phím tắt hệ thống',
      content: (
        <div className="vietnamese-text">
          <p><strong>Ctrl + Alt + B:</strong> Mở giao diện bán hàng</p>
          <p><strong>Ctrl + Alt + S:</strong> Quản lý sản phẩm</p>
          <p><strong>Ctrl + Alt + K:</strong> Quản lý khách hàng</p>
          <p><strong>Ctrl + Alt + R:</strong> Xem báo cáo</p>
          <p><strong>Ctrl + Alt + H:</strong> Hiển thị hướng dẫn</p>
          <p><strong>F1:</strong> Trợ giúp nhập tiếng Việt</p>
          <p><strong>Mũi tên lên/xuống:</strong> Điều hướng giữa các phần tử</p>
        </div>
      ),
      okText: 'Đóng',
    });
  };

  const showVietnameseInputHelp = () => {
    Modal.info({
      title: 'Hướng dẫn nhập tiếng Việt',
      content: (
        <div className="vietnamese-text">
          <p><strong>Gõ dấu thanh:</strong></p>
          <p>â: aa, ă: aw, ê: ee, ô: oo, ơ: ow, ư: uw</p>
          <p><strong>Gõ dấu phụ:</strong></p>
          <p>à: af, á: as, ả: ar, ã: ax, ạ: aj</p>
          <p><strong>Ví dụ:</strong></p>
          <p>mười → muowif, không → khoong, tiền → tieenf</p>
          <p><strong>Ctrl + Z:</strong> Khôi phục ký tự gốc</p>
        </div>
      ),
      okText: 'Đóng',
    });
  };

  return (
    <div className="vietnamese-keyboard-nav">
      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
        <Switch
          checked={isEnabled}
          onChange={setIsEnabled}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
        <span className="vietnamese-text">Điều hướng bằng phím</span>
        
        <Button
          type="link"
          icon={<KeyboardOutlined />}
          onClick={showKeyboardHelp}
          className="vietnamese-text"
        >
          Phím tắt
        </Button>
      </div>
    </div>
  );
};

// Vietnamese Visual Accessibility
export const VietnameseVisualA11y: React.FC = () => {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [boldText, setBoldText] = useState(false);
  const [highlightFocus, setHighlightFocus] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState('none');

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.setProperty('--base-font-size', `${fontSize}px`);
    
    // Apply high contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply bold text
    if (boldText) {
      root.classList.add('bold-text');
    } else {
      root.classList.remove('bold-text');
    }
    
    // Apply focus highlighting
    if (highlightFocus) {
      root.classList.add('highlight-focus');
    } else {
      root.classList.remove('highlight-focus');
    }
    
    // Apply color blind mode
    root.className = root.className.replace(/colorblind-\w+/g, '');
    if (colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${colorBlindMode}`);
    }
  }, [fontSize, highContrast, boldText, highlightFocus, colorBlindMode]);

  return (
    <div className="vietnamese-visual-a11y">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FontSizeOutlined />
            <span className="text-sm vietnamese-text">Cỡ chữ:</span>
            <Slider
              min={12}
              max={24}
              value={fontSize}
              onChange={setFontSize}
              style={{ width: 100 }}
            />
            <span className="text-sm">{fontSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <BgColorsOutlined />
            <span className="text-sm vietnamese-text">Tương phản cao:</span>
            <Switch
              checked={highContrast}
              onChange={setHighContrast}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
          </div>

          <div className="flex items-center gap-2">
            <BoldOutlined />
            <span className="text-sm vietnamese-text">Chữ đậm:</span>
            <Switch
              checked={boldText}
              onChange={setBoldText}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HighlightOutlined />
            <span className="text-sm vietnamese-text">Làm nổi focus:</span>
            <Switch
              checked={highlightFocus}
              onChange={setHighlightFocus}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
          </div>

          <div className="flex items-center gap-2">
            <EyeOutlined />
            <span className="text-sm vietnamese-text">Chế độ màu:</span>
            <Select
              value={colorBlindMode}
              onChange={setColorBlindMode}
              style={{ width: 140 }}
            >
              <Option value="none">Bình thường</Option>
              <Option value="deuteranopia">Deuteranopia</Option>
              <Option value="protanopia">Protanopia</Option>
              <Option value="tritanopia">Tritanopia</Option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Vietnamese Currency Announcer
export const VietnameseCurrencyAnnouncer: React.FC<{ amount: number }> = ({ amount }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const numberToVietnamese = (num: number): string => {
    if (num === 0) return 'không đồng';
    
    const units = ['', 'nghìn', 'triệu', 'tỷ'];
    const digits = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    
    const formatHundreds = (n: number): string => {
      if (n === 0) return '';
      
      let result = '';
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      
      if (hundreds > 0) {
        result += digits[hundreds] + ' trăm';
      }
      
      if (remainder > 0) {
        if (hundreds > 0) result += ' ';
        
        if (remainder < 10) {
          result += digits[remainder];
        } else if (remainder < 20) {
          result += 'mười';
          if (remainder > 10) {
            result += ' ' + digits[remainder - 10];
          }
        } else {
          const tens = Math.floor(remainder / 10);
          const ones = remainder % 10;
          result += digits[tens] + ' mười';
          if (ones > 0) {
            result += ' ' + digits[ones];
          }
        }
      }
      
      return result;
    };
    
    let result = '';
    let unitIndex = 0;
    
    while (num > 0) {
      const group = num % 1000;
      if (group > 0) {
        const groupText = formatHundreds(group);
        if (unitIndex > 0) {
          result = groupText + ' ' + units[unitIndex] + ' ' + result;
        } else {
          result = groupText + ' đồng';
        }
      }
      num = Math.floor(num / 1000);
      unitIndex++;
    }
    
    return result.trim();
  };

  const announceAmount = () => {
    const vietnameseAmount = numberToVietnamese(amount);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vietnameseAmount);
      utterance.lang = 'vi-VN';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="vietnamese-currency-announcer inline-flex items-center gap-2">
      <span className="vnd-display">{amount.toLocaleString('vi-VN')}đ</span>
      {isEnabled && (
        <Button
          type="text"
          size="small"
          icon={<SoundOutlined />}
          onClick={announceAmount}
          title="Đọc số tiền"
        />
      )}
    </div>
  );
};

// Vietnamese Accessibility Provider
export const VietnameseA11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    screenReader: false,
    keyboardNav: false,
    visualA11y: false,
    currencyAnnouncer: false,
  });

  const openSettings = () => setIsModalOpen(true);
  const closeSettings = () => setIsModalOpen(false);

  return (
    <div className="vietnamese-a11y-provider">
      {children}
      
      {/* Floating accessibility button */}
      <Button
        type="primary"
        shape="circle"
        icon={<AccessibilityOutlined />}
        size="large"
        onClick={openSettings}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        title="Cài đặt trợ năng"
      />

      <Modal
        title="Cài đặt trợ năng"
        open={isModalOpen}
        onCancel={closeSettings}
        footer={null}
        width={800}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="vietnamese-text font-semibold">Đọc màn hình</span>
              <Switch
                checked={settings.screenReader}
                onChange={(checked) => setSettings(prev => ({ ...prev, screenReader: checked }))}
              />
            </div>
            {settings.screenReader && <VietnameseScreenReader />}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="vietnamese-text font-semibold">Điều hướng bằng phím</span>
              <Switch
                checked={settings.keyboardNav}
                onChange={(checked) => setSettings(prev => ({ ...prev, keyboardNav: checked }))}
              />
            </div>
            {settings.keyboardNav && <VietnameseKeyboardNav />}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="vietnamese-text font-semibold">Trợ năng thị giác</span>
              <Switch
                checked={settings.visualA11y}
                onChange={(checked) => setSettings(prev => ({ ...prev, visualA11y: checked }))}
              />
            </div>
            {settings.visualA11y && <VietnameseVisualA11y />}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="vietnamese-text font-semibold">Đọc số tiền</span>
              <Switch
                checked={settings.currencyAnnouncer}
                onChange={(checked) => setSettings(prev => ({ ...prev, currencyAnnouncer: checked }))}
              />
            </div>
            {settings.currencyAnnouncer && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm vietnamese-text text-gray-600 mb-2">
                  Ví dụ: <VietnameseCurrencyAnnouncer amount={1250000} />
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VietnameseA11yProvider;