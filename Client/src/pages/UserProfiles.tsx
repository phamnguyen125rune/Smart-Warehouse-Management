// src/pages/UserProfiles.tsx
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { authService } from "../services/authService";

import { UserProfile, UpdateProfilePayload } from "../types/auth.types";

interface DecodedToken {
  sub: number;
  role: string;
  login_type: "primary" | "secondary";
}

export default function UserProfiles() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const data = await authService.getMyProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        if (decodedToken.login_type === "primary") {
          setCanEdit(true);
        }
      } catch (e) {
        console.error("Invalid token:", e);
        setError("Phiên đăng nhập không hợp lệ.");
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (updatedData: UpdateProfilePayload) => {
    setError(null);
    try {
      await authService.updateProfile(updatedData);
      await fetchProfile();
      alert("Cập nhật thành công!");
      return true;
    } catch (err: any) {
      setError(err.message || "Cập nhật thất bại.");
      return false;
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (isLoading) return <div>Đang tải thông tin...</div>;
  if (error) return <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>;
  if (!profile) return <div>Không tìm thấy dữ liệu người dùng.</div>;

  return (
    <>
      <PageMeta title="Hồ sơ cá nhân" description="" />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <div className="space-y-6">
          <UserMetaCard
            profile={profile}
            onUpdate={handleUpdateProfile}
            canEdit={canEdit}
          />
          <UserInfoCard
            profile={profile}
            onUpdate={handleUpdateProfile}
            canEdit={canEdit}
          />
          <UserAddressCard
            profile={profile}
            onUpdate={handleUpdateProfile}
            canEdit={canEdit}
          />
        </div>
        <Button onClick={handleLogout} variant="outline" className="mt-3 flex-shrink-0">
          Logout
        </Button>
      </div>
    </>
  );
}