import React, { useState, useEffect } from 'react';
import { Input, Select, AutoComplete, Form, Space } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { 
  validateVietnameseAddress, 
  formatVietnameseAddress, 
  VIETNAMESE_PROVINCES 
} from '../../../utils/validators/vietnameseValidators';

const { Option } = Select;

interface VietnameseAddress {
  street?: string;
  ward?: string;
  wardCode?: string;
  district?: string;
  districtCode?: string;
  province?: string;
  provinceCode?: string;
  postalCode?: string;
  fullAddress?: string;
}

interface VNAddressSelectorProps {
  value?: VietnameseAddress;
  onChange?: (address: VietnameseAddress) => void;
  placeholder?: {
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
  };
  disabled?: boolean;
  required?: boolean;
}

// Mock data for districts and wards (in real app, would come from API)
const mockDistricts = {
  'Hà Nội': [
    { code: '001', name: 'Ba Đình' },
    { code: '002', name: 'Hoàn Kiếm' },
    { code: '003', name: 'Tây Hồ' },
    { code: '004', name: 'Long Biên' },
    { code: '005', name: 'Cầu Giấy' },
    { code: '006', name: 'Đống Đa' },
    { code: '007', name: 'Hai Bà Trưng' },
    { code: '008', name: 'Hoàng Mai' },
    { code: '009', name: 'Thanh Xuân' },
  ],
  'TP Hồ Chí Minh': [
    { code: '760', name: 'Quận 1' },
    { code: '761', name: 'Quận 2' },
    { code: '762', name: 'Quận 3' },
    { code: '763', name: 'Quận 4' },
    { code: '764', name: 'Quận 5' },
    { code: '765', name: 'Quận 6' },
    { code: '766', name: 'Quận 7' },
    { code: '767', name: 'Quận 8' },
    { code: '768', name: 'Quận 9' },
    { code: '769', name: 'Quận 10' },
    { code: '770', name: 'Quận 11' },
    { code: '771', name: 'Quận 12' },
    { code: '772', name: 'Thủ Đức' },
    { code: '773', name: 'Gò Vấp' },
    { code: '774', name: 'Phú Nhuận' },
    { code: '775', name: 'Tân Bình' },
    { code: '776', name: 'Tân Phú' },
    { code: '777', name: 'Bình Thạnh' },
  ],
};

const mockWards = {
  'Ba Đình': [
    { code: '00001', name: 'Phúc Xá' },
    { code: '00002', name: 'Trúc Bạch' },
    { code: '00003', name: 'Vĩnh Phúc' },
    { code: '00004', name: 'Cống Vị' },
    { code: '00005', name: 'Liễu Giai' },
    { code: '00006', name: 'Nguyễn Trung Trực' },
    { code: '00007', name: 'Quán Thánh' },
    { code: '00008', name: 'Ngọc Hà' },
    { code: '00009', name: 'Điện Biên' },
    { code: '00010', name: 'Đội Cấn' },
    { code: '00011', name: 'Ngọc Khánh' },
    { code: '00012', name: 'Kim Mã' },
    { code: '00013', name: 'Giảng Võ' },
    { code: '00014', name: 'Thành Công' },
  ],
  'Quận 1': [
    { code: '26734', name: 'Tân Định' },
    { code: '26735', name: 'Đa Kao' },
    { code: '26736', name: 'Bến Nghé' },
    { code: '26737', name: 'Bến Thành' },
    { code: '26738', name: 'Nguyễn Thái Bình' },
    { code: '26739', name: 'Phạm Ngũ Lão' },
    { code: '26740', name: 'Cầu Ông Lãnh' },
    { code: '26741', name: 'Cô Giang' },
    { code: '26742', name: 'Nguyễn Cư Trinh' },
    { code: '26743', name: 'Cầu Kho' },
  ],
};

