"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import NavBar from "../../../components/ui/NavBar";
import Footer from "../../../components/ui/Footer";
import Modal from "../../../components/ui/Modal";
import { useToast } from "../../../hooks/useToast";
import { formatOrderWhatsAppMessage } from "../../../lib/whatsapp";

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bouquetIdParam = searchParams.get("bouquet_id");
  const showToast = useToast(); // Toast notifications

  const [bouquets, setBouquets] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedBouquet, setSelectedBouquet] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    quantity: 1,
    bouquet_id: bouquetIdParam || "",
    pickup_date: "",
    pickup_time: "",
    card_message: "",
    additional_request: "",
    payment_type: "DP",
    payment_method: "",
    sender_name: "",
    sender_account_number: "",
    sender_phone: "",
  });

  const [referenceFiles, setReferenceFiles] = useState([]);
  const [paymentFiles, setPaymentFiles] = useState([]);
  const [showBouquetDropdown, setShowBouquetDropdown] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [minTime, setMinTime] = useState("08:00");
  const [maxTime] = useState("18:00");
  const [timeError, setTimeError] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [quantityError, setQuantityError] = useState("");

  // Set minimum date (today)
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  // Validate time based on selected date
  useEffect(() => {
    if (formData.pickup_date) {
      const now = new Date();
      const selectedDate = new Date(formData.pickup_date);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selected = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );

      // If today is selected, set minimum time to current time + 1 hour
      if (selected.getTime() === today.getTime()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if it's before operational hours
        if (currentHour < 8) {
          // Can book from 8:00 onwards
          generateTimeSlots(8, 0, 18, 0);
          setTimeError("");
        } else if (currentHour >= 17) {
          // Too late to book today (need at least 1 hour before closing)
          setTimeError(
            "Waktu operasional hari ini sudah habis (08:00-18:00). Silakan pilih tanggal besok."
          );
          setFormData((prev) => ({
            ...prev,
            pickup_date: "",
            pickup_time: "",
          }));
          setAvailableTimeSlots([]);
          return;
        } else {
          // Generate slots from (current time + 1 hour) to 18:00
          const minHour = currentHour + 1;
          const minMinute = currentMinute;
          generateTimeSlots(minHour, minMinute, 18, 0);
          setTimeError("");
        }

        // Reset time if current selected time is not in available slots
        if (formData.pickup_time) {
          const isValid = availableTimeSlots.some(
            (slot) => slot.value === formData.pickup_time
          );
          if (!isValid && availableTimeSlots.length > 0) {
            setFormData((prev) => ({ ...prev, pickup_time: "" }));
          }
        }
      } else {
        // For future dates, all operational hours available (08:00 - 18:00)
        generateTimeSlots(8, 0, 18, 0);
        setTimeError("");
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.pickup_date]);

  // Generate time slots in 30-minute intervals
  const generateTimeSlots = (startHour, startMinute, endHour, endMinute) => {
    const slots = [];
    let currentHour = startHour;
    let currentMinute = Math.ceil(startMinute / 30) * 30; // Round up to nearest 30 min

    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = 0;
    }

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute === 0)
    ) {
      const timeStr = `${String(currentHour).padStart(2, "0")}:${String(
        currentMinute
      ).padStart(2, "0")}`;
      slots.push({
        value: timeStr,
        label: timeStr,
      });

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }

      // Stop if we've passed the end hour
      if (currentHour > endHour) break;
    }

    setAvailableTimeSlots(slots);
    setMinTime(slots.length > 0 ? slots[0].value : "08:00");
  };

  useEffect(() => {
    // Load bouquets and settings in parallel for faster startup
    const loadInitial = async () => {
      try {
        const [bouqRes, setRes] = await Promise.all([
          fetch("/api/bouquets"),
          fetch("/api/settings"),
        ]);
        const bouqJson = await bouqRes.json().catch(() => null);
        const setJson = await setRes.json().catch(() => null);

        if (bouqJson && bouqJson.success)
          setBouquets(bouqJson.data.filter((b) => b.is_active));

        if (setJson && setJson.success) {
          const waData = setJson.data?.whatsapp_number;
          const whatsappNumber =
            typeof waData === "object" && waData?.value
              ? waData.value
              : typeof waData === "string"
              ? waData
              : null;
          if (!whatsappNumber) {
            setSettingsError(true);
          }
          setSettings(setJson.data || {});
        } else {
          setSettingsError(true);
        }
      } catch (err) {
        console.warn("Initial load failed", err);
        setSettingsError(true);
      }
    };

    loadInitial();
  }, []);

  useEffect(() => {
    if (bouquetIdParam && bouquets.length > 0) {
      const bouquet = bouquets.find((b) => b.id === parseInt(bouquetIdParam));
      if (bouquet) {
        setSelectedBouquet(bouquet);
        setFormData((prev) => ({ ...prev, bouquet_id: bouquetIdParam }));
      }
    }
  }, [bouquetIdParam, bouquets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showBouquetDropdown &&
        !event.target.closest(".bouquet-dropdown-container")
      ) {
        setShowBouquetDropdown(false);
      }
      if (
        showTimeDropdown &&
        !event.target.closest(".time-dropdown-container")
      ) {
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBouquetDropdown, showTimeDropdown]);

  const handleBouquetChange = (bouquetId) => {
    setFormData((prev) => ({ ...prev, bouquet_id: bouquetId }));
    const bouquet = bouquets.find((b) => b.id === parseInt(bouquetId));
    setSelectedBouquet(bouquet);
    setShowBouquetDropdown(false);
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (type === "reference") setReferenceFiles(files);
    else if (type === "payment") setPaymentFiles(files);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;

    // Allow empty input (user is typing)
    if (value === "") {
      setFormData({ ...formData, quantity: "" });
      setQuantityError("");
      return;
    }

    const numValue = parseInt(value);

    // Check for invalid numbers
    if (isNaN(numValue)) {
      setQuantityError("Harap masukkan angka yang valid");
      setFormData({ ...formData, quantity: value });
      return;
    }

    if (numValue <= 0) {
      setQuantityError("Jumlah pesanan minimal 1 buket");
      setFormData({ ...formData, quantity: numValue });
      return;
    }

    if (numValue > 500) {
      setQuantityError(
        "Jumlah pesanan maksimal 500 buket. Untuk pemesanan lebih dari 500, silakan hubungi admin"
      );
      setFormData({ ...formData, quantity: numValue });
      return;
    }

    // Valid quantity
    setQuantityError("");
    setFormData({ ...formData, quantity: numValue });
  };

  const uploadFiles = async (files, type) => {
    if (!files || files.length === 0) return [];

    setUploading(true);
    const fd = new FormData();
    files.forEach((file) => fd.append("files", file));
    fd.append("type", "orders");

    try {
      const response = await fetch("/api/upload/multiple", {
        method: "POST",
        body: fd,
      });
      const data = await response.json().catch(() => null);
      if (data && data.success) return data.urls || [];
      throw new Error((data && data.message) || "Upload failed");
    } catch (error) {
      showToast.error(
        `Gagal upload gambar ${type}: ${error?.message || error}`
      );
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi quantity sebelum submit
    if (
      !formData.quantity ||
      formData.quantity === "" ||
      formData.quantity <= 0
    ) {
      setQuantityError("Jumlah pesanan minimal 1 buket");
      showToast.error("Harap isi jumlah pesanan dengan benar");
      return;
    }

    if (formData.quantity > 500) {
      setQuantityError(
        "Jumlah pesanan maksimal 500 buket. Untuk pemesanan lebih dari 500, silakan hubungi admin"
      );
      showToast.error("Jumlah pesanan tidak valid");
      return;
    }

    // Validasi WhatsApp number tersedia
    const waData = settings?.whatsapp_number;
    const whatsappNumber =
      typeof waData === "object" && waData?.value
        ? waData.value
        : typeof waData === "string"
        ? waData
        : null;
    if (!whatsappNumber) {
      showToast.error(
        "Nomor WhatsApp belum dikonfigurasi. Tidak dapat melanjutkan pesanan."
      );
      return;
    }

    // Validate pickup time is selected and within available slots
    if (!formData.pickup_time) {
      showToast.error("Harap pilih jam pengambilan");
      return;
    }

    const isValidTime = availableTimeSlots.some(
      (slot) => slot.value === formData.pickup_time
    );
    if (!isValidTime) {
      showToast.error(
        "Jam pengambilan yang dipilih tidak valid. Silakan pilih ulang."
      );
      return;
    }

    if (!paymentFiles || paymentFiles.length === 0) {
      showToast.error("Harap upload bukti transfer/DP terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      // Run uploads in parallel
      const [refUrls, payUrls] = await Promise.all([
        uploadFiles(referenceFiles, "reference"),
        uploadFiles(paymentFiles, "payment"),
      ]);

      const orderData = {
        ...formData,
        reference_images: refUrls,
        payment_proofs: payUrls,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json().catch(() => null);
      if (!data) throw new Error("Response tidak valid");
      if (!data.success)
        throw new Error(data.message || "Gagal membuat pesanan");

      const saved = data.data || data;

      // Clear any old cached data before saving new order
      try {
        localStorage.removeItem("lastOrder");
        localStorage.removeItem("lastOrderId");
      } catch (err) {
        console.warn("Could not clear old cache", err);
      }

      try {
        localStorage.setItem("lastOrder", JSON.stringify(saved));
        const idKey = saved?.order_number || saved?.id || saved?.order_id || "";
        if (idKey) localStorage.setItem("lastOrderId", String(idKey));
      } catch (err) {
        console.warn("Could not save lastOrder", err);
      }

      // Tidak auto-open WhatsApp, user bisa klik manual di halaman order-success

      showToast.success(
        `Pesanan berhasil! Nomor Order: ${saved.order_number || saved.id || ""}`
      );

      // Navigate to order-success dengan data order di URL
      // Encode data order ke base64 untuk dikirim via URL
      const orderDataToPass = {
        id: saved.id,
        order_number: saved.order_number,
        customer_name: saved.customer_name,
        quantity: saved.quantity || formData.quantity,
        bouquet_name: saved.bouquet?.name || saved.bouquet_name,
        bouquet_price: saved.bouquet_price, // Total price (sudah dikalikan quantity dari backend)
        pickup_date: saved.pickup_date,
        pickup_time: saved.pickup_time,
        card_message: saved.card_message,
        payment_type: saved.payment_type,
        payment_method: saved.payment_method,
        dp_amount: saved.dp_amount,
        remaining_amount: saved.remaining_amount,
        created_at: saved.created_at,
        bouquet: saved.bouquet,
      };

      const encodedData = btoa(
        encodeURIComponent(JSON.stringify(orderDataToPass))
      );
      router.push(`/order-success?data=${encodedData}`);
    } catch (error) {
      showToast.error(`Error: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const payment = useMemo(() => {
    if (!selectedBouquet) return { dp: 0, remaining: 0, total: 0 };
    const base = parseFloat(selectedBouquet.price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const total = base * quantity;
    const dp = formData.payment_type === "DP" ? total * 0.3 : total;
    const remaining = formData.payment_type === "DP" ? total - dp : 0;
    return { dp, remaining, total };
  }, [selectedBouquet, formData.payment_type, formData.quantity]);

  return (
    <>
      {/* Navbar */}
      <div className="relative z-20">
        <NavBar />
      </div>

      {/* Main Content */}
      <div className="min-h-screen py-12 px-3 sm:px-4 md:px-6 font-serif bg-gray-50">
        <div className="max-w-6xl mx-auto pt-16 md:pt-20">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
              Form Pemesanan
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Lengkapi data pesanan Anda
            </p>
          </div>

          {/* Error Overlay when WhatsApp not configured */}
          {settingsError && (
            <div className="mb-6">
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 text-center shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Sistem Sedang dalam Pemeliharaan
                </h3>
                <p className="text-gray-700 mb-4 max-w-md mx-auto">
                  Maaf, sistem pemesanan kami sedang dalam proses konfigurasi.
                  Silakan coba lagi dalam beberapa saat atau hubungi kami
                  langsung melalui email.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <a
                    href="mailto:vylbouquet@gmail.com"
                    className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Hubungi via Email
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Muat Ulang Halaman
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Form - Span 2 kolom di desktop */}
            <div className="lg:col-span-2 relative">
              {/* Overlay untuk disable form */}
              {settingsError && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-75 backdrop-blur-sm rounded-lg md:rounded-xl z-10 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="animate-pulse mb-4">
                      <div className="w-12 h-12 bg-pink-200 rounded-full mx-auto flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-pink-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-700 font-medium">
                      Formulir tidak tersedia
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 border border-pink-100"
              >
                <div className="text-base sm:text-lg font-semibold mb-3 md:mb-4 text-gray-900">
                  Detail Pesanan
                </div>

                {/* Nama Pembeli */}
                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Nama Pembeli *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target"
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>

                {/* Jumlah Pesanan */}
                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Jumlah Pesanan *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.quantity}
                    onChange={handleQuantityChange}
                    className={`w-full px-3 py-2.5 md:py-2 border rounded-md focus:ring-2 focus:ring-pink-300 transition-all text-sm sm:text-base touch-target ${
                      quantityError
                        ? "border-red-300 focus:border-red-400"
                        : "border-pink-200 focus:border-pink-400"
                    }`}
                    placeholder="Masukkan jumlah buket"
                  />
                  {quantityError ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {quantityError}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimal 1, maksimal 500 buket
                    </p>
                  )}
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Pilih Buket *
                  </label>
                  <div className="relative bouquet-dropdown-container">
                    <button
                      type="button"
                      onClick={() =>
                        setShowBouquetDropdown(!showBouquetDropdown)
                      }
                      className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target cursor-pointer bg-white text-left flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {selectedBouquet ? (
                          <>
                            {selectedBouquet.image_url && (
                              <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={selectedBouquet.image_url}
                                  alt={selectedBouquet.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="text-gray-900">
                              {selectedBouquet.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Pilih buket yang Anda inginkan
                          </span>
                        )}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          showBouquetDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showBouquetDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-pink-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {bouquets.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Tidak ada buket tersedia
                          </div>
                        ) : (
                          bouquets.map((bouquet) => (
                            <button
                              key={bouquet.id}
                              type="button"
                              onClick={() => handleBouquetChange(bouquet.id)}
                              className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-pink-50 transition-colors text-left ${
                                formData.bouquet_id === bouquet.id.toString()
                                  ? "bg-pink-50"
                                  : ""
                              }`}
                            >
                              {bouquet.image_url && (
                                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                  <Image
                                    src={bouquet.image_url}
                                    alt={bouquet.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {bouquet.name}
                                </div>
                                <div className="text-xs text-pink-600 font-semibold">
                                  {formatPrice(bouquet.price)}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {/* Hidden input for form validation */}
                  <input type="hidden" required value={formData.bouquet_id} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                      Tanggal Ambil *
                    </label>
                    <input
                      type="date"
                      required
                      min={minDate}
                      value={formData.pickup_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickup_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tidak bisa memilih tanggal kemarin
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                      Jam Ambil *
                    </label>
                    <div className="relative time-dropdown-container">
                      <button
                        type="button"
                        onClick={() =>
                          formData.pickup_date &&
                          setShowTimeDropdown(!showTimeDropdown)
                        }
                        disabled={!formData.pickup_date}
                        className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target cursor-pointer bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <span
                          className={
                            formData.pickup_time
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.pickup_time || "Pilih jam pengambilan"}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            showTimeDropdown ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {showTimeDropdown && availableTimeSlots.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-pink-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {availableTimeSlots.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  pickup_time: slot.value,
                                });
                                setShowTimeDropdown(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-pink-50 transition-colors text-sm ${
                                formData.pickup_time === slot.value
                                  ? "bg-pink-50 text-pink-600 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {slot.label} WIB
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Hidden input for form validation */}
                    <input
                      type="hidden"
                      required
                      value={formData.pickup_time}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jam operasional: 08:00 - 18:00 WIB (minimal 1 jam dari
                      sekarang)
                    </p>
                    {timeError && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        {timeError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Pesan Untuk Kartu Ucapan
                  </label>
                  <textarea
                    value={formData.card_message}
                    onChange={(e) =>
                      setFormData({ ...formData, card_message: e.target.value })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base resize-none"
                    rows={3}
                    placeholder="Tulis pesan untuk kartu ucapan"
                  />
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Foto Request Tambahan (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, "reference")}
                    className="w-full px-3 py-2 border border-dashed border-pink-200 rounded-md text-xs sm:text-sm touch-target cursor-pointer hover:border-pink-300 transition-colors"
                  />
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Request Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.additional_request}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additional_request: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target"
                    placeholder="Jelaskan request khusus untuk buket Anda"
                  />
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Tipe Pembayaran *
                  </label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_type: e.target.value })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target cursor-pointer bg-white"
                  >
                    <option value="DP">Bayar DP 30%</option>
                    <option value="FULL">Lunas</option>
                  </select>
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Nama Pengirim / No Rekening *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sender_name}
                    onChange={(e) =>
                      setFormData({ ...formData, sender_name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target"
                    placeholder="Nama pengirim"
                  />
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.sender_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, sender_phone: e.target.value })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div className="mb-3 md:mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">
                    Metode Pembayaran *
                  </label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 md:py-2 border border-pink-200 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target cursor-pointer bg-white"
                  >
                    <option value="">Pilih metode pembayaran</option>
                    {settings &&
                      settings.payment_bca &&
                      settings.payment_bca.value && (
                        <option value="bca">
                          BCA - {String(settings.payment_bca.value)}
                          {settings.payment_bca.description &&
                          typeof settings.payment_bca.description === "string"
                            ? ` a.n ${settings.payment_bca.description}`
                            : ""}
                        </option>
                      )}
                    {settings &&
                      settings.payment_seabank &&
                      settings.payment_seabank.value && (
                        <option value="seabank">
                          SeaBank - {String(settings.payment_seabank.value)}
                          {settings.payment_seabank.description &&
                          typeof settings.payment_seabank.description ===
                            "string"
                            ? ` a.n ${settings.payment_seabank.description}`
                            : ""}
                        </option>
                      )}
                    {settings &&
                      settings.payment_shopeepay &&
                      settings.payment_shopeepay.value && (
                        <option value="shopeepay">
                          ShopeePay - {String(settings.payment_shopeepay.value)}
                          {settings.payment_shopeepay.description &&
                          typeof settings.payment_shopeepay.description ===
                            "string"
                            ? ` a.n ${settings.payment_shopeepay.description}`
                            : ""}
                        </option>
                      )}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Upload Bukti Transfer / DP *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    required
                    onChange={(e) => handleFileChange(e, "payment")}
                    className="w-full px-3 py-2 border border-dashed border-pink-200 rounded-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-pink-400 hover:bg-pink-500 active:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 md:py-3.5 rounded-lg md:rounded-xl mt-4 md:mt-6 transition-all hover:shadow-lg text-sm sm:text-base touch-target"
                >
                  {uploading
                    ? "Mengupload gambar..."
                    : loading
                    ? "Memproses pesanan..."
                    : "Kirim Pesanan Anda"}
                </button>
              </form>
            </div>

            {/* Sidebar - Stack di mobile, sidebar di desktop */}
            <aside className="space-y-4 md:space-y-6 relative">
              {/* Overlay untuk disable sidebar */}
              {settingsError && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-60 backdrop-blur-sm rounded-lg z-10"></div>
              )}

              <div className="p-4 md:p-5 bg-pink-50 rounded-lg border border-pink-200 shadow-sm">
                <h3 className="text-sm sm:text-base font-semibold mb-2 md:mb-3 text-gray-900">
                  Ringkasan Pembayaran
                </h3>
                <div className="text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Harga</span>
                    <span className="font-semibold text-gray-900">
                      {selectedBouquet ? formatPrice(payment.total) : "Rp ..."}
                    </span>
                  </div>
                  {formData.payment_type === "DP" && (
                    <>
                      <div className="flex justify-between items-center pt-2 border-t border-pink-200">
                        <span className="text-gray-600">DP (30%)</span>
                        <span className="font-bold text-pink-500">
                          {selectedBouquet ? formatPrice(payment.dp) : "Rp ..."}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Sisa Pembayaran</span>
                        <span className="text-gray-700">
                          {selectedBouquet
                            ? formatPrice(payment.remaining)
                            : "Rp ..."}
                        </span>
                      </div>
                    </>
                  )}
                 
                </div>
              </div>

              <div className="p-4 md:p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm sm:text-base font-semibold mb-2 md:mb-3 text-gray-900">
                  Metode Pembayaran
                </h3>
                <div className="text-xs sm:text-sm space-y-2">
                  {settings &&
                    settings.payment_bca &&
                    settings.payment_bca.value && (
                      <div>
                        <strong>BCA:</strong>{" "}
                        {String(settings.payment_bca.value)}
                        {settings.payment_bca.description && (
                          <span className="text-gray-600">
                            {" "}
                            a.n {String(settings.payment_bca.description)}
                          </span>
                        )}
                      </div>
                    )}
                  {settings &&
                    settings.payment_seabank &&
                    settings.payment_seabank.value && (
                      <div>
                        <strong>SeaBank:</strong>{" "}
                        {String(settings.payment_seabank.value)}
                        {settings.payment_seabank.description && (
                          <span className="text-gray-600">
                            {" "}
                            a.n {String(settings.payment_seabank.description)}
                          </span>
                        )}
                      </div>
                    )}
                  {settings &&
                    settings.payment_shopeepay &&
                    settings.payment_shopeepay.value && (
                      <div>
                        <strong>ShopeePay:</strong>{" "}
                        {String(settings.payment_shopeepay.value)}
                        {settings.payment_shopeepay.description && (
                          <span className="text-gray-600">
                            {" "}
                            a.n {String(settings.payment_shopeepay.description)}
                          </span>
                        )}
                        <span className="block text-orange-700 text-sm mt-1 font-bold" style={{ fontSize: '1rem' }}>
                          Catatan: Transfer bank ke ShopeePay dikenakan biaya admin Rp 1.000
                        </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-4 md:p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm sm:text-base font-semibold mb-2 md:mb-3 text-gray-900">
                  Ketentuan Pemesanan
                </h3>
                <ul className="text-xs sm:text-sm list-disc pl-4 md:pl-5 space-y-1.5 md:space-y-2 text-gray-600">
                  <li>
                    DP minimal 30% dari total harga untuk mengunci pesanan
                  </li>
                  <li>Pesanan dianggap diterima setelah DP dikonfirmasi</li>
                  <li>Pelunasan bisa dilakukan saat ambil atau H-1</li>
                  <li>
                    Jika diambil orang lain, wajib tunjukkan form order dan foto
                    buket
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      }
    >
      <OrderPageContent />
    </Suspense>
  );
}
