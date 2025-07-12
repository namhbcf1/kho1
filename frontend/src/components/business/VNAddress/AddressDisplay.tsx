import React from 'react';
import type { AddressDisplayProps } from './VNAddress.types';

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  format = 'full',
  separator = ', ',
}) => {
  const formatAddress = () => {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);
    
    if (format === 'short') {
      return parts.slice(-2).join(separator);
    }
    
    return parts.join(separator);
  };

  return <span>{formatAddress()}</span>;
};

export default AddressDisplay;
