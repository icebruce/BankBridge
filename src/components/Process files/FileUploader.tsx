import React from "react";

interface FileUploaderProps {
  onFiles: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFiles }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles([...e.dataTransfer.files]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFiles([...e.target.files]);
    }
  };

  return (
    <div
      className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="text-2xl font-semibold">Upload Your Bank Files</h2>
      <p className="mt-2 text-sm text-gray-600">
        Drag & drop CSV/JSON here, or click to browse.
      </p>
      <input
        type="file"
        multiple
        className="mt-4 block w-full text-sm text-gray-700"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default FileUploader; 