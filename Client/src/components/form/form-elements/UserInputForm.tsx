import { useState, useEffect } from 'react';
import { UserData, NewUserData } from '../../../pages/Management/ManageUsersPage';
import Label from '../Label';
import Input from '../input/InputField';
import Button from '../../ui/button/Button';

interface UserInputFormProps {
    roles: { id: number; name: string }[];
    userToEdit: UserData | null | undefined; 
    onAddUser: (data: NewUserData) => void;
    onEditUser: (data: Partial<NewUserData>) => void;
    onDeleteUser: (userId: number) => void;
    onClearSelection: () => void;
}
const initialFormState: NewUserData = {
    employee_id: '',
    full_name: '',
    password: '',
    role_id: '',
};
export default function UserInputForm({ roles, userToEdit, onAddUser, onEditUser, onDeleteUser, onClearSelection }: UserInputFormProps) {
    const [formData, setFormData] = useState<NewUserData>(initialFormState);
    useEffect(() => {
        if (userToEdit) {
            setFormData({
                employee_id: userToEdit.employee_id,
                full_name: userToEdit.full_name,
                password: '', // Không hiển thị password cũ
                role_id: roles.find(r => r.name === userToEdit.role)?.id || '',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [userToEdit, roles]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userToEdit) {
            // Khi edit, không gửi employee_id và role_id
            const { employee_id, role_id, ...updateData } = formData;
            onEditUser(updateData);
        } else {
            onAddUser(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Mã nhân viên</Label>
                <Input name="employee_id" value={formData.employee_id} onChange={handleInputChange} required disabled={!!userToEdit} />
            </div>
            <div>
                <Label>Họ và Tên</Label>
                <Input name="full_name" value={formData.full_name} onChange={handleInputChange} required />
            </div>
            <div>
                <Label>{userToEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}</Label>
                <Input name="password" type="password" value={formData.password} onChange={handleInputChange} required={!userToEdit} />
            </div>
            {!userToEdit && (
            <div>
                <Label>Quyền</Label>
                <select name="role_id" value={formData.role_id} onChange={handleInputChange} required disabled={!!userToEdit} className="w-full p-2 border rounded">
                    <option value="">-- Chọn quyền --</option>
                    {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </select>
            </div>
            )}
            <div className="flex flex-col space-y-2">
                <Button type="submit">{userToEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}</Button>
                {userToEdit && (
                    <>
                        <Button type="button" variant="outline" onClick={onClearSelection}>Hủy bỏ</Button>
                        <Button type="button" variant="primary" onClick={() => onDeleteUser(userToEdit.id)}>Vô hiệu hóa tài khoản</Button>
                    </>
                )}
            </div>
        </form>
    );
}