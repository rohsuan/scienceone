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

interface VerificationEmailProps {
  url: string;
  name: string;
}

export function VerificationEmail({ url, name }: VerificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Verify your ScienceOne account to get started</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ScienceOne</Heading>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Verify your email address</Heading>

            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              Welcome to ScienceOne. We&apos;re glad you&apos;re here. Before you can start
              reading, please verify your email address by clicking the button
              below.
            </Text>

            <Section style={buttonContainer}>
              <Button href={url} style={button}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={paragraph}>
              This verification link expires in 24 hours. If you did not create
              a ScienceOne account, you can safely ignore this email.
            </Text>

            <Text style={smallText}>
              If the button above doesn&apos;t work, copy and paste this link into
              your browser:
            </Text>
            <Text style={link}>{url}</Text>
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

export default VerificationEmail;

// Styles
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

const link = {
  fontSize: "13px",
  color: "#1e2d5e",
  wordBreak: "break-all" as const,
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
