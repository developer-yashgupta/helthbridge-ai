"use client";

import { MapPin, Phone, Navigation, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoutingDecision } from "./ConversationDisplay";

interface RoutingCardProps {
  routing: RoutingDecision;
}

export default function RoutingCard({ routing }: RoutingCardProps) {
  const { facility, severity, contactInfo, reasoning } = routing;

  // Get severity color and label
  const getSeverityConfig = () => {
    switch (severity) {
      case "low":
        return {
          color: "bg-green-500",
          label: "कम गंभीर",
          textColor: "text-green-700",
          bgColor: "bg-green-50",
        };
      case "medium":
        return {
          color: "bg-yellow-500",
          label: "मध्यम गंभीर",
          textColor: "text-yellow-700",
          bgColor: "bg-yellow-50",
        };
      case "high":
        return {
          color: "bg-orange-500",
          label: "गंभीर",
          textColor: "text-orange-700",
          bgColor: "bg-orange-50",
        };
      case "critical":
        return {
          color: "bg-red-500",
          label: "अत्यंत गंभीर",
          textColor: "text-red-700",
          bgColor: "bg-red-50",
        };
      default:
        return {
          color: "bg-gray-500",
          label: "अज्ञात",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
        };
    }
  };

  // Get facility label
  const getFacilityLabel = () => {
    switch (facility) {
      case "ASHA":
        return "आशा कार्यकर्ता";
      case "PHC":
        return "प्राथमिक स्वास्थ्य केंद्र";
      case "CHC":
        return "सामुदायिक स्वास्थ्य केंद्र";
      case "EMERGENCY":
        return "आपातकालीन सेवाएं";
      default:
        return facility;
    }
  };

  const severityConfig = getSeverityConfig();

  // Handle get directions
  const handleGetDirections = () => {
    if (contactInfo?.address) {
      const encodedAddress = encodeURIComponent(contactInfo.address);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank"
      );
    }
  };

  // Handle call
  const handleCall = () => {
    if (contactInfo?.phone) {
      window.location.href = `tel:${contactInfo.phone}`;
    }
  };

  return (
    <Card
      className={`${severityConfig.bgColor} border-l-4 ${severityConfig.color.replace("bg-", "border-")} shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-left duration-500`}
      data-routing-card
      data-severity={severity}
      data-facility={facility}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={`p-2 rounded-full ${severityConfig.bgColor} animate-pulse`}>
                <AlertCircle className={`w-5 h-5 ${severityConfig.textColor}`} />
              </div>
              <span className="animate-in fade-in slide-in-from-left duration-300">स्वास्थ्य सुविधा सिफारिश</span>
            </CardTitle>
          </div>
          <Badge
            className={`${severityConfig.color} text-white shadow-md animate-in zoom-in duration-300`}
            data-severity-badge
          >
            {severityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Facility Information with stagger animation */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: '100ms' }}>
          <h4 className="font-semibold text-base flex items-center gap-2" data-facility-name>
            <span className="text-2xl">🏥</span>
            {getFacilityLabel()}
          </h4>

          {contactInfo && (
            <div className="space-y-2 text-sm">
              {contactInfo.name && (
                <p className="font-medium flex items-center gap-2 animate-in fade-in duration-300" data-contact-name style={{ animationDelay: '200ms' }}>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {contactInfo.name}
                </p>
              )}

              {contactInfo.address && (
                <div className="flex items-start gap-2 p-2 rounded-md bg-white/50 hover:bg-white transition-colors duration-200 animate-in fade-in duration-300" data-contact-address style={{ animationDelay: '300ms' }}>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span className="text-muted-foreground">
                    {contactInfo.address}
                  </span>
                </div>
              )}

              {contactInfo.phone && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-white/50 hover:bg-white transition-colors duration-200 animate-in fade-in duration-300" data-contact-phone style={{ animationDelay: '400ms' }}>
                  <Phone className="w-4 h-4 flex-shrink-0 text-green-600" />
                  <span className="text-muted-foreground font-medium">
                    {contactInfo.phone}
                  </span>
                </div>
              )}

              {contactInfo.distance && (
                <p className="text-muted-foreground flex items-center gap-2 animate-in fade-in duration-300" data-contact-distance style={{ animationDelay: '500ms' }}>
                  <span className="text-lg">📍</span>
                  दूरी: <span className="font-semibold">{contactInfo.distance}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Reasoning with enhanced styling */}
        {reasoning && (
          <div
            className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md border-2 border-blue-200 animate-in fade-in slide-in-from-bottom duration-500"
            data-routing-reasoning
            style={{ animationDelay: '600ms' }}
          >
            <p className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-lg flex-shrink-0">💡</span>
              <span>{reasoning}</span>
            </p>
          </div>
        )}

        {/* Action Buttons with hover effects */}
        {contactInfo && (
          <div className="flex gap-2 pt-2 animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: '700ms' }}>
            {contactInfo.phone && (
              <Button
                onClick={handleCall}
                variant="default"
                size="sm"
                className="flex-1 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                data-call-button
              >
                <Phone className="w-4 h-4 mr-2 animate-pulse" />
                कॉल करें
              </Button>
            )}

            {contactInfo.address && (
              <Button
                onClick={handleGetDirections}
                variant="outline"
                size="sm"
                className="flex-1 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                data-directions-button
              >
                <Navigation className="w-4 h-4 mr-2" />
                दिशा-निर्देश
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
