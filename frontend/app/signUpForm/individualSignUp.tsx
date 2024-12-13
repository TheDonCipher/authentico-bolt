"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function PersonalSignUp({
  showIndSignUp,
  closeSignup,
}: IpersonalSignup) {
  //TODO: remove hardcoding the url and migrate to .env
  const router = useRouter();

  async function submitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the form data
    const form = e.target;
    const formData: FormData = new FormData(form as HTMLFormElement);
    const response = fetch("http://localhost/backend/api/users/create.php", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: formData,
    })
      .then((res) => {
        router.push("/dashboard");
        localStorage.setItem("account", "true");
        localStorage.setItem("name", formData.get("name").toString());
        console.log(res.json());
        // return res.json();
      })
      .then((json) => {
        // console.log(json);
      });
  }

  return (
    showIndSignUp && (
      <div className="bg-white sm:py-12 py-24 px-6 rounded-lg shadow-md border border-gray-200 sm:w-1/2  absolute top-3  sm:left-1/4 ">
        <div className="flex justify-end">
          <button onClick={closeSignup}>X</button>
        </div>
        <h4 className="text-2xl font-bold mb-4 text-center text-[#2C3E50]">
          Individual Sign-Up
        </h4>
        <p className="text-center mb-6 text-gray-600">
          Complete the form below to sign up as an individual user.
        </p>
        <form className="space-y-4" method="POST" onSubmit={submitDetails}>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              required
            />
          </div>

          <div className="flex gap-2 flex-col">
            <label htmlFor="password">Password</label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              type="password"
              placeholder="password"
              required
            />
          </div>
          <button
            //TODO: move the forms in their own component
            type="submit"
            className={`w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 ${false ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Sign up
          </button>
        </form>
      </div>
    )
  );
}

interface IpersonalSignup {
  showIndSignUp: boolean;
  closeSignup: any;
}
