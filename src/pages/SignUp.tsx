import React, { useState } from "react";


const SignUp = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    company: "",
    role: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Registering:", user);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl flex bg-white shadow-lg rounded-lg overflow-hidden">
        
        {/* Left Side - App Info Section */}
        <div className="w-1/2 bg-blue-500 text-white flex flex-col items-center justify-center p-8">
          <h2 className="text-3xl font-semibold">App Icon - Name</h2>
          <p className="text-lg mt-2">Some descriptive text about the app</p>
          <div className="mt-6 w-full h-40 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-500 font-semibold">Image</span>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-1/2 p-8">
          <h2 className="text-2xl font-semibold mb-4">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={user.firstName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={user.lastName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700">Company</label>
              <input
                type="text"
                name="company"
                value={user.company}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-gray-700">Role</label>
              <input
                type="text"
                name="role"
                value={user.role}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={user.password}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={user.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="agree"
                checked={user.agree}
                onChange={() => setUser({ ...user, agree: !user.agree })}
                className="mr-2"
              />
              <label className="text-gray-700">I agree to the terms</label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600">or sign up with GitHub</p>
            <button className="w-full bg-gray-900 text-white py-2 rounded-md mt-2 hover:bg-gray-800 transition">
              Sign up with GitHub
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-600">Already have an account? <a href="/signin" className="text-blue-500 hover:underline">Sign in</a></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignUp;
