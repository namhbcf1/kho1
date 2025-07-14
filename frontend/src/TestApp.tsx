import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Button, Card, Typography } from 'antd';

const { Title, Text } = Typography;

const TestLoginPage = () => {
  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>Đăng nhập</Title>
        <Text>Test login page for debugging</Text>
        <br />
        <Button type="primary" style={{ marginTop: '20px' }}>
          Test Button
        </Button>
      </Card>
    </div>
  );
};

const TestApp = () => {
  return (
    <div>
      <Routes>
        <Route path="*" element={<TestLoginPage />} />
      </Routes>
    </div>
  );
};

export default TestApp;