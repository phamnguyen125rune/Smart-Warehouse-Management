import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Định nghĩa props cho component
interface ProtectedRouteProps {
  allowedRoles?: string[]; // Mảng các role được phép, ví dụ: ['manager']
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation(); // Hook để lấy vị trí hiện tại

    // 1. Trong khi context đang kiểm tra token, hiển thị màn hình loading
    if (isLoading) {
        return <div>Loading application...</div>; // Hoặc một component Spinner đẹp hơn
    }

    // 2. Nếu đã kiểm tra xong và không có user, chuyển về trang đăng nhập
    //    Lưu lại trang người dùng đang cố truy cập để có thể quay lại sau khi đăng nhập
    if (!isAuthenticated || !user) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // 3. Nếu route này yêu cầu một role cụ thể (allowedRoles được cung cấp)
    //    VÀ role của người dùng không nằm trong danh sách được phép
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Người dùng đã đăng nhập nhưng không có quyền
        // Chuyển hướng họ đến một trang "Không có quyền" (Forbidden)
        // hoặc trang dashboard chính, tùy theo trải nghiệm bạn muốn.
        // Ở đây, chúng ta sẽ chuyển hướng về trang profile mặc định.
        return <Navigate to="/profile" replace />;
    }

    // 4. Nếu tất cả kiểm tra đều qua, hiển thị nội dung của trang
    return <Outlet />;
};

export default ProtectedRoute;