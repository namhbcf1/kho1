import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Table, 
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  CalculatorOutlined, 
  DollarOutlined, 
  FileTextOutlined, 
  PercentageOutlined 
} from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

const { Title, Text } = Typography;
const { Option } = Select;

interface TaxCalculationItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  isTaxInclusive: boolean;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  exciseAmount: number;
  totalAmount: number;
}

interface TaxCalculation {
  items: TaxCalculationItem[];
  subtotal: number;
  totalVat: number;
  totalExcise: number;
  totalTax: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

interface VNTaxCalculatorProps {
  onCalculationChange?: (calculation: TaxCalculation) => void;
}

const TAX_CATEGORIES = [
  { value: 'essential_goods', label: 'Hàng hóa thiết yếu (5%)', vatRate: 5 },
  { value: 'semi_essential_goods', label: 'Hàng hóa bán thiết yếu (8%)', vatRate: 8 },
  { value: 'standard_goods', label: 'Hàng hóa thông thường (10%)', vatRate: 10 },
  { value: 'export_goods', label: 'Hàng xuất khẩu (0%)', vatRate: 0 },
  { value: 'exempt_goods', label: 'Hàng miễn thuế', vatRate: 0 },
  { value: 'alcohol', label: 'Rượu bia (10% VAT + 65% Excise)', vatRate: 10 },
  { value: 'tobacco', label: 'Thuốc lá (10% VAT + 75% Excise)', vatRate: 10 },
  { value: 'luxury', label: 'Hàng xa xỉ (10% VAT + Special Tax)', vatRate: 10 },
];

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Phần trăm (%)' },
  { value: 'fixed', label: 'Số tiền cố định (VND)' },
];

