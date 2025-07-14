// Real Vietnamese loyalty system component with 5-tier program
import React, { useState, useEffect } from 'react';
import { Card, Progress, Tag, Button, Divider, Spin, Alert, Modal, List, Typography, Space, Statistic } from 'antd';
import { StarOutlined, GiftOutlined, HistoryOutlined, TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { customerService, LoyaltyTierConfig, Customer, LoyaltyTransaction } from '../../../services/api/customerService';

const { Text, Title } = Typography;

interface LoyaltyProgramProps {
  customerId: string;
  onRewardRedeemed?: (transaction: LoyaltyTransaction) => void;
}

export const LoyaltyProgram: React.FC<LoyaltyProgramProps> = ({ 
  customerId, 
  onRewardRedeemed 
}) => {
  const [loyaltyData, setLoyaltyData] = useState<{
    customer: Customer;
    currentTier: LoyaltyTierConfig;
    nextTier?: LoyaltyTierConfig;
    progressToNextTier: number;
    availableRewards: Array<{
      id: string;
      name: string;
      description: string;
      pointsCost: number;
      type: 'discount' | 'gift' | 'service';
      isAvailable: boolean;
    }>;
    recentTransactions: LoyaltyTransaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getLoyaltyProgram(customerId);
      setLoyaltyData(data);
    } catch (err: any) {
      setError('Không thể tải thông tin chương trình khách hàng thân thiết.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoyaltyData();
  }, [customerId]);

  const handleRedeemReward = async (rewardId: string, pointsCost: number, rewardName: string) => {
    try {
      setRedeeming(rewardId);
      const transaction = await customerService.redeemLoyaltyPoints(
        customerId,
        pointsCost,
        rewardId,
        `Đổi quà: ${rewardName}`
      );
      
      // Reload loyalty data to reflect changes
      await loadLoyaltyData();
      setShowRewards(false);
      
      if (onRewardRedeemed) {
        onRewardRedeemed(transaction);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể đổi quà. Vui lòng thử lại.');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <Card title="Chương trình khách hàng thân thiết">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Chương trình khách hàng thân thiết">
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={loadLoyaltyData} icon={<ReloadOutlined />}>
              Thử lại
            </Button>
          }
        />
      </Card>
    );
  }

  if (!loyaltyData) {
    return null;
  }

  const { customer, currentTier, nextTier, progressToNextTier, availableRewards, recentTransactions } = loyaltyData;

  return (
    <>
      <Card 
        title="Chương trình khách hàng thân thiết"
        extra={
          <Button size="small" onClick={loadLoyaltyData} icon={<ReloadOutlined />}>
            Làm mới
          </Button>
        }
      >
        {/* Customer Info */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {customer.name}
          </div>
          <Tag 
            color={currentTier.color}
            icon={<TrophyOutlined />}
            style={{ marginTop: 8, fontSize: '14px', padding: '4px 8px' }}
          >
            {currentTier.name}
          </Tag>
        </div>

        {/* Points & Spending Stats */}
        <div style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Điểm tích lũy hiện tại:</Text>
              <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                {customer.loyaltyPoints.toLocaleString('vi-VN')} điểm
              </Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Tổng chi tiêu:</Text>
              <Text strong style={{ fontSize: '16px' }}>
                {formatVND(customer.totalSpent)}
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Tổng đơn hàng:</Text>
              <Text strong>{customer.totalOrders} đơn</Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Giá trị đơn TB:</Text>
              <Text strong>{formatVND(customer.averageOrderValue)}</Text>
            </div>
          </Space>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Tiến độ lên hạng {nextTier.name}</Text>
            </div>
            <Progress 
              percent={Math.min(progressToNextTier, 100)} 
              status={progressToNextTier >= 100 ? 'success' : 'active'}
              strokeColor={nextTier.color}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Cần chi thêm {formatVND(nextTier.minSpent - customer.totalSpent)} 
              để lên hạng {nextTier.name}
            </div>
          </div>
        )}

        <Divider />

        {/* Current Tier Benefits */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>Quyền lợi hiện tại:</Title>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>Tích điểm x{currentTier.pointsMultiplier}</li>
            <li>Giảm giá {currentTier.discountPercent}% cho mọi đơn hàng</li>
            {currentTier.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
            {currentTier.perks.freeShipping && <li>Miễn phí giao hàng</li>}
            {currentTier.perks.prioritySupport && <li>Hỗ trợ ưu tiên</li>}
            {currentTier.perks.specialOffers && <li>Ưu đãi đặc biệt</li>}
            {currentTier.perks.birthdayBonus > 0 && (
              <li>Thưởng sinh nhật: {currentTier.perks.birthdayBonus} điểm</li>
            )}
            {currentTier.perks.tetBonus > 0 && (
              <li>Thưởng Tết: {currentTier.perks.tetBonus} điểm</li>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            icon={<GiftOutlined />} 
            block
            disabled={customer.loyaltyPoints < 100 || availableRewards.length === 0}
            onClick={() => setShowRewards(true)}
          >
            Đổi quà ({customer.loyaltyPoints.toLocaleString('vi-VN')} điểm)
          </Button>
          
          <Button 
            icon={<HistoryOutlined />} 
            block
            onClick={() => setShowHistory(true)}
          >
            Lịch sử tích điểm
          </Button>
        </Space>
      </Card>

      {/* Rewards Modal */}
      <Modal
        title="Đổi quà tích điểm"
        open={showRewards}
        onCancel={() => setShowRewards(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={availableRewards.filter(reward => reward.isAvailable)}
          renderItem={reward => (
            <List.Item
              actions={[
                <Button
                  key="redeem"
                  type="primary"
                  loading={redeeming === reward.id}
                  disabled={customer.loyaltyPoints < reward.pointsCost || redeeming !== null}
                  onClick={() => handleRedeemReward(reward.id, reward.pointsCost, reward.name)}
                >
                  Đổi ({reward.pointsCost} điểm)
                </Button>
              ]}
            >
              <List.Item.Meta
                title={reward.name}
                description={
                  <div>
                    <Text>{reward.description}</Text>
                    <br />
                    <Tag color={reward.type === 'discount' ? 'blue' : reward.type === 'gift' ? 'green' : 'orange'}>
                      {reward.type === 'discount' ? 'Giảm giá' : 
                       reward.type === 'gift' ? 'Quà tặng' : 'Dịch vụ'}
                    </Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* History Modal */}
      <Modal
        title="Lịch sử tích điểm"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={recentTransactions}
          renderItem={transaction => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div className="flex justify-between items-center">
                    <span>{transaction.description}</span>
                    <Text 
                      strong 
                      style={{ 
                        color: transaction.type === 'earn' ? '#52c41a' : 
                               transaction.type === 'redeem' ? '#ff4d4f' : '#666'
                      }}
                    >
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.points} điểm
                    </Text>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary">
                      {new Date(transaction.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                    {transaction.expiryDate && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Hết hạn: {new Date(transaction.expiryDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default LoyaltyProgram;
