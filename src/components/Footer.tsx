import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white shadow-md py-4 px-6 text-center flex justify-between">
      <a href="/about" className="text-gray-600 hover:text-blue-500">About</a>
      <a href="/contact" className="text-gray-600 hover:text-blue-500">Contact Us</a>
      <a href="/help" className="text-gray-600 hover:text-blue-500">Help</a>
    </footer>
  );
};

export default Footer;