const VNAddressSelector: React.FC<VNAddressSelectorProps> = ({
  value = {},
  onChange,
  placeholder = {},
  disabled = false,
  required = false,
}) => {
  const [address, setAddress] = useState<VietnameseAddress>(value);
  const [districts, setDistricts] = useState<Array<{ code: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: string; name: string }>>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    setAddress(value);
  }, [value]);

  useEffect(() => {
    if (address.province) {
      const provinceDistricts = mockDistricts[address.province as keyof typeof mockDistricts] || [];
      setDistricts(provinceDistricts);
      
      if (address.district && !provinceDistricts.find(d => d.name === address.district)) {
        updateAddress({ district: undefined, districtCode: undefined, ward: undefined, wardCode: undefined });
      }
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [address.province]);

  useEffect(() => {
    if (address.district) {
      const districtWards = mockWards[address.district as keyof typeof mockWards] || [];
      setWards(districtWards);
      
      if (address.ward && !districtWards.find(w => w.name === address.ward)) {
        updateAddress({ ward: undefined, wardCode: undefined });
      }
    } else {
      setWards([]);
    }
  }, [address.district]);

  const updateAddress = (updates: Partial<VietnameseAddress>) => {
    const newAddress = { ...address, ...updates };
    
    // Generate full address
    const fullAddress = formatVietnameseAddress(newAddress);
    newAddress.fullAddress = fullAddress;
    
    setAddress(newAddress);
    onChange?.(newAddress);
  };

  const handleProvinceChange = (value: string) => {
    const province = VIETNAMESE_PROVINCES.find(p => p === value);
    if (province) {
      updateAddress({ 
        province: value, 
        provinceCode: value,
        district: undefined,
        districtCode: undefined,
        ward: undefined,
        wardCode: undefined,
      });
    }
  };

  const handleDistrictChange = (value: string) => {
    const district = districts.find(d => d.name === value);
    if (district) {
      updateAddress({ 
        district: value, 
        districtCode: district.code,
        ward: undefined,
        wardCode: undefined,
      });
    }
  };

  const handleWardChange = (value: string) => {
    const ward = wards.find(w => w.name === value);
    if (ward) {
      updateAddress({ 
        ward: value, 
        wardCode: ward.code,
      });
    }
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAddress({ street: e.target.value });
  };

  const handleAddressSearch = (searchText: string) => {
    if (searchText.length < 2) {
      setAddressSuggestions([]);
      return;
    }

    // Mock address suggestions
    const suggestions = [
      { value: '123 Nguyễn Huệ, Bến Nghé, Quận 1, TP Hồ Chí Minh', label: '123 Nguyễn Huệ, Bến Nghé, Quận 1, TP Hồ Chí Minh' },
      { value: '456 Trần Hưng Đạo, Cầu Ông Lãnh, Quận 1, TP Hồ Chí Minh', label: '456 Trần Hưng Đạo, Cầu Ông Lãnh, Quận 1, TP Hồ Chí Minh' },
      { value: '789 Lê Lợi, Bến Thành, Quận 1, TP Hồ Chí Minh', label: '789 Lê Lợi, Bến Thành, Quận 1, TP Hồ Chí Minh' },
    ].filter(item => item.label.toLowerCase().includes(searchText.toLowerCase()));

    setAddressSuggestions(suggestions);
  };

  const handleAddressSelect = (selectedValue: string) => {
    // Parse the selected address
    const parts = selectedValue.split(', ');
    if (parts.length >= 4) {
      const [street, ward, district, province] = parts;
      updateAddress({
        street,
        ward,
        district,
        province,
        fullAddress: selectedValue,
      });
    }
  };

  const validation = validateVietnameseAddress(address);

  return (
    <div className="vn-address-selector">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Full Address Search */}
        <Form.Item
          label={<><EnvironmentOutlined /> Tìm kiếm địa chỉ</>}
          help="Nhập địa chỉ để tìm kiếm nhanh"
        >
          <AutoComplete
            options={addressSuggestions}
            onSearch={handleAddressSearch}
            onSelect={handleAddressSelect}
            placeholder="Nhập địa chỉ để tìm kiếm..."
            disabled={disabled}
            suffixIcon={<SearchOutlined />}
          />
        </Form.Item>

        {/* Province */}
        <Form.Item
          label="Tỉnh/Thành phố"
          required={required}
          validateStatus={!validation.isValid && address.province ? 'error' : undefined}
          help={!validation.isValid && validation.errors.find(e => e.includes('Province')) ? 'Tỉnh/Thành phố không hợp lệ' : undefined}
        >
          <Select
            value={address.province}
            onChange={handleProvinceChange}
            placeholder={placeholder.province || 'Chọn tỉnh/thành phố'}
            disabled={disabled}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
            }
          >
            {VIETNAMESE_PROVINCES.map(province => (
              <Option key={province} value={province}>
                {province}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* District */}
        <Form.Item
          label="Quận/Huyện"
          required={required}
          validateStatus={!validation.isValid && address.district ? 'error' : undefined}
          help={!validation.isValid && validation.errors.find(e => e.includes('District')) ? 'Quận/Huyện không hợp lệ' : undefined}
        >
          <Select
            value={address.district}
            onChange={handleDistrictChange}
            placeholder={placeholder.district || 'Chọn quận/huyện'}
            disabled={disabled || !address.province}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
            }
          >
            {districts.map(district => (
              <Option key={district.code} value={district.name}>
                {district.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Ward */}
        <Form.Item
          label="Phường/Xã"
          required={required}
          validateStatus={!validation.isValid && address.ward ? 'error' : undefined}
          help={!validation.isValid && validation.errors.find(e => e.includes('Ward')) ? 'Phường/Xã không hợp lệ' : undefined}
        >
          <Select
            value={address.ward}
            onChange={handleWardChange}
            placeholder={placeholder.ward || 'Chọn phường/xã'}
            disabled={disabled || !address.district}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
            }
          >
            {wards.map(ward => (
              <Option key={ward.code} value={ward.name}>
                {ward.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Street */}
        <Form.Item
          label="Số nhà, tên đường"
          required={required}
        >
          <Input
            value={address.street}
            onChange={handleStreetChange}
            placeholder={placeholder.street || 'Nhập số nhà, tên đường'}
            disabled={disabled}
          />
        </Form.Item>

        {/* Full Address Display */}
        {address.fullAddress && (
          <Form.Item label="Địa chỉ đầy đủ">
            <Input.TextArea
              value={address.fullAddress}
              readOnly
              rows={2}
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>
        )}

        {/* Validation Messages */}
        {!validation.isValid && validation.errors.length > 0 && (
          <div style={{ color: '#ff4d4f', fontSize: '14px' }}>
            {validation.errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div style={{ color: '#faad14', fontSize: '14px' }}>
            {validation.warnings.map((warning, index) => (
              <div key={index}>⚠ {warning}</div>
            ))}
          </div>
        )}
      </Space>
    </div>
  );
};

export default VNAddressSelector;