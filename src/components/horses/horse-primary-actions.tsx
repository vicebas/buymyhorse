"use client";

import ContactSellerButton from "@/components/horses/contact-seller-button";
import RequestAccessButton from "@/components/horses/request-access-button";

type AccessStatus =
  | "NONE"
  | "PENDING"
  | "APPROVED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED"
  | "ACTIVE";

export default function HorsePrimaryActions({
  horseId,
  horseName,
  sellerName,
  isLoggedIn,
  currentAccessStatus,
}: {
  horseId: string;
  horseName: string;
  sellerName: string;
  isLoggedIn: boolean;
  currentAccessStatus: AccessStatus;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <RequestAccessButton
        horseId={horseId}
        isLoggedIn={isLoggedIn}
        currentStatus={currentAccessStatus}
      />

      <ContactSellerButton
        horseId={horseId}
        horseName={horseName}
        sellerName={sellerName}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
