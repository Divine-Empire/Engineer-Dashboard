import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Phone,
  ClipboardCheck,
  Search,
  Calendar
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import TableWrapper from '../../components/TableWrapper';
import formatDate from '../../utils/formatDate';
import VisitCalendarModal from './VisitCalendarModal';
import { Modal } from '../../components/ui/modal';
import { useAuthStore } from '../../store/authStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const PREMIUM_COLORS = [
  { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
  { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", badge: "bg-indigo-100 text-indigo-800" },
  { bg: "bg-amber-50 text-amber-700 border-amber-200", badge: "bg-amber-100 text-amber-800" },
  { bg: "bg-rose-50 text-rose-700 border-rose-200", badge: "bg-rose-100 text-rose-800" },
  { bg: "bg-sky-50 text-sky-700 border-sky-200", badge: "bg-sky-100 text-sky-800" },
  { bg: "bg-violet-50 text-violet-700 border-violet-200", badge: "bg-violet-100 text-violet-800" },
  { bg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", badge: "bg-fuchsia-100 text-fuchsia-800" },
  { bg: "bg-cyan-50 text-cyan-700 border-cyan-200", badge: "bg-cyan-100 text-cyan-800" },
  { bg: "bg-teal-50 text-teal-700 border-teal-200", badge: "bg-teal-100 text-teal-800" },
  { bg: "bg-orange-50 text-orange-700 border-orange-200", badge: "bg-orange-100 text-orange-800" },
];

const getEngineerColor = (name) => {
  if (!name) return { bg: "bg-slate-50 text-slate-700 border-slate-200", badge: "bg-slate-100 text-slate-850" };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PREMIUM_COLORS[Math.abs(hash) % PREMIUM_COLORS.length];
};

const IST_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const getISTComponents = (date) => {
  const parts = {};
  IST_FORMATTER.formatToParts(date).forEach((p) => {
    if (p.type !== "literal") parts[p.type] = parseInt(p.value, 10);
  });
  return { year: parts.year, month: parts.month - 1, day: parts.day };
};

const parseIST = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;

  if (dateStr.includes("T") || dateStr.endsWith("Z")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return getISTComponents(d);
    return null;
  }

  if (dateStr.includes("/")) {
    const datePart = dateStr.split(" ")[0];
    const parts = datePart.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return { day, month, year };
    }
  }

  if (dateStr.includes("-")) {
    const datePart = dateStr.split(" ")[0];
    const parts = datePart.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) return { day, month, year };
    }
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return { day, month, year };
    }
  }

  return null;
};

