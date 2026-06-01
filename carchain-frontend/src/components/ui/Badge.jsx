const variants = {
  active:   { dot: "bg-green-500",  pill: "bg-green-50  text-green-700  border-green-200"  },
  stolen:   { dot: "bg-red-500",    pill: "bg-red-50    text-red-700    border-red-200"    },
  scrapped: { dot: "bg-gray-400",   pill: "bg-gray-100  text-gray-600   border-gray-200"   },
  removed:  { dot: "bg-orange-400", pill: "bg-orange-50 text-orange-700 border-orange-200" },
  pending:  { dot: "bg-yellow-400", pill: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  verified: { dot: "bg-blue-500",   pill: "bg-blue-50   text-blue-700   border-blue-200"   },
  rejected: { dot: "bg-red-500",    pill: "bg-red-50    text-red-700    border-red-200"    },
  success:  { dot: "bg-green-500",  pill: "bg-green-50  text-green-700  border-green-200"  },
  failure:  { dot: "bg-red-500",    pill: "bg-red-50    text-red-700    border-red-200"    },
  admin:    { dot: "bg-purple-500", pill: "bg-purple-50 text-purple-700 border-purple-200" },
  user:     { dot: "bg-gray-400",   pill: "bg-gray-100  text-gray-600   border-gray-200"   },
  default:  { dot: "bg-gray-400",   pill: "bg-gray-100  text-gray-600   border-gray-200"   },
};

export default function Badge({ label, variant }) {
  const v = variants[variant?.toLowerCase()] || variants.default;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${v.pill}`}>
      <span className={`status-dot ${v.dot}`} />
      {label}
    </span>
  );
}
