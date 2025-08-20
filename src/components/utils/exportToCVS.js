export function exportInvoicesToCSV(invoices) {
    const headers = [
      "Date",
      "Plan",
      "Billing Period",
      "Amount",
      "Status",
      "Receipt Link",
      "PDF Link",
    ];
  
    const rows = invoices.map((inv) => [
      new Date(inv.created * 1000).toLocaleDateString(),
      inv.plan_nickname || "—",
      `${new Date(inv.billing_period_start * 1000).toLocaleDateString()} → ${new Date(
        inv.billing_period_end * 1000
      ).toLocaleDateString()}`,
      `$${(inv.amount_paid / 100).toFixed(2)}`,
      inv.status,
      inv.hosted_invoice_url || "",
      inv.invoice_pdf || "",
    ]);
  
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "billing-history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }