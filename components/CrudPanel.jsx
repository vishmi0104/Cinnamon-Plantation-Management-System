// src/components/CrudPanel.jsx
import React from "react";

export default function CrudPanel({ title, description, columns, data, children }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{description}</p>

      {/* Toolbar (passed from outside) */}
      <div className="flex justify-between items-center mb-4">{children}</div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 border-b">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row._id || i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 border-b">
                    {col.render
                      ? col.render(
                          col.key.includes(".")
                            ? col.key.split(".").reduce((o, k) => (o ? o[k] : ""), row)
                            : row[col.key],
                          row
                        )
                      : col.key.includes(".")
                      ? col.key.split(".").reduce((o, k) => (o ? o[k] : ""), row)
                      : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-2 border-b space-x-2">{row.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
