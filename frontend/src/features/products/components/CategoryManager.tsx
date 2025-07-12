// Product categories management
import React from 'react';
import { Tree, Button, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export const CategoryManager: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [form] = Form.useForm();

  const treeData = [
    {
      title: 'Đồ uống',
      key: 'cat-001',
      children: [
        { title: 'Cà phê', key: 'cat-001-001' },
        { title: 'Trà', key: 'cat-001-002' },
      ],
    },
    {
      title: 'Thức ăn',
      key: 'cat-002',
      children: [
        { title: 'Bánh mì', key: 'cat-002-001' },
        { title: 'Cơm', key: 'cat-002-002' },
      ],
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowModal(true)}
        >
          Thêm danh mục
        </Button>
      </div>

      <Tree
        treeData={treeData}
        defaultExpandAll
        titleRender={(nodeData) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{nodeData.title}</span>
            <div>
              <Button type="text" size="small" icon={<EditOutlined />} />
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </div>
          </div>
        )}
      />

      <Modal
        title="Thêm danh mục"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả danh mục" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManager;
