// Customer selector component for POS terminal
import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Modal, Form, Input, message, Avatar, Tag } from 'antd';
import { UserOutlined, PlusOutlined, StarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePOSCart } from '../stores/posCartStore';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { validateVietnamesePhone } from '../../../utils/validators/vietnameseValidators';

const { Option } = Select;

export const CustomerSelector: React.FC = () => {
  const { t } = useTranslation();
  const { selectedCustomer, setSelectedCustomer } = usePOSCart();
  const { customers, searchCustomers, createCustomer, loading } = useCustomers();
  
  const [searchValue, setSearchValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (searchValue) {
      searchCustomers(searchValue);
    }
  }, [searchValue]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleAddCustomer = async (values: any) => {
    try {
      const newCustomer = await createCustomer({
        name: values.name,
        phone: values.phone,
        email: values.email,
      });
      
      setSelectedCustomer(newCustomer);
      setShowAddModal(false);
      form.resetFields();
      message.success(t('customers.customerCreated'));
    } catch (error) {
      message.error(t('customers.createFailed'));
    }
  };

  const getTierColor = (tierId?: string) => {
    switch (tierId) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      case 'diamond': return '#b9f2ff';
      default: return '#d9d9d9';
    }
  };

  const getTierName = (tierId?: string) => {
    switch (tierId) {
      case 'bronze': return 'Đồng';
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Bạch kim';
      case 'diamond': return 'Kim cương';
      default: return 'Khách lẻ';
    }
  };

  return (
    <>
      <Card 
        title={t('pos.customer')}
        className="mb-4"
        data-testid="customer-selector"
      >
        {selectedCustomer ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div className="font-medium">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedCustomer.phone || selectedCustomer.email}
                  </div>
                </div>
              </div>
              
              <Button
                type="text"
                onClick={() => setSelectedCustomer(null)}
                size="small"
              >
                ×
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Tag 
                color={getTierColor(selectedCustomer.tierId)}
                icon={<StarOutlined />}
              >
                {getTierName(selectedCustomer.tierId)}
              </Tag>
              
              <span className="text-sm text-gray-600">
                {selectedCustomer.loyaltyPoints} điểm
              </span>
            </div>

            <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
              <div>
                Tổng chi tiêu: {formatVND(selectedCustomer.totalSpent || 0)}
              </div>
              <div>
                Đơn hàng: {selectedCustomer.totalOrders || 0}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Select
              showSearch
              placeholder={t('pos.selectCustomer')}
              value={null}
              onSearch={setSearchValue}
              onSelect={handleCustomerSelect}
              loading={loading}
              className="w-full"
              filterOption={false}
              notFoundContent={
                searchValue ? (
                  <div className="text-center py-2">
                    <div className="text-gray-500 mb-2">
                      {t('customers.notFound')}
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setShowAddModal(true);
                        form.setFieldsValue({ 
                          phone: validateVietnamesePhone(searchValue) ? searchValue : '',
                          name: !validateVietnamesePhone(searchValue) ? searchValue : ''
                        });
                      }}
                    >
                      {t('customers.addNew')}
                    </Button>
                  </div>
                ) : null
              }
              data-testid="customer-search"
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id} data-testid="customer-option">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-500">
                        {customer.phone} • {customer.loyaltyPoints} điểm
                      </div>
                    </div>
                    <Tag 
                      color={getTierColor(customer.tierId)}
                      size="small"
                    >
                      {getTierName(customer.tierId)}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setShowAddModal(true)}
              className="w-full"
              data-testid="add-customer"
            >
              {t('customers.addNew')}
            </Button>
          </div>
        )}

        {selectedCustomer && (
          <div className="mt-3 pt-3 border-t" data-testid="selected-customer">
            <div className="text-xs text-gray-600">
              {t('pos.loyaltyDiscount')}: {selectedCustomer.tier?.discountPercentage || 0}%
            </div>
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal
        title={t('customers.addNew')}
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCustomer}
        >
          <Form.Item
            name="name"
            label={t('customers.name')}
            rules={[
              { required: true, message: t('validation.required') },
              { min: 2, message: t('validation.minLength', { min: 2 }) },
            ]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="phone"
            label={t('customers.phone')}
            rules={[
              { required: true, message: t('validation.required') },
              {
                validator: (_, value) => {
                  if (!value || validateVietnamesePhone(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('validation.phone')));
                },
              },
            ]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('customers.email')}
            rules={[
              { type: 'email', message: t('validation.email') },
            ]}
          >
            <Input placeholder="customer@example.com" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowAddModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('common.create')}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default CustomerSelector;
