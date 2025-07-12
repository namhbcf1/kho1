import React, { useState, useEffect } from 'react';
import { Select, Space } from 'antd';
import type { AddressSelectorProps } from './VNAddress.types';

// Mock data - trong thực tế sẽ load từ API
const provinces = [
  { value: 'HN', label: 'Hà Nội' },
  { value: 'HCM', label: 'Hồ Chí Minh' },
  { value: 'DN', label: 'Đà Nẵng' },
];

const districts = {
  HN: [
    { value: 'BA_DINH', label: 'Ba Đình' },
    { value: 'HOAN_KIEM', label: 'Hoàn Kiếm' },
  ],
  HCM: [
    { value: 'QUAN_1', label: 'Quận 1' },
    { value: 'QUAN_3', label: 'Quận 3' },
  ],
  DN: [
    { value: 'HAI_CHAU', label: 'Hải Châu' },
    { value: 'THANH_KHE', label: 'Thanh Khê' },
  ],
};

const wards = {
  BA_DINH: [
    { value: 'PHUC_XA', label: 'Phúc Xá' },
    { value: 'TRUC_BACH', label: 'Trúc Bạch' },
  ],
  HOAN_KIEM: [
    { value: 'HANG_BAC', label: 'Hàng Bạc' },
    { value: 'HANG_DAO', label: 'Hàng Đào' },
  ],
};

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  value,
  onChange,
  placeholder = {
    province: 'Chọn tỉnh/thành phố',
    district: 'Chọn quận/huyện',
    ward: 'Chọn phường/xã',
  },
}) => {
  const [selectedProvince, setSelectedProvince] = useState(value?.province);
  const [selectedDistrict, setSelectedDistrict] = useState(value?.district);
  const [selectedWard, setSelectedWard] = useState(value?.ward);

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict(undefined);
    setSelectedWard(undefined);
    
    onChange?.({
      province,
      district: undefined,
      ward: undefined,
    });
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedWard(undefined);
    
    onChange?.({
      province: selectedProvince!,
      district,
      ward: undefined,
    });
  };

  const handleWardChange = (ward: string) => {
    setSelectedWard(ward);
    
    onChange?.({
      province: selectedProvince!,
      district: selectedDistrict!,
      ward,
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        placeholder={placeholder.province}
        value={selectedProvince}
        onChange={handleProvinceChange}
        options={provinces}
        style={{ width: '100%' }}
      />
      
      <Select
        placeholder={placeholder.district}
        value={selectedDistrict}
        onChange={handleDistrictChange}
        options={selectedProvince ? districts[selectedProvince as keyof typeof districts] : []}
        disabled={!selectedProvince}
        style={{ width: '100%' }}
      />
      
      <Select
        placeholder={placeholder.ward}
        value={selectedWard}
        onChange={handleWardChange}
        options={selectedDistrict ? wards[selectedDistrict as keyof typeof wards] : []}
        disabled={!selectedDistrict}
        style={{ width: '100%' }}
      />
    </Space>
  );
};

export default AddressSelector;
