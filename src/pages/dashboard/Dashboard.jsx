import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Phone,
  ClipboardCheck,
  Search
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import TableWrapper from '../../components/TableWrapper';
import formatDate from '../../utils/formatDate';

export default function Dashboard() {
  const [videoCallStats, setVideoCallStats] = useState({ pending: 0, solved: 0 });
  const [materialTestingStats, setMaterialTestingStats] = useState({ pending: 0, completed: 0 });

  const [allTickets, setAllTickets] = useState([]);
  const [allQcChecks, setAllQcChecks] = useState([]);

  const [vcSearchTerm, setVcSearchTerm] = useState('');
  const [vcStatusFilter, setVcStatusFilter] = useState('all');

  const [mtSearchTerm, setMtSearchTerm] = useState('');
  const [mtStatusFilter, setMtStatusFilter] = useState('all');

  const [statsLoading, setStatsLoading] = useState(false);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const sheetUrl1 = import.meta.env.VITE_SERVICE_SHEET_API;
      const sheetUrl2 = import.meta.env.VITE_PURCHASE_SHEET_API;

      if (!sheetUrl1 || !sheetUrl2) return;

      const [videoRes, materialRes, partialRes] = await Promise.all([
        fetch(`${sheetUrl1}?sheet=Ticket_Enquiry`),
        fetch(`${sheetUrl2}?sheet=RECEIVING-ACCOUNTS&action=getAll`),
        fetch(`${sheetUrl2}?sheet=Material-Testing&action=getAll`)
      ]);

      const videoJson = await videoRes.json();
      const materialJson = await materialRes.json();
      const partialJson = await partialRes.json();

      let vcPending = 0;
      let vcSolved = 0;
      let vcRows = [];
      if (videoJson.success && Array.isArray(videoJson.data)) {
        vcRows = videoJson.data.slice(6)
          .filter(row => row[1] && String(row[1]).trim() !== "")
          .map((row, index) => ({
            id: index + 1,
            timeStemp: String(row[0] || "").trim(),
            ticketId: String(row[1] || "").trim(),
            clientName: String(row[17] || "").trim(),
            companyName: String(row[16] || "").trim(),
            category: String(row[23] || "").trim(),
            phoneNumber: String(row[18] || "").trim(),
            actual2: String(row[32] || "").trim(),
          }))
          .reverse();

        vcRows.forEach(ticket => {
          if (ticket.actual2 === "") {
            vcPending++;
          } else {
            vcSolved++;
          }
        });
      }

      const approvedMap = new Map();
      if (partialJson.success && Array.isArray(partialJson.data)) {
        partialJson.data.slice(6)
          .filter((r) => r[1] && String(r[1]).trim() !== "")
          .forEach((r) => {
            const liftNo = String(r[2] || "").trim().toLowerCase();
            if (!liftNo) return;
            approvedMap.set(liftNo, (approvedMap.get(liftNo) || 0) + (parseFloat(r[6] || "0") || 0));
          });
      }

      let mtPending = 0;
      let mtCompleted = 0;
      let mtRows = [];
      if (materialJson.success && Array.isArray(materialJson.data)) {
        mtRows = materialJson.data.slice(7)
          .filter(row => row[1] && String(row[1]).trim() !== "")
          .map((row, index) => {
            const plan7Str = String(row[61] || "").trim();
            const completionStr = String(row[62] || "").trim();
            let status = "not_ready";
            if (plan7Str && plan7Str !== "-") {
              if (completionStr && completionStr !== "-") {
                status = "completed";
              } else {
                status = "pending";
              }
            }
            const liftNo = String(row[2] || "").trim();
            const totalApproved = approvedMap.get(liftNo.toLowerCase()) || 0;

            return {
              id: index + 1,
              indentNumber: String(row[1] || "").trim(),
              liftNo,
              itemName: String(row[7] || "").trim(),
              receivedQty: row[25] || "0",
              approvedQty: totalApproved,
              status,
            };
          })
          .filter(item => item.status === "pending" || item.status === "completed")
          .reverse();

        mtRows.forEach(record => {
          if (record.status === "pending") {
            mtPending++;
          } else if (record.status === "completed") {
            mtCompleted++;
          }
        });
      }

      setVideoCallStats({ pending: vcPending, solved: vcSolved });
      setMaterialTestingStats({ pending: mtPending, completed: mtCompleted });
      setAllTickets(vcRows);
      setAllQcChecks(mtRows);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const filteredTickets = useMemo(() => {
    return allTickets
      .filter(ticket => {
        if (vcStatusFilter !== 'all') {
          const isPending = ticket.actual2 === "";
          if (vcStatusFilter === 'pending' && !isPending) return false;
          if (vcStatusFilter === 'solved' && isPending) return false;
        }
        const q = vcSearchTerm.toLowerCase().trim();
        if (q) {
          const matches =
            String(ticket.ticketId || "").toLowerCase().includes(q) ||
            String(ticket.clientName || "").toLowerCase().includes(q) ||
            String(ticket.companyName || "").toLowerCase().includes(q) ||
            String(ticket.category || "").toLowerCase().includes(q) ||
            String(ticket.phoneNumber || "").includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .slice(0, 8);
  }, [allTickets, vcSearchTerm, vcStatusFilter]);

  const filteredQcChecks = useMemo(() => {
    return allQcChecks
      .filter(record => {
        if (mtStatusFilter !== 'all' && record.status !== mtStatusFilter) return false;
        const q = mtSearchTerm.toLowerCase().trim();
        if (q) {
          const matches =
            String(record.indentNumber || "").toLowerCase().includes(q) ||
            String(record.liftNo || "").toLowerCase().includes(q) ||
            String(record.itemName || "").toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .slice(0, 8);
  }, [allQcChecks, mtSearchTerm, mtStatusFilter]);

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pending Video Calls" value={statsLoading ? "..." : videoCallStats.pending} icon={Phone} gradient="from-cyan-500 to-cyan-600" description="Awaiting engineer solve" />
        <MetricCard title="Solved Video Calls" value={statsLoading ? "..." : videoCallStats.solved} icon={CheckCircle2} gradient="from-teal-500 to-teal-600" description="Total resolved tickets" />
        <MetricCard title="Pending QC Checks" value={statsLoading ? "..." : materialTestingStats.pending} icon={ClipboardCheck} gradient="from-orange-500 to-orange-600" description="Awaiting QA inspection" />
        <MetricCard title="Completed QC Checks" value={statsLoading ? "..." : materialTestingStats.completed} icon={CheckCircle2} gradient="from-purple-500 to-purple-600" description="Total QC items verified" />
      </div>

      {/* 2 Tables Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 pb-6">
        {/* Video Call Latest Entries */}
        <div className="p-5 shadow-sm space-y-4 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Latest Video Call Tickets</h3>
              <p className="text-[11px] text-slate-400 font-medium">Showing top 5 matching entries from all ticket logs</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={vcStatusFilter}
                onChange={(e) => setVcStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-8"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="solved">Solved</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={vcSearchTerm}
                  onChange={(e) => setVcSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-8"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <TableWrapper
              headers={['Ticket-ID', 'Date', 'Client', 'Category', 'Phone Number', 'Status']}
              data={filteredTickets}
              loading={statsLoading}
              emptyMessage="No tickets found."
              renderRow={(ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{ticket.ticketId}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(ticket.timeStemp)}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-850 truncate max-w-[150px]" title={ticket.clientName || ticket.companyName}>{ticket.clientName || ticket.companyName}</td>
                  <td className="px-5 py-3 text-xs text-slate-650 truncate max-w-[120px]" title={ticket.category}>{ticket.category}</td>
                  <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap">{ticket.phoneNumber || "-"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ticket.actual2 === ""
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                      {ticket.actual2 === "" ? "Pending" : "Solved"}
                    </span>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>

        {/* Material Testing Latest Entries */}
        <div className="p-5 shadow-sm space-y-4 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Latest QC Inspections</h3>
              <p className="text-[11px] text-slate-400 font-medium">Showing top 5 matching entries from all QC logs</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={mtStatusFilter}
                onChange={(e) => setMtStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-8"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search QC..."
                  value={mtSearchTerm}
                  onChange={(e) => setMtSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-8"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <TableWrapper
              headers={['Indent No.', 'Unit Tracking No.', 'Item', 'Total Qty', 'Approved Qty', 'Status']}
              data={filteredQcChecks}
              loading={statsLoading}
              emptyMessage="No QC inspections found."
              renderRow={(record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-xs text-slate-700">{record.indentNumber}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{record.liftNo}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-850 truncate max-w-[180px]" title={record.itemName}>{record.itemName}</td>
                  <td className="px-5 py-3 text-xs font-bold text-slate-700">{record.receivedQty}</td>
                  <td className="px-5 py-3 text-xs font-bold text-emerald-600">{record.approvedQty}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${record.status === "pending"
                        ? "bg-orange-50 text-orange-700 border-orange-100"
                        : "bg-purple-50 text-purple-700 border-purple-100"
                      }`}>
                      {record.status === "pending" ? "Pending" : "Completed"}
                    </span>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
