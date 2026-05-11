import { Link } from "react-router-dom";

function NavbarBrand() {
  return (
    <div className="relative z-10 mx-1 flex w-full shrink-0 items-center justify-between px-2 pb-7 sm:px-3">
      <Link to="/signup" className="flex items-center gap-3">
        <span className="text-[2rem] font-semibold tracking-tight text-[#0f172a]">
          Interviewly
          <span className="text-[#852a4e]">AI</span>
        </span>
      </Link>
    </div>
  );
}

export default NavbarBrand;
