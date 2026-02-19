import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  Hr,
  Preview,
} from "@react-email/components";

export interface PurchaseConfirmationEmailProps {
  bookTitle: string;
  bookSlug: string;
  amount: number;
  purchaseDate: Date;
  appUrl: string;
}

export function PurchaseConfirmationEmail({
  bookTitle,
  bookSlug,
  amount,
  purchaseDate,
  appUrl,
}: PurchaseConfirmationEmailProps) {
  const formattedDate = purchaseDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html lang="en">
      <Head />
      <Preview>Your ScienceOne purchase: {bookTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ScienceOne</Heading>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Purchase Confirmed</Heading>

            <Text style={paragraph}>
              Thank you for your purchase. You now have full digital access to:
            </Text>

            <Text style={bookTitleStyle}>{bookTitle}</Text>

            <Text style={smallText}>
              Amount: ${amount.toFixed(2)} USD
            </Text>
            <Text style={smallText}>Date: {formattedDate}</Text>

            <Section style={buttonContainer}>
              <Button href={`${appUrl}/read/${bookSlug}`} style={button}>
                Start Reading
              </Button>
            </Section>

            <Text style={downloadNote}>
              PDF and EPUB downloads will be available soon. We&apos;ll notify
              you when they&apos;re ready.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} ScienceOne. All rights reserved.
            </Text>
            <Text style={footerText}>
              STEM books with first-class mathematical typesetting.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PurchaseConfirmationEmail;

// Styles — shared with verification.tsx for consistency
const body = {
  backgroundColor: "#f8f9fa",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const header = {
  backgroundColor: "#1e2d5e",
  padding: "32px 40px",
};

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0",
  letterSpacing: "-0.5px",
};

const content = {
  padding: "40px",
};

const heading = {
  fontSize: "22px",
  fontWeight: "600",
  color: "#1a1a2e",
  marginBottom: "24px",
  letterSpacing: "-0.3px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  marginBottom: "16px",
};

const bookTitleStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a2e",
  marginBottom: "16px",
  lineHeight: "1.4",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1e2d5e",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const smallText = {
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "4px",
};

const downloadNote = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "24px",
  lineHeight: "1.5",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const footer = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
};

const footerText = {
  fontSize: "13px",
  color: "#9ca3af",
  margin: "4px 0",
  textAlign: "center" as const,
};
