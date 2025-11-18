import ComponentCard from "../../common/ComponentCard";
import FileInput from "../input/FileInput";
import Label from "../Label";

interface FileInputExampleProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean; 
}

export default function FileInputExample({ onFileUpload, disabled }: FileInputExampleProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <ComponentCard title="Upload hóa đơn">
      <div>
        <Label>Chọn file ảnh hóa đơn</Label>
        <FileInput
          onChange={handleFileChange}
          className="custom-class"
        />
        {disabled && <p className="text-sm text-gray-500 mt-2">Đang xử lý, vui lòng đợi...</p>}
      </div>
    </ComponentCard>
  );
}

// import ComponentCard from "../../common/ComponentCard";
// import FileInput from "../input/FileInput";
// import Label from "../Label";

// export default function FileInputExample() {
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       console.log("Selected file:", file.name);
//     }
//   };

//   return (
//     <ComponentCard title="File Input">
//       <div>
//         <Label>Upload file</Label>
//         <FileInput onChange={handleFileChange} className="custom-class" />
//       </div>
//     </ComponentCard>
//   );
// }
