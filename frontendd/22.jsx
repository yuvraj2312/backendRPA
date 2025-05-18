<div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    className="px-3 py-1 border rounded disabled:opacity-50"
  >
    Prev
  </button>

  {pageNumbers.map((page) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={`px-3 py-1 rounded ${currentPage === page ? "bg-blue-500 text-white" : "border"}`}
    >
      {page}
    </button>
  ))}

  <button
    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-3 py-1 border rounded disabled:opacity-50"
  >
    Next
  </button>
</div>
