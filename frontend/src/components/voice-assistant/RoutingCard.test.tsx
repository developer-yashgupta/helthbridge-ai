import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RoutingCard from "./RoutingCard";
import { RoutingDecision } from "./ConversationDisplay";

describe("RoutingCard Component", () => {
  const mockRoutingLow: RoutingDecision = {
    facility: "ASHA",
    severity: "low",
    contactInfo: {
      name: "सुनीता देवी",
      phone: "+91-9876543210",
      address: "गांव पंचायत, जिला मुजफ्फरपुर",
      distance: "2 किमी",
    },
    reasoning: "आपके लक्षण हल्के हैं। आशा कार्यकर्ता आपकी मदद कर सकती हैं।",
  };

  const mockRoutingMedium: RoutingDecision = {
    facility: "PHC",
    severity: "medium",
    contactInfo: {
      name: "प्राथमिक स्वास्थ्य केंद्र मुजफ्फरपुर",
      phone: "+91-6222-234567",
      address: "मुख्य मार्ग, मुजफ्फरपुर, बिहार 842001",
      distance: "5 किमी",
    },
    reasoning: "आपके लक्षणों के लिए डॉक्टर से परामर्श आवश्यक है।",
  };

  const mockRoutingHigh: RoutingDecision = {
    facility: "CHC",
    severity: "high",
    contactInfo: {
      name: "सामुदायिक स्वास्थ्य केंद्र",
      phone: "+91-6222-345678",
      address: "केंद्रीय अस्पताल रोड, मुजफ्फरपुर",
    },
    reasoning: "आपकी स्थिति गंभीर है। तुरंत चिकित्सा सहायता लें।",
  };

  const mockRoutingCritical: RoutingDecision = {
    facility: "EMERGENCY",
    severity: "critical",
    contactInfo: {
      name: "आपातकालीन सेवाएं",
      phone: "108",
      address: "निकटतम अस्पताल",
    },
    reasoning: "यह एक आपातकालीन स्थिति है। तुरंत 108 पर कॉल करें।",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    global.window.open = vi.fn();
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: "" };
  });

  describe("Rendering", () => {
    it("should render routing card with all information", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      expect(screen.getByText("स्वास्थ्य सुविधा सिफारिश")).toBeInTheDocument();
      expect(screen.getByText("आशा कार्यकर्ता")).toBeInTheDocument();
      expect(screen.getByText("सुनीता देवी")).toBeInTheDocument();
      expect(screen.getByText("+91-9876543210")).toBeInTheDocument();
      expect(
        screen.getByText("गांव पंचायत, जिला मुजफ्फरपुर")
      ).toBeInTheDocument();
      expect(screen.getByText("दूरी: 2 किमी")).toBeInTheDocument();
    });

    it("should render reasoning text", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      expect(
        screen.getByText("आपके लक्षण हल्के हैं। आशा कार्यकर्ता आपकी मदद कर सकती हैं।")
      ).toBeInTheDocument();
    });

    it("should render without optional fields", () => {
      const minimalRouting: RoutingDecision = {
        facility: "ASHA",
        severity: "low",
      };

      render(<RoutingCard routing={minimalRouting} />);

      expect(screen.getByText("आशा कार्यकर्ता")).toBeInTheDocument();
      expect(screen.queryByText("कॉल करें")).not.toBeInTheDocument();
      expect(screen.queryByText("दिशा-निर्देश")).not.toBeInTheDocument();
    });
  });

  describe("Severity Display", () => {
    it("should display low severity with correct styling", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const badge = container.querySelector("[data-severity-badge]");
      expect(badge).toHaveTextContent("कम गंभीर");
      expect(badge).toHaveClass("bg-green-500");

      const card = container.querySelector("[data-routing-card]");
      expect(card).toHaveAttribute("data-severity", "low");
    });

    it("should display medium severity with correct styling", () => {
      const { container } = render(<RoutingCard routing={mockRoutingMedium} />);

      const badge = container.querySelector("[data-severity-badge]");
      expect(badge).toHaveTextContent("मध्यम गंभीर");
      expect(badge).toHaveClass("bg-yellow-500");

      const card = container.querySelector("[data-routing-card]");
      expect(card).toHaveAttribute("data-severity", "medium");
    });

    it("should display high severity with correct styling", () => {
      const { container } = render(<RoutingCard routing={mockRoutingHigh} />);

      const badge = container.querySelector("[data-severity-badge]");
      expect(badge).toHaveTextContent("गंभीर");
      expect(badge).toHaveClass("bg-orange-500");

      const card = container.querySelector("[data-routing-card]");
      expect(card).toHaveAttribute("data-severity", "high");
    });

    it("should display critical severity with correct styling", () => {
      const { container } = render(
        <RoutingCard routing={mockRoutingCritical} />
      );

      const badge = container.querySelector("[data-severity-badge]");
      expect(badge).toHaveTextContent("अत्यंत गंभीर");
      expect(badge).toHaveClass("bg-red-500");

      const card = container.querySelector("[data-routing-card]");
      expect(card).toHaveAttribute("data-severity", "critical");
    });
  });

  describe("Facility Display", () => {
    it("should display ASHA facility label", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      expect(screen.getByText("आशा कार्यकर्ता")).toBeInTheDocument();
    });

    it("should display PHC facility label", () => {
      render(<RoutingCard routing={mockRoutingMedium} />);

      expect(screen.getByText("प्राथमिक स्वास्थ्य केंद्र")).toBeInTheDocument();
    });

    it("should display CHC facility label", () => {
      const { container } = render(<RoutingCard routing={mockRoutingHigh} />);

      const facilityName = container.querySelector("[data-facility-name]");
      expect(facilityName).toHaveTextContent("सामुदायिक स्वास्थ्य केंद्र");
    });

    it("should display EMERGENCY facility label", () => {
      const { container } = render(
        <RoutingCard routing={mockRoutingCritical} />
      );

      const facilityName = container.querySelector("[data-facility-name]");
      expect(facilityName).toHaveTextContent("आपातकालीन सेवाएं");
    });

    it("should have correct facility data attribute", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const card = container.querySelector("[data-routing-card]");
      expect(card).toHaveAttribute("data-facility", "ASHA");
    });
  });

  describe("Contact Information Display", () => {
    it("should display contact name", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const name = container.querySelector("[data-contact-name]");
      expect(name).toHaveTextContent("सुनीता देवी");
    });

    it("should display phone number", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const phone = container.querySelector("[data-contact-phone]");
      expect(phone).toHaveTextContent("+91-9876543210");
    });

    it("should display address", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const address = container.querySelector("[data-contact-address]");
      expect(address).toHaveTextContent("गांव पंचायत, जिला मुजफ्फरपुर");
    });

    it("should display distance", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const distance = container.querySelector("[data-contact-distance]");
      expect(distance).toHaveTextContent("दूरी: 2 किमी");
    });

    it("should not display distance if not provided", () => {
      const routingWithoutDistance: RoutingDecision = {
        ...mockRoutingLow,
        contactInfo: {
          ...mockRoutingLow.contactInfo!,
          distance: undefined,
        },
      };

      const { container } = render(
        <RoutingCard routing={routingWithoutDistance} />
      );

      const distance = container.querySelector("[data-contact-distance]");
      expect(distance).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should render call button when phone is provided", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      const callButton = screen.getByText("कॉल करें");
      expect(callButton).toBeInTheDocument();
    });

    it("should render directions button when address is provided", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      const directionsButton = screen.getByText("दिशा-निर्देश");
      expect(directionsButton).toBeInTheDocument();
    });

    it("should not render buttons when contact info is missing", () => {
      const routingWithoutContact: RoutingDecision = {
        facility: "ASHA",
        severity: "low",
      };

      render(<RoutingCard routing={routingWithoutContact} />);

      expect(screen.queryByText("कॉल करें")).not.toBeInTheDocument();
      expect(screen.queryByText("दिशा-निर्देश")).not.toBeInTheDocument();
    });

    it("should handle call button click", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      const callButton = screen.getByText("कॉल करें");
      fireEvent.click(callButton);

      expect(window.location.href).toBe("tel:+91-9876543210");
    });

    it("should handle directions button click", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      const directionsButton = screen.getByText("दिशा-निर्देश");
      fireEvent.click(directionsButton);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("https://www.google.com/maps/search/?api=1&query="),
        "_blank"
      );
    });

    it("should encode address for Google Maps", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      const directionsButton = screen.getByText("दिशा-निर्देश");
      fireEvent.click(directionsButton);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent("गांव पंचायत, जिला मुजफ्फरपुर")),
        "_blank"
      );
    });
  });

  describe("Reasoning Display", () => {
    it("should display reasoning text", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const reasoning = container.querySelector("[data-routing-reasoning]");
      expect(reasoning).toHaveTextContent(
        "आपके लक्षण हल्के हैं। आशा कार्यकर्ता आपकी मदद कर सकती हैं।"
      );
    });

    it("should not display reasoning section if not provided", () => {
      const routingWithoutReasoning: RoutingDecision = {
        ...mockRoutingLow,
        reasoning: undefined,
      };

      const { container } = render(
        <RoutingCard routing={routingWithoutReasoning} />
      );

      const reasoning = container.querySelector("[data-routing-reasoning]");
      expect(reasoning).not.toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("should have correct data attributes for testing", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      expect(container.querySelector("[data-routing-card]")).toBeInTheDocument();
      expect(container.querySelector("[data-severity-badge]")).toBeInTheDocument();
      expect(container.querySelector("[data-facility-name]")).toBeInTheDocument();
      expect(container.querySelector("[data-contact-name]")).toBeInTheDocument();
      expect(container.querySelector("[data-contact-phone]")).toBeInTheDocument();
      expect(container.querySelector("[data-contact-address]")).toBeInTheDocument();
      expect(container.querySelector("[data-routing-reasoning]")).toBeInTheDocument();
      expect(container.querySelector("[data-call-button]")).toBeInTheDocument();
      expect(container.querySelector("[data-directions-button]")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button labels", () => {
      render(<RoutingCard routing={mockRoutingLow} />);

      const callButton = screen.getByRole("button", { name: /कॉल करें/i });
      const directionsButton = screen.getByRole("button", {
        name: /दिशा-निर्देश/i,
      });

      expect(callButton).toBeInTheDocument();
      expect(directionsButton).toBeInTheDocument();
    });

    it("should have icons for visual indicators", () => {
      const { container } = render(<RoutingCard routing={mockRoutingLow} />);

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
