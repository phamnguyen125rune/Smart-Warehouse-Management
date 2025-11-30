import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table"; 
import { AdminUser } from "../../../types/admin.types";

interface UserListTableProps {
  users: AdminUser[];
  onSelectUser: (userId: number) => void;
  selectedUserId: number | null; // Thêm prop này để biết dòng nào đang được chọn
}

export default function UserListTable({ users, onSelectUser, selectedUserId }: UserListTableProps) {
  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <Table>
        {/* --- SỬA PHẦN HEADER --- */}
        <TableHeader className="bg-gray-50 dark:bg-gray-800">
          <TableRow className="border-b border-gray-200 dark:border-gray-700">
            <TableCell 
              isHeader 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
            >
              Mã NV
            </TableCell>
            <TableCell 
              isHeader 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
            >
              Họ và Tên
            </TableCell>
            <TableCell 
              isHeader 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
            >
              Email
            </TableCell>
            <TableCell 
              isHeader 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
            >
              Quyền
            </TableCell>
          </TableRow>
        </TableHeader>

        {/* --- SỬA PHẦN BODY --- */}
        <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map(user => (
            <TableRow 
              key={user.id} 
              onClick={() => onSelectUser(user.id)}
              // Thêm lớp để highlight dòng được chọn
              className={`cursor-pointer transition-colors duration-150 ease-in-out 
                          ${selectedUserId === user.id 
                            ? 'bg-blue-100 dark:bg-blue-900/50' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
              }
            >
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {user.employee_id}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {user.full_name}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {user.email || 'N/A'}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                {/* Thêm màu sắc cho role để dễ phân biệt */}
                <span 
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${user.role === 'manager' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`
                  }
                >
                  {user.role}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
