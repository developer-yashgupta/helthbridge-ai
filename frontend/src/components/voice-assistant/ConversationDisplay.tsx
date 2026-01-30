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
          const isLatest = index === messages.length - 1;

          // Check if this message has critical severity for emergency warning
          const showEmergencyWarning =
            message.routing?.severity === "critical" && index === messages.length - 1;

          return (
            <div 
              key={message.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
            >
              <div
                className={`flex gap-3 ${styles.container}`}
                data-message-id={message.id}
                data-message-role={message.role}
              >
                {/* Avatar with bounce animation for latest message */}
                {message.role !== "system" && (
                  <Avatar className={`${styles.avatar} flex-shrink-0 ${isLatest ? 'animate-in zoom-in duration-300' : ''}`}>
                    <AvatarFallback>
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message content with enhanced styling */}
                <div
                  className={`flex flex-col ${
                    message.role === "system" ? "w-full" : "max-w-[80%]"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 ${styles.bubble} ${
                      isLatest ? 'shadow-md' : ''
                    } transition-all duration-300 hover:shadow-lg`}
                    data-message-content
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {/* Routing Information with slide-in animation */}
                  {message.routing && (
                    <div className="mt-3 animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
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

        {/* Enhanced Loading indicator with typing animation */}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-4 duration-500" data-loading-indicator>
            <Avatar className="bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0 animate-pulse">
              <AvatarFallback>
                <Bot className="w-4 h-4 text-blue-600" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col max-w-[80%]">
              <div className="rounded-lg px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
                    <span
                      className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                  <span className="text-sm text-blue-700 font-medium animate-pulse">
                    AI विश्लेषण कर रहा है...
                  </span>
                </div>
              </div>
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
