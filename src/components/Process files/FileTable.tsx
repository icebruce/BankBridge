import React from "react";

interface FileRow {
  name: string;
  status: string;
}

interface FileTableProps {
  rows: FileRow[];
}

const FileTable: React.FC<FileTableProps> = ({ rows }) => {
  return (
    <table className="w-full mt-6 table-auto bg-white rounded shadow">
      <thead>
        <tr>
          <th className="px-4 py-2 border-b">Filename</th>
          <th className="px-4 py-2 border-b">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="hover:bg-gray-100">
            <td className="px-4 py-2 border-b">{row.name}</td>
            <td className="px-4 py-2 border-b">{row.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FileTable; 