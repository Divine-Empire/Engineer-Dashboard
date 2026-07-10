import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  ClipboardCheck
} from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import ModalWrapper from '../../components/ModalWrapper';
import formatDate from '../../utils/formatDate';
import toast from 'react-hot-toast';

const sheet_url = import.meta.env.VITE_PURCHASE_SHEET_API;
const Sheet_Id = import.meta.env.VITE_GOOGLE_SHEET_ID;
const IMAGE_FOLDER_ID = "1SihRrPrgbuPGm-09fuB180QJhdxq5Nxy";

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

const formatDateTime = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const getValueByColIndex = (row, colIndex) => {
  if (!Array.isArray(row)) return "";
  if (row.length > 0 && Array.isArray(row[0])) {
    const cell = row.find(c => Array.isArray(c) && c[0] === colIndex);
    return cell !== undefined && cell !== null ? cell[1] : "";
  }
  return row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : "";
};

function SearchableSrnDropdown({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return options;
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, search]);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        className="block w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-9"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        required
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors focus:bg-slate-50 focus:outline-none block text-slate-700"
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MaterialTesting() {
  const [activeTab, setActiveTab] = useState('pending');
  const [sheetRecords, setSheetRecords] = useState([]);
  const [partialQCRecords, setPartialQCRecords] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null); // Pending record to inspect

  const [qcEngineerList, setQcEngineerList] = useState([]);
  const [checklistList, setChecklistList] = useState([]);
  const [rejectTypeList, setRejectTypeList] = useState([]);

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);



  const loadSales = async () => {
    setFetchLoading(true);
    try {
      const [dropRes, partialRes, receiveRes] = await Promise.all([
        fetch(`${sheet_url}?sheet=Dropdown&action=getAll`),
        fetch(`${sheet_url}?sheet=Material-Testing&action=getAll`),
        fetch(`${sheet_url}?sheet=RECEIVING-ACCOUNTS&action=getAll`),
      ]);

      const [dropJson, partialJson, json] = await Promise.all([
        dropRes.json(),
        partialRes.json(),
        receiveRes.json(),
      ]);

      if (dropJson.success && Array.isArray(dropJson.data)) {
        setQcEngineerList(
          dropJson.data.slice(1)
            .map((row) => String(getValueByColIndex(row, 11) || "").trim())
            .filter((q) => q !== "")
        );
        setChecklistList(
          dropJson.data.slice(1)
            .map((row) => String(getValueByColIndex(row, 15) || "").trim())
            .filter((c) => c !== "")
        );
        setRejectTypeList(
          dropJson.data.slice(1)
            .map((row) => String(getValueByColIndex(row, 16) || "").trim())
            .filter((r) => r !== "")
        );
      }

      const approvedMap = new Map();
      const rejectedMap = new Map();
      let pRows = [];

      if (partialJson.success && Array.isArray(partialJson.data)) {
        pRows = partialJson.data.slice(6).filter((r) => getValueByColIndex(r, 1) && String(getValueByColIndex(r, 1)).trim() !== "");
        pRows.forEach((r) => {
          const liftNo = String(getValueByColIndex(r, 2) || "").trim().toLowerCase();
          if (!liftNo) return;
          approvedMap.set(liftNo, (approvedMap.get(liftNo) || 0) + (parseFloat(getValueByColIndex(r, 6) || "0") || 0));
          rejectedMap.set(liftNo, (rejectedMap.get(liftNo) || 0) + (parseFloat(getValueByColIndex(r, 12) || "0") || 0));
        });
        setPartialQCRecords(pRows);
      }

      if (json.success && Array.isArray(json.data)) {
        const rows = json.data.slice(7)
          .map((row, i) => ({ row, originalIndex: i + 8 }))
          .filter(({ row }) => getValueByColIndex(row, 1) && String(getValueByColIndex(row, 1)).trim() !== "")
          .map(({ row, originalIndex }) => {
            const indentNo = String(getValueByColIndex(row, 1) || "").trim();
            const liftNo = String(getValueByColIndex(row, 2) || "").trim().toLowerCase();
            const receivedQty = parseFloat(getValueByColIndex(row, 25) || "0");
            const totalApproved = approvedMap.get(liftNo) || 0;
            const totalRejected = rejectedMap.get(liftNo) || 0;
            const pendingQty = Math.max(0, receivedQty - (totalApproved + totalRejected));

            const plan7Str = String(getValueByColIndex(row, 61) || "").trim();
            const completionDate = getValueByColIndex(row, 62);
            const completionStr = String(completionDate || "").trim();

            let status = "not_ready";
            if (plan7Str && plan7Str !== "-") {
              if (completionStr && completionStr !== "-") {
                status = "completed";
              } else {
                status = "pending";
              }
            }

            return {
              id: `${indentNo}_${originalIndex}`,
              rowIndex: originalIndex,
              status,
              data: {
                indentNumber: indentNo,
                liftNo: String(getValueByColIndex(row, 2) || ""),
                vendorName: String(getValueByColIndex(row, 3) || ""),
                poNumber: String(getValueByColIndex(row, 4) || ""),
                itemName: String(getValueByColIndex(row, 7) || ""),
                invoiceNumber: String(getValueByColIndex(row, 24) || "-"),
                receivedQty: getValueByColIndex(row, 25) || "0",
                plan7: getValueByColIndex(row, 61) || "",
                actual7: getValueByColIndex(row, 62) || "",
                totalApproved,
                totalRejected,
                pendingQty,
                damageQty: getValueByColIndex(row, 116) || "0",
                damageReason: getValueByColIndex(row, 117) || "-",
                damageImage: getValueByColIndex(row, 118) || "",
              },
            };
          });
        setSheetRecords(rows);
      }
    } catch (error) {
      console.error("Error loading FMS Material Testing data:", error);
      toast.error("Failed to load live data");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    const handleRefresh = () => loadSales();
    window.addEventListener('refresh_sales', handleRefresh);
    return () => window.removeEventListener('refresh_sales', handleRefresh);
  }, []);

  const pending = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return sheetRecords.filter((r) => {
      if (r.status !== "pending") return false;
      if (!searchLower) return true;
      return (
        r.data.indentNumber?.toLowerCase().includes(searchLower) ||
        r.data.liftNo?.toLowerCase().includes(searchLower) ||
        r.data.itemName?.toLowerCase().includes(searchLower) ||
        r.data.vendorName?.toLowerCase().includes(searchLower) ||
        String(r.data.poNumber || "").toLowerCase().includes(searchLower) ||
        String(r.data.invoiceNumber || "").toLowerCase().includes(searchLower)
      );
    });
  }, [sheetRecords, searchTerm]);

  const history = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return partialQCRecords
      .filter(pRow => getValueByColIndex(pRow, 1) && String(getValueByColIndex(pRow, 1)).trim() !== "")
      .map((pRow, idx) => {
        const indentNoUpper = String(getValueByColIndex(pRow, 1) || "").trim().toUpperCase();
        const liftNo = String(getValueByColIndex(pRow, 2) || "").trim().toLowerCase();

        const parentRecord = sheetRecords.find(r =>
          String(r.data.liftNo || "").trim().toLowerCase() === liftNo
        );
        const parentData = parentRecord?.data ?? {};
        const parentStatus = parentRecord?.status ?? "not_ready";

        return {
          id: `partial-${indentNoUpper}-${idx}`,
          parentStatus,
          data: {
            indentNumber: indentNoUpper,
            vendorName: parentData.vendorName || "-",
            invoiceNumber: parentData.invoiceNumber || "-",
            itemName: parentData.itemName || "-",
            plan7: parentData.plan7 || "-",
            actual7: getValueByColIndex(pRow, 0) || "-",
            qcDate: getValueByColIndex(pRow, 3) || "-",
            qcBy: getValueByColIndex(pRow, 5) || "-",
            approvedQty: getValueByColIndex(pRow, 6) || "0",
            rejectedQty: getValueByColIndex(pRow, 12) || "0",
            qcStatus: getValueByColIndex(pRow, 4) || "-",
            remarks: getValueByColIndex(pRow, 13) || "-",
            damageQty: parentData.damageQty || "-",
            damageReason: parentData.damageReason || "-",
            damageImage: parentData.damageImage || "",
            liftNo: getValueByColIndex(pRow, 2) || "-",
            workingCondition: getValueByColIndex(pRow, 4) || "-",
            checklist: getValueByColIndex(pRow, 7) || "-",
            serialNo: getValueByColIndex(pRow, 8) || "-",
            image: getValueByColIndex(pRow, 9) || "-",
            rejectType: getValueByColIndex(pRow, 10) || "-",
            partName: getValueByColIndex(pRow, 11) || "-",
          },
        };
      })
      .filter(rec => {
        if (rec.parentStatus !== "completed") return false;
        if (!searchLower) return true;
        return (
          rec.data.indentNumber?.toLowerCase().includes(searchLower) ||
          rec.data.liftNo?.toLowerCase().includes(searchLower) ||
          rec.data.vendorName?.toLowerCase().includes(searchLower) ||
          rec.data.itemName?.toLowerCase().includes(searchLower)
        );
      })
      .reverse();
  }, [partialQCRecords, sheetRecords, searchTerm]);

  const activeRecords = activeTab === 'pending' ? pending : history;

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-hidden pr-1">
      {/* Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        {/* Tab Selection */}
        <div className="flex border border-slate-250 bg-slate-50/50 p-1 rounded-xl gap-1">
          <button
            onClick={() => { setActiveTab('pending'); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => { setActiveTab('history'); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
              className="block w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all pl-10"
            />
          </div>
          <button
            onClick={loadSales}
            disabled={fetchLoading}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${fetchLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-4">
        <TableWrapper
          headers={
            activeTab === 'pending'
              ? [
                'Action',
                'Indent No.',
                'Unit Tracking No.',
                'Planned',
                'Item',
                'Received Qty',
                'Approved',
                'Rejected',
                'Pending Qty',
                'Damage Qty',
                'Reason',
                'Image'
              ]
              : [
                'Indent No.',
                'Lift No.',
                'QC-Date',
                'Working Condition',
                'Checked By',
                'Approved Qty',
                'Checklist',
                'Serial-No',
                'Image',
                'Reject Type',
                'Part-Name',
                'Reject Qty',
                'Remarks'
              ]
          }
          data={activeRecords}
          emptyMessage={fetchLoading ? <>
            {/* spinner */}
            <div className="flex items-center justify-center flex-col ">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <p>Loading...</p>
            </div>
          </> : "No entries found in this folder."}
          renderRow={(record) => {
            if (activeTab === 'pending') {
              return (
                <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3.5 min-w-36">
                    <button
                      onClick={() => setSelectedSale(record)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Perform QC
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{record.data.indentNumber}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{record.data.liftNo}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(record.data.plan7)}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-700 min-w-[500px] ">{record.data.itemName}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-semibold">{record.data.receivedQty}</td>
                  <td className="px-5 py-3.5 text-xs text-emerald-600 font-bold">{record.data.totalApproved}</td>
                  <td className="px-5 py-3.5 text-xs text-rose-600 font-bold">{record.data.totalRejected}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{record.data.pendingQty}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{record.data.damageQty}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{record.data.damageReason}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {record.data.damageImage && record.data.damageImage !== "-" && record.data.damageImage !== "" ? (
                      <a href={record.data.damageImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        <FileText size={12} /> View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            } else {
              // History Row
              return (
                <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{record.data.indentNumber}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{record.data.liftNo}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(record.data.qcDate)}</td>
                  <td className="px-5 py-3.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold border ${record.data.workingCondition === "Passed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : record.data.workingCondition === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                      {record.data.workingCondition}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{record.data.qcBy}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{record.data.approvedQty}</td>
                  <td className="px-5 py-3.5 text-center">
                    {record.data.checklist && record.data.checklist !== "-" ? (
                      <button
                        onClick={() => { setSelectedHistoryRecord(record); setHistoryDialogOpen(true); }}
                        className="text-slate-500 hover:text-blue-600 p-1 rounded hover:bg-slate-100"
                      >
                        <Eye size={15} />
                      </button>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {record.data.serialNo && record.data.serialNo !== "-" ? (
                      <button
                        onClick={() => { setSelectedHistoryRecord(record); setHistoryDialogOpen(true); }}
                        className="text-slate-500 hover:text-blue-600 p-1 rounded hover:bg-slate-100"
                      >
                        <Eye size={15} />
                      </button>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {record.data.image && record.data.image !== "-" ? (
                      <button
                        onClick={() => { setSelectedHistoryRecord(record); setHistoryDialogOpen(true); }}
                        className="text-slate-500 hover:text-blue-600 p-1 rounded hover:bg-slate-100"
                      >
                        <Eye size={15} />
                      </button>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{record.data.rejectType || "-"}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{record.data.partName || "-"}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-rose-600">{record.data.rejectedQty || "0"}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[150px] truncate" title={record.data.remarks}>{record.data.remarks || "-"}</td>
                </tr>
              );
            }
          }}
        />

      </div>

      {/* QC Form Modal */}
      {selectedSale && (
        <QCFormModal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          record={selectedSale}
          onSave={loadSales}
          qcEngineerList={qcEngineerList}
          checklistList={checklistList}
          rejectTypeList={rejectTypeList}
        />
      )}

      {/* History Details Modal */}
      {historyDialogOpen && selectedHistoryRecord && (
        <ModalWrapper
          isOpen={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          title="Inspection Details"
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Indent No</span>
                <span className="text-xs font-bold text-slate-800">{selectedHistoryRecord.data.indentNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lift No</span>
                <span className="text-xs font-bold text-slate-800">{selectedHistoryRecord.data.liftNo}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QC Date</span>
                <span className="text-xs font-medium text-slate-850">{formatDate(selectedHistoryRecord.data.qcDate)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked By</span>
                <span className="text-xs font-medium text-slate-850">{selectedHistoryRecord.data.qcBy}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QC Checklist</h4>
              {selectedHistoryRecord.data.checklist && selectedHistoryRecord.data.checklist !== "-" ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedHistoryRecord.data.checklist.split(",").map((item, i) => (
                    <span key={i} className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                      ✓ {item.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No checklist recorded</span>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial Numbers & Photos</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {selectedHistoryRecord.data.serialNo && selectedHistoryRecord.data.serialNo !== "-" ? (
                  (() => {
                    const serials = String(selectedHistoryRecord.data.serialNo).split(",").map(s => s.trim()).filter(Boolean);
                    const images = selectedHistoryRecord.data.image && selectedHistoryRecord.data.image !== "-"
                      ? String(selectedHistoryRecord.data.image).split(",").map(i => i.trim()).filter(Boolean)
                      : [];
                    return serials.map((serial, idx) => {
                      const imageUrl = images[idx] || "";
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                          {imageUrl ? (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm transition-all hover:bg-slate-50"
                            >
                              <FileText size={12} className="text-blue-500" />
                              {serial}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600 font-medium bg-white px-2.5 py-1 rounded border border-slate-200">
                              {serial}
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()
                ) : (
                  <span className="text-xs text-slate-400 italic">No serial numbers recorded</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-5">
            <button
              onClick={() => setHistoryDialogOpen(false)}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

// Subcomponent: QC Form Modal
function QCFormModal({ isOpen, onClose, record, onSave, qcEngineerList, checklistList, rejectTypeList }) {
  const [qcBy, setQcBy] = useState('');
  const [qcDate, setQcDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [workingCondition, setWorkingCondition] = useState('');
  const [approvedQty, setApprovedQty] = useState('');
  const [checklistSelected, setChecklistSelected] = useState([]);
  const [rejectType, setRejectType] = useState('');
  const [partName, setPartName] = useState('');
  const [rejectQty, setRejectQty] = useState('');
  const [remarks, setRemarks] = useState('');

  const [srnEntries, setSrnEntries] = useState([]);
  const [rejectSrnEntries, setRejectSrnEntries] = useState([]);

  const [serialNoList, setSerialNoList] = useState([]);
  const [serialsLoading, setSerialsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load Serials
  useEffect(() => {
    if (record) {
      setSerialsLoading(true);
      fetch(`${sheet_url}?sheet=Serial-Generation&action=getAll`)
        .then(r => r.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            const cleanIndent = String(record.data.indentNumber || "").trim().toLowerCase();
            const cleanLift = String(record.data.liftNo || "").trim().toLowerCase();

            let serials = json.data.slice(6)
              .filter((row) => {
                const rowIndent = String(row[0] || "").trim().toLowerCase();
                const rowLift = String(row[1] || "").trim().toLowerCase();
                return rowIndent === cleanIndent && rowLift === cleanLift;
              })
              .map((row) => String(row[3] || "").trim())
              .filter((s) => s !== "");

            if (serials.length === 0) {
              serials = json.data.slice(6)
                .filter((row) => {
                  const rowIndent = String(row[0] || "").trim().toLowerCase();
                  return rowIndent === cleanIndent;
                })
                .map((row) => String(row[3] || "").trim())
                .filter((s) => s !== "");
            }
            setSerialNoList(serials);
          }
        })
        .catch(err => console.error("Error loading serials:", err))
        .finally(() => setSerialsLoading(false));

      // Reset values
      setQcBy('');
      setWorkingCondition('');
      setApprovedQty('');
      setChecklistSelected([]);
      setRejectType('');
      setPartName('');
      setRejectQty('');
      setRemarks('');
      setSrnEntries([]);
      setRejectSrnEntries([]);
    }
  }, [record]);

  if (!record) return null;

  const isFormValid = (() => {
    if (!qcDate || !workingCondition) return false;
    const isPassed = workingCondition === "Passed" || workingCondition === "Passed but Quality Concern";
    if (isPassed) {
      return !!(
        qcBy &&
        approvedQty &&
        parseInt(approvedQty) > 0 &&
        checklistSelected.length > 0 &&
        srnEntries.length > 0 &&
        srnEntries.every((e) => e.srn.trim() !== "")
      );
    } else if (workingCondition === "Rejected") {
      return !!(
        rejectType &&
        partName &&
        rejectQty &&
        parseInt(rejectQty) > 0 &&
        rejectSrnEntries.length > 0 &&
        rejectSrnEntries.every((e) => e.srn.trim() !== "")
      );
    }
    return false;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const timestamp = formatDateTime(new Date());
      const mDYYYY = timestamp;

      const qcDateObj = new Date(qcDate);
      const qcDateFormatted = !isNaN(qcDateObj.getTime())
        ? `${qcDateObj.getMonth() + 1}/${qcDateObj.getDate()}/${qcDateObj.getFullYear()}`
        : "";

      const isPassed = workingCondition === "Passed" || workingCondition === "Passed but Quality Concern";

      let serialNosStr = "";
      let imageUrlsStr = "";

      if (isPassed && srnEntries.length > 0) {
        const srnData = await Promise.all(
          srnEntries.map(async (entry) => {
            let imageUrl = "";
            if (entry.image instanceof File) {
              const uploadParams = new URLSearchParams();
              uploadParams.append("action", "uploadFile");
              uploadParams.append("base64Data", await toBase64(entry.image));
              uploadParams.append("fileName", `SRN_${entry.serialNo}_${entry.image.name}`);
              uploadParams.append("mimeType", entry.image.type);
              uploadParams.append("folderId", IMAGE_FOLDER_ID);
              const res = await fetch(sheet_url, { method: "POST", body: uploadParams });
              const json = await res.json();
              if (json.success) imageUrl = json.fileUrl || "";
            }
            return { srn: entry.srn, image: imageUrl };
          })
        );
        serialNosStr = srnData.map((d) => d.srn).filter(Boolean).join(", ");
        imageUrlsStr = srnData.map((d) => d.image).filter(Boolean).join(" , ");
      } else if (workingCondition === "Rejected" && rejectSrnEntries.length > 0) {
        const srnData = await Promise.all(
          rejectSrnEntries.map(async (entry) => {
            let imageUrl = "";
            if (entry.image instanceof File) {
              const uploadParams = new URLSearchParams();
              uploadParams.append("action", "uploadFile");
              uploadParams.append("base64Data", await toBase64(entry.image));
              uploadParams.append("fileName", `REJECT_SRN_${entry.serialNo}_${entry.image.name}`);
              uploadParams.append("mimeType", entry.image.type);
              uploadParams.append("folderId", IMAGE_FOLDER_ID);
              const res = await fetch(sheet_url, { method: "POST", body: uploadParams });
              const json = await res.json();
              if (json.success) imageUrl = json.fileUrl || "";
            }
            return { srn: entry.srn, image: imageUrl };
          })
        );
        serialNosStr = srnData.map((d) => d.srn).filter(Boolean).join(", ");
        imageUrlsStr = srnData.map((d) => d.image).filter(Boolean).join(" , ");
      }

      const postToPartialQC = async (row) => {
        const p = new URLSearchParams();
        p.append("action", "batchInsert");
        p.append("sheetName", "Material-Testing");
        p.append("rowsData", JSON.stringify([row]));
        p.append("startRow", "2");
        const res = await fetch(sheet_url, { method: "POST", body: p });
        const json = await res.json();
        if (!json.success) throw new Error("Failed to write to Material-Testing sheet");
      };

      const updateCell = async (rowIndex, columnIndex, value) => {
        const p = new URLSearchParams();
        p.append("action", "updateCell");
        p.append("sheetName", "RECEIVING-ACCOUNTS");
        p.append("rowIndex", rowIndex.toString());
        p.append("columnIndex", columnIndex.toString());
        p.append("value", value);
        const res = await fetch(sheet_url, { method: "POST", body: p });
        const json = await res.json();
        if (!json.success) throw new Error("Failed to update parent status");
      };

      const receivedQty = parseFloat(record.data.receivedQty || "0");
      const currentResolved = (record.data.totalApproved || 0) + (record.data.totalRejected || 0);
      const promises = [];

      const checklistStr = isPassed ? checklistSelected.join(", ") : "";

      const row = [
        mDYYYY,
        record.data.indentNumber,
        record.data.liftNo || "",
        qcDateFormatted,
        workingCondition,
        qcBy || "",
        isPassed ? approvedQty : "",
        checklistStr,
        serialNosStr,
        imageUrlsStr,
        workingCondition === "Rejected" ? rejectType : "",
        workingCondition === "Rejected" ? partName : "",
        workingCondition === "Rejected" ? rejectQty : "",
        remarks || "",
      ];

      promises.push(postToPartialQC(row));

      const changeQty = isPassed
        ? parseFloat(approvedQty || "0")
        : parseFloat(rejectQty || "0");

      const newTotalResolved = currentResolved + changeQty;
      if (newTotalResolved >= receivedQty) {
        promises.push(updateCell(record.rowIndex, 63, mDYYYY)); // Column BK is 63
        toast.success("QC Inspection Complete — all quantity resolved!");
      } else {
        toast.success("QC Entry saved successfully.");
      }

      await Promise.all(promises);
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`QC inspection: Indent ${record.data.indentNumber}`} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Record Info Bar */}
        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Item</span>
            <span className="font-bold text-slate-700 truncate block">{record.data.itemName}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Vendor</span>
            <span className="font-bold text-slate-700 truncate block">{record.data.vendorName}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Tracking No.</span>
            <span className="font-semibold text-slate-600 truncate block">{record.data.liftNo}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Pending Qty</span>
            <span className="font-bold text-indigo-600">{record.data.pendingQty} of {record.data.receivedQty}</span>
          </div>
        </div>

        {/* General Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>QC-Date *</label>
            <input
              type="date"
              value={qcDate}
              onChange={(e) => setQcDate(e.target.value)}
              required
              className={`${inputCls} cursor-pointer`}
            />
          </div>
          <div>
            <label className={labelCls}>Checked By *</label>
            <select
              value={qcBy}
              onChange={(e) => setQcBy(e.target.value)}
              required={workingCondition !== "Rejected"}
              className={inputCls}
            >
              <option value="">Select Inspector</option>
              {qcEngineerList.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Working Condition *</label>
            <select
              value={workingCondition}
              onChange={(e) => setWorkingCondition(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Select Condition</option>
              <option value="Passed">Passed</option>
              <option value="Passed but Quality Concern">Passed but Quality Concern</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Passed condition sections */}
        {(workingCondition === "Passed" || workingCondition === "Passed but Quality Concern") && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Approved Qty *</label>
                <input
                  type="number"
                  min="1"
                  max={record.data.pendingQty}
                  required
                  placeholder={`Pending: ${record.data.pendingQty}`}
                  value={approvedQty}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0;
                    const maxQty = record.data.pendingQty;
                    const validQty = Math.min(Math.max(0, qty), maxQty);
                    const newEntries = Array.from({ length: validQty }, (_, i) => ({
                      serialNo: i + 1,
                      srn: srnEntries[i]?.srn || "",
                      image: srnEntries[i]?.image || null,
                    }));
                    setApprovedQty(validQty ? String(validQty) : '');
                    setSrnEntries(newEntries);
                  }}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className={labelCls}>Checklist *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl max-h-[140px] overflow-y-auto">
                {checklistList.map((item) => {
                  const isChecked = checklistSelected.includes(item);
                  return (
                    <div key={item} className="flex items-start gap-2.5 py-0.5">
                      <input
                        type="checkbox"
                        id={`checklist-${item}`}
                        checked={isChecked}
                        onChange={() => {
                          const list = checklistSelected.includes(item)
                            ? checklistSelected.filter((i) => i !== item)
                            : [...checklistSelected, item];
                          setChecklistSelected(list);
                        }}
                        className="mt-0.5 h-3.5 w-3.5 text-indigo-600 border-slate-350 rounded cursor-pointer"
                      />
                      <label htmlFor={`checklist-${item}`} className="text-xs text-slate-600 cursor-pointer select-none leading-tight">
                        {item}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Serial Numbers dynamic rows */}
            {srnEntries.length > 0 && (
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700">Approved Item Serial Numbers & Photos</span>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {srnEntries.map((entry, idx) => (
                    <div key={entry.serialNo} className="grid grid-cols-12 gap-3 items-center bg-white p-2.5 rounded-xl border border-slate-100">
                      <div className="col-span-1 text-xs font-bold text-slate-400">#{entry.serialNo}</div>
                      <div className="col-span-5 relative">
                        <SearchableSrnDropdown
                          value={entry.srn}
                          onChange={(val) => {
                            const updated = [...srnEntries];
                            updated[idx] = { ...updated[idx], srn: val };
                            setSrnEntries(updated);
                          }}
                          options={serialNoList}
                          placeholder="Search/Select SRN"
                        />
                      </div>
                      <div className="col-span-6 flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id={`srn-image-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              const updated = [...srnEntries];
                              updated[idx] = { ...updated[idx], image: file };
                              setSrnEntries(updated);
                            }}
                          />
                          <label
                            htmlFor={`srn-image-${idx}`}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl cursor-pointer transition-all h-9 text-xs font-semibold ${entry.image
                              ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                          >
                            <FileText size={12} />
                            <span className="truncate max-w-[120px]">{entry.image ? entry.image.name : "Photo"}</span>
                          </label>
                        </div>
                        {entry.image && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...srnEntries];
                              updated[idx] = { ...updated[idx], image: null };
                              setSrnEntries(updated);
                            }}
                            className="text-slate-400 hover:text-rose-500 font-bold p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejected condition sections */}
        {workingCondition === "Rejected" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Reject Type *</label>
                <select
                  value={rejectType}
                  onChange={(e) => setRejectType(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Select type</option>
                  {rejectTypeList.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Part-Name *</label>
                <input
                  type="text"
                  placeholder="Enter part name"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Reject Qty *</label>
                <input
                  type="number"
                  min="1"
                  max={record.data.pendingQty}
                  required
                  placeholder={`Pending: ${record.data.pendingQty}`}
                  value={rejectQty}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0;
                    const maxQty = record.data.pendingQty;
                    const validQty = Math.min(Math.max(0, qty), maxQty);
                    const newEntries = Array.from({ length: validQty }, (_, i) => ({
                      serialNo: i + 1,
                      srn: rejectSrnEntries[i]?.srn || "",
                      image: rejectSrnEntries[i]?.image || null,
                    }));
                    setRejectQty(validQty ? String(validQty) : '');
                    setRejectSrnEntries(newEntries);
                  }}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Serial Numbers dynamic rows */}
            {rejectSrnEntries.length > 0 && (
              <div className="bg-rose-50/20 border border-rose-150 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-rose-800">Rejected Item Serial Numbers & Photos</span>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {rejectSrnEntries.map((entry, idx) => (
                    <div key={entry.serialNo} className="grid grid-cols-12 gap-3 items-center bg-white p-2.5 rounded-xl border border-slate-100">
                      <div className="col-span-1 text-xs font-bold text-slate-400">#{entry.serialNo}</div>
                      <div className="col-span-5 relative">
                        <SearchableSrnDropdown
                          value={entry.srn}
                          onChange={(val) => {
                            const updated = [...rejectSrnEntries];
                            updated[idx] = { ...updated[idx], srn: val };
                            setRejectSrnEntries(updated);
                          }}
                          options={serialNoList}
                          placeholder="Search/Select SRN"
                        />
                      </div>
                      <div className="col-span-6 flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id={`reject-srn-image-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              const updated = [...rejectSrnEntries];
                              updated[idx] = { ...updated[idx], image: file };
                              setRejectSrnEntries(updated);
                            }}
                          />
                          <label
                            htmlFor={`reject-srn-image-${idx}`}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl cursor-pointer transition-all h-9 text-xs font-semibold ${entry.image
                              ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                          >
                            <FileText size={12} />
                            <span className="truncate max-w-[120px]">{entry.image ? entry.image.name : "Photo"}</span>
                          </label>
                        </div>
                        {entry.image && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...rejectSrnEntries];
                              updated[idx] = { ...updated[idx], image: null };
                              setRejectSrnEntries(updated);
                            }}
                            className="text-slate-400 hover:text-rose-500 font-bold p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remarks / Concern */}
        <div>
          <label className={labelCls}>
            {workingCondition === "Passed but Quality Concern" ? "Concern Issue" : "Remarks"}
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={workingCondition === "Passed but Quality Concern" ? "Explain concern details..." : "Enter remarks..."}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Footer Actions */}
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
            disabled={submitting || !isFormValid}
            className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm"
          >
            {submitting ?
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </> : 'Finalize Quality Report'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
