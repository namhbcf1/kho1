// Product create/edit form
import React from 'react';
import { Form, Input, InputNumber, Select, Switch, Button } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

export const ProductForm: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Product data:', values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        active: true,
        featured: false,
      }}
    >
      <Form.Item
        name="name"
        label="Tên sản phẩm"
        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
      >
        <Input placeholder="Nhập tên sản phẩm" />
      </Form.Item>

      <Form.Item name="description" label="Mô tả">
        <TextArea rows={4} placeholder="Mô tả sản phẩm" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Giá bán (VND)"
        rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          placeholder="0"
        />
      </Form.Item>

      <Form.Item name="cost" label="Giá vốn (VND)">
        <InputNumber
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          placeholder="0"
        />
      </Form.Item>

      <Form.Item name="categoryId" label="Danh mục">
        <Select placeholder="Chọn danh mục">
          <Option value="cat-001">Đồ uống</Option>
          <Option value="cat-002">Thức ăn</Option>
        </Select>
      </Form.Item>

      <Form.Item name="barcode" label="Mã vạch">
        <Input placeholder="Nhập mã vạch" />
      </Form.Item>

      <Form.Item name="stock" label="Số lượng tồn kho">
        <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
      </Form.Item>

      <Form.Item name="minStock" label="Tồn kho tối thiểu">
        <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
      </Form.Item>

      <Form.Item name="active" label="Trạng thái" valuePropName="checked">
        <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
      </Form.Item>

      <Form.Item name="featured" label="Sản phẩm nổi bật" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Lưu sản phẩm
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
