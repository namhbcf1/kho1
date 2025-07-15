class UploadService {
    async uploadImage(storage, file) {
        try {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                return {
                    success: false,
                    message: 'Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP)',
                };
            }
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                return {
                    success: false,
                    message: 'File ảnh không được vượt quá 5MB',
                };
            }
            // Generate unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const filename = `images/${timestamp}-${crypto.randomUUID()}.${extension}`;
            // Upload to R2
            await storage.put(filename, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });
            const imageUrl = `https://storage.khoaugment.com/${filename}`;
            return {
                success: true,
                message: 'Tải ảnh thành công',
                data: {
                    filename,
                    url: imageUrl,
                    size: file.size,
                    type: file.type,
                },
            };
        }
        catch (error) {
            console.error('Upload image error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải ảnh',
            };
        }
    }
    async uploadAvatar(storage, file, userId) {
        try {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                return {
                    success: false,
                    message: 'Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP)',
                };
            }
            // Validate file size (max 2MB for avatars)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                return {
                    success: false,
                    message: 'Avatar không được vượt quá 2MB',
                };
            }
            // Generate filename for avatar
            const extension = file.name.split('.').pop();
            const filename = `avatars/${userId}.${extension}`;
            // Upload to R2
            await storage.put(filename, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });
            const avatarUrl = `https://storage.khoaugment.com/${filename}`;
            return {
                success: true,
                message: 'Cập nhật avatar thành công',
                data: {
                    filename,
                    url: avatarUrl,
                    size: file.size,
                    type: file.type,
                },
            };
        }
        catch (error) {
            console.error('Upload avatar error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải avatar',
            };
        }
    }
    async deleteFile(storage, filename) {
        try {
            await storage.delete(filename);
            return {
                success: true,
                message: 'Xóa file thành công',
            };
        }
        catch (error) {
            console.error('Delete file error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi xóa file',
            };
        }
    }
}
export const uploadService = new UploadService();
