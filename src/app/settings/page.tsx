import { Metadata } from "next";
import { Suspense } from "react";
import SemesterEditor from "./_components/semester-editor";
import UploadHistory from "./_components/upload-history";
import UploadDistribution from "./_components/upload-distribution";

export const metadata: Metadata = {
  title: "Settings | Coursify",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and contribute to the Coursify database.
        </p>
      </div>

      <div className="space-y-8">
        <Suspense fallback={<div>Loading semester settings...</div>}>
          <SemesterEditor />
        </Suspense>

        <UploadDistribution />

        <Suspense fallback={<div>Loading upload history...</div>}>
          <UploadHistory />
        </Suspense>
      </div>
    </div>
  );
}