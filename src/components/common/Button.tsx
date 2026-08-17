interface ButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit";
}

export default function Button({
  children,
  loading,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={loading}
      className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}