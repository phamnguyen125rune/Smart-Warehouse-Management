import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';

import { adminService } from '../../services/adminService';
import { AdminUser, Role, CreateUserPayload } from '../../types/admin.types';

import UserListTable from '../../components/tables/UserListTable/UserListTable'; 
import UserInputForm from '../../components/form/form-elements/UserInputForm';

// Định nghĩa Interface cho Form Data (Local UI state)
// Form component trả về role_id, nhưng API cần role_name
export interface UserFormData {
    employee_id: string;
    full_name: string;
    password?: string;
    role_id: number | '';
}

export default function ManageUsersPage() {
    // --- States ---
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching ---
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [usersData, rolesData] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getRoles()
            ]);
            
            // usersData thực chất là AdminUser[] (tương thích UserProfile[])
            setUsers(usersData as unknown as AdminUser[]);
            setRoles(rolesData as unknown as Role[]);

        } catch (err: any) {
            setError(err.message || 'Không thể tải dữ liệu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Event Handlers ---
    const handleSelectUser = (userId: number) => {
        setSelectedUserId(userId);
        setError(null); // Clear lỗi cũ khi chọn user mới
    };

    const handleClearSelection = () => {
        setSelectedUserId(null);
        setError(null);
    }

    // Xử lý Thêm User
    const handleAddUser = async (formData: UserFormData) => {
        try {
            // 1. Tìm tên Role từ ID (Vì Backend cần string 'manager'/'employee')
            const selectedRole = roles.find(r => r.id === Number(formData.role_id));
            if (!selectedRole) {
                setError("Vui lòng chọn quyền hạn hợp lệ.");
                return;
            }

            // 2. Chuẩn bị payload
            const payload: CreateUserPayload = {
                employee_id: formData.employee_id,
                full_name: formData.full_name,
                password: formData.password,
                role: selectedRole.name // Gửi name string
            };

            // 3. Gọi API
            const result = await adminService.registerUser(payload);
            
            // 4. Feedback & Reload
            alert(result.message || "Tạo tài khoản thành công");
            await fetchData(); 
        } catch (err: any) {
            setError(err.message || 'Tạo tài khoản thất bại.');
        }
    };

    // Xử lý Sửa User
    const handleEditUser = async (updatedFormData: Partial<UserFormData>) => {
        if (!selectedUserId) return;
        try {
            // Backend hiện tại chỉ cho sửa full_name (và password qua API khác)
            const payload = {
                full_name: updatedFormData.full_name,
                // password: ... (Thường password update qua API reset riêng)
            };

            const result = await adminService.updateUser(selectedUserId, payload);
            alert(result.message || "Cập nhật thành công");
            
            setSelectedUserId(null);
            await fetchData();
        } catch (err: any) {
            setError(err.message || 'Cập nhật thất bại.');
        }
    };

    // Xử lý Xóa User
    const handleDeleteUser = async (userId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn vô hiệu hóa tài khoản này?')) {
            try {
                const result = await adminService.deleteUser(userId);
                alert(result.message || "Đã vô hiệu hóa tài khoản");
                
                if (selectedUserId === userId) {
                    setSelectedUserId(null);
                }
                await fetchData();
            } catch (err: any) {
                setError(err.message || 'Xóa thất bại.');
            }
        }
    };

    // Tìm user đang được chọn để truyền xuống form edit
    const userToEdit = selectedUserId ? users.find(u => u.id === selectedUserId) : null;
    
    // Convert AdminUser sang định dạng mà UserInputForm mong đợi (có role_id)
    // Vì user từ API chỉ có role="manager", ta cần tìm ID của role đó
    const userToEditWithRoleId = userToEdit ? {
        ...userToEdit,
        role_id: roles.find(r => r.name === userToEdit.role)?.id || ''
    } : null;

    return (
        <>
            <PageMeta title="Quản lý Nhân viên" description='Admin Panel' />
            <PageBreadcrumb pageTitle="Quản lý Nhân viên" />

            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                    <span className="font-medium">Lỗi!</span> {error}
                </div>
            )}
            
            <div className="flex flex-col gap-6 md:flex-row">
                {/* Bảng danh sách */}
                <div className="w-full md:w-2/3">
                    <ComponentCard title="Danh sách nhân viên">
                        {isLoading ? <p className="p-4 text-center text-gray-500">Đang tải dữ liệu...</p> : (
                            <UserListTable
                                users={users}
                                onSelectUser={handleSelectUser}
                                selectedUserId={selectedUserId} 
                            />
                        )}
                    </ComponentCard>
                </div>

                {/* Form thao tác */}
                <div className="w-full md:w-1/3">
                    <ComponentCard title={userToEdit ? 'Chỉnh sửa thông tin' : 'Tạo tài khoản mới'}>
                        <UserInputForm
                            roles={roles}
                            userToEdit={userToEditWithRoleId} // Truyền user đã map role_id
                            onAddUser={handleAddUser}
                            onEditUser={handleEditUser}
                            onDeleteUser={handleDeleteUser}
                            onClearSelection={handleClearSelection}
                        />
                    </ComponentCard>
                </div>
            </div>
        </>
    );
}