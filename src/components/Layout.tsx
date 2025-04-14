import React from "react";
import Navbar from "./Navbar";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex">
        <Navbar />
        <main className="flex-grow pt-20 pl-64 p-6">{/* ✅ Prevent overlap with Navbar */}
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
