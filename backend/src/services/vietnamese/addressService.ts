/**
 * Vietnamese Address System Service
 * Handles Vietnamese address hierarchy: Tỉnh/Thành → Quận/Huyện → Phường/Xã
 * Provides address validation, formatting, and autocomplete functionality
 */

import { z } from 'zod';

// Address schemas
const ProvinceSchema = z.object({
  code: z.string(),
  name: z.string(),
  nameEn: z.string(),
  fullName: z.string(),
  fullNameEn: z.string(),
  codeName: z.string(),
  administrativeUnitId: z.number(),
  administrativeRegionId: z.number(),
});

const DistrictSchema = z.object({
  code: z.string(),
  name: z.string(),
  nameEn: z.string(),
  fullName: z.string(),
  fullNameEn: z.string(),
  codeName: z.string(),
  provinceCode: z.string(),
  administrativeUnitId: z.number(),
});

const WardSchema = z.object({
  code: z.string(),
  name: z.string(),
  nameEn: z.string(),
  fullName: z.string(),
  fullNameEn: z.string(),
  codeName: z.string(),
  districtCode: z.string(),
  administrativeUnitId: z.number(),
});

const VietnameseAddressSchema = z.object({
  street: z.string().optional(),
  ward: z.string().optional(),
  wardCode: z.string().optional(),
  district: z.string().optional(),
  districtCode: z.string().optional(),
  province: z.string().optional(),
  provinceCode: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Vietnam'),
  fullAddress: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export interface Province {
  code: string;
  name: string;
  nameEn: string;
  fullName: string;
  fullNameEn: string;
  codeName: string;
  administrativeUnitId: number;
  administrativeRegionId: number;
}

export interface District {
  code: string;
  name: string;
  nameEn: string;
  fullName: string;
  fullNameEn: string;
  codeName: string;
  provinceCode: string;
  administrativeUnitId: number;
}

export interface Ward {
  code: string;
  name: string;
  nameEn: string;
  fullName: string;
  fullNameEn: string;
  codeName: string;
  districtCode: string;
  administrativeUnitId: number;
}

export interface VietnameseAddress {
  street?: string;
  ward?: string;
  wardCode?: string;
  district?: string;
  districtCode?: string;
  province?: string;
  provinceCode?: string;
  postalCode?: string;
  country: string;
  fullAddress?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class VietnameseAddressService {
  private static provinces: Province[] = [
    // Major cities
    { code: '01', name: 'Hà Nội', nameEn: 'Ha Noi', fullName: 'Thành phố Hà Nội', fullNameEn: 'Ha Noi City', codeName: 'ha_noi', administrativeUnitId: 1, administrativeRegionId: 1 },
    { code: '79', name: 'TP Hồ Chí Minh', nameEn: 'Ho Chi Minh City', fullName: 'Thành phố Hồ Chí Minh', fullNameEn: 'Ho Chi Minh City', codeName: 'ho_chi_minh', administrativeUnitId: 1, administrativeRegionId: 3 },
    { code: '48', name: 'Đà Nẵng', nameEn: 'Da Nang', fullName: 'Thành phố Đà Nẵng', fullNameEn: 'Da Nang City', codeName: 'da_nang', administrativeUnitId: 1, administrativeRegionId: 2 },
    { code: '31', name: 'Hải Phòng', nameEn: 'Hai Phong', fullName: 'Thành phố Hải Phòng', fullNameEn: 'Hai Phong City', codeName: 'hai_phong', administrativeUnitId: 1, administrativeRegionId: 1 },
    { code: '92', name: 'Cần Thơ', nameEn: 'Can Tho', fullName: 'Thành phố Cần Thơ', fullNameEn: 'Can Tho City', codeName: 'can_tho', administrativeUnitId: 1, administrativeRegionId: 4 },
    
    // Northern provinces
    { code: '02', name: 'Hà Giang', nameEn: 'Ha Giang', fullName: 'Tỉnh Hà Giang', fullNameEn: 'Ha Giang Province', codeName: 'ha_giang', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '04', name: 'Cao Bằng', nameEn: 'Cao Bang', fullName: 'Tỉnh Cao Bằng', fullNameEn: 'Cao Bang Province', codeName: 'cao_bang', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '06', name: 'Bắc Kạn', nameEn: 'Bac Kan', fullName: 'Tỉnh Bắc Kạn', fullNameEn: 'Bac Kan Province', codeName: 'bac_kan', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '08', name: 'Tuyên Quang', nameEn: 'Tuyen Quang', fullName: 'Tỉnh Tuyên Quang', fullNameEn: 'Tuyen Quang Province', codeName: 'tuyen_quang', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '10', name: 'Lào Cai', nameEn: 'Lao Cai', fullName: 'Tỉnh Lào Cai', fullNameEn: 'Lao Cai Province', codeName: 'lao_cai', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '11', name: 'Điện Biên', nameEn: 'Dien Bien', fullName: 'Tỉnh Điện Biên', fullNameEn: 'Dien Bien Province', codeName: 'dien_bien', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '12', name: 'Lai Châu', nameEn: 'Lai Chau', fullName: 'Tỉnh Lai Châu', fullNameEn: 'Lai Chau Province', codeName: 'lai_chau', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '14', name: 'Sơn La', nameEn: 'Son La', fullName: 'Tỉnh Sơn La', fullNameEn: 'Son La Province', codeName: 'son_la', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '15', name: 'Yên Bái', nameEn: 'Yen Bai', fullName: 'Tỉnh Yên Bái', fullNameEn: 'Yen Bai Province', codeName: 'yen_bai', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '17', name: 'Hoà Bình', nameEn: 'Hoa Binh', fullName: 'Tỉnh Hoà Bình', fullNameEn: 'Hoa Binh Province', codeName: 'hoa_binh', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '19', name: 'Thái Nguyên', nameEn: 'Thai Nguyen', fullName: 'Tỉnh Thái Nguyên', fullNameEn: 'Thai Nguyen Province', codeName: 'thai_nguyen', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '20', name: 'Lạng Sơn', nameEn: 'Lang Son', fullName: 'Tỉnh Lạng Sơn', fullNameEn: 'Lang Son Province', codeName: 'lang_son', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '22', name: 'Quảng Ninh', nameEn: 'Quang Ninh', fullName: 'Tỉnh Quảng Ninh', fullNameEn: 'Quang Ninh Province', codeName: 'quang_ninh', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '24', name: 'Bắc Giang', nameEn: 'Bac Giang', fullName: 'Tỉnh Bắc Giang', fullNameEn: 'Bac Giang Province', codeName: 'bac_giang', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '25', name: 'Phú Thọ', nameEn: 'Phu Tho', fullName: 'Tỉnh Phú Thọ', fullNameEn: 'Phu Tho Province', codeName: 'phu_tho', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '26', name: 'Vĩnh Phúc', nameEn: 'Vinh Phuc', fullName: 'Tỉnh Vĩnh Phúc', fullNameEn: 'Vinh Phuc Province', codeName: 'vinh_phuc', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '27', name: 'Bắc Ninh', nameEn: 'Bac Ninh', fullName: 'Tỉnh Bắc Ninh', fullNameEn: 'Bac Ninh Province', codeName: 'bac_ninh', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '30', name: 'Hải Dương', nameEn: 'Hai Duong', fullName: 'Tỉnh Hải Dương', fullNameEn: 'Hai Duong Province', codeName: 'hai_duong', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '33', name: 'Hưng Yên', nameEn: 'Hung Yen', fullName: 'Tỉnh Hưng Yên', fullNameEn: 'Hung Yen Province', codeName: 'hung_yen', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '34', name: 'Thái Bình', nameEn: 'Thai Binh', fullName: 'Tỉnh Thái Bình', fullNameEn: 'Thai Binh Province', codeName: 'thai_binh', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '35', name: 'Hà Nam', nameEn: 'Ha Nam', fullName: 'Tỉnh Hà Nam', fullNameEn: 'Ha Nam Province', codeName: 'ha_nam', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '36', name: 'Nam Định', nameEn: 'Nam Dinh', fullName: 'Tỉnh Nam Định', fullNameEn: 'Nam Dinh Province', codeName: 'nam_dinh', administrativeUnitId: 2, administrativeRegionId: 1 },
    { code: '37', name: 'Ninh Bình', nameEn: 'Ninh Binh', fullName: 'Tỉnh Ninh Bình', fullNameEn: 'Ninh Binh Province', codeName: 'ninh_binh', administrativeUnitId: 2, administrativeRegionId: 1 },
    
    // Central provinces
    { code: '38', name: 'Thanh Hóa', nameEn: 'Thanh Hoa', fullName: 'Tỉnh Thanh Hóa', fullNameEn: 'Thanh Hoa Province', codeName: 'thanh_hoa', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '40', name: 'Nghệ An', nameEn: 'Nghe An', fullName: 'Tỉnh Nghệ An', fullNameEn: 'Nghe An Province', codeName: 'nghe_an', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '42', name: 'Hà Tĩnh', nameEn: 'Ha Tinh', fullName: 'Tỉnh Hà Tĩnh', fullNameEn: 'Ha Tinh Province', codeName: 'ha_tinh', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '44', name: 'Quảng Bình', nameEn: 'Quang Binh', fullName: 'Tỉnh Quảng Bình', fullNameEn: 'Quang Binh Province', codeName: 'quang_binh', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '45', name: 'Quảng Trị', nameEn: 'Quang Tri', fullName: 'Tỉnh Quảng Trị', fullNameEn: 'Quang Tri Province', codeName: 'quang_tri', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '46', name: 'Thừa Thiên Huế', nameEn: 'Thua Thien Hue', fullName: 'Tỉnh Thừa Thiên Huế', fullNameEn: 'Thua Thien Hue Province', codeName: 'thua_thien_hue', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '49', name: 'Quảng Nam', nameEn: 'Quang Nam', fullName: 'Tỉnh Quảng Nam', fullNameEn: 'Quang Nam Province', codeName: 'quang_nam', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '51', name: 'Quảng Ngãi', nameEn: 'Quang Ngai', fullName: 'Tỉnh Quảng Ngãi', fullNameEn: 'Quang Ngai Province', codeName: 'quang_ngai', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '52', name: 'Bình Định', nameEn: 'Binh Dinh', fullName: 'Tỉnh Bình Định', fullNameEn: 'Binh Dinh Province', codeName: 'binh_dinh', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '54', name: 'Phú Yên', nameEn: 'Phu Yen', fullName: 'Tỉnh Phú Yên', fullNameEn: 'Phu Yen Province', codeName: 'phu_yen', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '56', name: 'Khánh Hòa', nameEn: 'Khanh Hoa', fullName: 'Tỉnh Khánh Hòa', fullNameEn: 'Khanh Hoa Province', codeName: 'khanh_hoa', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '58', name: 'Ninh Thuận', nameEn: 'Ninh Thuan', fullName: 'Tỉnh Ninh Thuận', fullNameEn: 'Ninh Thuan Province', codeName: 'ninh_thuan', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '60', name: 'Bình Thuận', nameEn: 'Binh Thuan', fullName: 'Tỉnh Bình Thuận', fullNameEn: 'Binh Thuan Province', codeName: 'binh_thuan', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '62', name: 'Kon Tum', nameEn: 'Kon Tum', fullName: 'Tỉnh Kon Tum', fullNameEn: 'Kon Tum Province', codeName: 'kon_tum', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '64', name: 'Gia Lai', nameEn: 'Gia Lai', fullName: 'Tỉnh Gia Lai', fullNameEn: 'Gia Lai Province', codeName: 'gia_lai', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '66', name: 'Đắk Lắk', nameEn: 'Dak Lak', fullName: 'Tỉnh Đắk Lắk', fullNameEn: 'Dak Lak Province', codeName: 'dak_lak', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '67', name: 'Đắk Nông', nameEn: 'Dak Nong', fullName: 'Tỉnh Đắk Nông', fullNameEn: 'Dak Nong Province', codeName: 'dak_nong', administrativeUnitId: 2, administrativeRegionId: 2 },
    { code: '68', name: 'Lâm Đồng', nameEn: 'Lam Dong', fullName: 'Tỉnh Lâm Đồng', fullNameEn: 'Lam Dong Province', codeName: 'lam_dong', administrativeUnitId: 2, administrativeRegionId: 2 },
    
    // Southern provinces
    { code: '70', name: 'Bình Phước', nameEn: 'Binh Phuoc', fullName: 'Tỉnh Bình Phước', fullNameEn: 'Binh Phuoc Province', codeName: 'binh_phuoc', administrativeUnitId: 2, administrativeRegionId: 3 },
    { code: '72', name: 'Tây Ninh', nameEn: 'Tay Ninh', fullName: 'Tỉnh Tây Ninh', fullNameEn: 'Tay Ninh Province', codeName: 'tay_ninh', administrativeUnitId: 2, administrativeRegionId: 3 },
    { code: '74', name: 'Bình Dương', nameEn: 'Binh Duong', fullName: 'Tỉnh Bình Dương', fullNameEn: 'Binh Duong Province', codeName: 'binh_duong', administrativeUnitId: 2, administrativeRegionId: 3 },
    { code: '75', name: 'Đồng Nai', nameEn: 'Dong Nai', fullName: 'Tỉnh Đồng Nai', fullNameEn: 'Dong Nai Province', codeName: 'dong_nai', administrativeUnitId: 2, administrativeRegionId: 3 },
    { code: '77', name: 'Bà Rịa - Vũng Tàu', nameEn: 'Ba Ria - Vung Tau', fullName: 'Tỉnh Bà Rịa - Vũng Tàu', fullNameEn: 'Ba Ria - Vung Tau Province', codeName: 'ba_ria_vung_tau', administrativeUnitId: 2, administrativeRegionId: 3 },
    { code: '80', name: 'Long An', nameEn: 'Long An', fullName: 'Tỉnh Long An', fullNameEn: 'Long An Province', codeName: 'long_an', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '82', name: 'Tiền Giang', nameEn: 'Tien Giang', fullName: 'Tỉnh Tiền Giang', fullNameEn: 'Tien Giang Province', codeName: 'tien_giang', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '83', name: 'Bến Tre', nameEn: 'Ben Tre', fullName: 'Tỉnh Bến Tre', fullNameEn: 'Ben Tre Province', codeName: 'ben_tre', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '84', name: 'Trà Vinh', nameEn: 'Tra Vinh', fullName: 'Tỉnh Trà Vinh', fullNameEn: 'Tra Vinh Province', codeName: 'tra_vinh', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '86', name: 'Vĩnh Long', nameEn: 'Vinh Long', fullName: 'Tỉnh Vĩnh Long', fullNameEn: 'Vinh Long Province', codeName: 'vinh_long', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '87', name: 'Đồng Tháp', nameEn: 'Dong Thap', fullName: 'Tỉnh Đồng Tháp', fullNameEn: 'Dong Thap Province', codeName: 'dong_thap', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '89', name: 'An Giang', nameEn: 'An Giang', fullName: 'Tỉnh An Giang', fullNameEn: 'An Giang Province', codeName: 'an_giang', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '91', name: 'Kiên Giang', nameEn: 'Kien Giang', fullName: 'Tỉnh Kiên Giang', fullNameEn: 'Kien Giang Province', codeName: 'kien_giang', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '93', name: 'Hậu Giang', nameEn: 'Hau Giang', fullName: 'Tỉnh Hậu Giang', fullNameEn: 'Hau Giang Province', codeName: 'hau_giang', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '94', name: 'Sóc Trăng', nameEn: 'Soc Trang', fullName: 'Tỉnh Sóc Trăng', fullNameEn: 'Soc Trang Province', codeName: 'soc_trang', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '95', name: 'Bạc Liêu', nameEn: 'Bac Lieu', fullName: 'Tỉnh Bạc Liêu', fullNameEn: 'Bac Lieu Province', codeName: 'bac_lieu', administrativeUnitId: 2, administrativeRegionId: 4 },
    { code: '96', name: 'Cà Mau', nameEn: 'Ca Mau', fullName: 'Tỉnh Cà Mau', fullNameEn: 'Ca Mau Province', codeName: 'ca_mau', administrativeUnitId: 2, administrativeRegionId: 4 },
  ];

  private static districts: District[] = [
    // Ha Noi districts
    { code: '001', name: 'Ba Đình', nameEn: 'Ba Dinh', fullName: 'Quận Ba Đình', fullNameEn: 'Ba Dinh District', codeName: 'ba_dinh', provinceCode: '01', administrativeUnitId: 3 },
    { code: '002', name: 'Hoàn Kiếm', nameEn: 'Hoan Kiem', fullName: 'Quận Hoàn Kiếm', fullNameEn: 'Hoan Kiem District', codeName: 'hoan_kiem', provinceCode: '01', administrativeUnitId: 3 },
    { code: '003', name: 'Tây Hồ', nameEn: 'Tay Ho', fullName: 'Quận Tây Hồ', fullNameEn: 'Tay Ho District', codeName: 'tay_ho', provinceCode: '01', administrativeUnitId: 3 },
    { code: '004', name: 'Long Biên', nameEn: 'Long Bien', fullName: 'Quận Long Biên', fullNameEn: 'Long Bien District', codeName: 'long_bien', provinceCode: '01', administrativeUnitId: 3 },
    { code: '005', name: 'Cầu Giấy', nameEn: 'Cau Giay', fullName: 'Quận Cầu Giấy', fullNameEn: 'Cau Giay District', codeName: 'cau_giay', provinceCode: '01', administrativeUnitId: 3 },
    { code: '006', name: 'Đống Đa', nameEn: 'Dong Da', fullName: 'Quận Đống Đa', fullNameEn: 'Dong Da District', codeName: 'dong_da', provinceCode: '01', administrativeUnitId: 3 },
    { code: '007', name: 'Hai Bà Trưng', nameEn: 'Hai Ba Trung', fullName: 'Quận Hai Bà Trưng', fullNameEn: 'Hai Ba Trung District', codeName: 'hai_ba_trung', provinceCode: '01', administrativeUnitId: 3 },
    { code: '008', name: 'Hoàng Mai', nameEn: 'Hoang Mai', fullName: 'Quận Hoàng Mai', fullNameEn: 'Hoang Mai District', codeName: 'hoang_mai', provinceCode: '01', administrativeUnitId: 3 },
    { code: '009', name: 'Thanh Xuân', nameEn: 'Thanh Xuan', fullName: 'Quận Thanh Xuân', fullNameEn: 'Thanh Xuan District', codeName: 'thanh_xuan', provinceCode: '01', administrativeUnitId: 3 },
    
    // Ho Chi Minh City districts
    { code: '760', name: 'Quận 1', nameEn: 'District 1', fullName: 'Quận 1', fullNameEn: 'District 1', codeName: 'quan_1', provinceCode: '79', administrativeUnitId: 3 },
    { code: '761', name: 'Quận 2', nameEn: 'District 2', fullName: 'Quận 2', fullNameEn: 'District 2', codeName: 'quan_2', provinceCode: '79', administrativeUnitId: 3 },
    { code: '762', name: 'Quận 3', nameEn: 'District 3', fullName: 'Quận 3', fullNameEn: 'District 3', codeName: 'quan_3', provinceCode: '79', administrativeUnitId: 3 },
    { code: '763', name: 'Quận 4', nameEn: 'District 4', fullName: 'Quận 4', fullNameEn: 'District 4', codeName: 'quan_4', provinceCode: '79', administrativeUnitId: 3 },
    { code: '764', name: 'Quận 5', nameEn: 'District 5', fullName: 'Quận 5', fullNameEn: 'District 5', codeName: 'quan_5', provinceCode: '79', administrativeUnitId: 3 },
    { code: '765', name: 'Quận 6', nameEn: 'District 6', fullName: 'Quận 6', fullNameEn: 'District 6', codeName: 'quan_6', provinceCode: '79', administrativeUnitId: 3 },
    { code: '766', name: 'Quận 7', nameEn: 'District 7', fullName: 'Quận 7', fullNameEn: 'District 7', codeName: 'quan_7', provinceCode: '79', administrativeUnitId: 3 },
    { code: '767', name: 'Quận 8', nameEn: 'District 8', fullName: 'Quận 8', fullNameEn: 'District 8', codeName: 'quan_8', provinceCode: '79', administrativeUnitId: 3 },
    { code: '768', name: 'Quận 9', nameEn: 'District 9', fullName: 'Quận 9', fullNameEn: 'District 9', codeName: 'quan_9', provinceCode: '79', administrativeUnitId: 3 },
    { code: '769', name: 'Quận 10', nameEn: 'District 10', fullName: 'Quận 10', fullNameEn: 'District 10', codeName: 'quan_10', provinceCode: '79', administrativeUnitId: 3 },
    { code: '770', name: 'Quận 11', nameEn: 'District 11', fullName: 'Quận 11', fullNameEn: 'District 11', codeName: 'quan_11', provinceCode: '79', administrativeUnitId: 3 },
    { code: '771', name: 'Quận 12', nameEn: 'District 12', fullName: 'Quận 12', fullNameEn: 'District 12', codeName: 'quan_12', provinceCode: '79', administrativeUnitId: 3 },
    { code: '772', name: 'Thủ Đức', nameEn: 'Thu Duc', fullName: 'Thành phố Thủ Đức', fullNameEn: 'Thu Duc City', codeName: 'thu_duc', provinceCode: '79', administrativeUnitId: 1 },
    { code: '773', name: 'Gò Vấp', nameEn: 'Go Vap', fullName: 'Quận Gò Vấp', fullNameEn: 'Go Vap District', codeName: 'go_vap', provinceCode: '79', administrativeUnitId: 3 },
    { code: '774', name: 'Phú Nhuận', nameEn: 'Phu Nhuan', fullName: 'Quận Phú Nhuận', fullNameEn: 'Phu Nhuan District', codeName: 'phu_nhuan', provinceCode: '79', administrativeUnitId: 3 },
    { code: '775', name: 'Tân Bình', nameEn: 'Tan Binh', fullName: 'Quận Tân Bình', fullNameEn: 'Tan Binh District', codeName: 'tan_binh', provinceCode: '79', administrativeUnitId: 3 },
    { code: '776', name: 'Tân Phú', nameEn: 'Tan Phu', fullName: 'Quận Tân Phú', fullNameEn: 'Tan Phu District', codeName: 'tan_phu', provinceCode: '79', administrativeUnitId: 3 },
    { code: '777', name: 'Bình Thạnh', nameEn: 'Binh Thanh', fullName: 'Quận Bình Thạnh', fullNameEn: 'Binh Thanh District', codeName: 'binh_thanh', provinceCode: '79', administrativeUnitId: 3 },
  ];

  private static wards: Ward[] = [
    // Ba Dinh District wards
    { code: '00001', name: 'Phúc Xá', nameEn: 'Phuc Xa', fullName: 'Phường Phúc Xá', fullNameEn: 'Phuc Xa Ward', codeName: 'phuc_xa', districtCode: '001', administrativeUnitId: 4 },
    { code: '00002', name: 'Trúc Bạch', nameEn: 'Truc Bach', fullName: 'Phường Trúc Bạch', fullNameEn: 'Truc Bach Ward', codeName: 'truc_bach', districtCode: '001', administrativeUnitId: 4 },
    { code: '00003', name: 'Vĩnh Phúc', nameEn: 'Vinh Phuc', fullName: 'Phường Vĩnh Phúc', fullNameEn: 'Vinh Phuc Ward', codeName: 'vinh_phuc', districtCode: '001', administrativeUnitId: 4 },
    { code: '00004', name: 'Cống Vị', nameEn: 'Cong Vi', fullName: 'Phường Cống Vị', fullNameEn: 'Cong Vi Ward', codeName: 'cong_vi', districtCode: '001', administrativeUnitId: 4 },
    { code: '00005', name: 'Liễu Giai', nameEn: 'Lieu Giai', fullName: 'Phường Liễu Giai', fullNameEn: 'Lieu Giai Ward', codeName: 'lieu_giai', districtCode: '001', administrativeUnitId: 4 },
    { code: '00006', name: 'Nguyễn Trung Trực', nameEn: 'Nguyen Trung Truc', fullName: 'Phường Nguyễn Trung Trực', fullNameEn: 'Nguyen Trung Truc Ward', codeName: 'nguyen_trung_truc', districtCode: '001', administrativeUnitId: 4 },
    { code: '00007', name: 'Quán Thánh', nameEn: 'Quan Thanh', fullName: 'Phường Quán Thánh', fullNameEn: 'Quan Thanh Ward', codeName: 'quan_thanh', districtCode: '001', administrativeUnitId: 4 },
    { code: '00008', name: 'Ngọc Hà', nameEn: 'Ngoc Ha', fullName: 'Phường Ngọc Hà', fullNameEn: 'Ngoc Ha Ward', codeName: 'ngoc_ha', districtCode: '001', administrativeUnitId: 4 },
    { code: '00009', name: 'Điện Biên', nameEn: 'Dien Bien', fullName: 'Phường Điện Biên', fullNameEn: 'Dien Bien Ward', codeName: 'dien_bien', districtCode: '001', administrativeUnitId: 4 },
    { code: '00010', name: 'Đội Cấn', nameEn: 'Doi Can', fullName: 'Phường Đội Cấn', fullNameEn: 'Doi Can Ward', codeName: 'doi_can', districtCode: '001', administrativeUnitId: 4 },
    { code: '00011', name: 'Ngọc Khánh', nameEn: 'Ngoc Khanh', fullName: 'Phường Ngọc Khánh', fullNameEn: 'Ngoc Khanh Ward', codeName: 'ngoc_khanh', districtCode: '001', administrativeUnitId: 4 },
    { code: '00012', name: 'Kim Mã', nameEn: 'Kim Ma', fullName: 'Phường Kim Mã', fullNameEn: 'Kim Ma Ward', codeName: 'kim_ma', districtCode: '001', administrativeUnitId: 4 },
    { code: '00013', name: 'Giảng Võ', nameEn: 'Giang Vo', fullName: 'Phường Giảng Võ', fullNameEn: 'Giang Vo Ward', codeName: 'giang_vo', districtCode: '001', administrativeUnitId: 4 },
    { code: '00014', name: 'Thành Công', nameEn: 'Thanh Cong', fullName: 'Phường Thành Công', fullNameEn: 'Thanh Cong Ward', codeName: 'thanh_cong', districtCode: '001', administrativeUnitId: 4 },
    
    // District 1 wards (Ho Chi Minh City)
    { code: '26734', name: 'Tân Định', nameEn: 'Tan Dinh', fullName: 'Phường Tân Định', fullNameEn: 'Tan Dinh Ward', codeName: 'tan_dinh', districtCode: '760', administrativeUnitId: 4 },
    { code: '26735', name: 'Đa Kao', nameEn: 'Da Kao', fullName: 'Phường Đa Kao', fullNameEn: 'Da Kao Ward', codeName: 'da_kao', districtCode: '760', administrativeUnitId: 4 },
    { code: '26736', name: 'Bến Nghé', nameEn: 'Ben Nghe', fullName: 'Phường Bến Nghé', fullNameEn: 'Ben Nghe Ward', codeName: 'ben_nghe', districtCode: '760', administrativeUnitId: 4 },
    { code: '26737', name: 'Bến Thành', nameEn: 'Ben Thanh', fullName: 'Phường Bến Thành', fullNameEn: 'Ben Thanh Ward', codeName: 'ben_thanh', districtCode: '760', administrativeUnitId: 4 },
    { code: '26738', name: 'Nguyễn Thái Bình', nameEn: 'Nguyen Thai Binh', fullName: 'Phường Nguyễn Thái Bình', fullNameEn: 'Nguyen Thai Binh Ward', codeName: 'nguyen_thai_binh', districtCode: '760', administrativeUnitId: 4 },
    { code: '26739', name: 'Phạm Ngũ Lão', nameEn: 'Pham Ngu Lao', fullName: 'Phường Phạm Ngũ Lão', fullNameEn: 'Pham Ngu Lao Ward', codeName: 'pham_ngu_lao', districtCode: '760', administrativeUnitId: 4 },
    { code: '26740', name: 'Cầu Ông Lãnh', nameEn: 'Cau Ong Lanh', fullName: 'Phường Cầu Ông Lãnh', fullNameEn: 'Cau Ong Lanh Ward', codeName: 'cau_ong_lanh', districtCode: '760', administrativeUnitId: 4 },
    { code: '26741', name: 'Cô Giang', nameEn: 'Co Giang', fullName: 'Phường Cô Giang', fullNameEn: 'Co Giang Ward', codeName: 'co_giang', districtCode: '760', administrativeUnitId: 4 },
    { code: '26742', name: 'Nguyễn Cư Trinh', nameEn: 'Nguyen Cu Trinh', fullName: 'Phường Nguyễn Cư Trinh', fullNameEn: 'Nguyen Cu Trinh Ward', codeName: 'nguyen_cu_trinh', districtCode: '760', administrativeUnitId: 4 },
    { code: '26743', name: 'Cầu Kho', nameEn: 'Cau Kho', fullName: 'Phường Cầu Kho', fullNameEn: 'Cau Kho Ward', codeName: 'cau_kho', districtCode: '760', administrativeUnitId: 4 },
  ];

  /**
   * Get all provinces
   */
  static getProvinces(): Province[] {
    return this.provinces;
  }

  /**
   * Get districts by province code
   */
  static getDistrictsByProvince(provinceCode: string): District[] {
    return this.districts.filter(district => district.provinceCode === provinceCode);
  }

  /**
   * Get wards by district code
   */
  static getWardsByDistrict(districtCode: string): Ward[] {
    return this.wards.filter(ward => ward.districtCode === districtCode);
  }

  /**
   * Find province by code or name
   */
  static findProvince(query: string): Province | null {
    return this.provinces.find(province => 
      province.code === query || 
      province.name.toLowerCase().includes(query.toLowerCase()) ||
      province.nameEn.toLowerCase().includes(query.toLowerCase()) ||
      province.codeName === query
    ) || null;
  }

  /**
   * Find district by code or name
   */
  static findDistrict(query: string, provinceCode?: string): District | null {
    let districts = this.districts;
    
    if (provinceCode) {
      districts = districts.filter(district => district.provinceCode === provinceCode);
    }
    
    return districts.find(district => 
      district.code === query || 
      district.name.toLowerCase().includes(query.toLowerCase()) ||
      district.nameEn.toLowerCase().includes(query.toLowerCase()) ||
      district.codeName === query
    ) || null;
  }

  /**
   * Find ward by code or name
   */
  static findWard(query: string, districtCode?: string): Ward | null {
    let wards = this.wards;
    
    if (districtCode) {
      wards = wards.filter(ward => ward.districtCode === districtCode);
    }
    
    return wards.find(ward => 
      ward.code === query || 
      ward.name.toLowerCase().includes(query.toLowerCase()) ||
      ward.nameEn.toLowerCase().includes(query.toLowerCase()) ||
      ward.codeName === query
    ) || null;
  }

  /**
   * Validate Vietnamese address
   */
  static validateAddress(address: VietnameseAddress): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      VietnameseAddressSchema.parse(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      }
    }

    // Check if province exists
    if (address.province) {
      const province = this.findProvince(address.province);
      if (!province) {
        errors.push('Province not found');
      } else {
        // Check if district exists in province
        if (address.district) {
          const district = this.findDistrict(address.district, province.code);
          if (!district) {
            errors.push('District not found in specified province');
          } else {
            // Check if ward exists in district
            if (address.ward) {
              const ward = this.findWard(address.ward, district.code);
              if (!ward) {
                errors.push('Ward not found in specified district');
              }
            }
          }
        }
      }
    }

    // Validate postal code format
    if (address.postalCode && !/^\d{6}$/.test(address.postalCode)) {
      errors.push('Postal code must be 6 digits');
    }

    // Warnings
    if (!address.ward) {
      warnings.push('Ward is recommended for complete address');
    }

    if (!address.district) {
      warnings.push('District is recommended for complete address');
    }

    if (!address.street) {
      warnings.push('Street address is recommended');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format Vietnamese address
   */
  static formatAddress(address: VietnameseAddress): string {
    const parts: string[] = [];

    if (address.street) {
      parts.push(address.street);
    }

    if (address.ward) {
      parts.push(address.ward);
    }

    if (address.district) {
      parts.push(address.district);
    }

    if (address.province) {
      parts.push(address.province);
    }

    return parts.join(', ');
  }

  /**
   * Parse address string into components
   */
  static parseAddress(addressString: string): VietnameseAddress {
    const parts = addressString.split(',').map(part => part.trim());
    const address: VietnameseAddress = {
      country: 'Vietnam',
      fullAddress: addressString,
    };

    // Try to identify components from the end (province, district, ward, street)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const province = this.findProvince(lastPart);
      if (province) {
        address.province = province.name;
        address.provinceCode = province.code;
        parts.pop();
      }
    }

    if (parts.length > 0 && address.provinceCode) {
      const secondLastPart = parts[parts.length - 1];
      const district = this.findDistrict(secondLastPart, address.provinceCode);
      if (district) {
        address.district = district.name;
        address.districtCode = district.code;
        parts.pop();
      }
    }

    if (parts.length > 0 && address.districtCode) {
      const thirdLastPart = parts[parts.length - 1];
      const ward = this.findWard(thirdLastPart, address.districtCode);
      if (ward) {
        address.ward = ward.name;
        address.wardCode = ward.code;
        parts.pop();
      }
    }

    if (parts.length > 0) {
      address.street = parts.join(', ');
    }

    return address;
  }

  /**
   * Get address suggestions for autocomplete
   */
  static getAddressSuggestions(query: string, limit: number = 10): Array<{
    type: 'province' | 'district' | 'ward';
    name: string;
    fullName: string;
    code: string;
    parentCode?: string;
    parentName?: string;
  }> {
    const suggestions: Array<any> = [];
    const searchQuery = query.toLowerCase();

    // Search provinces
    this.provinces.forEach(province => {
      if (province.name.toLowerCase().includes(searchQuery) || 
          province.nameEn.toLowerCase().includes(searchQuery)) {
        suggestions.push({
          type: 'province',
          name: province.name,
          fullName: province.fullName,
          code: province.code,
        });
      }
    });

    // Search districts
    this.districts.forEach(district => {
      if (district.name.toLowerCase().includes(searchQuery) || 
          district.nameEn.toLowerCase().includes(searchQuery)) {
        const province = this.provinces.find(p => p.code === district.provinceCode);
        suggestions.push({
          type: 'district',
          name: district.name,
          fullName: district.fullName,
          code: district.code,
          parentCode: district.provinceCode,
          parentName: province?.name,
        });
      }
    });

    // Search wards
    this.wards.forEach(ward => {
      if (ward.name.toLowerCase().includes(searchQuery) || 
          ward.nameEn.toLowerCase().includes(searchQuery)) {
        const district = this.districts.find(d => d.code === ward.districtCode);
        const province = district ? this.provinces.find(p => p.code === district.provinceCode) : null;
        suggestions.push({
          type: 'ward',
          name: ward.name,
          fullName: ward.fullName,
          code: ward.code,
          parentCode: ward.districtCode,
          parentName: district ? `${district.name}, ${province?.name}` : '',
        });
      }
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Get postal code for address
   */
  static getPostalCode(address: VietnameseAddress): string | null {
    // This would typically query a postal code database
    // For now, return a mock postal code based on province
    const provincePostalCodes: { [key: string]: string } = {
      '01': '100000', // Ha Noi
      '79': '700000', // Ho Chi Minh City
      '48': '550000', // Da Nang
      '31': '180000', // Hai Phong
      '92': '900000', // Can Tho
    };

    if (address.provinceCode) {
      return provincePostalCodes[address.provinceCode] || null;
    }

    return null;
  }

  /**
   * Get coordinates for address (mock implementation)
   */
  static async getCoordinates(address: VietnameseAddress): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    // This would typically integrate with a geocoding service
    // For now, return mock coordinates for major cities
    const cityCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
      '01': { latitude: 21.0285, longitude: 105.8542 }, // Ha Noi
      '79': { latitude: 10.8231, longitude: 106.6297 }, // Ho Chi Minh City
      '48': { latitude: 16.0544, longitude: 108.2022 }, // Da Nang
      '31': { latitude: 20.8449, longitude: 106.6881 }, // Hai Phong
      '92': { latitude: 10.0452, longitude: 105.7469 }, // Can Tho
    };

    if (address.provinceCode) {
      return cityCoordinates[address.provinceCode] || null;
    }

    return null;
  }

  /**
   * Get address hierarchy
   */
  static getAddressHierarchy(address: VietnameseAddress): {
    province?: Province;
    district?: District;
    ward?: Ward;
  } {
    const result: any = {};

    if (address.provinceCode) {
      result.province = this.provinces.find(p => p.code === address.provinceCode);
    }

    if (address.districtCode) {
      result.district = this.districts.find(d => d.code === address.districtCode);
    }

    if (address.wardCode) {
      result.ward = this.wards.find(w => w.code === address.wardCode);
    }

    return result;
  }

  /**
   * Normalize address text for search
   */
  static normalizeAddressText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default VietnameseAddressService;