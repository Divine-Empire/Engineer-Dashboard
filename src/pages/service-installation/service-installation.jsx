import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import ModalWrapper from '../../components/ModalWrapper';
import formatDate from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const sheet_url = import.meta.env.VITE_SERVICE_SHEET_API;
const Sheet_Id = import.meta.env.VITE_GOOGLE_SHEET_ID || "1teE4IIdCw7qnQvm_W7xAPgmGgpU13dtYw6y5ui01HHc";

const formatDateTime = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function ServiceInstallation() {
  const [activeTab, setActiveTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();

  const loadItems = async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(`${sheet_url}?sheet=Service-Installation`);
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        // Headers are in row-6, data starts at row-7 (index 6)
        const allItems = json.data.slice(6)
          .map((row, index) => ({
            id: index + 1, // Row index in sheets is id + 6 (e.g. index 0 -> row 7 -> id 1 + 6 = 7)
            companyName: String(row[3] || "").trim(),
            contactPerson: String(row[4] || "").trim(),
            contactNo: String(row[5] || "").trim(),
            itemName: String(row[6] || "").trim(),
            qty: String(row[7] || "").trim(),
            serial: String(row[8] || "").trim(),
            siNo: String(row[9] || "").trim(),
            invoiceNo: String(row[11] || "").trim(),
            assignedEngineer: String(row[19] || "").trim(), // col-T (index 19)
            planned: String(row[23] || "").trim(),
            actual: String(row[24] || "").trim(),
            remarks: String(row[26] || "").trim(),
          }))
          .filter(item => item.siNo !== "");

        // Apply RBAC: if engineer, only see their assigned records
        const filteredByRole = user?.role === 'ENGINEER'
          ? allItems.filter(item =>
              item.assignedEngineer.toLowerCase() === user.name.toLowerCase() ||
              item.assignedEngineer.toLowerCase() === user.id.toLowerCase()
            )
          : allItems;

        setItems(filteredByRole);
      }
    } catch (error) {
      console.error("Error loading Service-Installation data:", error);
      toast.error("Failed to load live data");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const handleRefresh = () => loadItems();
    window.addEventListener('refresh_sales', handleRefresh);
    return () => window.removeEventListener('refresh_sales', handleRefresh);
  }, []);

  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const pendingItems = useMemo(() => {
    return items.filter(item => item.planned !== "" && item.actual === "");
  }, [items]);

  const historyItems = useMemo(() => {
    return items.filter(item => item.planned !== "" && item.actual !== "");
  }, [items]);

  const filteredItems = useMemo(() => {
    const activeList = activeTab === 'pending' ? pendingItems : historyItems;
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return activeList;

    return activeList.filter(item => 
      item.siNo.toLowerCase().includes(searchLower) ||
      item.companyName.toLowerCase().includes(searchLower) ||
      item.contactPerson.toLowerCase().includes(searchLower) ||
      item.remarks.toLowerCase().includes(searchLower) ||
      item.invoiceNo.toLowerCase().includes(searchLower) ||
      item.itemName.toLowerCase().includes(searchLower)
    );
  }, [activeTab, pendingItems, historyItems, searchTerm]);

  const allSelected = useMemo(() => {
    return filteredItems.length > 0 && filteredItems.every(item => selectedIds.has(item.id));
  }, [filteredItems, selectedIds]);

  const someSelected = useMemo(() => {
    return filteredItems.some(item => selectedIds.has(item.id)) && !allSelected;
  }, [filteredItems, selectedIds, allSelected]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelects = new Set(selectedIds);
      filteredItems.forEach(item => newSelects.add(item.id));
      setSelectedIds(newSelects);
    } else {
      const newSelects = new Set(selectedIds);
      filteredItems.forEach(item => newSelects.delete(item.id));
      setSelectedIds(newSelects);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-hidden pr-1">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        {/* Tab Selector */}
        <div className="flex border border-slate-250 bg-slate-50/50 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Pending ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            History ({historyItems.length})
          </button>
        </div>

        {/* Search, Action and Refresh */}
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && activeTab === 'pending' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Completed ({selectedIds.size})
            </button>
          )}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SI NO, Company, Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={loadItems}
            disabled={fetchLoading}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${fetchLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-4">
        <TableWrapper
          headers={
            activeTab === 'pending'
              ? [
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />,
                  'SI NO',
                  'Planned Date',
                  'Company Name',
                  'Contact Person',
                  'Contact No.',
                  'Invoice No',
                  'Item Name',
                  'Qty',
                  'Serial',
                  'Remarks'
                ]
              : [
                  'SI NO',
                  'Planned Date',
                  'Actual Date',
                  'Company Name',
                  'Contact Person',
                  'Contact No.',
                  'Invoice No',
                  'Item Name',
                  'Qty',
                  'Serial',
                  'Remarks'
                ]
          }
          data={filteredItems}
          emptyMessage={
            fetchLoading ? (
              <div className="flex items-center justify-center flex-col py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="mt-2 text-xs text-slate-500 font-medium">Loading records...</p>
              </div>
            ) : "No entries found."
          }
          renderRow={(item) => {
            const isSelected = selectedIds.has(item.id);
            if (activeTab === 'pending') {
              return (
                <tr key={item.id} className={`hover:bg-indigo-50/30 transition-colors ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(item.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {item.siNo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    {formatDate(item.planned)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                    {item.companyName}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.contactPerson}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                    {item.contactNo}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                    {item.invoiceNo || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.itemName || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.qty || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.serial || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[180px] truncate" title={item.remarks}>
                    {item.remarks || "-"}
                  </td>
                </tr>
              );
            } else {
              return (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {item.siNo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    {formatDate(item.planned)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    {formatDate(item.actual)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                    {item.companyName}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.contactPerson}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                    {item.contactNo}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                    {item.invoiceNo || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.itemName || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.qty || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {item.serial || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[180px] truncate" title={item.remarks}>
                    {item.remarks || "-"}
                  </td>
                </tr>
              );
            }
          }}
        />
      </div>

      {/* Completed Remarks Dialog Modal */}
      {isModalOpen && (
        <CompletedModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedCount={selectedIds.size}
          selectedItems={pendingItems.filter(item => selectedIds.has(item.id))}
          onSave={async () => {
            setSelectedIds(new Set());
            await loadItems();
          }}
        />
      )}
    </div>
  );
}

function CompletedModal({ isOpen, onClose, selectedCount, selectedItems, onSave }) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inputCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const updatePromises = selectedItems.map(item => {
      const columnData = {
        Y: formatDateTime(new Date()), // Actual-2 (Col Y)
        AA: remarks || "",            // Remarks (Col AA)
      };

      const params = {
        sheetName: "Service-Installation",
        action: "update",
        rowIndex: (item.id + 6).toString(),
        columnData: JSON.stringify(columnData),
      };
      if (Sheet_Id) {
        params.sheetId = Sheet_Id;
      }

      return fetch(sheet_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params).toString(),
      }).then(res => res.json());
    });

    try {
      const results = await Promise.all(updatePromises);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        const errors = failed.map(f => f.error || "Unknown error");
        const uniqueErrors = [...new Set(errors)].join(", ");
        toast.error(`Failed to update ${failed.length} records: ${uniqueErrors}`);
      } else {
        toast.success("Successfully completed installations!");
        await onSave();
        window.dispatchEvent(new Event('refresh_sales'));
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit status details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Complete Service Installation" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-2">Selected Installations ({selectedCount})</span>
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-slate-700 py-0.5 border-b border-slate-100/50 last:border-0">
                <span className="font-mono font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">{item.siNo}</span>
                <span className="truncate max-w-[200px] text-right font-medium">{item.companyName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks textarea */}
        <div>
          <label className={labelCls}>Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter optional remarks..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting ({selectedCount})...</span>
              </>
            ) : 'Completed'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
