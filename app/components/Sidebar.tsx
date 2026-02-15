import NavLinks from "./NavLinks";
import LogoutButton from "./LogoutButton";

export default function Sidebar({ userRole }: { userRole?: string }) {
    return (
        <aside className="w-64 bg-white border-r-2 border-slate-300 fixed h-full hidden md:flex flex-col z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    StaySync
                </h1>
            </div>

            <NavLinks userRole={userRole} />

            <div className="mt-auto px-4 pb-2">
                <LogoutButton />
            </div>
            <div className="p-4 border-t-2 border-slate-300 text-xs text-center text-slate-500 font-bold">
                v1.0.0
            </div>
        </aside>
    );
}
