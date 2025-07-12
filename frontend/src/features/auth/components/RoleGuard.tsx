import React from 'react';
import { Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth';
import type { RoleGuardProps } from '../types/auth.types';

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Bạn cần đăng nhập để truy cập trang này."
        extra={
          <Button type="primary" href="/login">
            Đăng nhập
          </Button>
        }
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập trang này."
        extra={
          <Button type="primary" href="/dashboard">
            Về trang chủ
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
