"use client";

import { useEffect, useRef, useState } from "react";
import { User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import RoutingCard from "./RoutingCard";
import MedicalDisclaimer from "./MedicalDisclaimer";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  routing?: RoutingDecision;
  metadata?: MessageMetadata;
}

export interface RoutingDecision {
  facility: "ASHA" | "PHC" | "CHC" | "EMERGENCY";
  severity: "low" | "medium" | "high" | "critical";
  contactInfo?: FacilityContact;
  reasoning?: string;
}

export interface FacilityContact {
  name: string;
  phone: string;
  address: string;
  distance?: string;
}

export interface MessageMetadata {
  [key: string]: any;
}

interface ConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function ConversationDisplay({
  messages,
  isLoading = false,
}: ConversationDisplayProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const lastMessageCountRef = useRef(messages.length);

  // Auto-scroll to latest message when new messages arrive
  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    if (!userHasScrolled && messages.length > lastMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, userHasScrolled]);

  // Detect when user scrolls up
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;

    setUserHasScrolled(!isAtBottom);
  };

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - messageDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return "अभी";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} मिनट पहले`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} घंटे पहले`;
    } else {
      return messageDate.toLocaleDateString("hi-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Get role-based styling
  const getRoleStyles = (role: Message["role"]) => {
    switch (role) {
      case "user":
        return {
          container: "justify-end",
          bubble: "bg-primary text-primary-foreground",
          avatar: "bg-primary/10",
        };
      case "assistant":
        return {
          container: "justify-start",
          bubble: "bg-muted",
          avatar: "bg-muted",
        };
      case "system":
        return {
          container: "justify-center",
          bubble: "bg-secondary text-secondary-foreground text-center",
          avatar: "hidden",
        };
      default:
        return {
          container: "justify-start",
          bubble: "bg-muted",
          avatar: "bg-muted",
        };
    }
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Bot className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          स्वास्थ्य सहायक में आपका स्वागत है
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          अपने स्वास्थ्य संबंधी प्रश्न पूछने के लिए माइक बटन दबाएं या टाइप करें
        </p>
      </div>
    );
  }

  return (
    <ScrollArea
      className="flex-1 p-4"
      onScroll={handleScroll}
      ref={scrollAreaRef}
    >
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Show disclaimer on first message */}
        {messages.length > 0 && (
          <div className="mb-4" data-disclaimer-container>
            <MedicalDisclaimer type="general" />
          </div>
        )}

        {messages.map((message, index) => {
          const styles = getRoleStyles(message.role);

          // Check if this message has critical severity for emergency warning
          const showEmergencyWarning =
            message.routing?.severity === "critical" && index === messages.length - 1;

          return (
            <div key={message.id}>
              <div
                className={`flex gap-3 ${styles.container}`}
                data-message-id={message.id}
                data-message-role={message.role}
              >
                {/* Avatar */}
                {message.role !== "system" && (
                  <Avatar className={`${styles.avatar} flex-shrink-0`}>
                    <AvatarFallback>
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message content */}
                <div
                  className={`flex flex-col ${
                    message.role === "system" ? "w-full" : "max-w-[80%]"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 ${styles.bubble}`}
                    data-message-content
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {/* Routing Information */}
                  {message.routing && (
                    <div className="mt-3">
                      <RoutingCard routing={message.routing} />
                    </div>
                  )}

                  {/* Timestamp */}
                  <span
                    className={`text-xs text-muted-foreground mt-1 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                    data-message-timestamp
                  >
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>

              {/* Emergency warning for critical cases */}
              {showEmergencyWarning && (
                <div className="mt-4" data-emergency-warning>
                  <MedicalDisclaimer type="emergency" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start" data-loading-indicator>
            <Avatar className="bg-muted flex-shrink-0">
              <AvatarFallback>
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col max-w-[80%]">
              <div className="rounded-lg px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
