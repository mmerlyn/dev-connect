import React from "react";

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
}

const Button: React.FC<ButtonProps> = ({ text, onClick, variant = "primary" }) => {
  const baseStyle = "px-4 py-2 rounded-md transition duration-300 transform hover:scale-105 focus:ring focus:ring-opacity-50";
  const styles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300",
    secondary: "bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-300",
  };

  return (
    <button className={`${baseStyle} ${styles[variant]}`} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;
