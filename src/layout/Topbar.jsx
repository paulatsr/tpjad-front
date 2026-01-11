import { useSchool } from "../context/SchoolContext";

export default function Topbar() {
  const { user } = useSchool();

  return (
    <header className="h-14 px-5 flex items-center justify-between bg-white sticky top-0 z-40 border-b border-gray-200">
      <h2 className="text-base font-semibold text-gray-900">
        School Overview
      </h2>

      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </div>
    </header>
  );
}

