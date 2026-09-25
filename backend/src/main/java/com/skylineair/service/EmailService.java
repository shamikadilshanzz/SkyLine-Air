package com.skylineair.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply.skylineair@gmail.com}")
    private String senderEmail;

    /**
     * Sends the OTP verification email with HTML styling
     * Returns true if sent successfully via SMTP, false if fallback/logged
     */
    public boolean sendOtpEmail(String recipientEmail, String passengerName, String otpCode, Double amount, String pnr) {
        String safeName = (passengerName != null && !passengerName.trim().isEmpty()) ? passengerName : "Valued Passenger";
        String safePnr = (pnr != null && !pnr.trim().isEmpty()) ? pnr : "Pending";
        String safeAmount = (amount != null) ? String.format("%.2f", amount) : "0.00";

        log.info("=================================================");
        log.info("📧 [SkyLine Air OTP Dispatch]");
        log.info("Recipient : {}", recipientEmail);
        log.info("Passenger : {}", safeName);
        log.info("PNR Ref   : {}", safePnr);
        log.info("Amount    : ${} USD", safeAmount);
        log.info("🔑 OTP CODE: {}", otpCode);
        log.info("=================================================");

        if (mailSender == null) {
            log.warn("JavaMailSender is not initialized. OTP logged to console above.");
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(senderEmail, "SkyLine Air Security");
            helper.setTo(recipientEmail);
            helper.setSubject("Your SkyLine Air Payment Verification Code: " + otpCode);

            String htmlBody = buildOtpHtmlTemplate(safeName, otpCode, safeAmount, safePnr);
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);
            log.info("✅ Real-time OTP email delivered successfully to {}", recipientEmail);
            return true;
        } catch (Exception ex) {
            log.error("⚠️ Failed to deliver OTP email via SMTP to {}: {}. (Active OTP: {})", recipientEmail, ex.getMessage(), otpCode);
            return false;
        }
    }

    /**
     * Constructs a modern, responsive HTML email template for SkyLine Air
     */
    private String buildOtpHtmlTemplate(String name, String otpCode, String amount, String pnr) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>SkyLine Air Payment OTP Verification</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
                .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 30, 92, 0.08); border: 1px solid #e2e8f0; }
                .header { background: linear-gradient(135deg, #0a1230 0%%, #0f1e5c 50%%, #1d4ed8 100%%); padding: 32px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
                .header p { margin: 6px 0 0; color: #93c5fd; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                .content { padding: 32px 28px; color: #1e293b; }
                .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
                .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
                .otp-box { background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
                .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 8px; }
                .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; margin: 0; }
                .otp-exp { font-size: 12px; color: #ea580c; font-weight: 700; margin-top: 10px; }
                .details-card { background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
                .detail-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
                .detail-row:last-child { border-bottom: none; }
                .detail-label { color: #64748b; font-weight: 600; }
                .detail-val { color: #0f172a; font-weight: 700; }
                .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #991b1b; line-height: 1.5; margin-bottom: 24px; }
                .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <p>SkyLine Air International</p>
                  <h1>3D Secure Payment Verification</h1>
                </div>
                <div class="content">
                  <div class="greeting">Hello %s,</div>
                  <div class="desc">
                    We received a request to authorize payment for your SkyLine Air flight booking. Please enter the One-Time Password (OTP) below to verify and complete your booking.
                  </div>

                  <div class="otp-box">
                    <div class="otp-label">Your Verification OTP</div>
                    <div class="otp-code">%s</div>
                    <div class="otp-exp">⏳ Valid for 5 minutes only</div>
                  </div>

                  <div class="details-card">
                    <div class="detail-row">
                      <span class="detail-label">Booking Reference (PNR):</span>
                      <span class="detail-val">%s</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Payment Amount:</span>
                      <span class="detail-val">$%s USD</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Security Gateway:</span>
                      <span class="detail-val">256-Bit SSL 3D Secure</span>
                    </div>
                  </div>

                  <div class="warning-box">
                    <strong>Security Notice:</strong> Never share this code with anyone. SkyLine Air staff will never ask for your OTP. If you did not initiate this transaction, please contact airline support immediately.
                  </div>
                </div>
                <div class="footer">
                  © 2026 SkyLine Air Airways Inc. All rights reserved. &bull; Electronic Ticketing &amp; Reservations
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, otpCode, pnr, amount);
    }
}
