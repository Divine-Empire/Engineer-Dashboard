import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Modal } from "../components/ui/modal";
import { useToast } from "../hooks/use-toast";
import { Eye, Loader2Icon, LoaderIcon } from "lucide-react";
import { Textarea } from "../components/ui/textarea";

const formatInputDate = (dateStr) => {
  if (!dateStr) return "";
  const str = String(dateStr).trim().split(" ")[0];
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    let year = match[3];
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${month}-${day}`;
  }

  const matchY = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (matchY) {
    const year = matchY[1];
    const month = matchY[2].padStart(2, "0");
    const day = matchY[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  
  return "";
};

export default function TADA() {
  const [activeTab, setActiveTab] = useState("pending");
  const [showTADAModal, setShowTADAModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchItem, setSearchItem] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);
  const { toast } = useToast();

  const [masterData, setMasterData] = useState({});

  // console.log("masterData", masterData);

  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sheet_url =
    import.meta.env.VITE_APPS_SCRIPT_API;
  const Sheet_Id = import.meta.env.VITE_GOOGLE_SHEET_ID;

  const fetchData = async () => {
    setFetchLoading(true); // start loading
    try {
      const response = await fetch(`${sheet_url}?sheet=Ticket_Enquiry`);
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        // Process the data to match your requirements
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

          // Stage specific and other columns
          emailAddress: row[4] || "",
          title: row[7] || "",
          description: row[8] || "",
          
          engineerAssign: row[130] || row[28] || "",
          warrantyCheck: row[134] || "",
          siteName: row[20] || "",

          planned1: row[9] || "",
          actual1: row[10] || "",
          delay1: row[11] || "",

          quotationNo: row[40] || "",
          basicAmount: row[41] || "",
          totalAmoutWithTex: row[42] || "",
          quotationPdfLink: row[43] || "",
          quotationShareByPersonName: row[44] || "",
          ShareThrough: row[45] || "",
          quotationremarks: row[46] || "",

          planned4: row[47] || "",
          actual4: row[48] || "",
          stage: row[50] || "",
          paymentTerm: row[51] || "",
          acceptanceVia: row[52] || "",
          acceptanceAttachemntFile: row[53] || "",
          paymentMode: row[54] || "",
          seniorApproval: row[55] || "",
          approvalAttachmentFile: row[56] || "",
          whatDidTheCustomerSay: row[57] || "",
          nextAction: row[58] || "",
          nextDateOfCall: row[59] || "",
          followUpRemarks: row[60] || "",

          planned5: row[61] || "",
          actual5: row[62] || "",
          delay5: row[63] || "",
          dateOfVisit: row[64] || "",
          transportation: row[65] || "",

          planned6: row[66] || "",
          actual6: row[67] || "",
          spareDetails: row[69] || "",
          dnCopyFileUpload: row[70] || "",
          dnNumber: row[71] || "",
          serviceAssets: row[72] || "",
          equipmentName: row[73] || "",
          attachment: row[74] || "",
          machineReceiverName: row[75] || "",
          machineReceiverNumber: row[76] || "",
          challanAttachment: row[77] || "",
          invoiceStatus: row[78] || "",

          planned7: row[79] || "",
          actual7: row[80] || "",
          delay7: row[81] || "",
          travelDate: row[82] || "",
          returnDate: row[83] || "",
          destinationInput: row[84] || "",
          purposeOfTravel: row[85] || "",
          amount: row[86] || "",
          CREName: row[127] || "",
          expectedCompletionDate: row[149] || "",
          expectedCompletionTime: row[150] || "",
        }));

        const pending = allData.filter(
          (item) => item.planned7 !== "" && item.actual7 === ""
        );

        const history = allData.filter(
          (item) => item.planned7 !== "" && item.actual7 !== ""
        );

        setPendingData(pending);
        setHistoryData(history);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchMasterSheet = async () => {
    try {
      const response = await fetch(`${sheet_url}?sheet=Master`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const headers = result.data[0]; // First row contains headers
        const structuredData = {};

        // Initialize each header with an empty array
        headers.forEach((header) => {
          structuredData[header] = [];
        });

        // Process each data row (skip the header row)
        result.data.slice(1).forEach((row) => {
          row.forEach((value, index) => {
            const header = headers[index];
            // Handle cases where value might be null/undefined or not a string
            if (value !== null && value !== undefined) {
              const stringValue = String(value).trim(); // Convert to string and trim
              if (stringValue !== "") {
                structuredData[header].push(stringValue);
              }
            }
          });
        });

        // Remove duplicates from each array
        Object.keys(structuredData).forEach((key) => {
          structuredData[key] = [...new Set(structuredData[key])];
        });

        // console.log("Structured Master Data:", structuredData);
        setMasterData([structuredData]); // Wrap in array as per your requested format
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data");
    }
  };

  useEffect(() => {
    fetchMasterSheet();
    fetchData();
  }, []);

  // Auto-open modal when arriving via a TADA deep-link (e.g. /tada?ticketId=XXX)
  useEffect(() => {
    if (pendingData.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const ticketIdFromUrl = params.get("ticketId");
    if (ticketIdFromUrl) {
      const targetTicket = pendingData.find(
        (t) => t.ticketId === decodeURIComponent(ticketIdFromUrl)
      );
      if (targetTicket) {
        handleTADAClick(targetTicket);
        // Clean the query param from the URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    }
  }, [pendingData]);


  const handleTADAClick = (ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      ticketId: ticket.ticketId,
      clientName: ticket.clientName,
      phoneNumber: ticket.phoneNumber,
      enquiryReceiverName: ticket.enquiryReceiverName || "",
      warrantyCheck: ticket.warrantyCheck || "",
      machineName: ticket.machineName || "",
      enquiryType: ticket.enquiryType || "",
      engineerAssign: ticket.engineerAssign || "",
      siteName: ticket.siteAddress || ticket.siteName || "",
      status: ticket.status || "",
      dateOfVisit: ticket.dateOfVisit || "",
      transportation: ticket.transportation || "",
      travelDate: formatInputDate(ticket.dateOfVisit),
      returnDate: "",
      destination: "",
      purposeOfTravel: "",
      amount: "",
      expectedCompletionDate: "",
      expectedCompletionTime: "",
    });
    setShowTADAModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true); // Start loading

    const currentDateTime = formatDateTime(new Date());
    // console.log("currentDateTime", currentDateTime);
    const id = selectedTicket?.id;

    try {
      const response = await fetch(sheet_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          sheetId: Sheet_Id,
          sheetName: "Ticket_Enquiry",
          action: "update",
          rowIndex: (id + 6).toString(),
          columnData: JSON.stringify({
            CC: currentDateTime,
            CE: formatDateTime(formData.travelDate),
            CF: formatDateTime(formData.returnDate || ""),
            CG: formData.destination || "",
            CH: formData.purposeOfTravel || "",
            CI: formData.amount || "",
            ET: formData.expectedCompletionDate || "",
            EU: formData.expectedCompletionTime || "",
          }),
        }).toString(),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update Google Sheet");
      }

      if (result.success) {
        setPendingData((prevPending) =>
          prevPending.filter(
            (ticket) => ticket.ticketId !== selectedTicket.ticketId
          )
        );
        setHistoryData((prevHistory) => [
          {
            ...selectedTicket,
            actual6: currentDateTime,
            travelDate: formData.travelDate,
            returnDate: formData.returnDate,
            destinationInput: formData.destination,
            purposeOfTravel: formData.purposeOfTravel,
            amount: formData.amount,
            expectedCompletionDate: formData.expectedCompletionDate,
            expectedCompletionTime: formData.expectedCompletionTime,
          },
          ...prevHistory,
        ]);

        toast({
          title: "Success",
          description: "Ticket details saved successfully",
        });

        setShowTADAModal(false);
        // fetchTickets(); // Refresh the ticket list
      } else {
        throw new Error(result.error || "Failed to save ticket details");
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to save ticket details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [cancelSubmit, setCancelSubmit] = useState(false);

  const handleSubmitCancel = async (e) => {
    e.preventDefault();

    setCancelSubmit(true);

    const currentDateTime = formatDateTime(new Date());

    try {
      const rowData = [
        currentDateTime,
        selectedTicket.ticketId || "", // Call Type
        selectedTicket.clientName || "", // Enquiry Receiver Name
        selectedTicket.phoneNumber || "", // Warranty Check
        selectedTicket.emailAddress || "", // Bill Number Input
        selectedTicket.category || "", // Bill Number Input

        selectedTicket.title || "", // Machine Name
        selectedTicket.description || "", // Machine Name
        "TADA", // Enquiry Type (second one)
        formData.cancelRemarks || "",
      ];

      // console.log("rowDAta", formData);

      const response = await fetch(sheet_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          sheetName: "Cancel",
          action: "insert",
          rowData: JSON.stringify(rowData),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // setTickets([...tickets, newTicket]);
        setPendingData((prevPending) =>
          prevPending.filter(
            (ticket) => ticket.ticketId !== selectedTicket.ticketId
          )
        );
        toast({
          title: "Success",
          description: "Ticket details Cancle successfully",
        });
        setShowTADAModal(false);
        setIsCancelled(false);
      } else {
        throw new Error(result.error || "Failed to save ticket");
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to save ticket. Data stored locally.",
        variant: "destructive",
      });

      // setTickets([...tickets, newTicket]);
    } finally {
      setCancelSubmit(false);
      // setShowForm(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

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

  const filteredPendingDataa = pendingData
    .filter((item) => {
      const q = searchItem.toLowerCase();
      const matchesSearch =
        String(item.ticketId || "").toLowerCase().includes(q) ||
        String(item.clientName || "").toLowerCase().includes(q) ||
        String(item.companyName || "").toLowerCase().includes(q) ||
        String(item.phoneNumber || "").toLowerCase().includes(q);
      return matchesSearch;
    })
    .reverse();

  const filteredHistoryDataa = historyData
    .filter((item) => {
      const q = searchItem.toLowerCase();
      const matchesSearch =
        String(item.ticketId || "").toLowerCase().includes(q) ||
        String(item.clientName || "").toLowerCase().includes(q) ||
        String(item.companyName || "").toLowerCase().includes(q) ||
        String(item.phoneNumber || "").toLowerCase().includes(q);
      return matchesSearch;
    })
    .reverse();

  const userName = localStorage.getItem("currentUsername");

  const roleStorage = localStorage.getItem("o2d-auth-storage");
  const parsedData = JSON.parse(roleStorage);
  const role = parsedData.state.user.role;

  const filteredPendingData = role === "user" ? filteredPendingDataa.filter(
    (item) => item["CREName"] === userName
  )
    : role === "engineer" ? filteredPendingDataa.filter((item) => item["engineerAssign"] === userName)
      : filteredPendingDataa;


  const filteredHistoryData = role === "user" ? filteredHistoryDataa.filter(
    (item) => item["CREName"] === userName
  ) : role === "engineer" ? filteredHistoryDataa.filter((item) => item["engineerAssign"] === userName) : filteredHistoryDataa;

  // console.log("filteredHistoryDataa", filteredHistoryDataa);

  return (
    <div className="space-y-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-t-lg border-b border-blue-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Left Side: Tabs buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <TabsList className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <TabsTrigger
                  value="pending"
                  data-testid="tab-pending"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Pending ({filteredPendingData.length})
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  data-testid="tab-history"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  History ({filteredHistoryData.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Right Side: Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 md:justify-end w-full md:w-auto">
              <div className="relative flex-1 max-w-md w-full">
                <Input
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
            <div className="mt-2">
              <TabsContent value="pending" className="mt-0">
              <div className="relative overflow-x-auto">
                <div className="max-h-[calc(103vh-200px)] overflow-y-auto">
                  <table className="hidden sm:block w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[120px] sticky top-0">
                          Action
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Date
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[120px] sticky top-0">
                          Ticket ID
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Source of enquiry
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Call type
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[180px] sticky top-0">
                          Enquiry Receiver Name
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Client Type
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
                          Billing Address
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                          Site Address
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          GST No.
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Machine Name
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Category
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                          Mention Issue
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Service Location
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Quotation No.
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Warranty Check
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Engineer Assign
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Site Name
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Date of Visit
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Transportation
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-center w-[120px] sticky top-0">
                          Quotation PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {filteredPendingData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={24}
                            className="text-center py-8 bg-white"
                            data-testid="text-no-pending"
                          >
                            {fetchLoading ? (
                              <div className="flex justify-center items-center text-blue-700">
                                <LoaderIcon className="animate-spin w-8 h-8" />
                              </div>
                            ) : (
                              <h1 className="text-blue-700">
                                No pending TADA requests found.
                              </h1>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredPendingData.map((ticket, ind) => (
                          <tr
                            key={ticket.id}
                            className={
                              ind % 2 === 0 ? "bg-blue-50/50" : "bg-white"
                            }
                          >
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 hover:text-blue-700 transition-all duration-300 border border-blue-200 hover:border-blue-300 rounded-lg px-3 py-1.5 shadow-sm hover:shadow-md group"
                                onClick={() => handleTADAClick(ticket)}
                                data-testid={`button-tada-${ticket.ticketId}`}
                              >
                                <Eye className="w-4 h-4 mr-2 transition-all group-hover:scale-110 text-blue-500 group-hover:text-blue-600" />
                                <span className="font-medium">TADA</span>
                              </Button>
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {formatDate(ticket.timeStemp)}
                            </td>
                            <td className="px-4 py-3 font-medium text-blue-800">
                              {ticket.ticketId}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.sourceOfEnquiry || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.callType || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.enquiryReceiverName || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.clientType || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.companyName || "-"}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.clientName}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.phoneNumber}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.gstAddress || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.siteAddress || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.gstNo || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.machineName || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.category || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.mentionIssue || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.serviceLocation || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.quotationNo ? String(ticket.quotationNo).replace(/^(Quotation|Quo|QUO|Quo\.)[:\-\s.]*/i, "").trim() : "-"}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.warrantyCheck}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.engineerAssign || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.siteName || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {formatDate(ticket.dateOfVisit) || ""}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {ticket.transportation || ""}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {ticket.quotationPdfLink ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full p-1"
                                  onClick={() => window.open(ticket.quotationPdfLink, "_blank")}
                                  title="View Quotation PDF"
                                >
                                  <Eye className="w-5 h-5" />
                                </Button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-4">
                    {filteredPendingData.length === 0 ? (
                      <div
                        className="text-center py-8 bg-white"
                        data-testid="text-no-pending"
                      >
                        {fetchLoading ? (
                          <div className="flex justify-center items-center text-blue-700">
                            <LoaderIcon className="animate-spin w-8 h-8" />
                          </div>
                        ) : (
                          <h1 className="text-blue-700">
                            No pending TADA requests found.
                          </h1>
                        )}
                      </div>
                    ) : (
                      filteredPendingData.map((ticket, ind) => (
                        <Card
                          key={ticket.id}
                          className={`${ind % 2 === 0 ? "bg-blue-50/50" : "bg-white"
                            } border-l-4 border-l-blue-500`}
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Header with Ticket ID and Action */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-blue-800 text-lg">
                                  {ticket.ticketId}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {ticket.clientName}
                                </p>
                                <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                                  <p className="text-sm">
                                    <span className="font-medium text-gray-500">Company:</span>{" "}
                                    <span className="text-blue-700">{ticket.companyName || "N/A"}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium text-gray-500">Quotation No:</span>{" "}
                                    <span className="text-blue-700">{ticket.quotationNo ? String(ticket.quotationNo).replace(/^(Quotation|Quo|QUO|Quo\.)[:\-\s.]*/i, "").trim() : "N/A"}</span>
                                  </p>
                                  {ticket.quotationPdfLink && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm font-medium text-gray-500">PDF:</span>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-blue-600 font-medium flex items-center gap-1"
                                        onClick={() => window.open(ticket.quotationPdfLink, "_blank")}
                                      >
                                        <Eye className="w-3 h-3" /> View
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 border border-blue-200"
                                onClick={() => handleTADAClick(ticket)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                TADA
                              </Button>
                            </div>

                            {/* Contact & Warranty Info */}
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
                                  Warranty
                                </p>
                                <p className="text-blue-900">
                                  {ticket.warrantyCheck}
                                </p>
                              </div>
                            </div>

                            {/* Machine & Enquiry Details */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Machine
                                </p>
                                <p className="text-blue-900">
                                  {ticket.machineName || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Call Type
                                </p>
                                <p className="text-blue-900">
                                  {ticket.callType || "N/A"}
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
                                  {ticket.engineerAssign || "N/A"}
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

                            {/* Visit Date & Transportation */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Visit Date
                                </p>
                                <p className="text-blue-900">
                                  {formatDate(ticket.dateOfVisit) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Transportation
                                </p>
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
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
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="relative overflow-x-auto">
                <div className="max-h-[calc(103vh-200px)] overflow-y-auto">
                  <table className="hidden sm:block w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Date
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[120px] sticky top-0">
                          Ticket ID
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Source of enquiry
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Call type
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[180px] sticky top-0">
                          Enquiry Receiver Name
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Client Type
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
                          Billing Address
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                          Site Address
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          GST No.
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Machine Name
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Category
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[200px] sticky top-0">
                          Mention Issue
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Service Location
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Quotation No.
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Engineer Assign
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Travel Date
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Return Date
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Destination
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Purpose
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-left w-[150px] sticky top-0">
                          Amount
                        </th>
                        <th className="text-white border-b border-blue-500 px-4 py-3 text-center w-[120px] sticky top-0">
                          Quotation PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {filteredHistoryData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={24}
                            className="text-center py-8 bg-white"
                            data-testid="text-no-history"
                          >
                            {fetchLoading ? (
                              <div className="flex justify-center items-center text-blue-700">
                                <LoaderIcon className="animate-spin w-8 h-8" />
                              </div>
                            ) : (
                              <h1 className="text-blue-700">
                                No TADA history found.
                              </h1>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredHistoryData.map((ticket, ind) => (
                          <tr
                            key={ind}
                            className={
                              ind % 2 === 0 ? "bg-blue-50/50" : "bg-white"
                            }
                          >
                            <td className="px-4 py-3 text-blue-900">
                              {formatDate(ticket.timeStemp)}
                            </td>
                            <td className="px-4 py-3 font-medium text-blue-800">
                              {ticket.ticketId}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.sourceOfEnquiry || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.callType || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.enquiryReceiverName || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.clientType || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.companyName || "-"}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.clientName}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.phoneNumber}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.gstAddress || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.siteAddress || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.gstNo || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.machineName || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.category || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.mentionIssue || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.serviceLocation || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.quotationNo ? String(ticket.quotationNo).replace(/^(Quotation|Quo|QUO|Quo\.)[:\-\s.]*/i, "").trim() : "-"}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.engineerAssign || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {formatDate(ticket.travelDate) || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {formatDate(ticket.returnDate) || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.destinationInput || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              {ticket.purposeOfTravel || ""}
                            </td>
                            <td className="px-4 py-3 text-blue-900">
                              ₹{ticket.amount || "0"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {ticket.quotationPdfLink ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full p-1"
                                  onClick={() => window.open(ticket.quotationPdfLink, "_blank")}
                                  title="View Quotation PDF"
                                >
                                  <Eye className="w-5 h-5" />
                                </Button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
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
                            No TADA history found.
                          </h1>
                        )}
                      </div>
                    ) : (
                      filteredHistoryData.map((ticket, ind) => (
                        <Card
                          key={ind}
                          className={`${ind % 2 === 0 ? "bg-blue-50/50" : "bg-white"
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
                              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-sm">
                                <p><span className="font-medium text-gray-500">Company:</span> <span className="text-blue-700">{ticket.companyName || "N/A"}</span></p>
                                <p><span className="font-medium text-gray-500">Quotation No:</span> <span className="text-blue-700">{ticket.quotationNo ? String(ticket.quotationNo).replace(/^(Quotation|Quo|QUO|Quo\.)[:\-\s.]*/i, "").trim() : "N/A"}</span></p>
                                {ticket.quotationPdfLink && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto text-blue-600 font-medium flex items-center gap-1 mt-1"
                                    onClick={() => window.open(ticket.quotationPdfLink, "_blank")}
                                  >
                                    <Eye className="w-3 h-3" /> View Quotation
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Engineer & Amount */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Engineer
                                </p>
                                <p className="text-blue-900">
                                  {ticket.engineerAssign || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Amount
                                </p>
                                <p className="text-blue-900 font-semibold">
                                  ₹{ticket.amount || "0"}
                                </p>
                              </div>
                            </div>

                            {/* Travel Dates */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Travel Date
                                </p>
                                <p className="text-blue-900">
                                  {formatDate(ticket.travelDate) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Return Date
                                </p>
                                <p className="text-blue-900">
                                  {formatDate(ticket.returnDate) || "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Destination */}
                            <div>
                              <p className="text-gray-500 font-medium text-sm">
                                Destination
                              </p>
                              <p className="text-blue-900">
                                {ticket.destinationInput || "N/A"}
                              </p>
                            </div>

                            {/* Purpose */}
                            <div>
                              <p className="text-gray-500 font-medium text-sm">
                                Purpose of Travel
                              </p>
                              <p className="text-blue-900 line-clamp-2">
                                {ticket.purposeOfTravel || "N/A"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </CardContent>
      </Card>
    </Tabs>

      {/* TADA Modal */}
      <Modal
        isOpen={showTADAModal}
        onClose={() => setShowTADAModal(false)}
        title="TADA (Travel and Daily Allowance)"
        size="2xl"
      >
        <div className="bg-white rounded-lg max-h-[70vh] overflow-y-auto">
          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6  "
            >
              <div className="flex items-center space-x-2 mb-10">
                <input
                  type="checkbox"
                  id="cancelTicket"
                  checked={isCancelled}
                  onChange={(e) => setIsCancelled(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <Label
                  htmlFor="cancelTicket"
                  className="text-red-600 font-medium"
                >
                  Cancel Ticket
                </Label>
              </div>

              <div></div>

              {/* Pre-filled fields */}
              <div className="space-y-1">
                <Label className="text-gray-600 font-medium">Ticket ID</Label>
                <Input
                  value={formData.ticketId || ""}
                  disabled
                  className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 font-medium">Client Name</Label>
                <Input
                  value={formData.clientName || ""}
                  disabled
                  className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 font-medium">
                  Phone Number
                </Label>
                <Input
                  value={formData.phoneNumber || ""}
                  disabled
                  className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 font-medium">
                  Machine Name
                </Label>
                <Input
                  value={formData.machineName || ""}
                  disabled
                  className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 font-medium">
                  Engineer Assign
                </Label>
                <Input
                  value={formData.engineerAssign || ""}
                  disabled
                  className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>

              {!isCancelled && (
                <>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Site Name
                    </Label>
                    <Input
                      value={formData.siteName || ""}
                      disabled
                      className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2 px-3 focus:outline-none"
                    />
                  </div>

                  {/* Editable fields */}
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Travel Date *
                    </Label>
                    <Input
                      type="date"
                      value={formData.travelDate || ""}
                      data-testid="input-travel-date"
                      className="bg-gray-50 border border-gray-200 text-gray-500 rounded-lg py-2 px-3 focus:outline-none cursor-not-allowed"
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Return Date *
                    </Label>
                    <Input
                      type="date"
                      value={formData.returnDate || ""}
                      onChange={(e) =>
                        handleInputChange("returnDate", e.target.value)
                      }
                      data-testid="input-return-date"
                      className="border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Destination *
                    </Label>
                    <Input
                      placeholder="Enter destination"
                      value={formData.destination || ""}
                      onChange={(e) =>
                        handleInputChange("destination", e.target.value)
                      }
                      data-testid="input-destination"
                      className="border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Purpose of Travel *
                    </Label>
                    <Input
                      placeholder="Enter purpose"
                      value={formData.purposeOfTravel || ""}
                      onChange={(e) =>
                        handleInputChange("purposeOfTravel", e.target.value)
                      }
                      data-testid="input-purpose"
                      className="border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Expected Completion Date *
                    </Label>
                    <Input
                      type="date"
                      value={formData.expectedCompletionDate || ""}
                      onChange={(e) =>
                        handleInputChange("expectedCompletionDate", e.target.value)
                      }
                      required
                      data-testid="input-expected-completion-date"
                      className="border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Expected Completion Time *
                    </Label>
                    <Input
                      type="time"
                      value={formData.expectedCompletionTime || ""}
                      onChange={(e) =>
                        handleInputChange("expectedCompletionTime", e.target.value)
                      }
                      required
                      data-testid="input-expected-completion-time"
                      className="border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-gray-600 font-medium">
                      Amount *
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={formData.amount || ""}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      data-testid="input-amount"
                      className="border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTADAModal(false)}
                      data-testid="button-cancel-tada"
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      data-testid="button-submit-tada"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <Loader2Icon className="animate-spin mr-2" />
                          Processing...
                        </span>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {isCancelled && (
                <>
                  <div>
                    <Label>Remarks</Label>
                    <Textarea
                      rows={3}
                      value={formData.cancelRemarks || ""}
                      onChange={(e) =>
                        handleInputChange("cancelRemarks", e.target.value)
                      }
                      data-testid="textarea-remark"
                    />
                  </div>

                  <div className="flex justify-center py-6">
                    <Button
                      type="button"
                      onClick={handleSubmitCancel}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                    >
                      {cancelSubmit && (
                        <Loader2Icon className="animate-spin w-4 h-4 mr-2" />
                      )}
                      Confirm Cancellation
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
