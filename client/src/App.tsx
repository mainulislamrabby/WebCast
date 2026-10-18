import { BrowserRouter, Route, Routes, Link } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Receiver from "./pages/Receiver";
import Sender from "./pages/Sender";

function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center px-4 bg-cyber-grid">
      <h1 className="text-7xl font-black text-blue-500 font-mono">404</h1>
      <p className="mt-3 text-lg font-semibold text-white">Page Not Found</p>
      <p className="mt-1 text-sm text-slate-400">
        The requested screen casting route does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
      >
        Return to Home
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[#090d16] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sender" element={<Sender />} />
            <Route path="/receiver" element={<Receiver />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />

        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </div>
    </BrowserRouter>
  );
}

export default App;