// Vietnamese export functionality component
import React from 'react';
import { Card, Button, Select, DatePicker, Form, Space } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';

export const ExportReports: React.FC = () => {
  const [form] = Form.useForm();

  const handleExport = (format: string) => {
    const values = form.getFieldsValue();
    console.log('Exporting:', { format, ...values });
  };

  return (
    <Card title="Xuất báo cáo">
      <Form form={form} layout="vertical">
        <Form.Item name="reportType" label="Loại báo cáo">
          <Select placeholder="Chọn loại báo cáo">
            <Select.Option value="revenue">Doanh thu</Select.Option>
            <Select.Option value="products">Sản phẩm</Select.Option>
            <Select.Option value="customers">Khách hàng</Select.Option>
            <Select.Option value="inventory">Tồn kho</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="dateRange" label="Khoảng thời gian">
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="groupBy" label="Nhóm theo">
          <Select placeholder="Chọn cách nhóm">
            <Select.Option value="day">Ngày</Select.Option>
            <Select.Option value="week">Tuần</Select.Option>
            <Select.Option value="month">Tháng</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              icon={<FileExcelOutlined />}
              onClick={() => handleExport('excel')}
            >
              Xuất Excel
            </Button>
            <Button 
              icon={<FilePdfOutlined />}
              onClick={() => handleExport('pdf')}
            >
              Xuất PDF
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('csv')}
            >
              Xuất CSV
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ExportReports;
