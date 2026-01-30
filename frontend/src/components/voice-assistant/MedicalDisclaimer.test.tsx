import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MedicalDisclaimer from "./MedicalDisclaimer";

describe("MedicalDisclaimer Component", () => {
  describe("General Disclaimer", () => {
    it("should render general disclaimer by default", () => {
      render(<MedicalDisclaimer />);

      expect(screen.getByText("चिकित्सा अस्वीकरण")).toBeInTheDocument();
      expect(
        screen.getByText(/यह AI सहायक केवल सामान्य स्वास्थ्य जानकारी/)
      ).toBeInTheDocument();
    });

    it("should render general disclaimer when type is general", () => {
      render(<MedicalDisclaimer type="general" />);

      expect(screen.getByText("चिकित्सा अस्वीकरण")).toBeInTheDocument();
    });

    it("should have correct data attribute for general type", () => {
      const { container } = render(<MedicalDisclaimer type="general" />);

      const disclaimer = container.querySelector("[data-disclaimer-type]");
      expect(disclaimer).toHaveAttribute("data-disclaimer-type", "general");
    });

    it("should have blue styling for general disclaimer", () => {
      const { container } = render(<MedicalDisclaimer type="general" />);

      const alert = container.querySelector("[data-disclaimer-type='general']");
      expect(alert).toHaveClass("bg-blue-50");
      expect(alert).toHaveClass("border-blue-200");
    });

    it("should mention professional medical advice", () => {
      render(<MedicalDisclaimer type="general" />);

      expect(
        screen.getByText(/पेशेवर चिकित्सा सलाह, निदान या उपचार का विकल्प नहीं/)
      ).toBeInTheDocument();
    });

    it("should advise consulting doctor for serious symptoms", () => {
      render(<MedicalDisclaimer type="general" />);

      expect(
        screen.getByText(/गंभीर लक्षणों के लिए कृपया तुरंत डॉक्टर से परामर्श लें/)
      ).toBeInTheDocument();
    });
  });

  describe("Emergency Warning", () => {
    it("should render emergency warning", () => {
      render(<MedicalDisclaimer type="emergency" />);

      expect(screen.getByText("आपातकालीन चेतावनी")).toBeInTheDocument();
    });

    it("should have correct data attribute for emergency type", () => {
      const { container } = render(<MedicalDisclaimer type="emergency" />);

      const disclaimer = container.querySelector("[data-disclaimer-type]");
      expect(disclaimer).toHaveAttribute("data-disclaimer-type", "emergency");
    });

    it("should have red styling for emergency warning", () => {
      const { container } = render(<MedicalDisclaimer type="emergency" />);

      const alert = container.querySelector("[data-disclaimer-type='emergency']");
      expect(alert).toHaveClass("bg-red-50");
      expect(alert).toHaveClass("border-red-300");
    });

    it("should display default emergency numbers", () => {
      const { container } = render(<MedicalDisclaimer type="emergency" />);

      expect(screen.getByText(/108/)).toBeInTheDocument();
      expect(screen.getByText(/102/)).toBeInTheDocument();

      const numbers = container.querySelectorAll("[data-emergency-number]");
      expect(numbers.length).toBe(2);
    });

    it("should display custom emergency numbers", () => {
      const { container } = render(
        <MedicalDisclaimer type="emergency" emergencyNumbers={["108", "100", "102"]} />
      );

      expect(screen.getByText(/108/)).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/102/)).toBeInTheDocument();

      const numbers = container.querySelectorAll("[data-emergency-number]");
      expect(numbers.length).toBe(3);
    });

    it("should list serious symptoms", () => {
      render(<MedicalDisclaimer type="emergency" />);

      expect(screen.getByText(/सीने में दर्द/)).toBeInTheDocument();
      expect(screen.getByText(/सांस लेने में कठिनाई/)).toBeInTheDocument();
      expect(screen.getByText(/गंभीर रक्तस्राव/)).toBeInTheDocument();
      expect(screen.getByText(/बेहोशी/)).toBeInTheDocument();
    });

    it("should have prominent emergency contact instruction", () => {
      render(<MedicalDisclaimer type="emergency" />);

      expect(
        screen.getByText(/यदि आप या कोई अन्य व्यक्ति गंभीर स्थिति में है/)
      ).toBeInTheDocument();
    });
  });

  describe("Medication Warning", () => {
    it("should render medication warning", () => {
      render(<MedicalDisclaimer type="medication" />);

      expect(screen.getByText("दवा संबंधी चेतावनी")).toBeInTheDocument();
    });

    it("should have correct data attribute for medication type", () => {
      const { container } = render(<MedicalDisclaimer type="medication" />);

      const disclaimer = container.querySelector("[data-disclaimer-type]");
      expect(disclaimer).toHaveAttribute("data-disclaimer-type", "medication");
    });

    it("should have yellow styling for medication warning", () => {
      const { container } = render(<MedicalDisclaimer type="medication" />);

      const alert = container.querySelector("[data-disclaimer-type='medication']");
      expect(alert).toHaveClass("bg-yellow-50");
      expect(alert).toHaveClass("border-yellow-300");
    });

    it("should advise consulting doctor before taking medicine", () => {
      render(<MedicalDisclaimer type="medication" />);

      expect(
        screen.getByText(/कोई भी दवा लेने से पहले हमेशा डॉक्टर या फार्मासिस्ट से परामर्श लें/)
      ).toBeInTheDocument();
    });

    it("should warn against self-medication", () => {
      render(<MedicalDisclaimer type="medication" />);

      expect(screen.getByText(/स्व-दवा खतरनाक हो सकती है/)).toBeInTheDocument();
    });

    it("should mention following doctor's advice for dosage", () => {
      render(<MedicalDisclaimer type="medication" />);

      expect(
        screen.getByText(/दवा की खुराक, समय और अवधि के लिए चिकित्सक की सलाह का पालन करें/)
      ).toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("should display info icon for general disclaimer", () => {
      const { container } = render(<MedicalDisclaimer type="general" />);

      const icon = container.querySelector(".lucide-info");
      expect(icon).toBeInTheDocument();
    });

    it("should display warning icon for emergency", () => {
      const { container } = render(<MedicalDisclaimer type="emergency" />);

      const icon = container.querySelector(".lucide-triangle-alert");
      expect(icon).toBeInTheDocument();
    });

    it("should display warning icon for medication", () => {
      const { container } = render(<MedicalDisclaimer type="medication" />);

      const icon = container.querySelector(".lucide-triangle-alert");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure for general", () => {
      render(<MedicalDisclaimer type="general" />);

      const heading = screen.getByText("चिकित्सा अस्वीकरण");
      expect(heading.tagName).toBe("H5");
    });

    it("should have proper heading structure for emergency", () => {
      render(<MedicalDisclaimer type="emergency" />);

      const heading = screen.getByText("आपातकालीन चेतावनी");
      expect(heading.tagName).toBe("H5");
    });

    it("should have proper heading structure for medication", () => {
      render(<MedicalDisclaimer type="medication" />);

      const heading = screen.getByText("दवा संबंधी चेतावनी");
      expect(heading.tagName).toBe("H5");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty emergency numbers array", () => {
      const { container } = render(
        <MedicalDisclaimer type="emergency" emergencyNumbers={[]} />
      );

      const numbers = container.querySelectorAll("[data-emergency-number]");
      expect(numbers.length).toBe(0);
    });

    it("should handle single emergency number", () => {
      const { container } = render(
        <MedicalDisclaimer type="emergency" emergencyNumbers={["108"]} />
      );

      const numbers = container.querySelectorAll("[data-emergency-number]");
      expect(numbers.length).toBe(1);
      expect(screen.getByText(/108/)).toBeInTheDocument();
    });
  });
});
