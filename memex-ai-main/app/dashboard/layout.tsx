import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#08080a]">
      {/* Clerk user button in top-right (floating) */}
      <div className="fixed top-4 right-4 z-50">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
      {children}
    </div>
  );
}
