// Fallback script if main bundle fails to load
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('root');
  
  // Check if the application is loaded after 2 seconds
  setTimeout(function() {
    if (!window.appLoaded && rootElement && rootElement.children.length === 0) {
      // Application didn't load, show fallback UI
      rootElement.innerHTML = `
        <div style="padding: 40px; font-family: Arial, sans-serif; text-align: center; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1890ff;">KhoAugment POS</h1>
          <p>Ứng dụng đang tải...</p>
          <div style="margin: 30px 0;">
            <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Tải lại trang
            </button>
          </div>
          <p style="color: #888; font-size: 14px;">
            Nếu vấn đề vẫn tiếp tục, vui lòng xóa bộ nhớ cache và thử lại.
          </p>
        </div>
      `;
    }
  }, 2000);
});

// Set flag when main app loads
window.appLoaded = false; 