import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { LoaderIcon } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export default function SiteVisitPlan() {
  const [searchItem, setSearchItem] = useState("");
  const { user } = useAuthStore();

  const [historyData, setHistoryData] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const sheet_url =
    import.meta.env.VITE_SERVICE_SHEET_API; // Fallback to service sheet api which is defined in .env
  const Sheet_Id = import.meta.env.VITE_GOOGLE_SHEET_ID;

  const fetchData = async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(`${sheet_url}?sheet=Ticket_Enquiry`);
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        const allData = json.data.slice(6).map((row, index) => ({
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
          planned8: row[79] || "",
          actual8: row[80] || "",
          engineerNameEI: String(row[138] || "").trim(),
        }));

        const pending = allData.filter(
          (item) => item.planned8 !== "" && item.actual8 === ""
        );

        setHistoryData(pending);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filteredHistoryDataa = historyData
    .filter((item) => {
      const q = searchItem.toLowerCase();
      return (
        String(item.ticketId || "").toLowerCase().includes(q) ||
        String(item.clientName || "").toLowerCase().includes(q) ||
        String(item.companyName || "").toLowerCase().includes(q) ||
        String(item.phoneNumber || "").toLowerCase().includes(q)
      );
    })
    .reverse();

  // Role-based visibility
  const filteredHistoryData = user?.role === "ENGINEER"
    ? filteredHistoryDataa.filter(
        (item) =>
          String(item.engineerNameEI || "").trim().toLowerCase() ===
          String(user.name || "").trim().toLowerCase()
      )
    : filteredHistoryDataa;

  return (
    <div className="space-y-2">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-t-lg border-b border-blue-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Planned Site Visits</h2>
            <p className="text-xs text-slate-500 mt-1">Showing all planned site visit records ({filteredHistoryData.length})</p>
          </div>

          {/* Right Side: Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 md:justify-end w-full md:w-auto">
            <div className="relative flex-1 max-w-md w-full">
              <input
                id="searchFilter"
                placeholder="Search by ticket ID, client, company or phone..."
                className="pl-10 py-2 w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                data-testid="input-search-filter"
                onChange={(e) => setSearchItem(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <div className="relative overflow-x-auto">
              <div className="max-h-[calc(103vh-200px)] overflow-y-auto">
                <table className="hidden sm:block w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[120px] sticky top-0">
                        Date
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[120px] sticky top-0">
                        Ticket-ID
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                        Company Name
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                        Client Name
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                        Phone Number
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                        Site Address
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                        Mention Issue
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                        Machine Name
                      </th>
                      <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                        Engineer Assign
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {filteredHistoryData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-8 bg-white"
                          data-testid="text-no-history"
                        >
                          {fetchLoading ? (
                            <div className="flex justify-center items-center text-blue-700">
                              <LoaderIcon className="animate-spin w-8 h-8" />
                            </div>
                          ) : (
                            <h1 className="text-blue-700">
                              No planned site visits found.
                            </h1>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredHistoryData.map((ticket, indx) => (
                        <tr
                          key={indx}
                          className={
                            indx % 2 === 0 ? "bg-blue-50/50" : "bg-white"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {formatDate(ticket.timeStemp)}
                          </td>
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {ticket.ticketId}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.companyName || ""}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.clientName || ""}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.phoneNumber || ""}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.siteAddress || ""}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.mentionIssue || ""}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.machineName || ""}
                          </td>
                          <td className="px-4 py-3 text-blue-900">
                            {ticket.engineerNameEI || ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-4">
                  {filteredHistoryData.length === 0 ? (
                    <div
                      className="text-center py-8 bg-white"
                      data-testid="text-no-history"
                    >
                      {fetchLoading ? (
                        <div className="flex justify-center items-center text-blue-700">
                          <LoaderIcon className="animate-spin w-8 h-8" />
                        </div>
                      ) : (
                        <h1 className="text-blue-700">
                          No pending TADA site visits found.
                        </h1>
                      )}
                    </div>
                  ) : (
                    filteredHistoryData.map((ticket, indx) => (
                      <Card
                        key={indx}
                        className={`${indx % 2 === 0 ? "bg-blue-50/50" : "bg-white"
                          } border-l-4 border-l-blue-500`}
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Header */}
                          <div>
                            <h3 className="font-bold text-blue-800 text-lg">
                              {ticket.ticketId}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {ticket.clientName}
                            </p>
                          </div>

                          {/* Contact & Machine Info */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium">
                                Phone
                              </p>
                              <p className="text-blue-900">
                                {ticket.phoneNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">
                                Machine
                              </p>
                              <p className="text-blue-900">
                                {ticket.machineName || "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Engineer & Site */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium">
                                Engineer
                              </p>
                              <p className="text-blue-900">
                                {ticket.engineerNameEI || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">
                                Site Name
                              </p>
                              <p className="text-blue-900">
                                {ticket.siteName || "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Visit Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium">
                                Travel Date
                              </p>
                              <p className="text-blue-900">
                                {formatDate(ticket.dateOfVisit) || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">
                                Transportation
                              </p>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {ticket.transportation || "N/A"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
