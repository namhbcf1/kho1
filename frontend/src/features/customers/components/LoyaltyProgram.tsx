// Vietnamese loyalty system component
import React from 'react';
import { Card, Progress, Tag, Button, Divider } from 'antd';
import { StarOutlined, GiftOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const LoyaltyProgram: React.FC = () => {
  const customerData = {
    name: 'Nguyễn Văn A',
    currentTier: 'silver',
    points: 1500,
    totalSpent: 8000000,
    nextTier: 'gold',
    nextTierRequirement: 20000000,
  };

  const tiers = [
    { id: 'bronze', name: 'Đồng', color: '#cd7f32', requirement: 0, discount: 0 },
    { id: 'silver', name: 'Bạc', color: '#c0c0c0', requirement: 5000000, discount: 2 },
    { id: 'gold', name: 'Vàng', color: '#ffd700', requirement: 20000000, discount: 5 },
    { id: 'platinum', name: 'Bạch kim', color: '#e5e4e2', requirement: 50000000, discount: 8 },
    { id: 'diamond', name: 'Kim cương', color: '#b9f2ff', requirement: 100000000, discount: 10 },
  ];

  const currentTierIndex = tiers.findIndex(t => t.id === customerData.currentTier);
  const nextTierData = tiers[currentTierIndex + 1];
  const progress = nextTierData 
    ? (customerData.totalSpent / nextTierData.requirement) * 100 
    : 100;

  return (
    <Card title="Chương trình khách hàng thân thiết">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {customerData.name}
        </div>
        <Tag 
          color={tiers[currentTierIndex].color} 
          icon={<StarOutlined />}
          style={{ marginTop: 8, fontSize: '14px' }}
        >
          {tiers[currentTierIndex].name}
        </Tag>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Điểm tích lũy hiện tại</span>
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {customerData.points} điểm
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Tổng chi tiêu</span>
          <span style={{ fontWeight: 'bold' }}>
            {formatVND(customerData.totalSpent)}
          </span>
        </div>
      </div>

      {nextTierData && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8 }}>
            Tiến độ lên hạng {nextTierData.name}
          </div>
          <Progress 
            percent={Math.min(progress, 100)} 
            status={progress >= 100 ? 'success' : 'active'}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            Cần chi thêm {formatVND(nextTierData.requirement - customerData.totalSpent)} 
            để lên hạng {nextTierData.name}
          </div>
        </div>
      )}

      <Divider />

      <div style={{ marginBottom: 16 }}>
        <h4>Quyền lợi hiện tại:</h4>
        <ul style={{ paddingLeft: 20 }}>
          <li>Tích điểm x{tiers[currentTierIndex].id === 'bronze' ? 1 : 1.2}</li>
          <li>Giảm giá {tiers[currentTierIndex].discount}% cho mọi đơn hàng</li>
          {currentTierIndex > 0 && <li>Ưu tiên hỗ trợ khách hàng</li>}
          {currentTierIndex > 1 && <li>Miễn phí giao hàng</li>}
        </ul>
      </div>

      <Button 
        type="primary" 
        icon={<GiftOutlined />} 
        block
        disabled={customerData.points < 100}
      >
        Đổi quà ({customerData.points} điểm)
      </Button>
    </Card>
  );
};

export default LoyaltyProgram;
