import { Link } from "react-router-dom";

function NavbarBrand() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1180px] shrink-0 items-center justify-between px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 lg:pb-7">
      <Link to="/signup" className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="truncate text-[1.625rem] font-semibold tracking-tight text-[#0f172a] sm:text-[1.85rem] md:text-[2rem]">
          Interviewly
          <span className="text-[#852a4e]">AI</span>
        </span>
      </Link>
    </div>
  );
}

export default NavbarBrand;
