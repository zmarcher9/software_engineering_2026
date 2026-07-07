import { useEffect, useState } from "react";
import { transactionAPI, categoryAPI } from "../services/api";

// Mock categories for MVP - will be replaced with backend fetch once auth is ready
const MOCK_CATEGORIES = [
  { id: "food", name: "Food & Dining" },
  { id: "transport", name: "Transport" },
  { id: "utilities", name: "Utilities" },
  { id: "entertainment", name: "Entertainment" },
  { id: "salary", name: "Salary" },
  { id: "bonus", name: "Bonus" },
  { id: "other", name: "Other" },
];

export default function TransactionForm() {
  const [formData, setFormData] = useState({
    amount: "",
    categoryId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    note: "",
    merchant: "",
    transactionType: "expense",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryAPI.getAll();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories(MOCK_CATEGORIES);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || "" : value,
    }));
  };

  const handleTypeToggle = (type) => {
    setFormData((prev) => ({
      ...prev,
      transactionType: type,
    }));
  };

  const validateForm = () => {
    if (!formData.amount || formData.amount <= 0) {
      setMessage({ type: "error", text: "Amount must be greater than 0" });
      return false;
    }

    if (!formData.transactionDate) {
      setMessage({ type: "error", text: "Date is required" });
      return false;
    }

    const selectedDate = new Date(formData.transactionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setMessage({
        type: "error",
        text: "Transaction date cannot be in the future",
      });
      return false;
    }

    // Check decimal places (max 2)
    const decimalPlaces = (formData.amount.toString().split(".")[1] || "").length;
    if (decimalPlaces > 2) {
      setMessage({
        type: "error",
        text: "Amount can have at most 2 decimal places",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const submitData = {
        amount: formData.amount,
        category_id: formData.categoryId || null,
        transaction_date: formData.transactionDate,
        note: formData.note || null,
        merchant: formData.merchant || null,
        transaction_type: formData.transactionType,
      };

      const response = await transactionAPI.create(submitData);
      setMessage({
        type: "success",
        text: `Transaction created successfully! ID: ${response.id}`,
      });

      // Reset form
      setFormData({
        amount: "",
        categoryId: "",
        transactionDate: new Date().toISOString().split("T")[0],
        note: "",
        merchant: "",
        transactionType: "expense",
      });

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${error.message || "Failed to create transaction"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Add Transaction
      </h2>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "error"
              ? "bg-red-900/30 text-red-300"
              : "bg-emerald-900/30 text-emerald-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeToggle("expense")}
              className={`flex-1 rounded-lg py-2 px-4 font-medium transition-colors ${
                formData.transactionType === "expense"
                  ? "bg-red-600/80 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle("income")}
              className={`flex-1 rounded-lg py-2 px-4 font-medium transition-colors ${
                formData.transactionType === "income"
                  ? "bg-emerald-600/80 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
            Amount *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            max="999999999.99"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="mt-1 text-xs text-slate-400">
            Maximum 2 decimal places
          </p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-slate-300 mb-2">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="transactionDate" className="block text-sm font-medium text-slate-300 mb-2">
            Date *
          </label>
          <input
            type="date"
            id="transactionDate"
            name="transactionDate"
            value={formData.transactionDate}
            onChange={handleInputChange}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Merchant */}
        <div>
          <label htmlFor="merchant" className="block text-sm font-medium text-slate-300 mb-2">
            Merchant
          </label>
          <input
            type="text"
            id="merchant"
            name="merchant"
            value={formData.merchant}
            onChange={handleInputChange}
            placeholder="e.g., Whole Foods, Uber, Netflix"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-2">
            Note
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            placeholder="Add any additional notes (optional)"
            rows="3"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting..." : "Add Transaction"}
        </button>
      </form>
    </div>
  );
}
