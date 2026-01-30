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
      className={`${severityConfig.bgColor} border-l-4 ${severityConfig.color.replace("bg-", "border-")}`}
      data-routing-card
      data-severity={severity}
      data-facility={facility}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${severityConfig.textColor}`} />
              <span>स्वास्थ्य सुविधा सिफारिश</span>
            </CardTitle>
          </div>
          <Badge
            className={`${severityConfig.color} text-white`}
            data-severity-badge
          >
            {severityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Facility Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-base" data-facility-name>
            {getFacilityLabel()}
          </h4>

          {contactInfo && (
            <div className="space-y-2 text-sm">
              {contactInfo.name && (
                <p className="font-medium" data-contact-name>
                  {contactInfo.name}
                </p>
              )}

              {contactInfo.address && (
                <div className="flex items-start gap-2" data-contact-address>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {contactInfo.address}
                  </span>
                </div>
              )}

              {contactInfo.phone && (
                <div className="flex items-center gap-2" data-contact-phone>
                  <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {contactInfo.phone}
                  </span>
                </div>
              )}

              {contactInfo.distance && (
                <p className="text-muted-foreground" data-contact-distance>
                  दूरी: {contactInfo.distance}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Reasoning */}
        {reasoning && (
          <div
            className="p-3 bg-white rounded-md border"
            data-routing-reasoning
          >
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          </div>
        )}

        {/* Action Buttons */}
        {contactInfo && (
          <div className="flex gap-2 pt-2">
            {contactInfo.phone && (
              <Button
                onClick={handleCall}
                variant="default"
                size="sm"
                className="flex-1"
                data-call-button
              >
                <Phone className="w-4 h-4 mr-2" />
                कॉल करें
              </Button>
            )}

            {contactInfo.address && (
              <Button
                onClick={handleGetDirections}
                variant="outline"
                size="sm"
                className="flex-1"
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
