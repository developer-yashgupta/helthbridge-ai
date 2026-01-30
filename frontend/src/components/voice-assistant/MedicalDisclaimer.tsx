"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MedicalDisclaimerProps {
  type?: "general" | "emergency" | "medication";
  emergencyNumbers?: string[];
}

export default function MedicalDisclaimer({
  type = "general",
  emergencyNumbers = ["108", "102"],
}: MedicalDisclaimerProps) {
  // General disclaimer
  if (type === "general") {
    return (
      <Alert className="bg-blue-50 border-blue-200" data-disclaimer-type="general">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">चिकित्सा अस्वीकरण</AlertTitle>
        <AlertDescription className="text-blue-800 text-sm">
          यह AI सहायक केवल सामान्य स्वास्थ्य जानकारी प्रदान करता है और पेशेवर
          चिकित्सा सलाह, निदान या उपचार का विकल्प नहीं है। गंभीर लक्षणों के लिए
          कृपया तुरंत डॉक्टर से परामर्श लें।
        </AlertDescription>
      </Alert>
    );
  }

  // Emergency warning
  if (type === "emergency") {
    return (
      <Alert
        className="bg-red-50 border-red-300 border-2"
        data-disclaimer-type="emergency"
      >
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-900 font-bold">
          आपातकालीन चेतावनी
        </AlertTitle>
        <AlertDescription className="text-red-800">
          <p className="font-semibold mb-2">
            यदि आप या कोई अन्य व्यक्ति गंभीर स्थिति में है, तो तुरंत आपातकालीन
            सेवाओं से संपर्क करें:
          </p>
          <div className="space-y-1 mb-2">
            {emergencyNumbers.map((number) => (
              <div
                key={number}
                className="flex items-center gap-2"
                data-emergency-number
              >
                <span className="font-bold text-lg">📞 {number}</span>
              </div>
            ))}
          </div>
          <p className="text-sm">
            गंभीर लक्षण: सीने में दर्द, सांस लेने में कठिनाई, गंभीर रक्तस्राव,
            बेहोशी, या अचानक गंभीर दर्द।
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Medication warning
  if (type === "medication") {
    return (
      <Alert
        className="bg-yellow-50 border-yellow-300"
        data-disclaimer-type="medication"
      >
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900">दवा संबंधी चेतावनी</AlertTitle>
        <AlertDescription className="text-yellow-800 text-sm">
          कोई भी दवा लेने से पहले हमेशा डॉक्टर या फार्मासिस्ट से परामर्श लें।
          स्व-दवा खतरनाक हो सकती है। दवा की खुराक, समय और अवधि के लिए चिकित्सक
          की सलाह का पालन करें।
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