const VNTaxCalculator: React.FC<VNTaxCalculatorProps> = ({ onCalculationChange }) => {
  const [items, setItems] = useState<TaxCalculationItem[]>([]);
  const [calculation, setCalculation] = useState<TaxCalculation>({
    items: [],
    subtotal: 0,
    totalVat: 0,
    totalExcise: 0,
    totalTax: 0,
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
  });
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isExport, setIsExport] = useState<boolean>(false);
  const [customerType, setCustomerType] = useState<'individual' | 'business'>('individual');

  // Mock tax calculation function (in real app, would call backend service)
  const calculateItemTax = (item: {
    unitPrice: number;
    quantity: number;
    category: string;
    isTaxInclusive: boolean;
  }): {
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    exciseAmount: number;
    totalAmount: number;
  } => {
    const { unitPrice, quantity, category, isTaxInclusive } = item;
    let subtotal = unitPrice * quantity;
    let vatRate = 0;
    let exciseRate = 0;

    // Determine VAT rate
    if (isExport) {
      vatRate = 0;
    } else {
      switch (category) {
        case 'essential_goods':
          vatRate = 0.05;
          break;
        case 'semi_essential_goods':
          vatRate = 0.08;
          break;
        case 'standard_goods':
        case 'luxury':
          vatRate = 0.10;
          break;
        case 'alcohol':
        case 'tobacco':
          vatRate = 0.10;
          break;
        case 'export_goods':
          vatRate = 0.00;
          break;
        case 'exempt_goods':
          vatRate = 0;
          break;
        default:
          vatRate = 0.10;
      }
    }

    // Determine excise rate
    switch (category) {
      case 'alcohol':
        exciseRate = 0.65;
        break;
      case 'tobacco':
        exciseRate = 0.75;
        break;
      case 'luxury':
        exciseRate = 0.60;
        break;
      default:
        exciseRate = 0;
    }

    let exciseAmount: number;
    let vatAmount: number;
    let totalAmount: number;

    if (isTaxInclusive) {
      // Amount includes tax, calculate backwards
      totalAmount = subtotal;
      const totalTaxRate = exciseRate + vatRate + (exciseRate * vatRate);
      const netSubtotal = totalAmount / (1 + totalTaxRate);
      
      subtotal = netSubtotal;
      exciseAmount = netSubtotal * exciseRate;
      vatAmount = (netSubtotal + exciseAmount) * vatRate;
    } else {
      // Amount excludes tax, calculate forward
      exciseAmount = subtotal * exciseRate;
      vatAmount = (subtotal + exciseAmount) * vatRate;
      totalAmount = subtotal + exciseAmount + vatAmount;
    }

    return {
      subtotal,
      vatRate: vatRate * 100,
      vatAmount,
      exciseAmount,
      totalAmount,
    };
  };

  const addItem = () => {
    const newItem: TaxCalculationItem = {
      id: Date.now().toString(),
      name: '',
      category: 'standard_goods',
      quantity: 1,
      unitPrice: 0,
      isTaxInclusive: false,
      subtotal: 0,
      vatRate: 10,
      vatAmount: 0,
      exciseAmount: 0,
      totalAmount: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<TaxCalculationItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate taxes
        const taxCalc = calculateItemTax({
          unitPrice: updatedItem.unitPrice,
          quantity: updatedItem.quantity,
          category: updatedItem.category,
          isTaxInclusive: updatedItem.isTaxInclusive,
        });

        return {
          ...updatedItem,
          ...taxCalc,
        };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateDiscount = (subtotal: number, discountValue: number, discountType: string): number => {
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    } else {
      return Math.min(discountValue, subtotal);
    }
  };

  const applyCashRounding = (amount: number): number => {
    // Round to nearest 500 VND for cash transactions
    return Math.round(amount / 500) * 500;
  };

  useEffect(() => {
    // Recalculate totals when items change
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalExcise = items.reduce((sum, item) => sum + item.exciseAmount, 0);
    const totalTax = totalVat + totalExcise;
    const totalAmount = subtotal + totalTax;

    const discountAmount = calculateDiscount(subtotal, discountValue, discountType);
    const finalAmount = totalAmount - discountAmount;

    const newCalculation: TaxCalculation = {
      items,
      subtotal,
      totalVat,
      totalExcise,
      totalTax,
      totalAmount,
      discountAmount,
      finalAmount,
    };

    setCalculation(newCalculation);
    onCalculationChange?.(newCalculation);
  }, [items, discountValue, discountType, isExport, customerType]);

  const columns = [
    {
      title: 'Tên hàng hóa',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TaxCalculationItem) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.id, { name: e.target.value })}
          placeholder="Nhập tên hàng hóa"
        />
      ),
    },
    {
      title: 'Loại hàng',
      dataIndex: 'category',
      key: 'category',
      render: (category: string, record: TaxCalculationItem) => (
        <Select
          value={category}
          onChange={(value) => updateItem(record.id, { category: value })}
          style={{ width: 200 }}
        >
          {TAX_CATEGORIES.map(cat => (
            <Option key={cat.value} value={cat.value}>
              {cat.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: TaxCalculationItem) => (
        <InputNumber
          value={quantity}
          onChange={(value) => updateItem(record.id, { quantity: value || 1 })}
          min={1}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number, record: TaxCalculationItem) => (
        <InputNumber
          value={price}
          onChange={(value) => updateItem(record.id, { unitPrice: value || 0 })}
          min={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={(value) => value!.replace(/\./g, '')}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: 'Giá gồm thuế',
      dataIndex: 'isTaxInclusive',
      key: 'isTaxInclusive',
      render: (isTaxInclusive: boolean, record: TaxCalculationItem) => (
        <Switch
          checked={isTaxInclusive}
          onChange={(checked) => updateItem(record.id, { isTaxInclusive: checked })}
        />
      ),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'VAT',
      dataIndex: 'vatRate',
      key: 'vatRate',
      render: (rate: number, record: TaxCalculationItem) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">{rate}%</Tag>
          <Text type="secondary">{formatVND(record.vatAmount)}</Text>
        </Space>
      ),
    },
    {
      title: 'Thuế TTĐB',
      dataIndex: 'exciseAmount',
      key: 'exciseAmount',
      render: (amount: number) => amount > 0 ? formatVND(amount) : '-',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text strong>{formatVND(amount)}</Text>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: TaxCalculationItem) => (
        <Button
          type="link"
          danger
          onClick={() => removeItem(record.id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div className="vn-tax-calculator">
      <Card>
        <Title level={3}>
          <CalculatorOutlined /> Máy tính thuế Việt Nam
        </Title>

        {/* Configuration */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Form.Item label="Loại khách hàng">
              <Select
                value={customerType}
                onChange={setCustomerType}
                style={{ width: '100%' }}
              >
                <Option value="individual">Cá nhân</Option>
                <Option value="business">Doanh nghiệp</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Hàng xuất khẩu">
              <Switch
                checked={isExport}
                onChange={setIsExport}
                checkedChildren="Có"
                unCheckedChildren="Không"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Items Table */}
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={addItem} style={{ marginBottom: 16 }}>
            Thêm hàng hóa
          </Button>
          
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </div>

        {/* Discount Configuration */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5}>Giảm giá</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Loại giảm giá">
                <Select
                  value={discountType}
                  onChange={setDiscountType}
                  style={{ width: '100%' }}
                >
                  {DISCOUNT_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giá trị giảm">
                <InputNumber
                  value={discountValue}
                  onChange={(value) => setDiscountValue(value || 0)}
                  min={0}
                  max={discountType === 'percentage' ? 100 : undefined}
                  formatter={(value) => discountType === 'percentage' 
                    ? `${value}%` 
                    : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                  }
                  parser={(value) => discountType === 'percentage'
                    ? value!.replace('%', '')
                    : value!.replace(/\./g, '')
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Calculation Summary */}
        <Card>
          <Title level={4}>
            <FileTextOutlined /> Tổng kết thuế
          </Title>
          
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Tổng tiền hàng"
                value={calculation.subtotal}
                formatter={(value) => formatVND(Number(value))}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Thuế VAT"
                value={calculation.totalVat}
                formatter={(value) => formatVND(Number(value))}
                prefix={<PercentageOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Thuế TTĐB"
                value={calculation.totalExcise}
                formatter={(value) => formatVND(Number(value))}
                prefix={<PercentageOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Tổng thuế"
                value={calculation.totalTax}
                formatter={(value) => formatVND(Number(value))}
                prefix={<PercentageOutlined />}
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Tổng cộng"
                value={calculation.totalAmount}
                formatter={(value) => formatVND(Number(value))}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Giảm giá"
                value={calculation.discountAmount}
                formatter={(value) => formatVND(Number(value))}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Thanh toán"
                value={calculation.finalAmount}
                formatter={(value) => formatVND(Number(value))}
                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Làm tròn tiền mặt"
                value={applyCashRounding(calculation.finalAmount)}
                formatter={(value) => formatVND(Number(value))}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>

          {/* Compliance Notes */}
          <div style={{ marginTop: 16 }}>
            <Alert
              message="Lưu ý tuân thủ"
              description={
                <ul>
                  <li>Hóa đơn sẽ được lưu trữ trong 5 năm theo quy định</li>
                  <li>Khách hàng doanh nghiệp cần cung cấp mã số thuế</li>
                  <li>Giao dịch trên 20 triệu VND bắt buộc có hóa đơn VAT</li>
                  <li>Thanh toán tiền mặt sẽ được làm tròn 500 VND</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default VNTaxCalculator;