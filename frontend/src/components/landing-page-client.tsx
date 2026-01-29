"use client";

import { useState } from "react";
import { User, Users, Stethoscope, Shield } from "lucide-react";
import type { Role } from "@/lib/types";
import { LoginModal } from "./login-modal";
import { roleDisplayNames, roleDescriptions } from "@/lib/types";
import { Button } from "./ui/button";

const roleCards = [
  {
    role: "Citizen" as Role,
    description: roleDescriptions["Citizen"],
    icon: <User className="w-7 h-7" />,
  },
  {
    role: "ASHA Worker" as Role,
    description: roleDescriptions["ASHA Worker"],
    icon: <Users className="w-7 h-7" />,
  },
  {
    role: "Clinical" as Role,
    description: roleDescriptions["Clinical"],
    icon: <Stethoscope className="w-7 h-7" />,
  },
  {
    role: "Admin" as Role,
    description: roleDescriptions["Admin"],
    icon: <Shield className="w-7 h-7" />,
  },
];

export default function LandingPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("Citizen");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen w-full">
        <header className="py-10 px-5 text-center">
          <div className="inline-flex items-center gap-4 mb-2.5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="h-8 w-8 text-primary-foreground"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 15L85 32.5V67.5L50 85L15 67.5V32.5L50 15Z"
                  fill="currentColor"
                />
                <path
                  d="M50 40V60M40 50H60"
                  stroke="hsl(var(--background))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-foreground to-primary/80 text-transparent bg-clip-text">
                HealthBridge AI
              </h1>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Unified Healthcare Intelligence Platform
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-5 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roleCards.map((card) => (
              <div
                key={card.role}
                className="group bg-card/80 backdrop-blur-lg border border-white/70 rounded-3xl p-8 flex flex-col shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary"
              >
                <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center mb-5 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {roleDisplayNames[card.role]}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {card.description}
                </p>
                <Button
                  onClick={() => handleRoleSelect(card.role)}
                  variant="outline"
                  className="mt-auto w-fit rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  aria-label={`Access Portal for ${roleDisplayNames[card.role]}`}
                >
                  Access Portal
                </Button>
              </div>
            ))}
          </div>
        </main>
      </div>
      <LoginModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        role={selectedRole}
      />
    </>
  );
}
