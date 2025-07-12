export interface Address {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}

export interface AddressSelectorProps {
  value?: Address;
  onChange?: (address: Address) => void;
  placeholder?: {
    province?: string;
    district?: string;
    ward?: string;
  };
}

export interface AddressDisplayProps {
  address: Address;
  format?: 'full' | 'short';
  separator?: string;
}
