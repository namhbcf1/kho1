/**
 * Vietnamese business utilities for backend
 */
export const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
export const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
};
/**
 * Vietnamese VAT calculation (10%)
 */
export const VAT_RATE = 0.1; // 10% VAT in Vietnam
export const calculateVAT = (amount) => {
    return amount * VAT_RATE;
};
export const calculateAmountWithVAT = (amount) => {
    return amount * (1 + VAT_RATE);
};
export const calculateAmountWithoutVAT = (amountWithVAT) => {
    return amountWithVAT / (1 + VAT_RATE);
};
/**
 * Vietnamese phone number validation
 */
export const isValidVietnamesePhone = (phone) => {
    // Vietnamese phone patterns:
    // Mobile: 09x, 08x, 07x, 05x, 03x (10-11 digits)
    // Landline: 02x (9-11 digits)
    const mobilePattern = /^(09|08|07|05|03)[0-9]{8,9}$/;
    const landlinePattern = /^(02)[0-9]{7,9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone);
};
export const formatVietnamesePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        // Mobile: 0xxx xxx xxx
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    else if (cleaned.length === 11) {
        // Mobile: 0xxx xxxx xxx
        return cleaned.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3');
    }
    else if (cleaned.length === 9 && cleaned.startsWith('02')) {
        // Landline: 02x xxx xxxx
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return phone; // Return original if doesn't match patterns
};
/**
 * Vietnamese business registration validation
 */
export const isValidBusinessLicense = (license) => {
    // Vietnamese business license format: XXXXXXXXXX (10 digits)
    const pattern = /^[0-9]{10}$/;
    return pattern.test(license.replace(/\D/g, ''));
};
export const isValidTaxCode = (taxCode) => {
    // Vietnamese tax code format: XXXXXXXXXX or XXXXXXXXXXXX (10 or 13 digits)
    const pattern = /^[0-9]{10}([0-9]{3})?$/;
    return pattern.test(taxCode.replace(/\D/g, ''));
};
/**
 * Vietnamese loyalty system
 */
export const vietnameseLoyaltyTiers = [
    {
        id: 'bronze',
        name: 'Đồng',
        minSpent: 0,
        color: '#cd7f32',
        benefits: ['Tích điểm cơ bản', 'Thông báo khuyến mãi']
    },
    {
        id: 'silver',
        name: 'Bạc',
        minSpent: 2000000,
        color: '#c0c0c0',
        benefits: ['Tích điểm x1.2', 'Giảm giá 5%', 'Hỗ trợ ưu tiên']
    },
    {
        id: 'gold',
        name: 'Vàng',
        minSpent: 5000000,
        color: '#ffd700',
        benefits: ['Tích điểm x1.5', 'Giảm giá 10%', 'Miễn phí giao hàng']
    },
    {
        id: 'platinum',
        name: 'Bạch Kim',
        minSpent: 10000000,
        color: '#e5e4e2',
        benefits: ['Tích điểm x2', 'Giảm giá 15%', 'Quà sinh nhật']
    },
    {
        id: 'diamond',
        name: 'Kim Cương',
        minSpent: 20000000,
        color: '#b9f2ff',
        benefits: ['Tích điểm x2.5', 'Giảm giá 20%', 'Dịch vụ VIP']
    },
];
export const calculateLoyaltyTier = (totalSpent) => {
    const tiers = [...vietnameseLoyaltyTiers].reverse(); // Start from highest tier
    const tier = tiers.find(t => totalSpent >= t.minSpent);
    return tier?.id || 'bronze';
};
export const calculateLoyaltyPoints = (amount, tier) => {
    const tierData = vietnameseLoyaltyTiers.find(t => t.id === tier);
    const multiplier = tierData?.id === 'bronze' ? 1 :
        tierData?.id === 'silver' ? 1.2 :
            tierData?.id === 'gold' ? 1.5 :
                tierData?.id === 'platinum' ? 2 :
                    tierData?.id === 'diamond' ? 2.5 : 1;
    // 1 point per 1000 VND spent
    return Math.floor((amount / 1000) * multiplier);
};
/**
 * Vietnamese payment methods
 */
export const vietnamesePaymentMethods = [
    { value: 'cash', label: 'Tiền mặt', icon: '💵' },
    { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { value: 'vnpay', label: 'VNPay', icon: '💳' },
    { value: 'momo', label: 'MoMo', icon: '📱' },
    { value: 'zalopay', label: 'ZaloPay', icon: '🅿️' },
    { value: 'shopee_pay', label: 'ShopeePay', icon: '🛒' },
    { value: 'grab_pay', label: 'GrabPay', icon: '🚗' },
    { value: 'credit_card', label: 'Thẻ tín dụng', icon: '💳' },
    { value: 'debit_card', label: 'Thẻ ghi nợ', icon: '💳' },
];
/**
 * Vietnamese banking
 */
export const vietnameseBanks = [
    { code: 'VCB', name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
    { code: 'VTB', name: 'Vietinbank', fullName: 'Ngân hàng TMCP Công thương Việt Nam' },
    { code: 'BIDV', name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
    { code: 'ACB', name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
    { code: 'TCB', name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
    { code: 'MBB', name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân đội' },
    { code: 'VPB', name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh vượng' },
    { code: 'TPB', name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
    { code: 'STB', name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương tín' },
    { code: 'EIB', name: 'Eximbank', fullName: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
];
/**
 * Vietnamese date formatting
 */
export const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
};
export const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN');
};
/**
 * Vietnamese invoice numbering
 */
export const generateVietnameseInvoiceNumber = (prefix = 'HD', sequence, date) => {
    const d = date || new Date();
    const year = d.getFullYear().toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const paddedSequence = sequence.toString().padStart(6, '0');
    return `${prefix}${year}${month}${paddedSequence}`;
};