const formatMinutesToTime = (min) => {
  const totalMin = min + 9 * 60;
  let hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  const minStr = String(mins).padStart(2, "0");
  return `${hrs}:${minStr} ${ampm}`;
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [videoCallStats, setVideoCallStats] = useState({ pending: 0, solved: 0 });
  const [materialTestingStats, setMaterialTestingStats] = useState({ pending: 0, completed: 0 });

  const [allTickets, setAllTickets] = useState([]);
  const [allQcChecks, setAllQcChecks] = useState([]);

  const [vcSearchTerm, setVcSearchTerm] = useState('');
  const [vcStatusFilter, setVcStatusFilter] = useState('all');

  const [mtSearchTerm, setMtSearchTerm] = useState('');
  const [mtStatusFilter, setMtStatusFilter] = useState('all');

  const [statsLoading, setStatsLoading] = useState(false);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isTodayAvailabilityOpen, setIsTodayAvailabilityOpen] = useState(false);
  const [siteVisitHistory, setSiteVisitHistory] = useState([]);
  const [masterData, setMasterData] = useState([]);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const sheetUrl1 = import.meta.env.VITE_SERVICE_SHEET_API;
      const sheetUrl2 = import.meta.env.VITE_PURCHASE_SHEET_API;

      if (!sheetUrl1 || !sheetUrl2) return;

      const videoRes = await fetch(`${sheetUrl1}?sheet=Ticket_Enquiry`);
      if (!videoRes.ok) throw new Error(`Failed to fetch Ticket_Enquiry: ${videoRes.status}`);

      const masterRes = await fetch(`${sheetUrl1}?sheet=Master`);
      if (!masterRes.ok) throw new Error(`Failed to fetch Master sheet: ${masterRes.status}`);

      const materialRes = await fetch(`${sheetUrl2}?sheet=RECEIVING-ACCOUNTS&action=getAll`);
      if (!materialRes.ok) throw new Error(`Failed to fetch RECEIVING-ACCOUNTS: ${materialRes.status}`);

      const partialRes = await fetch(`${sheetUrl2}?sheet=Material-Testing&action=getAll`);
      if (!partialRes.ok) throw new Error(`Failed to fetch Material-Testing: ${partialRes.status}`);

      const checkJsonContentType = (res) => {
        const contentType = res.headers.get("content-type");
        return contentType && contentType.includes("application/json");
      };

      if (!checkJsonContentType(videoRes) || !checkJsonContentType(masterRes) ||
        !checkJsonContentType(materialRes) || !checkJsonContentType(partialRes)) {
        throw new Error(
          "Google Apps Script returned HTML instead of JSON. " +
          "This is a redirect issue when logged into multiple Google accounts in the same browser. " +
          "Please sign out of other accounts, use an Incognito window, or use Chrome Profiles."
        );
      }

      const videoJson = await videoRes.json();
      const materialJson = await materialRes.json();
      const partialJson = await partialRes.json();
      const masterJson = await masterRes.json();

      let vcPending = 0;
      let vcSolved = 0;
      let vcRows = [];
      let svHistory = [];
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

        // Parse site visit history
        const allSvData = videoJson.data.slice(6).map((row, index) => ({
          id: index + 1,
          timeStemp: row[0] || "",
          ticketId: row[1] || "",
          sourceOfEnquiry: row[12] || "",
          callType: row[13] || "",
          enquiryReceiverName: row[14] || "",
          clientType: row[15] || "",
          companyName: row[16] || "",
          clientName: row[17] || "",
          phoneNumber: row[18] || "",
          gstAddress: row[19] || "",
          siteAddress: row[20] || "",
          gstNo: row[21] || "",
          machineName: row[22] || "",
          category: row[23] || "",
          mentionIssue: row[24] || "",
          serviceLocation: row[25] || "",
          emailAddress: row[4] || "",
          title: row[7] || "",
          description: row[8] || "",
          engineerAssign: row[130] || row[28] || "",
          warrantyCheck: row[134] || "",
          siteName: row[20] || "",
          paymentTerm: row[51] || "",
          acceptanceVia: row[52] || "",
          paymentMode: row[54] || "",
          seniorApproval: row[55] || "",
          planned5: row[61] || "",
          actual5: row[62] || "",
          delay5: row[63] || "",
          dateOfVisit: row[64] || "",
          transportation: row[65] || "",
          CREName: row[127] || "",
          expectedCompletionDate: row[149] || "",
          expectedCompletionTime: row[150] || "",
        }));

        svHistory = allSvData.filter(
          (item) => item.planned5 !== "" && item.actual5 !== ""
        );
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

      if (masterJson.success && masterJson.data && masterJson.data.length > 0) {
        const headers = masterJson.data[0];
        const structuredData = {};
        headers.forEach((header) => {
          structuredData[header] = [];
        });
        masterJson.data.slice(1).forEach((row) => {
          row.forEach((value, index) => {
            const header = headers[index];
            if (value !== null && value !== undefined) {
              const stringValue = String(value).trim();
              if (stringValue !== "") {
                structuredData[header].push(stringValue);
              }
            }
          });
        });
        Object.keys(structuredData).forEach((key) => {
          structuredData[key] = [...new Set(structuredData[key])];
        });
        setMasterData([structuredData]);
      }

      setVideoCallStats({ pending: vcPending, solved: vcSolved });
      setMaterialTestingStats({ pending: mtPending, completed: mtCompleted });
      setAllTickets(vcRows);
      setAllQcChecks(mtRows);
      setSiteVisitHistory(svHistory);
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

  const engineersList = useMemo(() => {
    const masterEngs = masterData[0]?.["Engineer Assign Name"] || [];
    if (masterEngs.length > 0) return [...new Set(masterEngs)].sort();
    return [...new Set(siteVisitHistory.map((t) => t.engineerAssign).filter(Boolean))].sort();
  }, [masterData, siteVisitHistory]);

  const getTodayAvailability = (engineer) => {
    const today = new Date();
    const cellDate = {
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
    };

    const busyMinutes = new Array(600).fill(false);
    let statusText = "Available all day (9 AM - 7 PM)";
    let isPendingTADA = false;

    // Filter tickets assigned to this engineer
    const engVisits = siteVisitHistory.filter(ticket =>
      ticket.engineerAssign &&
      String(ticket.engineerAssign).toLowerCase() === String(engineer).toLowerCase()
    );

    const cellVal = cellDate.year * 10000 + (cellDate.month + 1) * 100 + cellDate.day;

    for (const ticket of engVisits) {
      if (!ticket.dateOfVisit) continue;
      const parsedVisit = parseIST(ticket.dateOfVisit);
      if (!parsedVisit) continue;

      const parsedTravel = ticket.travelDate ? parseIST(ticket.travelDate) : null;
      const visitVal = parsedTravel ? (parsedTravel.year * 10000 + (parsedTravel.month + 1) * 100 + parsedTravel.day) : (parsedVisit.year * 10000 + (parsedVisit.month + 1) * 100 + parsedVisit.day);

      const rawCompDate = ticket.expectedCompletionDate || ticket.returnDate;
      const rawCompTime = ticket.expectedCompletionTime;

      let compVal = visitVal;

      if (rawCompDate) {
        const parsedComp = parseIST(rawCompDate);
        if (parsedComp) {
          compVal = parsedComp.year * 10000 + (parsedComp.month + 1) * 100 + parsedComp.day;
        }
      }

      // If selected date (today) is outside of [visitVal, compVal], ignore this ticket
      if (cellVal < visitVal || cellVal > compVal) {
        continue;
      }

      const formatDateLabel = (dateStr) => {
        if (!dateStr) return "";
        const parsed = parseIST(dateStr);
        if (!parsed) return dateStr;
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${parsed.day} ${monthsShort[parsed.month]}`;
      };

      const formatTime12h = (timeStr) => {
        if (!timeStr) return "";
        const parts = timeStr.split(":");
        if (parts.length < 2) return timeStr;
        let hrs = parseInt(parts[0], 10);
        const mins = parseInt(parts[1], 10);
        if (isNaN(hrs) || isNaN(mins)) return timeStr;
        const ampm = hrs >= 12 ? "PM" : "AM";
        hrs = hrs % 12;
        if (hrs === 0) hrs = 12;
        const minsStr = String(mins).padStart(2, "0");
        return `${hrs}:${minsStr} ${ampm}`;
      };

      const getRelativeMinutes = (timeStr) => {
        if (!timeStr) return 600;
        const parts = timeStr.split(":");
        if (parts.length < 2) return 600;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) return 600;
        const totalMinutes = hours * 60 + minutes;
        const nineAM = 9 * 60; // 540
        return Math.max(0, Math.min(600, totalMinutes - nineAM));
      };

      if (cellVal > visitVal && cellVal < compVal) {
        for (let m = 0; m < 600; m++) busyMinutes[m] = true;
        statusText = `Busy: expected completion on ${formatDateLabel(rawCompDate)}`;
      } else if (cellVal === visitVal && cellVal === compVal) {
        if (rawCompTime) {
          const relMins = getRelativeMinutes(rawCompTime);
          for (let m = 0; m < relMins; m++) busyMinutes[m] = true;
          statusText = `Busy until ${formatTime12h(rawCompTime)}`;
        } else {
          for (let m = 0; m < 600; m++) busyMinutes[m] = true;
          isPendingTADA = true;
          statusText = "Busy (Times Pending)";
        }
      } else if (cellVal === visitVal && cellVal < compVal) {
        for (let m = 0; m < 600; m++) busyMinutes[m] = true;
        statusText = `Busy: starts today, expected completion ${formatDateLabel(rawCompDate)}`;
      } else if (cellVal === compVal && cellVal > visitVal) {
        if (rawCompTime) {
          const relMins = getRelativeMinutes(rawCompTime);
          for (let m = 0; m < relMins; m++) busyMinutes[m] = true;
          statusText = `Busy until ${formatTime12h(rawCompTime)}`;
        } else {
          for (let m = 0; m < 600; m++) busyMinutes[m] = true;
          isPendingTADA = true;
          statusText = "Busy (Times Pending)";
        }
      }
    }

    const segments = [];
    let currentType = busyMinutes[0];
    let start = 0;
    for (let i = 1; i <= 600; i++) {
      if (i === 600 || busyMinutes[i] !== currentType) {
        segments.push({
          type: currentType ? "busy" : "free",
          start,
          end: i,
          widthPercent: ((i - start) / 600) * 100,
        });
        if (i < 600) {
          currentType = busyMinutes[i];
          start = i;
        }
      }
    }

    return { segments, statusText, isPendingTADA };
  };

  const chartData = useMemo(() => {
    return engineersList.map((eng) => {
      const { segments, statusText, isPendingTADA } = getTodayAvailability(eng);

      let busyHours = 0;
      let pendingHours = 0;
      let freeHours = 0;

      if (isPendingTADA) {
        pendingHours = 10;
      } else {
        segments.forEach((seg) => {
          const durationHrs = (seg.end - seg.start) / 60;
          if (seg.type === "busy") {
            busyHours += durationHrs;
          } else {
            freeHours += durationHrs;
          }
        });
      }

      return {
        name: eng,
        "Busy/Work Hours": parseFloat(busyHours.toFixed(1)),
        "Times Pending Hours": parseFloat(pendingHours.toFixed(1)),
        "Available Hours": parseFloat(freeHours.toFixed(1)),
      };
    });
  }, [engineersList, siteVisitHistory]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-lg text-xs space-y-1">
          <p className="font-bold text-slate-800">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }} className="font-medium">
              {p.name}: {p.value} hrs
            </p>
          ))}
          <p className="text-[10px] text-slate-400 mt-1 border-t pt-1">
            Total Shift: 10 hrs (9 AM - 7 PM)
          </p>
        </div>
      );
    }
    return null;
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Dashboard Header with CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Engineer Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Welcome back, {user?.name || "User"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            data-testid="btn-view-visit-calendar"
          >
            <Calendar className="h-4 w-4" />
            View Visit Calendar
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsTodayAvailabilityOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              data-testid="btn-view-today-availability"
            >
              <Calendar className="h-4 w-4" />
              Today's Availability
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
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

      {/* Visit Calendar Modal */}
      <VisitCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        allData={user?.role === "ENGINEER" ? siteVisitHistory.filter((item) => String(item.engineerAssign).trim().toLowerCase() === String(user.name).trim().toLowerCase()) : siteVisitHistory}
        masterData={masterData}
      />

      {/* Today's Availability Dialog Modal */}
      {isAdmin && (
        <Modal
          isOpen={isTodayAvailabilityOpen}
          onClose={() => setIsTodayAvailabilityOpen(false)}
          title="Today's Engineer Availability (9 AM - 7 PM)"
          size="3xl"
        >
          <div className="bg-white rounded-lg p-6 max-h-[80vh] overflow-y-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="text-sm text-slate-500">
                Availability view for today: <strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Busy</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Times Pending</span>
              </div>
            </div>

            {/* Availability Stacked Bar Chart */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 mb-2 px-1">Availability Breakdown (Hours)</h4>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Busy/Work Hours" stackId="availability" fill="#f43f5e" name="Busy/Work" />
                    <Bar dataKey="Times Pending Hours" stackId="availability" fill="#f59e0b" name="Times Pending" />
                    <Bar dataKey="Available Hours" stackId="availability" fill="#10b981" name="Available" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
