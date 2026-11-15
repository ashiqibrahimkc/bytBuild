import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail, companyName, backupData } = body;

    if (!recipientEmail || typeof recipientEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid recipient Gmail address is required." },
        { status: 400 }
      );
    }

    if (!backupData || !backupData.data) {
      return NextResponse.json(
        { success: false, message: "Invalid or empty backup data." },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_BACKUP_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    // If environment variables are not set yet
    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json({
        success: false,
        notConfigured: true,
        message:
          "Gmail SMTP is not configured in .env. Please set GMAIL_BACKUP_USER and GMAIL_APP_PASSWORD (16-char Google App Password).",
      });
    }

    // Clean any spaces from the 16-character Google App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const cleanPassword = gmailAppPassword.replace(/\s+/g, "");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: cleanPassword,
      },
    });

    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `bytbuild_backup_${timestamp}.json`;

    const stats = backupData.stats || {};
    const sitesCount = stats.sitesCount ?? backupData.data.sites?.length ?? 0;
    const workersCount = stats.workersCount ?? backupData.data.workers?.length ?? 0;
    const vendorsCount = stats.vendorsCount ?? backupData.data.vendors?.length ?? 0;
    const purchasesCount = stats.purchasesCount ?? backupData.data.vendorPurchases?.length ?? 0;
    const auditLogsCount = stats.auditLogsCount ?? backupData.data.auditLogs?.length ?? 0;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 18px 24px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">BytBuild Construction ERP</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; font-mono;">Automated Database & Cash Flow Backup</p>
        </div>

        <h2 style="color: #0f172a; font-size: 16px; margin-bottom: 8px;">Backup Snapshot for: <span style="color: #d97706;">${companyName || "BytBuild Constructions"}</span></h2>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          A full certified database snapshot was generated on <strong>${dateStr}</strong>. The backup file is attached to this email. Keep this file safe for disaster recovery or offline archiving.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">Backup Summary</h3>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Active Sites:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${sitesCount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Registered Workers:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${workersCount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Active Vendors:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${vendorsCount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Material Bills Recorded:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${purchasesCount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Audit Trail Events:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${auditLogsCount}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          <p style="margin: 0;">To restore this database, upload the attached JSON file in <strong>BytBuild &gt; Backup &amp; Recovery</strong>.</p>
          <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} BytBuild Systems Inc. Confidential Business Backup.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"BytBuild ERP Backup" <${gmailUser}>`,
      to: recipientEmail,
      subject: `[BytBuild Backup] ${companyName || "BytBuild ERP"} - ${dateStr}`,
      html: emailHtml,
      attachments: [
        {
          filename,
          content: jsonString,
          contentType: "application/json",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Complete database backup successfully delivered to ${recipientEmail}`,
    });
  } catch (error: any) {
    console.error("Backup email dispatch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send backup email via Gmail SMTP.",
      },
      { status: 500 }
    );
  }
}

