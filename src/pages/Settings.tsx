import React from "react";
import Layout from "../components/Layout";

const Settings = () => {
  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p>Manage account, security, and notifications here.</p>

        {/* Account Settings Section */}
        <div className="mt-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold">Account Settings</h3>
            <p className="text-gray-600">Update your profile information.</p>
            <button className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition">
              Edit Profile
            </button>
          </div>

          {/* Security Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold">Security</h3>
            <p className="text-gray-600">Manage your password and authentication settings.</p>
            <button className="mt-2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition">
              Change Password
            </button>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-gray-600">Control how you receive notifications.</p>
            <button className="mt-2 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition">
              Manage Notifications
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
