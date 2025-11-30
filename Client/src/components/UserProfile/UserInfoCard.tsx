import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { UserProfile, UpdateProfilePayload } from "../../types/auth.types";
// [NEW] Import service
import { authService } from "../../services/authService"; 

interface UserInfoCardProps {
  profile: UserProfile;
  onUpdate: (data: UpdateProfilePayload) => Promise<boolean>;
  canEdit: boolean;
}

export default function UserInfoCard({ profile, onUpdate, canEdit }: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const [formData, setFormData] = useState<UpdateProfilePayload>({});
  
  // [NEW] State cho phần đổi mật khẩu
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    setFormData({
      email: profile.email || '',
      google_auth_email: profile.google_auth_email || '',
      phone_number: profile.phone_number || '',
      bio: profile.bio || '',
    });
  }, [profile]);

  // Reset form mật khẩu khi đóng/mở modal
  useEffect(() => {
    if (isOpen) {
      setShowPasswordSection(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // [NEW] Xử lý input mật khẩu
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Xử lý đổi mật khẩu (nếu người dùng mở tab này)
    if (showPasswordSection) {
        if (!passwordData.current_password || !passwordData.new_password) {
            alert("Vui lòng nhập đầy đủ thông tin mật khẩu.");
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert("Mật khẩu mới không khớp.");
            return;
        }
        
        try {
            await authService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            alert("Đổi mật khẩu thành công!");
        } catch (error: any) {
            alert(error.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ.");
            return; // Dừng lại nếu đổi pass lỗi
        }
    }

    // 2. Xử lý cập nhật thông tin chung
    const success = await onUpdate(formData);
    if (success) {
      closeModal();
    }
  };

  return (
    <>
      {/* --- DISPLAY CARD --- */}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Họ và Tên
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.full_name}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email liên lạc
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.email || 'Chưa cập nhật'}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email Google
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.google_auth_email || 'Chưa thiết lập'}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Số điện thoại
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.phone_number || 'Chưa cập nhật'}
                </p>
              </div>
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Bio
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.bio || 'Chưa cập nhật'}
                </p>
              </div>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={openModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto flex-shrink-0"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* --- MODAL EDIT --- */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Chỉnh sửa thông tin
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Cập nhật thông tin cá nhân và bảo mật.
            </p>
          </div>

          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2">
                    <Label>Họ và Tên (Read only)</Label>
                    <Input type="text" value={profile.full_name} disabled className="opacity-70 cursor-not-allowed" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label htmlFor="email">Email liên lạc</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email ?? ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label htmlFor="phone_number">Số điện thoại</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="text"
                      value={formData.phone_number ?? ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="google_auth_email">Email đăng nhập Google</Label>
                    <Input id="google_auth_email" name="google_auth_email" type="email" value={formData.google_auth_email ?? ''} onChange={handleInputChange} />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="bio">Giới thiệu (Bio)</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio ?? ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  {/* --- PHẦN ĐỔI MẬT KHẨU (TOGGLE) --- */}
                  <div className="col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-medium text-gray-800 dark:text-white/90">
                            Đổi mật khẩu
                        </h5>
                        <button 
                            type="button"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                        >
                            {showPasswordSection ? "Hủy bỏ" : "Thay đổi"}
                        </button>
                    </div>

                    {showPasswordSection && (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 bg-gray-50 dark:bg-white/5 p-4 rounded-xl mt-4">
                            <div className="col-span-2">
                                <Label htmlFor="current_password">Mật khẩu hiện tại <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="current_password" 
                                    name="current_password" 
                                    type="password" 
                                    value={passwordData.current_password} 
                                    onChange={handlePasswordChange} 
                                    placeholder="Nhập mật khẩu cũ"
                                />
                            </div>
                            <div className="col-span-2 lg:col-span-1">
                                <Label htmlFor="new_password">Mật khẩu mới <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="new_password" 
                                    name="new_password" 
                                    type="password" 
                                    value={passwordData.new_password} 
                                    onChange={handlePasswordChange} 
                                    placeholder="Nhập mật khẩu mới"
                                />
                            </div>
                            <div className="col-span-2 lg:col-span-1">
                                <Label htmlFor="confirm_password">Xác nhận mật khẩu <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="confirm_password" 
                                    name="confirm_password" 
                                    type="password" 
                                    value={passwordData.confirm_password} 
                                    onChange={handlePasswordChange} 
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                        </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} type="button">
                Close
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
