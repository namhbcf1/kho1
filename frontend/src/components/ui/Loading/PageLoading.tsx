import React from 'react';
import { Spin } from 'antd';
import type { PageLoadingProps } from './Loading.types';

export const PageLoading: React.FC<PageLoadingProps> = ({
  tip = 'Đang tải...',
  size = 'large',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        ...style,
      }}
    >
      <Spin size={size} tip={tip} />
    </div>
  );
};

export default PageLoading;
