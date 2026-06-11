const {
  buildButton,
  buildInfoBox,
  buildWarningBox,
  buildStatusBox,
  buildOtpBox,
  buildEmailHtml,
  buildOtpEmailBody,
  buildNotificationEmailBody,
  EMAIL_COLORS,
} = require("../../shared/lib/emailTemplateBuilder");

describe("Email Template Builder", () => {
  describe("Helper Functions", () => {
    describe("buildButton", () => {
      it("should create a button with default styling", () => {
        const button = buildButton({
          text: "Click Me",
          href: "http://example.com",
        });

        expect(button).toContain("Click Me");
        expect(button).toContain("http://example.com");
        expect(button).toContain("padding:8px 20px");
        expect(button).toContain("font-size:14px");
        expect(button).toContain("border-radius:6px");
        expect(button).toContain(EMAIL_COLORS.primary);
      });

      it("should accept custom colors and styling", () => {
        const button = buildButton({
          text: "Custom",
          href: "http://example.com",
          bgColor: "#ff0000",
          textColor: "#ffffff",
        });

        expect(button).toContain("background:#ff0000");
        expect(button).toContain("color:#ffffff");
      });
    });

    describe("buildOtpBox", () => {
      it("should create an OTP box with proper styling", () => {
        const otpBox = buildOtpBox("123456");

        expect(otpBox).toContain("123456");
        expect(otpBox).toContain("font-size:18px");
        expect(otpBox).toContain("letter-spacing:4px");
        expect(otpBox).toContain("border:1px dashed");
        expect(otpBox).toContain(EMAIL_COLORS.primary);
      });
    });

    describe("buildWarningBox", () => {
      it("should create a warning box with default styling", () => {
        const warningBox = buildWarningBox({
          title: "Warning",
          message: "This is a warning message",
        });

        expect(warningBox).toContain("Warning");
        expect(warningBox).toContain("This is a warning message");
        expect(warningBox).toContain("border-radius:6px");
        expect(warningBox).toContain(EMAIL_COLORS.bgWarning);
        expect(warningBox).toContain(EMAIL_COLORS.borderWarning);
      });

      it("should accept custom colors", () => {
        const warningBox = buildWarningBox({
          title: "Error",
          message: "This is an error",
          bgColor: "#fff1f0",
          borderColor: "#ffccc7",
          titleColor: "#ff4d4f",
        });

        expect(warningBox).toContain("background:#fff1f0");
        expect(warningBox).toContain("border:1px solid #ffccc7");
        expect(warningBox).toContain("color:#ff4d4f");
      });
    });

    describe("buildInfoBox", () => {
      it("should create an info box with label/value pairs", () => {
        const infoBox = buildInfoBox({
          fields: [
            { label: "Name", value: "John Doe" },
            { label: "Email", value: "john@example.com" },
          ],
        });

        expect(infoBox).toContain("Name");
        expect(infoBox).toContain("John Doe");
        expect(infoBox).toContain("Email");
        expect(infoBox).toContain("john@example.com");
        expect(infoBox).toContain("font-size:12px");
        expect(infoBox).toContain("font-weight:600");
        expect(infoBox).toContain("border-left:3px solid");
      });

      it("should not use uppercase labels", () => {
        const infoBox = buildInfoBox({
          fields: [{ label: "Reference number", value: "12345" }],
        });

        expect(infoBox).toContain("Reference number");
        expect(infoBox).not.toContain("text-transform:uppercase");
        expect(infoBox).not.toContain("letter-spacing:1px");
      });

      it("should support contextual backgrounds with accent border", () => {
        const infoBox = buildInfoBox({
          fields: [{ label: "Status", value: "Active" }],
          bgColor: EMAIL_COLORS.bgSuccess,
          borderColor: EMAIL_COLORS.borderSuccess,
          accentColor: EMAIL_COLORS.success,
        });

        expect(infoBox).toContain(EMAIL_COLORS.bgSuccess);
        expect(infoBox).toContain("border:1px solid #b7eb8f");
        expect(infoBox).toContain("border-left:3px solid #52c41a");
      });

      it("should support custom font sizes and colors", () => {
        const infoBox = buildInfoBox({
          fields: [
            {
              label: "Amount",
              value: "$100",
              fontSize: "16px",
              fontWeight: "700",
            },
          ],
        });

        expect(infoBox).toContain("font-size:16px");
        expect(infoBox).toContain("font-weight:700");
      });
    });

    describe("buildStatusBox", () => {
      it("should create a status box with labels and values", () => {
        const statusBox = buildStatusBox({
          label1: "Application reference",
          value1: "APP-12345",
          label2: "Business name",
          value2: "Test Business",
        });

        expect(statusBox).toContain("Application reference");
        expect(statusBox).toContain("APP-12345");
        expect(statusBox).toContain("Business name");
        expect(statusBox).toContain("Test Business");
        expect(statusBox).toContain("border-left:3px solid");
        expect(statusBox).toContain("border-radius:6px");
      });

      it("should not use uppercase labels", () => {
        const statusBox = buildStatusBox({
          label1: "Application reference",
          value1: "APP-12345",
          label2: "Business name",
          value2: "Test Business",
        });

        expect(statusBox).not.toContain("text-transform:uppercase");
        expect(statusBox).not.toContain("letter-spacing:1px");
      });

      it("should support extra field for rejection reason", () => {
        const statusBox = buildStatusBox({
          label1: "Application reference",
          value1: "APP-12345",
          label2: "Business name",
          value2: "Test Business",
          extraLabel: "Reason",
          extraValue: "Incomplete documentation",
        });

        expect(statusBox).toContain("Reason");
        expect(statusBox).toContain("Incomplete documentation");
      });
    });
  });

  describe("Main Builder Functions", () => {
    describe("buildEmailHtml", () => {
      it("should wrap content in full email HTML shell", () => {
        const html = buildEmailHtml({
          bodyContent: "<p>Test content</p>",
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain('<html lang="en">');
        expect(html).toContain("Test content");
        expect(html).toContain("Terms of Service");
        expect(html).toContain("Privacy Policy");
        expect(html).toContain("BizClear Manual");
        expect(html).toContain("BizClear");
      });

      it("should include the BizClear logo SVG", () => {
        const html = buildEmailHtml({
          bodyContent: "<p>Test</p>",
        });

        expect(html).toContain("<svg");
        expect(html).toContain('viewBox="0 0 348 326"');
        expect(html).toContain('fill="none"');
      });

      it("should not contain the old dark header", () => {
        const html = buildEmailHtml({
          bodyContent: "<p>Test</p>",
        });

        expect(html).not.toContain("background:#003a70");
        expect(html).not.toContain("BizClear");
      });
    });

    describe("buildOtpEmailBody", () => {
      it("should create OTP email with proper structure", () => {
        const html = buildOtpEmailBody({
          heading: "Your verification code",
          intro: "Use this code to sign in",
          code: "123456",
          expiry: 10,
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("Your verification code");
        expect(html).toContain("Use this code to sign in");
        expect(html).toContain("123456");
        expect(html).toContain("10 minutes");
        expect(html).toContain("Do not share this code with anyone");
      });

      it("should not contain emojis", () => {
        const html = buildOtpEmailBody({
          heading: "Your verification code",
          intro: "Use this code to sign in",
          code: "123456",
          expiry: 10,
        });

        expect(html).not.toContain("⚠️");
        expect(html).not.toContain("🚨");
        expect(html).not.toContain("⏰");
      });

      it("should use proper OTP box styling (not oversized)", () => {
        const html = buildOtpEmailBody({
          heading: "Your verification code",
          intro: "Use this code to sign in",
          code: "123456",
          expiry: 10,
        });

        expect(html).toContain("font-size:18px");
        expect(html).not.toContain("font-size:32px");
        expect(html).toContain("letter-spacing:4px");
        expect(html).not.toContain("letter-spacing:8px");
      });
    });

    describe("buildNotificationEmailBody", () => {
      it("should create notification email with greeting and intro", () => {
        const html = buildNotificationEmailBody({
          heading: "Welcome",
          greeting: "John",
          intro: "Your account has been created",
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("Welcome");
        expect(html).toContain("Hi John");
        expect(html).toContain("Your account has been created");
      });

      it("should create notification without greeting when not provided", () => {
        const html = buildNotificationEmailBody({
          heading: "System Alert",
          intro: "This is a system notification",
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("System Alert");
        expect(html).toContain("This is a system notification");
        expect(html).not.toContain("Hi");
      });

      it("should include info box when fields provided", () => {
        const html = buildNotificationEmailBody({
          heading: "Account Details",
          intro: "Here are your account details",
          fields: {
            fields: [
              { label: "Username", value: "john_doe" },
              { label: "Email", value: "john@example.com" },
            ],
          },
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("Username");
        expect(html).toContain("john_doe");
        expect(html).toContain("Email");
        expect(html).toContain("john@example.com");
      });

      it("should include warning box when provided", () => {
        const html = buildNotificationEmailBody({
          heading: "Security Notice",
          intro: "Your account was accessed",
          warningBox: {
            title: "Important",
            message: "If this wasn't you, please change your password",
          },
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("Important");
        expect(html).toContain(
          "If this wasn't you, please change your password",
        );
      });

      it("should include button when provided", () => {
        const html = buildNotificationEmailBody({
          heading: "Action Required",
          intro: "Please verify your account",
          button: {
            text: "Verify Now",
            href: "http://localhost:3000/verify",
          },
          appUrl: "http://localhost:3000",
        });

        expect(html).toContain("Verify Now");
        expect(html).toContain("http://localhost:3000/verify");
        expect(html).toContain("padding:8px 20px");
        expect(html).toContain("font-size:14px");
      });

      it("should not contain emojis in any section", () => {
        const html = buildNotificationEmailBody({
          heading: "Security Alert",
          greeting: "Admin",
          intro: "Suspicious activity detected",
          warningBox: {
            title: "Warning",
            message: "Please review immediately",
          },
          appUrl: "http://localhost:3000",
        });

        expect(html).not.toContain("🚨");
        expect(html).not.toContain("⚠️");
        expect(html).not.toContain("✅");
        expect(html).not.toContain("❌");
      });
    });
  });

  describe("Design Consistency", () => {
    it("should not use uppercase labels in any builder", () => {
      const infoBox = buildInfoBox({
        fields: [{ label: "Test label", value: "Test value" }],
      });
      const statusBox = buildStatusBox({
        label1: "Test label 1",
        value1: "Test value 1",
        label2: "Test label 2",
        value2: "Test value 2",
      });

      expect(infoBox).not.toContain("text-transform:uppercase");
      expect(statusBox).not.toContain("text-transform:uppercase");
    });

    it("should use consistent border-radius of 6px", () => {
      const button = buildButton({ text: "Test", href: "http://example.com" });
      const warningBox = buildWarningBox({
        title: "Test",
        message: "Test message",
      });
      const infoBox = buildInfoBox({
        fields: [{ label: "Test", value: "Test" }],
      });
      const statusBox = buildStatusBox({
        label1: "Test",
        value1: "Test",
        label2: "Test",
        value2: "Test",
      });

      expect(button).toContain("border-radius:6px");
      expect(warningBox).toContain("border-radius:6px");
      expect(infoBox).toContain("border-radius:6px");
      expect(statusBox).toContain("border-radius:6px");
    });

    it("should use left-border accent pattern for info boxes", () => {
      const infoBox = buildInfoBox({
        fields: [{ label: "Test", value: "Test" }],
      });

      expect(infoBox).toContain("border-left:3px solid");
    });

    it("should use default font-size of 14px for values", () => {
      const infoBox = buildInfoBox({
        fields: [{ label: "Test", value: "Test value" }],
      });

      expect(infoBox).toContain("font-size:14px");
    });

    it("should use label font-size of 12px", () => {
      const infoBox = buildInfoBox({
        fields: [{ label: "Test label", value: "Test value" }],
      });

      expect(infoBox).toContain("font-size:12px");
    });
  });

  describe("Color Constants", () => {
    it("should have all required color constants", () => {
      expect(EMAIL_COLORS).toHaveProperty("primary");
      expect(EMAIL_COLORS).toHaveProperty("error");
      expect(EMAIL_COLORS).toHaveProperty("warning");
      expect(EMAIL_COLORS).toHaveProperty("success");
      expect(EMAIL_COLORS).toHaveProperty("textPrimary");
      expect(EMAIL_COLORS).toHaveProperty("textSecondary");
      expect(EMAIL_COLORS).toHaveProperty("textTertiary");
      expect(EMAIL_COLORS).toHaveProperty("border");
      expect(EMAIL_COLORS).toHaveProperty("bgWhite");
      expect(EMAIL_COLORS).toHaveProperty("bgWarning");
      expect(EMAIL_COLORS).toHaveProperty("bgError");
      expect(EMAIL_COLORS).toHaveProperty("bgSuccess");
    });

    it("should use the new primary color (#0039AF)", () => {
      expect(EMAIL_COLORS.primary).toBe("#0039AF");
    });
  });
});
