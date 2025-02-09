/* eslint-disable */
"use client";
import reviewng from "./img/roller-skating.svg";
import sittingreading from "./img/sitting-reading.svg";
import reviewingDoc from "./img/hero.png";
import React, { useState, useEffect, useReducer } from "react";
import Link from "next/link";
import {
  Shield,
  Database,
  Key,
  Github,
  Linkedin,
  Twitter,
  ChevronDown,
  Upload,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "./client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { PersonalSignUp } from "./signUpForm/individualSignUp";
import { Menu } from "./svg";
import { Login } from "./login/login";

const wallets = [
  createWallet("io.metamask"),
  inAppWallet({
    auth: {
      options: ["email", "google", "apple", "facebook", "phone"],
    },
  }),
];
function modalManager(state, action) {
  if (action.type == "openLogin") {
    return {
      open: true,
    };
  } else if (action.type == "closeLogin") {
    return {
      open: false,
    };
  }
}
const NeubrutalistLanding = () => {
  const account = useActiveAccount();
  const router = useRouter();
  const [state, dispatch] = useReducer(modalManager, { open: false });
  const [showOrgSignUp, setShowOrgSignUp] = useState(false);
  const [showIndSignUp, setShowIndSignUp] = useState(false);
  const [orgDetails, setOrgDetails] = useState({ orgName: "", email: "" });
  const [indDetails, setIndDetails] = useState({
    password: "",
    name: "",
    email: "",
  });
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showWalletMessage, setShowWalletMessage] = useState(false);

  function OpenLogin() {
    dispatch({ type: "openLogin" });
  }
  function CloseLogin() {
    dispatch({ type: "closeLogin" });
  }
  function toogleLogin(open: boolean) {
    if (open) {
      OpenLogin();
      return;
    }
    CloseLogin();
  }
  useEffect(() => {
    const fetchOrCreateUser = async () => {
      if (account) {
        try {
          const response = await fetch(`/api/user/${account.address}`);
          if (response.ok) {
            const user = await response.json();
            setUserType(user.userType);
            if (user.userType === "organization") {
              router.push("/organization-dashboard");
            } else if (user.userType === "individual") {
              router.push("/dashboard");
            }
          } else if (response.status === 404) {
            setShowIndSignUp(true);
            setShowOrgSignUp(true);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          showToast(
            "error",
            "An error occurred while fetching user data. Please try again.",
          );
        }
      }
    };

    fetchOrCreateUser();
  }, [account, router]);

  const handleOrganizationSignUp = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/signup/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...orgDetails,
          walletAddress: account?.address,
        }),
      });
      if (response.ok) {
        showToast(
          "success",
          "Organization signed up successfully! Redirecting to dashboard...",
        );
        setTimeout(() => router.push("/organization-dashboard"), 2000);
      } else {
        const errorData = await response.json();
        showToast("error", errorData.error || "Failed to sign up organization");
      }
    } catch (error) {
      showToast("error", "An unexpected error occurred. Please try again.");
    }
    setIsLoading(false);
  };

  const handleIndividualSignUp = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/signup/individual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...indDetails,
          walletAddress: account?.address,
        }),
      });
      if (response.ok) {
        showToast(
          "success",
          "Individual signed up successfully! Redirecting to dashboard...",
        );
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const errorData = await response.json();
        showToast("error", errorData.error || "Failed to sign up individual");
      }
    } catch (error) {
      showToast("error", "An unexpected error occurred. Please try again.");
    }
    setIsLoading(false);
  };

  const handleInputChange = <T extends { [key: string]: string }>(
    e: React.ChangeEvent<HTMLInputElement>,
    setDetails: React.Dispatch<React.SetStateAction<T>>,
  ) => {
    const { name, value } = e.target;
    setDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };
  async function handleSignUpAsIndividual() {
    const response = await fetch("https://localhost:3000/create.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(indDetails),
    });

    const result = await response.json();
    if (response.ok) {
      alert("account created");
    } else {
      alert("Oops try again");
    }
    return result;
  }
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    if (!account) {
      setAuthError("Please connect your wallet before signing in.");
      setIsSigningIn(false);
      return;
    }
    try {
      const response = await fetch(`/api/user/${account.address}`);
      if (response.ok) {
        const user = await response.json();
        if (user.userType === "organization") {
          router.push("/organization-dashboard");
        } else if (user.userType === "individual") {
          router.push("/dashboard");
        }
      } else if (response.status === 404) {
        setAuthError("User not found. Please sign up first.");
      } else {
        setAuthError("An error occurred while signing in. Please try again.");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setAuthError("An error occurred while signing in. Please try again.");
    }
    setIsSigningIn(false);
  };

  const handleSignUp = (type: "individual" | "organization") => {
    if (!account) {
      setAuthError("Please connect your wallet before signing up.");
      return;
    }
    if (type === "individual") {
      setShowIndSignUp(true);
      setShowOrgSignUp(false);
    } else {
      setShowOrgSignUp(true);
      setShowIndSignUp(false);
    }
    setAuthError(null);
  };
  const [seeStart, setseeStart] = useState("hidden");
  function toogleShow() {
    if (seeStart == "hidden" || seeStart == "hidden ") {
      setseeStart("flex overflow-y-hidden");
      return;
    }
    setseeStart("hidden ");
  }
  // Function to show wallet connection message
  const handleWalletConnection = () => {
    setShowWalletMessage(true);
    setTimeout(() => {
      setShowWalletMessage(false);
    }, 5000); // Message will disappear after 5 seconds
  };

  // Call this function when the wallet is connected successfully
  useEffect(() => {
    if (account) {
      handleWalletConnection();
    }
  }, [account]);

  return (
    <div className="min-h-screen bg-[#F0EAD6] text-[#2C3E50] flex flex-col relative overflow-x-hidden">
      {/* Background Pattern */}
      <div
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A6741' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      <div className="sticky top-0">
        <NavBar toogleShow={toogleShow} openForm={OpenLogin} />
      </div>
      <main className="w-screen flex flex-col flex-1 pt-16">
        {/* Improved Title Section */}

        <div
          id="home"
          className="bg-[#F0F4F8] p-8 justify-center items-center flex flex-1 flex-col rounded-lg shadow-lg  w-full"
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-center flex-col">
              <h1 className="font-bold text-4xl sm:text-6xl text-center">
                Transform your document security
              </h1>
              <h1 className="font-bold text-4xl sm:text-6xl text-center">
                with Authentico
              </h1>
            </div>
            <div className=" justify-center flex items-center ">
              <p className="text-center sm:flex justify-center hidden  w-1/2">
                Enhance your security and efficiency with our AI-powered
                document authentication solution. Our innovative technology
                leverages machine learning to verify the authenticity of
                documents in real-time, reducing the risk of fraud and ensuring
                compliance.
              </p>

              <p className="text-center sm:hidden md:hidden flex ">
                Enhance your security and efficiency with our AI-powered
                document authentication solution.
              </p>
            </div>

            {/* <button */}
            {/*   onClick={() => alert(1)} */}
            {/*   className="border-black w-28 border-2 p-3 font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md" */}
            {/* > */}
            {/*   Pricing */}
            {/* </button> */}
            <div className="flex justify-center items-center gap-4">
              <button
                className="border-black border-2 p-3 bg-[#fef29f] font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md"
                onClick={toogleShow}
              >
                Get Started 🚀
              </button>
              <Link href="/dashboard">
                <button className="border-black border-2 p-3 font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md">
                  Individual Dashboard
                </button>
              </Link>
              <Link href="/organization-dashboard">
                <button className="border-black border-2 p-3 font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md">
                  Organization Dashboard
                </button>
              </Link>
            </div>
            <div className="sm:flex hidden -my-10 w-screen justify-between">
              <Image width={323} height={323} src={reviewng} alt="users" />
              <Image
                width={323}
                height={323}
                src={sittingreading}
                alt="users"
              />
            </div>
          </div>
        </div>

        <div
          className={
            seeStart +
            " backdrop-blur-md absolute items-center top-0 w-screen h-screen flex-col md:flex-row justify-center mb-12 space-y-4 md:space-y-0 md:space-x-8"
          }
        >
          {/* Left Column: Wallet Connection Instructions and Buttons */}
          <div className=" absolute top-4 left-1 sm:left-1/3 flex-1 bg-white p-6 rounded-lg w shadow-md border border-gray-200">
            <div className="flex justify-end">
              <button onClick={toogleShow}>X</button>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#2C3E50]">
              Get Started with Authentico
            </h3>
            <p className="font-bold text-lg text-[#1E3A8A] mb-4">
              Follow these steps:
            </p>
            <ol className="list-decimal list-inside mb-6 text-gray-600">
              <li className="mb-2">
                Connect your wallet using the button below
              </li>
              <li className="mb-2">
                Sign in if you're a returning user, or sign up if you're new
              </li>
            </ol>

            {/* Connect Button */}
            <div className="mb-6">
              <ConnectButton
                client={client}
                wallets={wallets}
                theme={darkTheme({
                  colors: {
                    accentText: "#ffffff",
                    accentButtonBg: "#4f46e5",
                    primaryButtonBg: "#3730a3",
                  },
                  fontFamily: "Archivo",
                })}
                connectButton={{ label: "Connect Wallet" }}
                connectModal={{
                  size: "wide",
                  welcomeScreen: {
                    title: "Welcome to Authentico",
                    subtitle:
                      "Secure document verification powered by blockchain",
                  },
                }}
              />
            </div>

            {/* User Feedback for Successful Wallet Connection */}
            {account && (
              <div className="mb-6 text-center">
                <p className="text-green-600 font-bold">
                  Wallet connected successfully!
                </p>
              </div>
            )}

            {/* Sign-in and Sign-up Buttons */}
            <div className="space-y-4">
              {!account && (
                <motion.button
                  onClick={handleSignIn}
                  className={`w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 flex items-center justify-center ${!account ? "opacity-50 cursor-not-allowed" : ""}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSigningIn || !account}
                >
                  {isSigningIn ? (
                    <>
                      <LoadingSpinner />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="inline-block mr-2" />
                      <span>Sign In</span>
                    </>
                  )}
                </motion.button>
              )}
              {account && (
                <div className="flex flex-col gap-2">
                  {" "}
                  <motion.button
                    onClick={() => {
                      setShowIndSignUp(true);
                      setShowOrgSignUp(false);
                      document
                        .getElementById("indSignUpForm")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-full bg-[#5D8C5D] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300 ${!account ? "opacity-50 cursor-not-allowed" : ""}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!account}
                  >
                    Sign Up as Individual
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowOrgSignUp(true);
                      setShowIndSignUp(false);
                      document
                        .getElementById("orgSignUpForm")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-full bg-[#5D8C5D] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300 ${!account ? "opacity-50 cursor-not-allowed" : ""}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!account}
                  >
                    Sign Up as Organization
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sign-up Forms */}
          <PersonalSignUp
            closeSignup={() => setShowIndSignUp(false)}
            showIndSignUp={showIndSignUp}
          />
          <div className="flex-1">
            {showOrgSignUp && (
              <motion.section
                id="orgSignUpForm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white py-24 px-6 rounded-lg shadow-md border border-gray-200 w-1/2  absolute top-3  left-1/4 "
              >
                <h4 className="text-2xl font-bold mb-4 text-center text-[#2C3E50]">
                  Organization Sign-Up
                </h4>
                <p className="text-center mb-6 text-gray-600">
                  Complete the form below to sign up as an organization.
                </p>
                <form onSubmit={handleOrganizationSignUp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="orgName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Organization Name
                    </label>
                    <input
                      type="text"
                      id="orgName"
                      name="orgName"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
                      value={orgDetails.orgName}
                      onChange={(e) => handleInputChange(e, setOrgDetails)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
                      value={orgDetails.email}
                      onChange={(e) => handleInputChange(e, setOrgDetails)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isLoading}
                    onClick={() => router.push("/organization-dashboard")}
                  >
                    {isLoading ? "Signing Up..." : "Sign Up"}
                  </button>
                </form>
              </motion.section>
            )}
          </div>
        </div>

        {/* Improved Error Message Toast */}
        {authError && (
          <div className="mb-8 text-center">
            <p className="text-red-600 font-bold text-lg">{authError}</p>
          </div>
        )}

        {/* Toast notification with improved styling */}
        <AnimatePresence>
          {toastMessage && (
            <Toast type={toastMessage.type} message={toastMessage.message} />
          )}
        </AnimatePresence>

        <Login openLogin={state.open} closeLogin={() => toogleLogin(false)} />
        {/* How it works section */}
        <section id="guide" className="mb-20 p-8">
          <h3 className="text-3xl font-black mb-8 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessStep
              number={1}
              title="Upload"
              description="Securely upload your documents to our platform."
            />
            <ProcessStep
              number={2}
              title="Verify"
              description="We verify the authenticity of your documents using blockchain technology."
            />
            <ProcessStep
              number={3}
              title="Access"
              description="Access your verified documents anytime, anywhere."
            />
          </div>
        </section>

        {/* Features section */}
        <section id="features" className="mb-20 p-8">
          <h3 className="text-3xl font-black mb-8 text-center">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Upload size={48} />}
              title="Secure Upload and Verify"
              description="Upload and verify your documents with confidence using our blockchain-powered system."
              color="bg-[#4A6741]"
            />
            <FeatureCard
              icon={<Database size={48} />}
              title="Intuitive Dashboard"
              description="Manage all your documents effortlessly with our user-friendly dashboard."
              color="bg-[#5D8C5D]"
            />
            <FeatureCard
              icon={<Search size={48} />}
              title="Advanced Document Lookup"
              description="Find and access your verified documents quickly with our powerful search functionality."
              color="bg-[#4A6741]"
            />
          </div>
        </section>

        {/* For Who section */}
        <section className="mb-20 p-8">
          <h3 className="text-3xl font-black mb-8 text-center">
            Who Is It For?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Users size={48} className="mb-4 text-[#4A6741]" />
              <h4 className="text-xl font-black mb-2">Individuals</h4>
              <p className="font-bold">
                Securely store and share your personal documents, from
                certificates to IDs.
              </p>
            </motion.div>
            <motion.div
              className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Shield size={48} className="mb-4 text-[#4A6741]" />
              <h4 className="text-xl font-black mb-2">Organizations</h4>
              <p className="font-bold">
                Streamline document verification processes and enhance security
                for your institution.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ section with smoother animations */}
        <section id="faq" className="mb-20 p-8">
          <h3 className="text-3xl font-black mb-8 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <FAQItem
              question="How secure is Authentico?"
              answer="Authentico uses advanced blockchain technology to ensure the highest level of security for your documents."
            />
            <FAQItem
              question="What types of documents can I verify?"
              answer="You can verify a wide range of documents, including educational certificates, IDs, and official records."
            />
            <FAQItem
              question="How long does the verification process take?"
              answer="The verification process is typically completed within 24-48 hours, depending on the complexity of the document."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#2C3E50] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold mb-2">Authentico</h4>
              <p>Secure Document Verification</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="hover:text-[#4A6741] transition duration-300"
              >
                <Github size={24} />
              </Link>
              <Link
                href="#"
                className="hover:text-[#4A6741] transition duration-300"
              >
                <Linkedin size={24} />
              </Link>
              <Link
                href="#"
                className="hover:text-[#4A6741] transition duration-300"
              >
                <Twitter size={24} />
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2025 Authentico. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
}) => (
  <motion.div
    className={`${color} p-8 flex flex-col items-center text-center border-8 border-[#2C3E50] transform hover:rotate-2 transition-all duration-300 rounded-lg`}
    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
  >
    <div className="text-white mb-6 bg-[#2C3E50] p-4 border-4 border-white rounded-full">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 text-white">{title}</h3>
    <p className="font-bold text-white">{description}</p>
  </motion.div>
);

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({
  number,
  title,
  description,
}) => (
  <motion.div
    className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
    whileHover={{ scale: 1.05 }}
  >
    <div className="bg-[#4A6741] text-white text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center mb-4">
      {number}
    </div>
    <h4 className="text-xl font-black mb-2">{title}</h4>
    <p className="font-bold">{description}</p>
  </motion.div>
);
//TODO:make the landing page responsive
//TODO: the navlinks should lead somewhere
//FIX: close dialong boxes
const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-4 border-[#2C3E50] bg-[#E5DCC3]"
      initial={false}
      animate={{ backgroundColor: isOpen ? "#F0EAD6" : "#E5DCC3" }}
    >
      <button
        className="w-full text-left p-4 font-bold flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <ChevronDown
          className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial="collapsed"
        animate={isOpen ? "open" : "collapsed"}
        variants={{
          open: { opacity: 1, height: "auto" },
          collapsed: { opacity: 0, height: 0 },
        }}
        transition={{ duration: 0.3 }}
        className="px-4 pb-4 overflow-hidden"
      >
        <p>{answer}</p>
      </motion.div>
    </motion.div>
  );
};

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-6 w-6 mr-3 text-white" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const Toast: React.FC<{ type: "success" | "error"; message: string }> = ({
  type,
  message,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${type === "success" ? "bg-green-500" : "bg-red-500"} text-white p-4 rounded-lg shadow-lg z-50`}
  >
    {message}
  </motion.div>
);

interface INavbar {
  toogleShow: () => void;
  openForm: any;
}
const NavBar = ({ toogleShow, openForm }: INavbar) => {
  return (
    <nav className="flex justify-evenly fixed top-0 z-50 bg-[#ede8d3] p-4 rounded gap-2 list-none border-4 border-b-black w-full">
      <div className="flex justify-center items-center">
        <li className="flex justify-center items-center">
          <button className="font-bold text-2xl">Authentico</button>
        </li>
      </div>
      <div className="hidden md:flex gap-7 w-1/2 items-center font-bold list-none justify-evenly">
        <li>
          <a href="#home">
            <button>Home</button>
          </a>
        </li>
        <li>
          <a href="#guide">
            <button>Guide</button>
          </a>
        </li>
        <li>
          <a href="#features">
            <button>Features</button>
          </a>
        </li>
        <li>
          <a href="#faq">
            <button>FaQ</button>
          </a>
        </li>
      </div>
      <div className="flex gap-4 items-center">
        <button
          className="sm:outline-black outline-2 px-2 rounded-md outline sm:h-auto h-8 text-sm sm:p-3 bg-[#a6fafe]"
          onClick={openForm}
        >
          Login
        </button>
        <div className="flex justify-center sm:hidden">
          <HamburgerMenu />
        </div>
      </div>
    </nav>
  );
};

function HamburgerMenu() {
  const [showMenu, setshowMenu] = useState(false);
  function toogleBurger() {
    setshowMenu(!showMenu);
  }
  function getShowStyle() {
    if (showMenu) {
      return "flex";
    }
    return "hidden";
  }
  return (
    <>
      <div>
        <button onClick={toogleBurger}>
          <Menu />
        </button>
      </div>
      <div
        className={
          getShowStyle() +
          " absolute flex-col gap-6 text-2xl -left-1 -top-1 p-4 w-screen h-screen bg-black text-white "
        }
      >
        <li className="flex justify-end ">
          <button onClick={toogleBurger}>X</button>
        </li>
        <li className="flex justify-center">
          <a href="#home">
            <button onClick={toogleBurger}>Home</button>
          </a>
        </li>
        <li className="flex justify-center">
          {" "}
          <a href="#guide">
            <button onClick={toogleBurger}>Guide</button>
          </a>
        </li>
        <li className="flex justify-center">
          {" "}
          <a href="#features">
            <button onClick={toogleBurger}>Features</button>
          </a>
        </li>
        <li className="flex justify-center">
          {" "}
          <a href="#faq">
            <button onClick={toogleBurger}>FaQ</button>
          </a>
        </li>
      </div>
    </>
  );
}

export default NeubrutalistLanding;
