// D1 backup configuration component
import React from 'react';
import { Form, Select, Switch, Button, Card, TimePicker, Table, Tag } from 'antd';
import { DownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';

export const BackupSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Backup settings:', values);
  };

  const backupColumns = [
    {
      title: 'Tên file',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'auto' ? 'blue' : 'green'}>
          {type === 'auto' ? 'Tự động' : 'Thủ công'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Button type="primary" icon={<DownloadOutlined />} size="small">
          Tải về
        </Button>
      ),
    },
  ];

  const backupData = [
    {
      key: '1',
      filename: 'backup_2024_01_15.sql',
      createdAt: '15/01/2024 02:00',
      size: '2.5 MB',
      type: 'auto',
    },
    {
      key: '2',
      filename: 'manual_backup_2024_01_14.sql',
      createdAt: '14/01/2024 10:30',
      size: '2.3 MB',
      type: 'manual',
    },
  ];

  return (
    <div>
      <Card title="Cài đặt sao lưu" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            autoBackup: true,
            frequency: 'daily',
            time: '02:00',
            retention: 30,
            cloudBackup: false,
          }}
        >
          <Form.Item
            name="autoBackup"
            label="Sao lưu tự động"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item name="frequency" label="Tần suất sao lưu">
            <Select placeholder="Chọn tần suất">
              <Select.Option value="daily">Hàng ngày</Select.Option>
              <Select.Option value="weekly">Hàng tuần</Select.Option>
              <Select.Option value="monthly">Hàng tháng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="time" label="Thời gian sao lưu">
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="retention" label="Lưu trữ (ngày)">
            <Select placeholder="Chọn thời gian lưu trữ">
              <Select.Option value={7}>7 ngày</Select.Option>
              <Select.Option value={30}>30 ngày</Select.Option>
              <Select.Option value={90}>90 ngày</Select.Option>
              <Select.Option value={365}>1 năm</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="cloudBackup"
            label="Sao lưu lên cloud"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item name="cloudProvider" label="Nhà cung cấp cloud">
            <Select placeholder="Chọn nhà cung cấp">
              <Select.Option value="r2">Cloudflare R2</Select.Option>
              <Select.Option value="s3">Amazon S3</Select.Option>
              <Select.Option value="gcs">Google Cloud Storage</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              Lưu cài đặt
            </Button>
            <Button icon={<CloudUploadOutlined />}>
              Sao lưu ngay
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Lịch sử sao lưu">
        <Table
          columns={backupColumns}
          dataSource={backupData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} file sao lưu`,
          }}
        />
      </Card>
    </div>
  );
};

export default BackupSettings;
